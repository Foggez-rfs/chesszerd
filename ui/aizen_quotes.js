export class AizenQuotes {
    constructor() {
        this.quotes = {
            opening: [
                '"Садись. Покажи мне свою волю."',
                '"Шахматы — это битва разумов. Ты готов проиграть?"',
                '"Каждый ход — это шаг к твоему поражению."'
            ],
            pressure: [
                '"Ты уже допустил ошибку. Я её вижу."',
                '"Твоя защита рушится, как и твой разум."'
            ],
            victory: ['"Это было предсказуемо. Ты слаб."'],
            defeat: ['"...Невозможно. Ты превзошёл мои расчёты."']
        };
        this.element = null;
    }
    setElement(el) { this.element = el; }
    show(category) {
        const pool = this.quotes[category] || this.quotes.opening;
        const q = pool[Math.floor(Math.random() * pool.length)];
        if (this.element) this.element.textContent = q;
        return q;
    }
    showOpeningQuote() { return this.show('opening'); }
    showPressureQuote() { return this.show('pressure'); }
    showVictoryQuote() { return this.show('victory'); }
    showDefeatQuote() { return this.show('defeat'); }
}
