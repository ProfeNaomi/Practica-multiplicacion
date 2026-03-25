class SoundManager {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio playback error", e);
    }
  }

  playCorrect() {
    this.playTone(600, 'sine', 0.1, 0.2);
    setTimeout(() => this.playTone(800, 'sine', 0.15, 0.2), 100);
  }

  playWrong() {
    this.playTone(300, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 0.2), 150);
  }

  playLevelUp() {
    [400, 500, 600, 800].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.1, 0.1), i * 100);
    });
  }

  playGameOver() {
    [400, 350, 300, 200].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.3, 0.2), i * 200);
    });
  }
}

export const sounds = new SoundManager();
