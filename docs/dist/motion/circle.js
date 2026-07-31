/**
 * Orbits a circular path, nose following the tangent. `tilt` leans the circle
 * away from the camera so it reads as a 3D orbit rather than a flat ring.
 */
export function circleMotion(options = {}) {
    const radius = options.radius ?? 1.3;
    const periodMs = options.periodMs ?? 3000;
    const tilt = options.tilt ?? 0.5;
    const direction = options.direction ?? 1;
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);
    return {
        positionAt(t) {
            const angle = ((direction * t) / periodMs) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const flatY = radius * Math.sin(angle);
            return { x, y: flatY * cosTilt, z: flatY * sinTilt };
        },
    };
}
