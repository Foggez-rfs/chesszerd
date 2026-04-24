// core/move_validator.js — Полная валидация ходов (250 строк)
// "Ты думаешь, что можешь пойти? Докажи." — Айзен

import { getFrom, getTo, getPromo, isSpecial } from './bitboard_engine.js';

export class MoveValidator {
    constructor(board) {
        this.board = board;
        this.positionHistory = [];
        this.fiftyMoveCounter = 0;
        this.repetitionMap = new Map();
    }

    // Проверяет, легален ли ход
    isLegal(move) {
        const saved = this.saveState();
        this.board.makeMove(move);
        const inCheck = this.board.inCheck();
        this.restoreState(saved);
        return !inCheck;
    }

    // Проверяет, находится ли король под шахом
    isInCheck() {
        return this.board.inCheck();
    }

    // Проверяет мат
    isCheckmate() {
        if (!this.isInCheck()) return false;
        const moves = this.board.generatePseudoMoves();
        for (const move of moves) {
            if (this.isLegal(move)) return false;
        }
        return true;
    }

    // Проверяет пат
    isStalemate() {
        if (this.isInCheck()) return false;
        const moves = this.board.generatePseudoMoves();
        for (const move of moves) {
            if (this.isLegal(move)) return false;
        }
        return true;
    }

    // Проверяет троекратное повторение позиции
    isThreefoldRepetition() {
        const key = this.getPositionKey();
        const count = this.repetitionMap.get(key) || 0;
        return count >= 3;
    }

    // Проверяет правило 50 ходов
    isFiftyMoveRule() {
        return this.fiftyMoveCounter >= 100;
    }

    // Проверяет недостаток материала для мата
    isInsufficientMaterial() {
        const wPieces = this.countPieces(0);
        const bPieces = this.countPieces(1);
        
        // K vs K
        if (wPieces.total === 1 && bPieces.total === 1) return true;
        // K+B vs K или K+N vs K
        if ((wPieces.total === 2 && wPieces.bishops + wPieces.knights === 1 && bPieces.total === 1) ||
            (bPieces.total === 2 && bPieces.bishops + bPieces.knights === 1 && wPieces.total === 1)) return true;
        // K+B vs K+B (одноцветные слоны)
        if (wPieces.total === 2 && bPieces.total === 2 && 
            wPieces.bishops === 1 && bPieces.bishops === 1) {
            // Проверка цвета слонов — заглушка
            return false;
        }
        
        return false;
    }

    countPieces(color) {
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
        // Король
        if (this.board.pieces[10 + color] !== 0n) counts.total++;
        return counts;
    }

    getPositionKey() {
        let key = '';
        for (let type = 0; type < 6; type++) {
            for (let color = 0; color < 2; color++) {
                key += this.board.pieces[type * 2 + color].toString(36) + ':';
            }
        }
        key += this.board.active_color + ':';
        key += this.board.castling_rights + ':';
        key += this.board.en_passant_square;
        return key;
    }

    // Обновляет счётчики после хода
    afterMove(move) {
        const to = getTo(move);
        const from = getFrom(move);
        
        // Правило 50 ходов
        const captured = this.isCapture(move);
        const isPawnMove = this.isPawnMove(from);
        
        if (captured || isPawnMove) {
            this.fiftyMoveCounter = 0;
        } else {
            this.fiftyMoveCounter++;
        }
        
        // Троекратное повторение
        const key = this.getPositionKey();
        this.repetitionMap.set(key, (this.repetitionMap.get(key) || 0) + 1);
    }

    isCapture(move) {
        const to = getTo(move);
        const them = this.board.active_color ^ 1;
        return (this.board.occupied[them] & (1n << BigInt(to))) !== 0n;
    }

    isPawnMove(from) {
        const bb = 1n << BigInt(from);
        return (this.board.pieces[0] & bb) !== 0n || (this.board.pieces[1] & bb) !== 0n;
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

    // Полная проверка окончания игры
    getGameStatus() {
        if (this.isCheckmate()) return 'checkmate';
        if (this.isStalemate()) return 'stalemate';
        if (this.isThreefoldRepetition()) return 'threefold';
        if (this.isFiftyMoveRule()) return 'fifty_move';
        if (this.isInsufficientMaterial()) return 'insufficient_material';
        return 'playing';
    }

    // Сброс для новой игры
    reset() {
        this.fiftyMoveCounter = 0;
        this.repetitionMap.clear();
        this.positionHistory = [];
    }
}
