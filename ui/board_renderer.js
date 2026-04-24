// ui/board_renderer.js — Отрисовка досоки с фигурами
export class BoardRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = 'dark';
        this.selectedSquare = -1;
        this.legalMoves = [];
        this.flipped = false;
        this.pieceSymbols = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        this.colors = {
            dark: { light: '#769656', dark: '#eeeed2', highlight: '#baca44', selected: '#f6f669', moveDot: '#00000044', lastMove: '#cdd26a88' },
            light: { light: '#f0d9b5', dark: '#b58863', highlight: '#829769', selected: '#ffff00', moveDot: '#00000033', lastMove: '#aaa23a88' }
        };
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth - 10, container.clientHeight - 10, 600);
        this.canvas.width = size;
        this.canvas.height = size;
        this.squareSize = size / 8;
    }
    setTheme(theme) { this.theme = theme; this.draw(); }
    
    getSquareFromXY(x, y) {
        const file = Math.floor(x / this.squareSize);
        const rank = Math.floor(y / this.squareSize);
        if (file < 0 || file >= 8 || rank < 0 || rank >= 8) return -1;
        const boardFile = this.flipped ? 7 - file : file;
        const boardRank = this.flipped ? 7 - rank : rank;
        return boardRank * 8 + boardFile;
    }

    draw(board, lastMove = null) {
        const ctx = this.ctx;
        const sq = this.squareSize;
        const c = this.colors[this.theme];
        
        // Клетки
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const isLight = (rank + file) % 2 === 0;
                const squareIndex = (this.flipped ? 7 - rank : rank) * 8 + (this.flipped ? 7 - file : file);
                const x = file * sq, y = rank * sq;
                
                ctx.fillStyle = isLight ? c.light : c.dark;
                ctx.fillRect(x, y, sq, sq);
                
                if (squareIndex === this.selectedSquare) {
                    ctx.fillStyle = c.selected;
                    ctx.fillRect(x, y, sq, sq);
                }
                if (lastMove && (squareIndex === lastMove.from || squareIndex === lastMove.to)) {
                    ctx.fillStyle = c.lastMove;
                    ctx.fillRect(x, y, sq, sq);
                }
            }
        }
        
        // Точки возможных ходов
        for (const move of this.legalMoves) {
            const to = move.to !== undefined ? move.to : getTo(move);
            const toRank = Math.floor(to / 8), toFile = to % 8;
            const drawRank = this.flipped ? 7 - toRank : toRank;
            const drawFile = this.flipped ? 7 - toFile : toFile;
            const cx = drawFile * sq + sq / 2, cy = drawRank * sq + sq / 2;
            ctx.fillStyle = c.moveDot;
            ctx.beginPath(); ctx.arc(cx, cy, sq * 0.18, 0, Math.PI * 2); ctx.fill();
        }
        
        // Фигуры
        ctx.font = `${sq * 0.72}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (board && board.pieces) {
            const pieceChars = ['P','N','B','R','Q','K'];
            for (let rank = 0; rank < 8; rank++) {
                for (let file = 0; file < 8; file++) {
                    const boardRank = this.flipped ? 7 - rank : rank;
                    const boardFile = this.flipped ? 7 - file : file;
                    const squareIndex = boardRank * 8 + boardFile;
                    
                    for (let type = 0; type < 6; type++) {
                        for (let color = 0; color < 2; color++) {
                            if (board.pieces[type * 2 + color] & (1n << BigInt(squareIndex))) {
                                const char = color === 0 ? pieceChars[type] : pieceChars[type].toLowerCase();
                                const x = file * sq + sq / 2, y = rank * sq + sq / 2;
                                ctx.fillStyle = color === 0 ? '#ffffff' : '#000000';
                                ctx.strokeStyle = color === 0 ? '#000000' : '#ffffff';
                                ctx.lineWidth = 2;
                                ctx.strokeText(this.pieceSymbols[char], x, y);
                                ctx.fillText(this.pieceSymbols[char], x, y);
                            }
                        }
                    }
                }
            }
        }
    }
}

// Импорт для получения getTo если move — объект
function getTo(move) { return (move >> 6) & 0x3F; }
