// Web Audio API Synthesized Mechanical Keyboard Audio
// Supports Creamy Thock, Crisp Clicky, and Bubble Pop sound profiles.

import type { SoundProfile } from "./types";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      // @ts-expect-error webkit prefix fallback
      window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playKeyClick(profile: SoundProfile = "thock") {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (profile === "bubble") {
    // Water bubble pop: fast sine chirp rising from 350Hz to 850Hz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const startFreq = 320 + Math.random() * 80;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.4, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
    return;
  }

  if (profile === "clicky") {
    // Sharp tactile click (Box White / Cherry MX Blue)
    const bufferSize = Math.floor(ctx.sampleRate * 0.012);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    const freq = 1800 + Math.random() * 400;
    filter.frequency.setValueAtTime(freq, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.018);
    return;
  }

  // Profile: "thock" (Default) - Deep creamy linear mechanical bottom-out
  // Low resonant frequency with slight metallic tick
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();

  osc.type = "triangle";
  const baseFreq = 260 + Math.random() * 40;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);

  oscGain.gain.setValueAtTime(0.22, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  // Add subtle impact noise
  const bufferSize = Math.floor(ctx.sampleRate * 0.01);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(700, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.start(now);
  noise.start(now);
  osc.stop(now + 0.04);
  noise.stop(now + 0.025);
}

export function playErrorSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}
