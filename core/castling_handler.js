// core/castling_handler.js — Все правила рокировки (150 строк)
// "Король в безопасности? Нет. Только иллюзия." — Айзен

export class CastlingHandler {
    constructor(board) {
        this.board = board;
    }

    // Проверяет, возможна ли рокировка
    canCastle(side) {
        const us = this.board.active_color;
        const row = us === 0 ? 0 : 7;

        // Проверяем права
        if (side === 'kingside') {
            const right = us === 0 ? 1 : 4;
            if (!(this.board.castling_rights & right)) return false;
        } else {
            const right = us === 0 ? 2 : 8;
            if (!(this.board.castling_rights & right)) return false;
        }

        // Проверяем, что король не под шахом
        if (this.board.inCheck()) return false;

        const kingSq = row * 8 + 4;
        const them = us ^ 1;

        if (side === 'kingside') {
            const pathSquares = [kingSq + 1, kingSq + 2];
            const occupiedSquares = [kingSq + 1, kingSq + 2];
            
            // Проверяем, что клетки свободны
            for (const sq of occupiedSquares) {
                if (this.board.all_occupied & (1n << BigInt(sq))) return false;
            }
            
            // Проверяем, что клетки не атакованы
            for (const sq of pathSquares) {
                if (this.isSquareAttacked(sq, them)) return false;
            }
        } else {
            const pathSquares = [kingSq - 1, kingSq - 2];
            const occupiedSquares = [kingSq - 1, kingSq - 2, kingSq - 3];
            
            for (const sq of occupiedSquares) {
                if (sq >= row * 8 && (this.board.all_occupied & (1n << BigInt(sq)))) return false;
            }
            
            for (const sq of pathSquares) {
                if (this.isSquareAttacked(sq, them)) return false;
            }
        }

        // Проверяем, что ладья на месте
        if (side === 'kingside') {
            const rookSq = row * 8 + 7;
            const rookBB = 1n << BigInt(rookSq);
            if (!(this.board.pieces[6 + us] & rookBB)) return false; // ROOK = 3, 3*2 = 6
        } else {
            const rookSq = row * 8;
            const rookBB = 1n << BigInt(rookSq);
            if (!(this.board.pieces[6 + us] & rookBB)) return false;
        }

        return true;
    }

    isSquareAttacked(sq, attackerColor) {
        return this.board.isSquareAttacked(sq, attackerColor);
    }

    // Выполняет рокировку
    execute(side) {
        const us = this.board.active_color;
        const row = us === 0 ? 0 : 7;

        if (side === 'kingside') {
            const kingFrom = row * 8 + 4;
            const kingTo = row * 8 + 6;
            const rookFrom = row * 8 + 7;
            const rookTo = row * 8 + 5;
            return this.makeCastleMove(kingFrom, kingTo, rookFrom, rookTo);
        } else {
            const kingFrom = row * 8 + 4;
            const kingTo = row * 8 + 2;
            const rookFrom = row * 8;
            const rookTo = row * 8 + 3;
            return this.makeCastleMove(kingFrom, kingTo, rookFrom, rookTo);
        }
    }

    makeCastleMove(kingFrom, kingTo, rookFrom, rookTo) {
        // Кодируем как специальный ход
        return kingFrom | (kingTo << 6) | (2 << 15); // special = 2 (рокировка)
    }

    // Обновляет права рокировки после хода
    updateRights(move) {
        const from = move & 0x3F;
        const to = (move >> 6) & 0x3F;

        // Король ходил
        if (from === 4) this.board.castling_rights &= ~3;      // Белые теряют права
        if (from === 60) this.board.castling_rights &= ~12;    // Чёрные теряют права

        // Ладья ходила
        if (from === 0 || to === 0) this.board.castling_rights &= ~2;   // Белая ферзевая
        if (from === 7 || to === 7) this.board.castling_rights &= ~1;   // Белая королевская
        if (from === 56 || to === 56) this.board.castling_rights &= ~8; // Чёрная ферзевая
        if (from === 63 || to === 63) this.board.castling_rights &= ~4; // Чёрная королевская

        // Взятие ладьи
        if (to === 0) this.board.castling_rights &= ~2;
        if (to === 7) this.board.castling_rights &= ~1;
        if (to === 56) this.board.castling_rights &= ~8;
        if (to === 63) this.board.castling_rights &= ~4;
    }
}
