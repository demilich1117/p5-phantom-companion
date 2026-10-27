// Normalised positions survive viewport changes; no chat or character data involved.
export function clamp(value, min, max, fallback = min) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
export function portrait(value = {}) {
    return { height: clamp(value?.height, 75, 150, 100), x: clamp(value?.x, 0, 100, 50), y: clamp(value?.y, 0, 100, 30) };
}
export function bounds(viewport, size, padding = 28) {
    return { minX: padding, maxX: Math.max(padding, viewport.width - size.width - padding), minY: padding, maxY: Math.max(padding, viewport.height - size.height - padding) };
}
export function place(position, box) {
    return { x: box.minX + clamp(position?.x, 0, 1, 0) * (box.maxX - box.minX), y: box.minY + clamp(position?.y, 0, 1, 0.5) * (box.maxY - box.minY) };
}
export function normalise(point, box) {
    return { x: box.maxX === box.minX ? 0 : clamp((point.x - box.minX) / (box.maxX - box.minX), 0, 1), y: box.maxY === box.minY ? 0 : clamp((point.y - box.minY) / (box.maxY - box.minY), 0, 1) };
}
