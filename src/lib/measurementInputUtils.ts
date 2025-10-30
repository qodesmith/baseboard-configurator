// Common fractions for 1/16" precision - 0, 1/16 => 15/16
const fractions: [number, string][] = Array.from({length: 16}, (_, i) => {
  return [i * 0.0625, i === 0 ? '' : `${i}/16`]
})

/**
 * Formats a decimal size as a fraction string with 1/16" precision.
 *
 * @param size - The decimal size to format (e.g., 83.3125)
 *
 * @returns The formatted fraction string (e.g., "83 5/16")
 *
 * @example
 * formatAsFraction(83.3125) // returns "83 5/16"
 * formatAsFraction(5.0) // returns "5""
 * formatAsFraction(0.0625) // returns "1/16""
 */
export function formatAsFraction(size: number): string {
  const whole = Math.floor(size)
  const decimal = size - whole

  // Find closest fraction
  const closest = fractions.reduce((prev, curr) => {
    return Math.abs(curr[0] - decimal) < Math.abs(prev[0] - decimal)
      ? curr
      : prev
  })

  if (closest[1] === '') {
    return `${whole.toString()}"`
  }

  return whole > 0 ? `${whole} ${closest[1]}"` : `${closest[1]}"`
}
