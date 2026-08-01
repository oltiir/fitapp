import { restRemaining, restJustFinished } from './rest'

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

describe('restJustFinished', () => {
  const started = '2026-08-01T18:00:00.000Z'

  it('is false while the timer is still running', () => {
    expect(restJustFinished(started, 180, new Date('2026-08-01T18:02:00.000Z'))).toBe(false)
  })

  it('is true at the moment it hits zero', () => {
    expect(restJustFinished(started, 180, new Date('2026-08-01T18:03:00.000Z'))).toBe(true)
  })

  it('is true just inside the grace window', () => {
    expect(restJustFinished(started, 180, new Date('2026-08-01T18:03:01.500Z'))).toBe(true)
  })

  it('is false once the grace window has passed, so a backgrounded app never beeps late', () => {
    expect(restJustFinished(started, 180, new Date('2026-08-01T18:03:02.500Z'))).toBe(false)
    expect(restJustFinished(started, 180, new Date('2026-08-01T18:07:00.000Z'))).toBe(false)
  })

  it('is false when no timer is running', () => {
    expect(restJustFinished(null, null, new Date('2026-08-01T18:03:00.000Z'))).toBe(false)
    expect(restJustFinished(started, null, new Date('2026-08-01T18:03:00.000Z'))).toBe(false)
  })

  it('respects a custom grace window', () => {
    expect(restJustFinished(started, 180, new Date('2026-08-01T18:03:04.000Z'), 5)).toBe(true)
  })
})
