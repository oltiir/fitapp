/**
 * A short synthesised beep — no audio asset, so it works offline.
 *
 * The AudioContext is module-scoped rather than held in a component ref: iOS
 * only lets it start inside a real user gesture, and the gesture that unlocks
 * it (tapping "Start Push") happens on a different screen from the one that
 * plays the beep. A per-component context would lose the unlock on navigation.
 */
let ctx: AudioContext | null = null

type AudioContextCtor = typeof AudioContext

function contextCtor(): AudioContextCtor | undefined {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  )
}

/** Call from inside a real user gesture (a tap handler), or iOS will refuse to start audio. */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor = contextCtor()
    if (!Ctor) return
    ctx = new Ctor()
  }
  void ctx.resume()
}

export function beep(): void {
  if (!ctx || ctx.state !== 'running') return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.5)
}
