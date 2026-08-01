import { restRemaining } from './rest'

describe('restRemaining', () => {
  const started = '2026-08-01T18:00:00.000Z'

  it('returns null when no timer is running', () => {
    expect(restRemaining(null, null, new Date('2026-08-01T18:00:00.000Z'))).toBeNull()
    expect(restRemaining(started, null, new Date('2026-08-01T18:00:00.000Z'))).toBeNull()
  })

  it('returns the full duration at the moment it starts', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:00:00.000Z'))).toBe(180)
  })

  it('counts down from the stored timestamp', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:00:13.000Z'))).toBe(167)
  })

  it('clamps at zero instead of going negative', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:10:00.000Z'))).toBe(0)
  })

  it('is correct after a long background gap, which a decrementing counter would not be', () => {
    // Phone pocketed for 4 minutes on a 3-minute rest
    expect(restRemaining(started, 180, new Date('2026-08-01T18:04:00.000Z'))).toBe(0)
  })

  it('rounds up so 0 only appears when the timer is genuinely done', () => {
    expect(restRemaining(started, 180, new Date('2026-08-01T18:02:59.500Z'))).toBe(1)
  })
})
