/**
 * FlightAudio.js
 * High-fidelity Web Audio API Sound Synthesizer for Twin Jet Turbofans, Smoke Generator Hiss,
 * High-G Pilot Breathing/Strain, Aerodynamic Wind Rush, and Blue Impulse Pilot Radio Callouts.
 */

import { i18n } from '../i18n/translations.js';

export class FlightAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
    this.lastHighGTime = 0;
    this.lastSmokeCallTime = 0;
    this.prevSmoking = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Jet Engine Turbofan Exhaust Rumble
      this.initEngineSound();

      // 2. High-Speed Aerodynamic Wind Noise
      this.initWindSound();

      // 3. Smoke Generator Pressure Hiss
      this.initSmokeSound();

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  initEngineSound() {
    // Twin turbofan low rumble
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.90 * b2 + white * 0.15;
      output[i] = b0 + b1 + b2;
    }

    this.engineNoise = this.ctx.createBufferSource();
    this.engineNoise.buffer = noiseBuffer;
    this.engineNoise.loop = true;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.engineNoise.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineNoise.start();

    // High turbine whine (IHI F3 turbofan compressor whine)
    this.turbineOsc = this.ctx.createOscillator();
    this.turbineOsc.type = 'sawtooth';
    this.turbineOsc.frequency.setValueAtTime(1800, this.ctx.currentTime);

    this.turbineFilter = this.ctx.createBiquadFilter();
    this.turbineFilter.type = 'bandpass';
    this.turbineFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    this.turbineFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.turbineGain = this.ctx.createGain();
    this.turbineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.turbineOsc.connect(this.turbineFilter);
    this.turbineFilter.connect(this.turbineGain);
    this.turbineGain.connect(this.masterGain);
    this.turbineOsc.start();
  }

  initWindSound() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.windNoise = this.ctx.createBufferSource();
    this.windNoise.buffer = noiseBuffer;
    this.windNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(550, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.windNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windNoise.start();
  }

  initSmokeSound() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.smokeNoise = this.ctx.createBufferSource();
    this.smokeNoise.buffer = noiseBuffer;
    this.smokeNoise.loop = true;

    this.smokeFilter = this.ctx.createBiquadFilter();
    this.smokeFilter.type = 'highpass';
    this.smokeFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.smokeGain = this.ctx.createGain();
    this.smokeGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.smokeNoise.connect(this.smokeFilter);
    this.smokeFilter.connect(this.smokeGain);
    this.smokeGain.connect(this.masterGain);
    this.smokeNoise.start();
  }

  update(telemetry = {}) {
    if (!this.initialized || this.isMuted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const throttle = telemetry.throttle !== undefined ? telemetry.throttle : 0.6;
    const speedKt = telemetry.airspeedKt || 180;
    const gForce = telemetry.gForce || 1.0;
    const isSmoking = telemetry.isSmoking || false;

    // Engine Pitch & Volume modulation
    const baseFreq = 180 + throttle * 320;
    const turbineFreq = 1400 + throttle * 1800;
    const engVol = 0.12 + throttle * 0.38;

    this.engineFilter.frequency.setTargetAtTime(baseFreq, t, 0.1);
    this.turbineOsc.frequency.setTargetAtTime(turbineFreq, t, 0.1);
    this.turbineFilter.frequency.setTargetAtTime(turbineFreq, t, 0.1);
    this.engineGain.gain.setTargetAtTime(engVol, t, 0.1);
    this.turbineGain.gain.setTargetAtTime(engVol * 0.35, t, 0.1);

    // Wind Volume (Rushes violently at high speed & high G)
    const windVol = Math.max(0.02, Math.min(0.35, (speedKt / 300.0) * 0.25 + Math.max(0, (gForce - 1.0) * 0.04)));
    this.windGain.gain.setTargetAtTime(windVol, t, 0.1);
    this.windFilter.frequency.setTargetAtTime(450 + (speedKt / 250.0) * 900, t, 0.1);

    // Smoke Hiss sound
    const smokeVol = isSmoking ? 0.12 : 0.0;
    this.smokeGain.gain.setTargetAtTime(smokeVol, t, 0.1);

    // Smoke ON Callout
    if (isSmoking && !this.prevSmoking && Date.now() - this.lastSmokeCallTime > 4000) {
      this.lastSmokeCallTime = Date.now();
      this.speak(i18n.t('callSmokeOn'));
    }
    this.prevSmoking = isSmoking;

    // High G Strain Warning (> 5.5 G)
    if (gForce > 5.2 && Date.now() - this.lastHighGTime > 5000) {
      this.lastHighGTime = Date.now();
      this.playHighGChime();
    }
  }

  playHighGChime() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
    g.gain.setValueAtTime(0.2, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.2);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playTouchdown() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2600, t);
    osc.frequency.linearRampToValueAtTime(1100, t + 0.35);

    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  speak(text) {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = i18n.lang === 'ja' ? 'ja-JP' : 'en-US';
      u.rate = 1.25;
      u.pitch = 1.05;
      u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  playCrashSound() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Heavy Low Impact Sub-bass Shockwave
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sawtooth';
    boomOsc.frequency.setValueAtTime(140, now);
    boomOsc.frequency.exponentialRampToValueAtTime(22, now + 1.4);

    const boomFilter = this.ctx.createBiquadFilter();
    boomFilter.type = 'lowpass';
    boomFilter.frequency.setValueAtTime(320, now);
    boomFilter.frequency.exponentialRampToValueAtTime(50, now + 1.4);

    boomGain.gain.setValueAtTime(0.9, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    boomOsc.connect(boomFilter);
    boomFilter.connect(boomGain);
    boomGain.connect(this.ctx.destination);

    boomOsc.start(now);
    boomOsc.stop(now + 1.6);

    // 2. High-Frequency Crunch / Distortion Noise
    const crunchBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.8), this.ctx.sampleRate);
    const crunchData = crunchBuffer.getChannelData(0);
    for (let i = 0; i < crunchData.length; i++) {
      crunchData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const crunchNode = this.ctx.createBufferSource();
    crunchNode.buffer = crunchBuffer;

    const crunchFilter = this.ctx.createBiquadFilter();
    crunchFilter.type = 'bandpass';
    crunchFilter.frequency.setValueAtTime(800, now);

    const crunchGain = this.ctx.createGain();
    crunchGain.gain.setValueAtTime(0.6, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    crunchNode.connect(crunchFilter);
    crunchFilter.connect(crunchGain);
    crunchGain.connect(this.ctx.destination);

    crunchNode.start(now);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0 : 0.5, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
