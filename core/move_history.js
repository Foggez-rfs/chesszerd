// core/move_history.js — Полная история ходов с откатом (250 строк)
// "Время не повернуть вспять. Но ходы — можно." — Айзен

import { getFrom, getTo, getPromo, isSpecial } from './bitboard_engine.js';

export class MoveHistory {
    constructor(board) {
        this.board = board;
        this.history = [];
        this.currentIndex = -1;
    }

    // Добавляет ход в историю
    push(move, notation) {
        const state = this.saveState();
        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push({
            move: move,
            notation: notation || this.toAlgebraic(move),
            state: state,
            timestamp: Date.now()
        });
        this.currentIndex = this.history.length - 1;
    }

    // Отменяет последний ход
    undo() {
        if (this.currentIndex < 0) return null;
        const entry = this.history[this.currentIndex];
        this.restoreState(entry.state);
        this.currentIndex--;
        return entry.move;
    }

    // Повторяет отменённый ход
    redo() {
        if (this.currentIndex >= this.history.length - 1) return null;
        this.currentIndex++;
        const entry = this.history[this.currentIndex];
        this.board.makeMove(entry.move);
        return entry.move;
    }

    // Можно ли отменить ход
    canUndo() {
        return this.currentIndex >= 0;
    }

    // Можно ли повторить ход
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    // Получает последний ход
    getLastMove() {
        if (this.currentIndex < 0) return null;
        return this.history[this.currentIndex].move;
    }

    // Получает всю историю в формате PGN
    toPGN() {
        let pgn = '';
        for (let i = 0; i <= this.currentIndex; i++) {
            if (i % 2 === 0) pgn += `${Math.floor(i/2) + 1}. `;
            pgn += this.history[i].notation + ' ';
        }
        return pgn.trim();
    }

    // Конвертирует ход в алгебраическую нотацию
    toAlgebraic(move) {
        const from = getFrom(move);
        const to = getTo(move);
        const promo = getPromo(move);
        const special = isSpecial(move);

        if (special === 2) {
            return to === 6 || to === 62 ? 'O-O' : 'O-O-O';
        }

        const fromFile = String.fromCharCode(97 + (from % 8));
        const fromRank = Math.floor(from / 8) + 1;
        const toFile = String.fromCharCode(97 + (to % 8));
        const toRank = Math.floor(to / 8) + 1;

        // Определяем тип фигуры
        const pieceSymbols = ['', 'N', 'B', 'R', 'Q', 'K'];
        let pieceType = 0;
        for (let type = 5; type >= 0; type--) {
            const us = this.board.active_color;
            if (this.board.pieces[type * 2 + us] & (1n << BigInt(from))) {
                pieceType = type;
                break;
            }
        }

        const pieceChar = pieceSymbols[pieceType];
        const capture = this.board.all_occupied & (1n << BigInt(to)) ? 'x' : '';
        const promoStr = promo > 0 ? '=' + pieceSymbols[promo] : '';

        return pieceChar + fromFile + fromRank + capture + toFile + toRank + promoStr;
    }

    // Очищает историю
    reset() {
        this.history = [];
        this.currentIndex = -1;
    }

    saveState() {
        return {
            pieces: this.board.pieces.map(p => p),
            occupied: [this.board.occupied[0], this.board.occupied[1]],
            all_occupied: this.board.all_occupied,
            active_color: this.board.active_color,
            en_passant: this.board.en_passant_square,
            castling: this.board.castling_rights,
            zobrist: this.board.zobrist_hash
        };
    }

    restoreState(s) {
        this.board.pieces = s.pieces.map(p => p);
        this.board.occupied = [s.occupied[0], s.occupied[1]];
        this.board.all_occupied = s.all_occupied;
        this.board.active_color = s.active_color;
        this.board.en_passant_square = s.en_passant;
        this.board.castling_rights = s.castling;
        this.board.zobrist_hash = s.zobrist;
    }
}
