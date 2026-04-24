// ui/touch_handler.js — Исправленная обработка касаний
// "Твой палец дрожит. Я это чувствую. Но теперь ходы работают." — Айзен

import { getFrom, getTo, encodeMove } from '../core/bitboard_engine.js';

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
            if (square >= 0 && square < 64) {
                this.handleClick(square);
            }
        });
        
        // Поддержка касаний на мобильных
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const square = this.renderer.getSquareFromXY(x, y);
            if (square >= 0 && square < 64) {
                this.handleClick(square);
            }
        });
    }

    handleClick(square) {
        console.log('Нажата клетка:', square, 'выбрано:', this.selected);
        
        // Если ничего не выбрано — пытаемся выбрать фигуру
        if (this.selected === -1) {
            this.selectPiece(square);
        } 
        // Если уже выбрана фигура — пытаемся сделать ход
        else {
            // Если нажали на ту же клетку — отмена выбора
            if (square === this.selected) {
                this.clearSelection();
                return;
            }
            
            // Если нажали на другую свою фигуру — перевыбор
            if (this.isOwnPiece(square)) {
                this.clearSelection();
                this.selectPiece(square);
                return;
            }
            
            // Ищем ход на выбранную клетку
            const move = this.legalMoves.find(m => getTo(m) === square);
            if (move) {
                this.executeMove(move);
            } else {
                // Нет легального хода — просто показываем ошибку
                console.log('Невозможный ход');
                this.clearSelection();
            }
        }
    }

    selectPiece(square) {
        if (this.isOwnPiece(square)) {
            this.selected = square;
            this.renderer.selectedSquare = square;
            this.legalMoves = this.getLegalMovesForSquare(square);
            this.renderer.legalMoves = this.legalMoves;
            this.renderer.draw(this.board);
            console.log('Выбрана фигура на', square, 'доступно ходов:', this.legalMoves.length);
        }
    }

    isOwnPiece(square) {
        const us = this.board.active_color;
        const bb = 1n << BigInt(square);
        for (let type = 0; type < 6; type++) {
            if (this.board.pieces[type * 2 + us] & bb) {
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
        
        console.log('Ход сделан:', from, '→', to);
        
        if (this.onMove) {
            this.onMove(move);
        }
    }

    clearSelection() {
        this.selected = -1;
        this.renderer.selectedSquare = -1;
        this.renderer.legalMoves = [];
        this.legalMoves = [];
        this.renderer.draw(this.board);
    }

    getLegalMovesForSquare(from) {
        // Генерируем ВСЕ псевдолегальные ходы
        const allMoves = this.board.generatePseudoMoves();
        
        // Фильтруем: только ходы с нашей клетки
        const fromMoves = allMoves.filter(m => getFrom(m) === from);
        
        // Фильтруем: только легальные (после хода король не под шахом)
        const legalMoves = [];
        const savedState = this.saveState();
        
        for (const move of fromMoves) {
            this.board.makeMove(move);
            const inCheck = this.board.inCheck();
            this.restoreState(savedState);
            if (!inCheck) {
                legalMoves.push(move);
            }
        }
        
        return legalMoves;
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
