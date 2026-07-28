export function isOutsideSafeViewportBand(rect: Pick<DOMRect, "top" | "bottom">, viewportHeight: number) {
  const top = viewportHeight * 0.3;
  const bottom = viewportHeight * 0.7;
  return rect.bottom < top || rect.top > bottom;
}
