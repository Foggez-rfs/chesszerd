// ui/aizen_quotes.js — Психологическое давление
export class AizenQuotes {
    constructor() {
        this.quotes = {
            opening: [
                "\"Садись. Покажи мне свою волю.\"",
                "\"Шахматы — это битва разумов. Ты готов проиграть?\"",
                "\"Каждый ход — это шаг к твоему поражению.\""
            ],
            pressure: [
                "\"Ты уже допустил ошибку. Я её вижу.\"",
                "\"Твоя защита рушится, как и твой разум.\"",
                "\"Centipawn loss: критический. Ты теряешь контроль.\""
            ],
            victory: [
                "\"Это было предсказуемо. Ты слаб.\"",
                "\"Хогьёку поглощает твою душу.\""
            ]
        };
        this.element = null;
    }
    setElement(el) { this.element = el; }
    showOpeningQuote() {
        const q = this.quotes.opening[Math.floor(Math.random() * this.quotes.opening.length)];
        if (this.element) this.element.textContent = q;
    }
    showPressureQuote() {
        const q = this.quotes.pressure[Math.floor(Math.random() * this.quotes.pressure.length)];
        if (this.element) this.element.textContent = q;
    }
}
