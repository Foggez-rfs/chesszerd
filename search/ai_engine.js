// search/ai_engine.js — ИИ на автономной нейросети
// "Я просчитываю не ходы. Я просчитываю твою душу." — Айзен

import { NNCore } from '../brain/nn_core.js';
import { InferenceEngine } from '../brain/inference_engine.js';
import { getFrom, getTo, popCount } from '../core/bitboard_engine.js';

export class AIEngine {
    constructor(board, depth = 3) {
        this.board = board;
        this.depth = depth;
        this.nn = new NNCore();
        this.inference = new InferenceEngine(board);
        this.transpositionTable = new Map();
    }

    // Основной поиск с Alpha-Beta
    findBestMove() {
        const moves = this.getLegalMoves();
        if (moves.length === 0) return null;
        if (moves.length === 1) return moves[0];
        
        let bestMove = moves[0];
        let bestScore = -Infinity;
        const alpha = -Infinity;
        const beta = Infinity;
        
        for (const move of moves) {
            const saved = this.saveState();
            this.board.makeMove(move);
            
            const score = -this.alphaBeta(this.depth - 1, -beta, -alpha);
            
            this.restoreState(saved);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    alphaBeta(depth, alpha, beta) {
        if (depth === 0) return this.quiescenceSearch(alpha, beta);
        
        const moves = this.getLegalMoves();
        if (moves.length === 0) {
            if (this.board.inCheck()) return -100000 + (this.depth - depth) * 1000;
            return 0;
        }
        
        // Move ordering — сначала взятия
        moves.sort((a, b) => {
            const aCapture = this.getCaptureValue(b);
            const bCapture = this.getCaptureValue(a);
            return bCapture - aCapture;
        });
        
        for (const move of moves) {
            const saved = this.saveState();
            this.board.makeMove(move);
            
            const score = -this.alphaBeta(depth - 1, -beta, -alpha);
            
            this.restoreState(saved);
            
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        
        return alpha;
    }

    quiescenceSearch(alpha, beta) {
        const standPat = this.inference.evaluate(this.nn);
        if (standPat >= beta) return beta;
        if (standPat > alpha) alpha = standPat;
        
        const captures = this.getLegalMoves().filter(m => this.isCapture(m));
        for (const move of captures) {
            const saved = this.saveState();
            this.board.makeMove(move);
            const score = -this.quiescenceSearch(-beta, -alpha);
            this.restoreState(saved);
            
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        
        return alpha;
    }

    getLegalMoves() {
        const all = this.board.generatePseudoMoves();
        return all.filter(m => {
            const saved = this.saveState();
            this.board.makeMove(m);
            const ok = !this.board.inCheck();
            this.restoreState(saved);
            return ok;
        });
    }

    isCapture(move) {
        const to = getTo(move);
        const them = this.board.active_color ^ 1;
        return (this.board.occupied[them] & (1n << BigInt(to))) !== 0n;
    }

    getCaptureValue(move) {
        if (!this.isCapture(move)) return 0;
        const values = [100, 320, 330, 500, 900, 0];
        const to = getTo(move);
        const them = this.board.active_color ^ 1;
        for (let type = 0; type < 6; type++) {
            if (this.board.pieces[type * 2 + them] & (1n << BigInt(to))) {
                return values[type];
            }
        }
        return 0;
    }

    // Обучение после партии
    train(result) {
        const tensor = this.inference.boardToTensor();
        const target = result === 'win' ? 1 : result === 'loss' ? -1 : 0;
        const loss = this.nn.forward(tensor);
        this.nn.backward(target, 0.01);
        return Math.abs(loss - target);
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

    exportWeights() { return this.nn.exportWeights(); }
    importWeights(json) { return this.nn.importWeights(json); }
}
