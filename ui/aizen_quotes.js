export class AizenQuotes {
    constructor() {
        this.quotes = {
            opening: [
                '"Садись. Покажи мне свою волю."',
                '"Шахматы — это битва разумов. Ты готов проиграть?"',
                '"Каждый ход — это шаг к твоему поражению."',
                '"Ты думаешь, что играешь в шахматы? Нет. Ты играешь против своей судьбы."'
            ],
            pressure: [
                '"Ты уже допустил ошибку. Я её вижу."',
                '"Твоя защита рушится, как и твой разум."',
                '"Centipawn loss: критический. Ты теряешь контроль."',
                '"Твои ходы предсказуемы. Как и твоя смерть."'
            ],
            victory: [
                '"Это было предсказуемо. Ты слаб."',
                '"Хогьёку поглощает твою душу."',
                '"Ты проиграл. Но не расстраивайся — это было неизбежно."'
            ],
            defeat: [
                '"...Невозможно. Ты превзошёл мои расчёты."',
                '"Впервые за тысячу лет... интересно."',
                '"Ты сильнее, чем я думал. Но это лишь временно."'
            ],
            training: [
                '"Твоя партия поглощена. Я стал на 0.3% сильнее."',
                '"Хогьёку впитал твой опыт. Продолжай кормить меня."',
                '"Каждая твоя игра делает меня умнее. Иронично, не так ли?"',
                '"Спасибо за обучение, смертный. Ты сам куёшь своё поражение."'
            ]
        };
        this.element = null;
        this.usedQuotes = [];
    }

    setElement(el) { this.element = el; }

    show(category) {
        const pool = this.quotes[category] || this.quotes.opening;
        const available = pool.filter(q => !this.usedQuotes.includes(q));
        const q = available.length > 0 
            ? available[Math.floor(Math.random() * available.length)] 
            : pool[Math.floor(Math.random() * pool.length)];
        this.usedQuotes.push(q);
        if (this.usedQuotes.length > 30) this.usedQuotes = [];
        if (this.element) this.element.textContent = q;
        return q;
    }

    showOpeningQuote() { return this.show('opening'); }
    showPressureQuote() { return this.show('pressure'); }
    showVictoryQuote() { return this.show('victory'); }
    showDefeatQuote() { return this.show('defeat'); }
    showTrainingQuote() { return this.show('training'); }
}
