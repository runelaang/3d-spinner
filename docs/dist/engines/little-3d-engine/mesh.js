/** Create a {@link Transform} with sensible defaults (origin, no rotation). */
export function transform(init) {
    return {
        position: init?.position ?? { x: 0, y: 0, z: 0 },
        rotation: init?.rotation ?? { x: 0, y: 0, z: 0 },
    };
}
