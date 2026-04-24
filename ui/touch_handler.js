// ui/touch_handler.js — Обработка касаний
// "Твой палец дрожит. Я это чувствую." — Айзен

import { getFrom, getTo } from '../core/bitboard_engine.js';

export class TouchHandler {
    constructor(canvas, board, renderer, onMoveCallback) {
        this.canvas = canvas;
        this.board = board;
        this.renderer = renderer;
        this.onMove = onMoveCallback;
        this.selected = -1;
        this.legalMoves = [];
        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const square = this.renderer.getSquareFromXY(x, y);
            this.handleClick(square);
        });
    }

    handleClick(square) {
        if (this.selected === -1) {
            const us = this.board.active_color;
            for (let type = 0; type < 6; type++) {
                if (this.board.pieces[type * 2 + us] & (1n << BigInt(square))) {
                    this.selected = square;
                    this.renderer.selectedSquare = square;
                    this.legalMoves = this.getLegalMovesForSquare(square);
                    this.renderer.legalMoves = this.legalMoves;
                    this.renderer.draw(this.board);
                    return;
                }
            }
        } else {
            const move = this.legalMoves.find(m => getTo(m) === square);
            if (move) {
                this.board.makeMove(move);
                this.renderer.selectedSquare = -1;
                this.renderer.legalMoves = [];
                this.renderer.draw(this.board, { from: getFrom(move), to: getTo(move) });
                this.selected = -1;
                this.legalMoves = [];
                if (this.onMove) this.onMove(move);
            } else {
                this.selected = -1;
                this.renderer.selectedSquare = -1;
                this.renderer.legalMoves = [];
                this.renderer.draw(this.board);
                this.handleClick(square);
            }
        }
    }

    getLegalMovesForSquare(from) {
        const moves = this.board.generatePseudoMoves();
        return moves.filter(m => {
            if (getFrom(m) !== from) return false;
            const saved = this.saveState();
            this.board.makeMove(m);
            const inCheck = this.board.inCheck();
            this.restoreState(saved);
            return !inCheck;
        });
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
