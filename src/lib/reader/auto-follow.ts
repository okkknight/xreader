type VerticalBounds = { top: number; bottom: number };

export function isSentenceComfortablyVisible(bounds: VerticalBounds, viewportHeight: number) {
  const margin = Math.min(160, viewportHeight * 0.2);
  return bounds.top >= margin && bounds.bottom <= viewportHeight - margin;
}
