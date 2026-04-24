// ui/touch_handler.js — Ходы в стиле Chess.com
// "Перетаскивание? Детский сад. Но для тебя — сделаю." — Айзен

import { getFrom, getTo } from '../core/bitboard_engine.js';

export class TouchHandler {
    constructor(canvas, board, renderer, onMoveCallback) {
        this.canvas = canvas;
        this.board = board;
        this.renderer = renderer;
        this.onMove = onMoveCallback;
        this.selected = -1;
        this.legalMoves = [];
        this.isDragging = false;
        this.dragStartSquare = -1;
        this.bindEvents();
    }

    bindEvents() {
        // Мышь (десктоп)
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e));
        this.canvas.addEventListener('mouseleave', () => this.cancelDrag());

        // Касания (мобильные)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onPointerDown(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.onPointerMove(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onPointerUp(e.changedTouches[0]);
        });
        this.canvas.addEventListener('touchcancel', () => this.cancelDrag());
    }

    getSquareFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return this.renderer.getSquareFromXY(x, y);
    }

    onPointerDown(e) {
        const square = this.getSquareFromEvent(e);
        if (square < 0 || square >= 64) return;

        const us = this.board.active_color;

        // Если нажали на СВОЮ фигуру
        if (this.isOwnPiece(square, us)) {
            // Если уже была выбрана ДРУГАЯ своя фигура — выбираем новую
            if (this.selected !== -1 && this.selected !== square) {
                this.clearSelection();
            }
            
            this.selected = square;
            this.dragStartSquare = square;
            this.isDragging = true;
            this.renderer.selectedSquare = square;
            this.legalMoves = this.getLegalMovesForSquare(square);
            this.renderer.legalMoves = this.legalMoves;
            this.renderer.draw(this.board);
            return;
        }

        // Если нажали на вражескую фигуру ИЛИ пустую клетку, когда фигура выбрана
        if (this.selected !== -1) {
            const move = this.legalMoves.find(m => getTo(m) === square);
            if (move) {
                this.executeMove(move);
            } else {
                // Кликнули на пустую/вражескую клетку без легального хода
                this.clearSelection();
            }
        }
    }

    onPointerMove(e) {
        // Не используется для drag-and-drop, но можно добавить позже
    }

    onPointerUp(e) {
        const square = this.getSquareFromEvent(e);
        
        if (this.isDragging && this.selected !== -1 && square >= 0) {
            // Если отпустили на ту же клетку — не делаем ничего (это был выбор)
            if (square === this.dragStartSquare) {
                this.isDragging = false;
                return;
            }
            
            // Пытаемся сделать ход
            const move = this.legalMoves.find(m => getTo(m) === square);
            if (move) {
                this.executeMove(move);
            } else {
                // Отпустили на нелегальную клетку — отмена
                this.clearSelection();
            }
        }
        
        this.isDragging = false;
        this.dragStartSquare = -1;
    }

    cancelDrag() {
        this.isDragging = false;
        this.dragStartSquare = -1;
    }

    isOwnPiece(square, color) {
        const bb = 1n << BigInt(square);
        for (let type = 0; type < 6; type++) {
            if (this.board.pieces[type * 2 + color] & bb) {
                return true;
            }
        }
        return false;
    }

    executeMove(move) {
        const from = getFrom(move);
        const to = getTo(move);
        
        this.board.makeMove(move);
        this.renderer.selectedSquare = -1;
        this.renderer.legalMoves = [];
        this.renderer.draw(this.board, { from, to });
        
        this.selected = -1;
        this.legalMoves = [];
        this.isDragging = false;
        this.dragStartSquare = -1;
        
        console.log('✅ Ход:', from, '→', to);
        
        if (this.onMove) {
            this.onMove(move);
        }
    }

    clearSelection() {
        this.selected = -1;
        this.renderer.selectedSquare = -1;
        this.renderer.legalMoves = [];
        this.legalMoves = [];
        this.isDragging = false;
        this.dragStartSquare = -1;
        this.renderer.draw(this.board);
    }

    getLegalMovesForSquare(from) {
        // Генерируем все псевдолегальные ходы
        const allMoves = this.board.generatePseudoMoves();
        
        // Фильтруем: только ходы с нашей клетки
        const fromMoves = allMoves.filter(m => getFrom(m) === from);
        
        // Проверяем легальность (не оставляет ли короля под шахом)
        const legalMoves = [];
        
        for (const move of fromMoves) {
            const saved = {
                pieces: this.board.pieces.map(p => p),
                occupied: [this.board.occupied[0], this.board.occupied[1]],
                all_occupied: this.board.all_occupied,
                active_color: this.board.active_color,
                en_passant: this.board.en_passant_square,
                castling: this.board.castling_rights
            };
            
            this.board.makeMove(move);
            const inCheck = this.board.inCheck();
            
            // Восстанавливаем состояние
            this.board.pieces = saved.pieces.map(p => p);
            this.board.occupied = [saved.occupied[0], saved.occupied[1]];
            this.board.all_occupied = saved.all_occupied;
            this.board.active_color = saved.active_color;
            this.board.en_passant_square = saved.en_passant;
            this.board.castling_rights = saved.castling;
            
            if (!inCheck) {
                legalMoves.push(move);
            }
        }
        
        console.log('♟️ Легальных ходов для', from, ':', legalMoves.length);
        return legalMoves;
    }
}
