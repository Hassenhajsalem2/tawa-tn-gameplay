/**
 * useAudio — Web Audio API based sound engine.
 * Generates all sounds synthetically, no external files needed.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

// ─── Master volume ───────────────────────────────────────────────────────────
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

function getMasterGain(): GainNode {
  if (!masterGain) {
    const ctx = getCtx();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(masterGain);
  }
  return masterGain!;
}

// ─── Background music (looping ambient pad) ──────────────────────────────────
let musicNodes: AudioNode[] = [];
let musicPlaying = false;

/** Arabian / mystic ambient scale notes (Hz) */
const AMBIENT_NOTES = [130.81, 155.56, 174.61, 207.65, 233.08, 261.63, 311.13];

function startBackgroundMusic() {
  if (musicPlaying) return;
  musicPlaying = true;

  getMasterGain(); // ensure gain nodes exist
  const ctx = getCtx();

  // Drone bass
  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = 'sawtooth';
  drone.frequency.value = 65.4; // C2
  droneGain.gain.value = 0.04;
  drone.connect(droneGain);
  droneGain.connect(musicGain!);
  drone.start();
  musicNodes.push(drone, droneGain);

  // Warm pad using multiple detuned oscillators
  const padFreqs = [130.81, 196.0, 261.63];
  padFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = (i - 1) * 8;

    filter.type = 'lowpass';
    filter.frequency.value = 800;

    gain.gain.value = 0.06;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain!);
    osc.start();
    musicNodes.push(osc, gain, filter);
  });

  // Slow melodic arpeggio
  let arpStep = 0;
  const playArpNote = () => {
    if (!musicPlaying) return;
    const ctx2 = getCtx();
    const now = ctx2.currentTime;
    const freq = AMBIENT_NOTES[arpStep % AMBIENT_NOTES.length] * 2;

    const osc = ctx2.createOscillator();
    const env = ctx2.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.08, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(env);
    env.connect(musicGain!);
    osc.start(now);
    osc.stop(now + 1.3);

    arpStep++;
    if (musicPlaying) {
      setTimeout(playArpNote, 600 + Math.random() * 400);
    }
  };
  setTimeout(playArpNote, 1000);
}

function stopBackgroundMusic() {
  musicPlaying = false;
  musicNodes.forEach(n => {
    try { (n as OscillatorNode).stop?.(); } catch (_) {}
    n.disconnect();
  });
  musicNodes = [];
}

// ─── Sound effects ────────────────────────────────────────────────────────────

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  connectTo?: AudioNode,
) {
  const ctx = getCtx();
  getMasterGain();
  const target = connectTo ?? sfxGain!;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(env);
  env.connect(target);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function playChord(freqs: number[], type: OscillatorType, duration: number, gain: number) {
  freqs.forEach(f => playTone(f, type, duration, gain));
}

// Exciting fanfare for challenge reveal
export function sfxChallengeReveal() {
  const ctx = getCtx(); getMasterGain();
  const now = ctx.currentTime;
  // Rising trumpet-like sweep
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'sawtooth', 0.35, 0.15), i * 120);
  });
  // Shimmer
  setTimeout(() => playChord([1046.5, 1318.5, 1567.98], 'sine', 0.8, 0.08), 520);
}

// Card draw — soft swish
export function sfxDrawCard() {
  const ctx = getCtx(); getMasterGain();
  const now = ctx.currentTime;
  // White noise burst
  const bufSize = ctx.sampleRate * 0.12;
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3500;
  filter.Q.value = 0.5;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.3, now);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  source.connect(filter);
  filter.connect(env);
  env.connect(sfxGain!);
  source.start(now);
  source.stop(now + 0.15);
}

// Card discard — satisfying thud
export function sfxDiscardCard() {
  playTone(120, 'sine', 0.18, 0.4);
  setTimeout(() => playTone(80, 'sine', 0.12, 0.25), 30);
}

// TAWA! — big dramatic reveal
export function sfxTawa() {
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'square', 0.4, 0.14), i * 60);
  });
  // Low boom
  setTimeout(() => playTone(55, 'sawtooth', 0.6, 0.5), 0);
}

// Round win fanfare
export function sfxRoundWin() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
    setTimeout(() => playTone(f, 'triangle', 0.5, 0.18), i * 100);
  });
}

// Error / invalid
export function sfxError() {
  playTone(200, 'sawtooth', 0.18, 0.25);
  setTimeout(() => playTone(150, 'sawtooth', 0.25, 0.25), 100);
}

// Button click
export function sfxClick() {
  playTone(880, 'sine', 0.08, 0.12);
}

// Turn start — your turn notification
export function sfxYourTurn() {
  playTone(880, 'sine', 0.1, 0.15);
  setTimeout(() => playTone(1109.73, 'sine', 0.15, 0.15), 110);
}

// Game over
export function sfxGameOver() {
  const sadNotes = [440, 415.3, 392.0, 349.23, 329.63];
  sadNotes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'triangle', 0.55, 0.2), i * 180);
  });
}

// ─── React hook ──────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

export function useAudio() {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const musicEnabledRef = useRef(musicEnabled);
  const sfxEnabledRef = useRef(sfxEnabled);

  useEffect(() => { musicEnabledRef.current = musicEnabled; }, [musicEnabled]);
  useEffect(() => { sfxEnabledRef.current = sfxEnabled; }, [sfxEnabled]);

  const toggleMusic = () => {
    setMusicEnabled(prev => {
      const next = !prev;
      if (next) {
        startBackgroundMusic();
        if (musicGain) musicGain.gain.value = 0.18;
      } else {
        if (musicGain) musicGain.gain.value = 0;
      }
      return next;
    });
  };

  const toggleSfx = () => {
    setSfxEnabled(prev => {
      const next = !prev;
      if (sfxGain) sfxGain.gain.value = next ? 1.0 : 0;
      return next;
    });
  };

  const initAudio = () => {
    // Must be called from a user gesture
    getMasterGain();
    if (musicEnabledRef.current) startBackgroundMusic();
  };

  return { musicEnabled, sfxEnabled, toggleMusic, toggleSfx, initAudio };
}

export { startBackgroundMusic, stopBackgroundMusic };
