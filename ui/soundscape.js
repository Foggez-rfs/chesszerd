// ui/soundscape.js — Звуки через Web Audio API (без файлов!)
// "Ты слышишь этот звук? Это твоё поражение." — Айзен

export class Soundscape {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            this.enabled = false;
        }
    }

    playTone(freq, duration, type = 'sine', volume = 0.1) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    playMove() {
        this.playTone(600, 0.05, 'sine', 0.08);
    }

    playCapture() {
        this.playTone(300, 0.15, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(200, 0.1, 'triangle', 0.1), 100);
    }

    playCheck() {
        this.playTone(800, 0.3, 'square', 0.4);
    }

    playCastle() {
        this.playTone(500, 0.08, 'sine', 0.06);
        setTimeout(() => this.playTone(700, 0.08, 'sine', 0.06), 80);
    }

    playGameOver() {
        this.playTone(400, 0.5, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(300, 0.5, 'sawtooth', 0.3), 500);
        setTimeout(() => this.playTone(200, 0.8, 'sawtooth', 0.4), 1000);
    }

    playVictory() {
        this.playTone(523, 0.2, 'sine', 0.1);
        setTimeout(() => this.playTone(659, 0.2, 'sine', 0.1), 200);
        setTimeout(() => this.playTone(784, 0.4, 'sine', 0.1), 400);
    }
}
