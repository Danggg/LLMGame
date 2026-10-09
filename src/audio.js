// audio (lazy, tiny oscillator SFX)
'use strict';

let _ac = null;
function ac() {
  if (!_ac) {
    try { _ac = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { _ac = null; }
  }
  if (_ac && _ac.state === 'suspended') { try { _ac.resume(); } catch (e) {} }
  return _ac;
}
function sfx(kind) {
  const a = ac(); if (!a) return;
  try {
    const t0 = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    const spec = {
      swing: ['sawtooth', 300, 90, 0.2, 0.06],
      hit:   ['square', 160, 60, 0.12, 0.07],
      die:   ['triangle', 120, 30, 0.3, 0.09],
      hurt:  ['square', 90, 90, 0.25, 0.08],
      pickup:['sine', 520, 880, 0.18, 0.07],
      gem:   ['triangle', 700, 1400, 0.15, 0.07],
      boss:  ['sawtooth', 70, 35, 0.5, 0.12],
    }[kind];
    o.type = spec[0];
    o.frequency.setValueAtTime(spec[1], t0);
    o.frequency.exponentialRampToValueAtTime(spec[2], t0 + spec[3]);
    g.gain.setValueAtTime(spec[4], t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + spec[3]);
    o.start(t0); o.stop(t0 + spec[3] + 0.02);
  } catch (e) {}
}
