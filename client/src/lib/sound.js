// Web Audio API Sound System for FlowZen
// Pure synthesis using oscillators, gain envelopes, and biquad filters - Zero external audio files

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.lastPlayed = {};
    this.throttleMs = 60;
  }

  // Lazy initialize AudioContext on first user interaction
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  isThrottled(soundName) {
    const now = Date.now();
    if (this.lastPlayed[soundName] && now - this.lastPlayed[soundName] < this.throttleMs) {
      return true;
    }
    this.lastPlayed[soundName] = now;
    return false;
  }

  canPlay(soundName, volume = 0.3, isMuted = false) {
    if (isMuted || volume <= 0) return false;
    if (typeof document !== 'undefined' && document.hidden) return false;
    if (this.isThrottled(soundName)) return false;
    this.init();
    return !!this.ctx;
  }

  // 1. Click: Short soft tick (~40ms)
  playClick(volume = 0.3, isMuted = false) {
    if (!this.canPlay('click', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // 2. Toggle: Two-tone chime (rising or falling)
  playToggle(isOpening = true, volume = 0.3, isMuted = false) {
    if (!this.canPlay('toggle', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const freq1 = isOpening ? 520 : 680;
    const freq2 = isOpening ? 680 : 520;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq1, now);
    osc.frequency.setValueAtTime(freq2, now + 0.045);

    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 3. Hover: Very subtle, quiet tick
  playHover(volume = 0.3, isMuted = false) {
    if (!this.canPlay('hover', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

    gain.gain.setValueAtTime(volume * 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  // 4. Success: Rising 3-note melodic chime (C5 -> E5 -> G5)
  playSuccess(volume = 0.3, isMuted = false) {
    if (!this.canPlay('success', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(volume * 0.5, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  // 5. Error: Low double buzz
  playError(volume = 0.3, isMuted = false) {
    if (!this.canPlay('error', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    [0, 0.09].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const t = now + offset;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, t);

      gain.gain.setValueAtTime(volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    });
  }

  // 6. Notification: Soft gentle bell
  playNotification(volume = 0.3, isMuted = false) {
    if (!this.canPlay('notification', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now); // A6 overtone

    gain.gain.setValueAtTime(volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  // 7. Drag Pickup: Light pop
  playDragPickup(volume = 0.3, isMuted = false) {
    if (!this.canPlay('dragPickup', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.05);

    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // 8. Drop: Soft thud
  playDrop(volume = 0.3, isMuted = false) {
    if (!this.canPlay('drop', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    gain.gain.setValueAtTime(volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 9. Drawer Open / Close: Soft whoosh (filtered swept sound)
  playDrawer(isOpen = true, volume = 0.3, isMuted = false) {
    if (!this.canPlay('drawer', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = isOpen ? 220 : 440;
    const endFreq = isOpen ? 440 : 220;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.28, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  // 10. Timer Start / Stop
  playTimer(isStarting = true, volume = 0.3, isMuted = false) {
    if (!this.canPlay('timer', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isStarting ? 880 : 440, now);

    gain.gain.setValueAtTime(volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 11. Level Up: Triumphant arpeggio
  playLevelUp(volume = 0.3, isMuted = false) {
    if (!this.canPlay('levelUp', volume, isMuted)) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(volume * 0.55, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }
}

export const soundEngine = new SoundEngine();

