import { expandToTriangles, parseColor } from "../geometry.js";
const VERTEX_SHADER = `#version 300 es
in vec3 aPos;
in vec3 aNormal;
in vec3 aColor;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vNormal;
out vec3 vColor;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vColor = aColor;
  gl_Position = uViewProj * uModel * vec4(aPos, 1.0);
}`;
const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec3 vNormal;
in vec3 vColor;
uniform vec3 uToLight;
uniform float uIntensity;
uniform float uAmbient;
out vec4 fragColor;
void main() {
  float lambert = max(dot(normalize(vNormal), normalize(uToLight)), 0.0);
  float brightness = clamp(uAmbient + uIntensity * lambert, 0.0, 1.0);
  fragColor = vec4(vColor * brightness, 1.0);
}`;
function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`3d-spinner: shader compile failed: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
}
function link(gl) {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`3d-spinner: program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    return program;
}
/** Hardware renderer using WebGL2: GPU transforms with a real depth buffer. */
export class WebGLRenderer {
    constructor(options = {}) {
        this.cache = new Map();
        if (options.background) {
            const [r, g, b] = parseColor(options.background);
            this.clearColor = [r / 255, g / 255, b / 255, 1];
        }
        else {
            this.clearColor = [0, 0, 0, 0];
        }
    }
    init(canvas) {
        const gl = canvas.getContext("webgl2");
        if (!gl)
            throw new Error("3d-spinner: WebGL2 is not supported in this browser.");
        this.gl = gl;
        this.program = link(gl);
        this.locations = {
            aPos: gl.getAttribLocation(this.program, "aPos"),
            aNormal: gl.getAttribLocation(this.program, "aNormal"),
            aColor: gl.getAttribLocation(this.program, "aColor"),
            uViewProj: gl.getUniformLocation(this.program, "uViewProj"),
            uModel: gl.getUniformLocation(this.program, "uModel"),
            uToLight: gl.getUniformLocation(this.program, "uToLight"),
            uIntensity: gl.getUniformLocation(this.program, "uIntensity"),
            uAmbient: gl.getUniformLocation(this.program, "uAmbient"),
        };
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);
    }
    resize() {
        const gl = this.gl;
        if (!gl)
            return;
        const canvas = gl.canvas;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    buffers(mesh) {
        const cached = this.cache.get(mesh);
        if (cached)
            return cached;
        const gl = this.gl;
        const loc = this.locations;
        const data = expandToTriangles(mesh);
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const attribute = (location, array) => {
            if (location < 0)
                return;
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
        };
        attribute(loc.aPos, data.positions);
        attribute(loc.aNormal, data.normals);
        attribute(loc.aColor, data.colors);
        gl.bindVertexArray(null);
        const result = { vao, count: data.count };
        this.cache.set(mesh, result);
        return result;
    }
    render(frame) {
        const gl = this.gl;
        const loc = this.locations;
        if (!gl || !this.program || !loc)
            return;
        gl.clearColor(...this.clearColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(loc.uViewProj, false, new Float32Array(frame.viewProjection));
        gl.uniform3f(loc.uToLight, frame.light.toLight.x, frame.light.toLight.y, frame.light.toLight.z);
        gl.uniform1f(loc.uIntensity, frame.light.intensity);
        gl.uniform1f(loc.uAmbient, frame.light.ambient);
        for (const item of frame.items) {
            const mesh = this.buffers(item.mesh);
            gl.uniformMatrix4fv(loc.uModel, false, new Float32Array(item.model));
            gl.bindVertexArray(mesh.vao);
            gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
        }
        gl.bindVertexArray(null);
    }
    destroy() {
        const gl = this.gl;
        if (gl) {
            for (const mesh of this.cache.values())
                gl.deleteVertexArray(mesh.vao);
            if (this.program)
                gl.deleteProgram(this.program);
        }
        this.cache.clear();
        this.gl = undefined;
        this.program = undefined;
        this.locations = undefined;
    }
}
