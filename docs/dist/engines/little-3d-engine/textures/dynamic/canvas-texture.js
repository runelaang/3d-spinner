export function canvasTexture(draw, size = 96) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx)
        draw(ctx);
    return canvas;
}
