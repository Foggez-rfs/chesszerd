// ui/touch_handler.js — СТАБИЛЬНЫЙ ОБРАБОТЧИК КАСАНИЙ
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
        // Клик
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const square = this.renderer.getSquareFromXY(x, y);
            if (square >= 0 && square < 64) this.handleClick(square);
        });

        // Тач для мобильных
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const square = this.renderer.getSquareFromXY(x, y);
            if (square >= 0 && square < 64) this.handleClick(square);
        }, { passive: false });
    }

    handleClick(square) {
        // Если уже выбрана фигура
        if (this.selected >= 0) {
            const move = this.legalMoves.find(m => getTo(m) === square);
            if (move) {
                // Делаем ход
                this.board.makeMove(move);
                this.renderer.selectedSquare = -1;
                this.renderer.legalMoves = [];
                this.renderer.draw(this.board, { from: getFrom(move), to: getTo(move) });
                this.selected = -1;
                this.legalMoves = [];
                if (this.onMove) this.onMove(move);
                return;
            }
            
            // Если нажали на другую СВОЮ фигуру — перевыбираем
            if (this.isMyPiece(square)) {
                this.selected = -1;
                this.renderer.selectedSquare = -1;
                this.renderer.legalMoves = [];
                this.renderer.draw(this.board);
                this.selectPiece(square);
                return;
            }
            
            // Нажали на пустую/вражескую клетку без хода — отмена
            this.clearSelection();
            return;
        }
        
        // Ничего не выбрано — пытаемся выбрать
        this.selectPiece(square);
    }

    selectPiece(square) {
        if (!this.isMyPiece(square)) return;
        
        this.selected = square;
        this.renderer.selectedSquare = square;
        this.legalMoves = this.getLegalMovesForSquare(square);
        this.renderer.legalMoves = this.legalMoves;
        this.renderer.draw(this.board);
    }

    isMyPiece(square) {
        const us = this.board.active_color;
        const bb = 1n << BigInt(square);
        for (let type = 0; type < 6; type++) {
            if ((this.board.pieces[type * 2 + us] & bb) !== 0n) return true;
        }
        return false;
    }

    clearSelection() {
        this.selected = -1;
        this.renderer.selectedSquare = -1;
        this.renderer.legalMoves = [];
        this.legalMoves = [];
        this.renderer.draw(this.board);
    }

    getLegalMovesForSquare(from) {
        const allMoves = this.board.generatePseudoMoves();
        const fromMoves = allMoves.filter(m => getFrom(m) === from);
        const legal = [];
        
        for (const move of fromMoves) {
            const saved = this.saveState();
            this.board.makeMove(move);
            if (!this.board.inCheck()) legal.push(move);
            this.restoreState(saved);
        }
        
        return legal;
    }

    saveState() {
        return {
            pieces: this.board.pieces.map(p => p),
            occupied: [this.board.occupied[0], this.board.occupied[1]],
            all_occupied: this.board.all_occupied,
            active_color: this.board.active_color,
            en_passant: this.board.en_passant_square,
            castling: this.board.castling_rights
        };
    }

    restoreState(s) {
        this.board.pieces = s.pieces.map(p => p);
        this.board.occupied = [s.occupied[0], s.occupied[1]];
        this.board.all_occupied = s.all_occupied;
        this.board.active_color = s.active_color;
        this.board.en_passant_square = s.en_passant;
        this.board.castling_rights = s.castling;
    }
}
