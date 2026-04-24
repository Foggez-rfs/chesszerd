export class ThemeManager {
    constructor() {
        this.themes = [
            { id: 'classic_dark', name: 'Классика (тёмная)', board: { light: '#769656', dark: '#eeeed2' } },
            { id: 'classic_light', name: 'Классика (светлая)', board: { light: '#f0d9b5', dark: '#b58863' } },
            { id: 'marble', name: 'Мрамор', board: { light: '#d4c5b9', dark: '#8b7d6b' } },
            { id: 'forest', name: 'Лес', board: { light: '#a8c5a0', dark: '#5d7a4a' } },
            { id: 'metal', name: 'Металл', board: { light: '#c0c0c0', dark: '#606060' } },
            { id: 'neon', name: 'Неон', board: { light: '#1a0033', dark: '#330066' } },
            { id: 'vintage', name: 'Винтаж', board: { light: '#f4e4c1', dark: '#8b6914' } }
        ];
        this.current = 0;
        const saved = localStorage.getItem('chesszerd_theme');
        if (saved) {
            const idx = this.themes.findIndex(t => t.id === saved);
            if (idx >= 0) this.current = idx;
        }
    }

    get() { return this.themes[this.current]; }
    
    next() {
        this.current = (this.current + 1) % this.themes.length;
        localStorage.setItem('chesszerd_theme', this.themes[this.current].id);
        return this.themes[this.current];
    }

    setById(id) {
        const idx = this.themes.findIndex(t => t.id === id);
        if (idx >= 0) {
            this.current = idx;
            localStorage.setItem('chesszerd_theme', id);
        }
    }

    getAll() { return this.themes; }
}
