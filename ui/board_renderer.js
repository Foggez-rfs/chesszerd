// ui/board_renderer.js — Отрисовка доски
export class BoardRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize() {
        const size = Math.min(window.innerWidth - 20, 600);
        this.canvas.width = size;
        this.canvas.height = size;
        this.squareSize = size / 8;
    }
    draw(board) {
        const ctx = this.ctx;
        const size = this.squareSize;
        // Отрисовка клеток
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const isLight = (rank + file) % 2 === 0;
                ctx.fillStyle = isLight ? '#769656' : '#eeeed2';
                ctx.fillRect(file * size, (7 - rank) * size, size, size);
            }
        }
        // Заглушка: будет полная отрисовка фигур
        console.log('Доска отрисована');
    }
}
