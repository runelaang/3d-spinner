export function canvasTexture(
  draw: (ctx: CanvasRenderingContext2D) => void,
  size = 96,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return canvas;
}
