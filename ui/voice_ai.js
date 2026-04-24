// ui/voice_ai.js — Голос Айзена через Web Speech API
export class VoiceAI {
    constructor() {
        this.enabled = 'speechSynthesis' in window;
        this.voice = null;
        this.initVoice();
    }

    initVoice() {
        if (!this.enabled) return;
        const voices = speechSynthesis.getVoices();
        // Ищем русский голос
        this.voice = voices.find(v => v.lang.startsWith('ru')) || voices[0];
    }

    speak(text, rate = 0.9, pitch = 0.8) {
        if (!this.enabled) return;
        
        // Отменяем предыдущую речь
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 0.8;
        
        speechSynthesis.speak(utterance);
    }

    sayOpening() { this.speak('Добро пожаловать в шахматный полигон, боец.'); }
    sayCheck() { this.speak('Шах.'); }
    sayMate() { this.speak('Мат. Твоя душа принадлежит мне.'); }
    sayGoodMove() { this.speak('Неплохой ход. Для смертного.'); }
    sayBadMove() { this.speak('Ты допустил ошибку. Я её вижу.'); }
    sayTraining() { this.speak('Твоя партия поглощена. Я стал сильнее.'); }
}
