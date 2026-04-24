// ui/board_renderer.js — Отрисовка с SVG-фигурами
export class BoardRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = 'dark';
        this.selectedSquare = -1;
        this.legalMoves = [];
        this.flipped = false;
        this.pieceImages = {};
        this.piecesLoaded = false;
        this.colors = {
            dark: { light: '#769656', dark: '#eeeed2', highlight: '#baca44', selected: '#f6f669', moveDot: '#00000044', lastMove: '#cdd26a88' },
            light: { light: '#f0d9b5', dark: '#b58863', highlight: '#829769', selected: '#ffff00', moveDot: '#00000033', lastMove: '#aaa23a88' }
        };
        this.loadPieceImages();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // Загружаем SVG-фигуры как Image-объекты
    loadPieceImages() {
        const pieceMap = {
            'K': 'wk', 'Q': 'wq', 'R': 'wr', 'B': 'wb', 'N': 'wn', 'P': 'wp',
            'k': 'bk', 'q': 'bq', 'r': 'br', 'b': 'bb', 'n': 'bn', 'p': 'bp'
        };
        
        // Создаём кешированный SVG для конвертации в Data URL
        const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
            <defs>
                <g id="wk"><path d="M22.5 11.63V6M20 8h5" stroke="#000" stroke-width="1.5" fill="none"/><path fill="#fff" stroke="#000" stroke-width="1.5" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path fill="none" stroke="#000" stroke-width="1.5" d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/><path fill="#fff" d="M11.5 30c5.5-3 15.5-3 21 0"/><path fill="#fff" stroke="#000" stroke-width="1.5" d="M11.5 33.5c5.5-3 15.5-3 21 0v3.5h-21v-3.5z"/></g>
                <g id="wq"><path fill="#fff" stroke="#000" stroke-width="1.5" d="M22.5 26c0-4-4-4-4-4s-4 0-4 4c0 3 2.5 4 4 5.5v3.5h8v-3.5c1.5-1.5 4-2.5 4-5.5 0-4-4-4-4-4s-4 0-4 4z"/><path fill="none" stroke="#000" stroke-width="1.5" d="M11.5 30c3.5-1 9-1 11 2.5M33.5 30c-3.5-1-9-1-11 2.5"/><circle cx="6" cy="12" r="2.75" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="14" cy="9" r="2.75" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="22.5" cy="8" r="2.75" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="31" cy="9" r="2.75" fill="#fff" stroke="#000" stroke-width="1.5"/><circle cx="39" cy="12" r="2.75" fill="#fff" stroke="#000" stroke-width="1.5"/></g>
                <g id="wr"><path fill="#fff" stroke="#000" stroke-width="1.5" d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"/><path fill="none" stroke="#000" stroke-width="1.5" d="M34 14l-3 3H14l-3-3"/><path fill="#fff" stroke="#000" stroke-width="1.5" d="M31 17v12.5H14V17"/><path fill="none" stroke="#000" stroke-width="1.5" d="M31 29.5l1.5 2.5h-20l1.5-2.5"/></g>
                <g id="wb"><path fill="#fff" stroke="#000" stroke-width="1.5" d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path fill="none" stroke="#000" stroke-width="1.5" d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><circle cx="22" cy="12" r="1.75" fill="#fff" stroke="#000" stroke-width="1.5"/></g>
                <g id="wn"><path fill="none" stroke="#000" stroke-width="1.5" d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/><path fill="#fff" stroke="#000" stroke-width="1.5" d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"/></g>
                <g id="wp"><path fill="#fff" stroke="#000" stroke-width="1.5" d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"/></g>
            </defs>
        </svg>`;

        // Конвертируем каждую фигуру в data URL через canvas
        const size = 90; // размер одной фигуры
        for (const [char, id] of Object.entries(pieceMap)) {
            const img = new Image(size, size);
            
            // Создаём SVG для одной фигуры
            const pieceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="${size}" height="${size}">
                <use href="#${id}" fill="${char === char.toUpperCase() ? '#fff' : '#000'}" stroke="${char === char.toUpperCase() ? '#000' : '#fff'}" stroke-width="1.5"/>
            </svg>`;
            
            const blob = new Blob([pieceSvg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            img.src = url;
            img.onload = () => {
                this.pieceImages[char] = img;
                URL.revokeObjectURL(url);
            };
            this.pieceImages[char] = img;
        }
        this.piecesLoaded = true;
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
                const boardRank = this.flipped ? 7 - rank : rank;
                const boardFile = this.flipped ? 7 - file : file;
                const squareIndex = boardRank * 8 + boardFile;
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
            const to = move.to !== undefined ? move.to : (move >> 6) & 0x3F;
            const toRank = Math.floor(to / 8), toFile = to % 8;
            const drawRank = this.flipped ? 7 - toRank : toRank;
            const drawFile = this.flipped ? 7 - toFile : toFile;
            const cx = drawFile * sq + sq / 2, cy = drawRank * sq + sq / 2;
            ctx.fillStyle = c.moveDot;
            ctx.beginPath(); ctx.arc(cx, cy, sq * 0.18, 0, Math.PI * 2); ctx.fill();
        }
        
        // SVG-Фигуры (или fallback на Unicode)
        const pieceChars = ['P','N','B','R','Q','K'];
        if (this.piecesLoaded && Object.keys(this.pieceImages).length > 0) {
            for (let rank = 0; rank < 8; rank++) {
                for (let file = 0; file < 8; file++) {
                    const boardRank = this.flipped ? 7 - rank : rank;
                    const boardFile = this.flipped ? 7 - file : file;
                    const squareIndex = boardRank * 8 + boardFile;
                    
                    for (let type = 0; type < 6; type++) {
                        for (let color = 0; color < 2; color++) {
                            if (board.pieces[type * 2 + color] & (1n << BigInt(squareIndex))) {
                                const pieceChar = pieceChars[type];
                                const char = color === 0 ? pieceChar : pieceChar.toLowerCase();
                                const img = this.pieceImages[char];
                                const x = file * sq + sq * 0.1;
                                const y = rank * sq + sq * 0.1;
                                const pieceSize = sq * 0.8;
                                
                                if (img && img.complete && img.naturalWidth > 0) {
                                    ctx.drawImage(img, x, y, pieceSize, pieceSize);
                                } else {
                                    // Fallback: Unicode
                                    const unicodeMap = {
                                        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
                                        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
                                    };
                                    ctx.font = `${sq * 0.72}px serif`;
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    ctx.fillStyle = color === 0 ? '#fff' : '#000';
                                    ctx.strokeStyle = color === 0 ? '#000' : '#fff';
                                    ctx.lineWidth = 2;
                                    const cx = file * sq + sq / 2, cy = rank * sq + sq / 2;
                                    ctx.strokeText(unicodeMap[char] || '?', cx, cy);
                                    ctx.fillText(unicodeMap[char] || '?', cx, cy);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Unicode fallback
            const unicodeMap = {
                'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
                'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
            };
            ctx.font = `${sq * 0.72}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let rank = 0; rank < 8; rank++) {
                for (let file = 0; file < 8; file++) {
                    const boardRank = this.flipped ? 7 - rank : rank;
                    const boardFile = this.flipped ? 7 - file : file;
                    const squareIndex = boardRank * 8 + boardFile;
                    
                    for (let type = 0; type < 6; type++) {
                        for (let color = 0; color < 2; color++) {
                            if (board.pieces[type * 2 + color] & (1n << BigInt(squareIndex))) {
                                const pieceChar = pieceChars[type];
                                const char = color === 0 ? pieceChar : pieceChar.toLowerCase();
                                const cx = file * sq + sq / 2, cy = rank * sq + sq / 2;
                                ctx.fillStyle = color === 0 ? '#fff' : '#000';
                                ctx.strokeStyle = color === 0 ? '#000' : '#fff';
                                ctx.lineWidth = 2;
                                ctx.strokeText(unicodeMap[char] || '?', cx, cy);
                                ctx.fillText(unicodeMap[char] || '?', cx, cy);
                            }
                        }
                    }
                }
            }
        }
    }
}
