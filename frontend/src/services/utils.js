export function fmt(price) {
  const p = price != null ? parseFloat(price) : 0
  return p.toFixed(2)
}
