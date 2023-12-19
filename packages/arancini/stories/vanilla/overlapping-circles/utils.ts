import * as THREE from 'three'

export function random(a: number, b: number) {
  return Math.random() * (b - a) + a
}

export function intersection(
  circleA: {
    position: THREE.Vector2
    radius: number
  },
  circleB: {
    position: THREE.Vector2
    radius: number
  }
): [number, number, number, number] | false {
  // dx and dy are the vertical and horizontal distances between the circle centers.
  const dx = circleB.position.x - circleA.position.x
  const dy = circleB.position.y - circleA.position.y

  // Distance between the centers
  const d = Math.sqrt(dy * dy + dx * dx)

  // Check for solvability
  if (d > circleA.radius + circleB.radius) {
    // No solution: circles don't intersect
    return false
  }
  if (d < Math.abs(circleA.radius - circleB.radius)) {
    // No solution: one circle is contained in the other
    return false
  }

  /* 'point 2' is the point where the line through the circle
   * intersection points crosses the line between the circle
   * centers.
   */

  /* Determine the distance from point 0 to point 2. */
  const a =
    (circleA.radius * circleA.radius -
      circleB.radius * circleB.radius +
      d * d) /
    (2.0 * d)

  /* Determine the coordinates of point 2. */
  const x2 = circleA.position.x + (dx * a) / d
  const y2 = circleA.position.y + (dy * a) / d

  /* Determine the distance from point 2 to either of the
   * intersection points.
   */
  const h = Math.sqrt(circleA.radius * circleA.radius - a * a)

  /* Now determine the offsets of the intersection points from
   * point 2.
   */
  const rx = -dy * (h / d)
  const ry = dx * (h / d)

  /* Determine the absolute intersection points. */
  const xi = x2 + rx
  const xi_prime = x2 - rx
  const yi = y2 + ry
  const yi_prime = y2 - ry

  return [xi, yi, xi_prime, yi_prime]
}

export function fillCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2, false)
  ctx.fill()

  return this
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  a: number,
  b: number,
  c: number,
  d: number
) {
  ctx.beginPath(), ctx.moveTo(a, b), ctx.lineTo(c, d), ctx.stroke()
}
