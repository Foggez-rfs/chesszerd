export class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('chesszerd_theme') || 'dark';
    }
    toggle() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('chesszerd_theme', this.theme);
        return this.theme;
    }
    get() { return this.theme; }
    apply() {
        document.body.className = this.theme;
        const quote = document.getElementById('aizen-quote');
        if (quote) quote.style.color = this.theme === 'dark' ? '#c71585' : '#8b0000';
    }
}
