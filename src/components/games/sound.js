// Web Audio API sound effects — lazy-initialised so the AudioContext is only
// created after the first user gesture (browser policy).

let _ctx = null

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

/** Play a simple oscillator tone. */
function tone(freq, type = 'sine', duration = 0.1, gainVal = 0.3, when = 0) {
  try {
    const ctx = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + when)
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + when)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + duration)
    osc.start(ctx.currentTime + when)
    osc.stop(ctx.currentTime + when + duration + 0.01)
  } catch (e) {}
}

/** Play a burst of white noise (tapered off). */
function noise(duration = 0.3, gainVal = 0.4) {
  try {
    const ctx = getCtx()
    const buf  = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5)
    const src  = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer = buf
    src.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(gainVal, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    src.start()
  } catch (e) {}
}

export const SFX = {
  wallBounce:    () => tone(220, 'triangle', 0.06, 0.18),
  plankHit:      () => { tone(320, 'square', 0.07, 0.22); tone(440, 'square', 0.05, 0.15, 0.04) },
  brickBreak:    () => { tone(520, 'sawtooth', 0.07, 0.2); tone(720, 'sawtooth', 0.04, 0.1, 0.05) },
  armoredHit:    () => tone(140, 'square', 0.1, 0.28),
  levelUp:       () => [440, 550, 660, 880].forEach((f, i) => tone(f, 'sine', 0.18, 0.28, i * 0.1)),
  ballLost:      () => { [280, 200, 140].forEach((f, i) => tone(f, 'sine', 0.2, 0.3, i * 0.12)); noise(0.35, 0.35) },
  powerUp:       () => { tone(660, 'sine', 0.12, 0.3); tone(880, 'sine', 0.15, 0.25, 0.09) },
  explosion:     () => noise(0.4, 0.5),
  combo:         (n) => tone(380 + n * 90, 'sine', 0.09, 0.28),
  magnet:        () => tone(500, 'triangle', 0.15, 0.2),
  magnetRelease: () => tone(350, 'triangle', 0.1, 0.2),
}
