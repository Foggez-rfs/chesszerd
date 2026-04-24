// core/draw_detector.js — Определение ничьих (200 строк)
// "Ничья? Я не признаю ничьих." — Айзен

export class DrawDetector {
    constructor(board) {
        this.board = board;
        this.positionCount = new Map();
        this.halfMoves = 0;
    }

    // Правило 50 ходов
    is50MoveRule() {
        return this.halfMoves >= 100;
    }

    // Троекратное повторение
    isThreefoldRepetition() {
        const key = this.getPositionKey();
        return (this.positionCount.get(key) || 0) >= 3;
    }

    // Недостаток материала
    isInsufficientMaterial() {
        const w = this.countNonKingPieces(0);
        const b = this.countNonKingPieces(1);

        // K vs K
        if (w.total === 0 && b.total === 0) return true;

        // K+B vs K или K+N vs K
        if ((w.total === 1 && w.bishops + w.knights === 1 && b.total === 0) ||
            (b.total === 1 && b.bishops + b.knights === 1 && w.total === 0)) return true;

        // K+B vs K+B (одноцветные слоны) — упрощённая проверка
        if (w.total === 1 && b.total === 1 && w.bishops === 1 && b.bishops === 1) {
            // Сравниваем цвет слонов
            const wBishopSq = this.findBishopSquare(0);
            const bBishopSq = this.findBishopSquare(1);
            if (wBishopSq !== -1 && bBishopSq !== -1) {
                const wColor = (wBishopSq % 8 + Math.floor(wBishopSq / 8)) % 2;
                const bColor = (bBishopSq % 8 + Math.floor(bBishopSq / 8)) % 2;
                return wColor === bColor;
            }
        }

        return false;
    }

    countNonKingPieces(color) {
        const counts = { total: 0, pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0 };
        const types = ['pawns', 'knights', 'bishops', 'rooks', 'queens'];
        for (let type = 0; type < 5; type++) {
            let bb = this.board.pieces[type * 2 + color];
            while (bb !== 0n) {
                counts.total++;
                const typeName = types[type];
                counts[typeName]++;
                bb &= bb - 1n;
            }
        }
        return counts;
    }

    findBishopSquare(color) {
        const bb = this.board.pieces[4 + color]; // BISHOP = 2, 2*2 = 4
        if (bb === 0n) return -1;
        return this.bitscan(bb);
    }

    bitscan(bb) {
        let sq = 0;
        while ((bb & 1n) === 0n) { bb >>= 1n; sq++; }
        return sq;
    }

    getPositionKey() {
        let key = '';
        for (let type = 0; type < 6; type++) {
            for (let color = 0; color < 2; color++) {
                key += this.board.pieces[type * 2 + color].toString(16) + ':';
            }
        }
        key += this.board.active_color;
        key += this.board.castling_rights;
        key += this.board.en_passant_square;
        return key;
    }

    // Обновляет счётчики после хода
    afterMove(move, isCapture, isPawnMove) {
        if (isCapture || isPawnMove) {
            this.halfMoves = 0;
        } else {
            this.halfMoves++;
        }

        const key = this.getPositionKey();
        this.positionCount.set(key, (this.positionCount.get(key) || 0) + 1);
    }

    // Обновляет счётчики после взятия или хода пешки
    onIrreversibleMove() {
        this.halfMoves = 0;
        this.positionCount.clear();
    }

    // Сброс для новой игры
    reset() {
        this.halfMoves = 0;
        this.positionCount.clear();
    }
}
