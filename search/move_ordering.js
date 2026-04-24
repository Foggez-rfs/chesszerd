// search/move_ordering.js — Сортировка ходов (200 строк)
// "Порядок ходов — это порядок победы." — Айзен

import { getFrom, getTo, getPromo } from '../core/bitboard_engine.js';

export class MoveOrdering {
    constructor() {
        this.killerMoves = new Array(64).fill(null).map(() => [0, 0]);
        this.historyTable = new Array(64).fill(null).map(() => new Array(64).fill(0));
        this.pieceValues = [100, 320, 330, 500, 900, 0];
    }

    // Сортирует ходы: лучшие сначала
    order(moves, board, hashMove = null) {
        return moves.sort((a, b) => this.score(b, board, hashMove) - this.score(a, board, hashMove));
    }

    score(move, board, hashMove) {
        // 1. Хеш-ход (из транспозиционной таблицы)
        if (hashMove !== null && move === hashMove) return 10000000;

        const from = getFrom(move);
        const to = getTo(move);
        const promo = getPromo(move);

        // 2. Взятия (MVV-LVA)
        const victimValue = this.getVictimValue(to, board);
        if (victimValue > 0) {
            const attackerValue = this.getAttackerValue(from, board);
            return 1000000 + victimValue * 100 - attackerValue;
        }

        // 3. Продвижение пешки
        if (promo > 0) return 900000 + promo * 10000;

        // 4. Ходы-убийцы
        if (this.killerMoves[from][0] === to) return 800000;
        if (this.killerMoves[from][1] === to) return 700000;

        // 5. Историческая эвристика
        return Math.min(this.historyTable[from][to], 500000);
    }

    getVictimValue(square, board) {
        const them = board.active_color ^ 1;
        const bb = 1n << BigInt(square);
        for (let type = 0; type < 6; type++) {
            if (board.pieces[type * 2 + them] & bb) {
                return this.pieceValues[type];
            }
        }
        return 0;
    }

    getAttackerValue(square, board) {
        const us = board.active_color;
        const bb = 1n << BigInt(square);
        for (let type = 0; type < 6; type++) {
            if (board.pieces[type * 2 + us] & bb) {
                return this.pieceValues[type];
            }
        }
        return 0;
    }

    // Обновляет киллер-ходы
    updateKiller(move, depth) {
        const from = getFrom(move);
        const to = getTo(move);
        if (this.killerMoves[from][0] !== to) {
            this.killerMoves[from][1] = this.killerMoves[from][0];
            this.killerMoves[from][0] = to;
        }
    }

    // Обновляет историческую таблицу
    updateHistory(move, depth) {
        const from = getFrom(move);
        const to = getTo(move);
        this.historyTable[from][to] += depth * depth;
    }

    // Сброс для новой игры
    reset() {
        this.killerMoves = new Array(64).fill(null).map(() => [0, 0]);
        this.historyTable = new Array(64).fill(null).map(() => new Array(64).fill(0));
    }
}
