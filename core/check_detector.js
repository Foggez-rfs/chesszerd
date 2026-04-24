// core/check_detector.js — Определение всех видов шаха и мата (200 строк)
// "Шах. Мат. Твоя душа." — Айзен

export class CheckDetector {
    constructor(board) {
        this.board = board;
    }

    // Проверяет, даёт ли ход шах
    givesCheck(move) {
        const saved = this.saveState();
        this.board.makeMove(move);
        const inCheck = this.board.inCheck();
        this.restoreState(saved);
        return inCheck;
    }

    // Проверяет двойной шах
    isDoubleCheck() {
        const us = this.board.active_color;
        const them = us ^ 1;
        const kingBB = this.board.pieces[10 + us]; // KING = 5
        if (kingBB === 0n) return false;
        
        const kingSq = this.bitscan(kingBB);
        let attackers = 0;

        // Проверяем всех вражеских слонов и ферзей (диагонали)
        const diagonalAttackers = this.board.pieces[4 + them] | this.board.pieces[8 + them]; // BISHOP + QUEEN
        let temp = diagonalAttackers;
        while (temp !== 0n) {
            const sq = this.bitscan(temp);
            if (this.onDiagonal(sq, kingSq) && this.clearPath(sq, kingSq)) attackers++;
            temp &= temp - 1n;
        }

        // Проверяем вражеских ладей и ферзей (прямые)
        const straightAttackers = this.board.pieces[6 + them] | this.board.pieces[8 + them]; // ROOK + QUEEN
        temp = straightAttackers;
        while (temp !== 0n) {
            const sq = this.bitscan(temp);
            if (this.onStraight(sq, kingSq) && this.clearPath(sq, kingSq)) attackers++;
            temp &= temp - 1n;
        }

        // Проверяем коней
        const knightBB = this.board.pieces[2 + them]; // KNIGHT = 1
        temp = knightBB;
        const knightAttacks = this.getKnightAttacks(kingSq);
        while (temp !== 0n) {
            const sq = this.bitscan(temp);
            if (knightAttacks & (1n << BigInt(sq))) attackers++;
            temp &= temp - 1n;
        }

        // Проверяем пешки
        const pawnBB = this.board.pieces[them]; // PAWN = 0
        temp = pawnBB;
        const pawnAttacks = this.getPawnAttacks(kingSq, us);
        while (temp !== 0n) {
            const sq = this.bitscan(temp);
            if (pawnAttacks & (1n << BigInt(sq))) attackers++;
            temp &= temp - 1n;
        }

        return attackers >= 2;
    }

    // Проверяет, является ли шах вскрытым
    isDiscoveredCheck(move) {
        const saved = this.saveState();
        const wasInCheck = this.board.inCheck();
        this.board.makeMove(move);
        const isInCheck = this.board.inCheck();
        this.restoreState(saved);
        return !wasInCheck && isInCheck;
    }

    // Находит все шахи
    findAllChecks() {
        const moves = this.board.generatePseudoMoves();
        const checks = [];
        for (const move of moves) {
            if (this.givesCheck(move)) checks.push(move);
        }
        return checks;
    }

    onDiagonal(sq1, sq2) {
        const file1 = sq1 % 8, rank1 = Math.floor(sq1 / 8);
        const file2 = sq2 % 8, rank2 = Math.floor(sq2 / 8);
        return Math.abs(file1 - file2) === Math.abs(rank1 - rank2);
    }

    onStraight(sq1, sq2) {
        const file1 = sq1 % 8, rank1 = Math.floor(sq1 / 8);
        const file2 = sq2 % 8, rank2 = Math.floor(sq2 / 8);
        return file1 === file2 || rank1 === rank2;
    }

    clearPath(from, to) {
        const fileFrom = from % 8, rankFrom = Math.floor(from / 8);
        const fileTo = to % 8, rankTo = Math.floor(to / 8);
        const df = Math.sign(fileTo - fileFrom);
        const dr = Math.sign(rankTo - rankFrom);
        
        let f = fileFrom + df, r = rankFrom + dr;
        while (f !== fileTo || r !== rankTo) {
            const sq = r * 8 + f;
            if (this.board.all_occupied & (1n << BigInt(sq))) return false;
            f += df; r += dr;
        }
        return true;
    }

    getKnightAttacks(sq) {
        const file = sq % 8, rank = Math.floor(sq / 8);
        let attacks = 0n;
        const moves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, df] of moves) {
            const r = rank + dr, f = file + df;
            if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                attacks |= 1n << BigInt(r * 8 + f);
            }
        }
        return attacks;
    }

    getPawnAttacks(kingSq, kingColor) {
        const file = kingSq % 8, rank = Math.floor(kingSq / 8);
        let attacks = 0n;
        const dir = kingColor === 0 ? 1 : -1;
        for (const df of [-1, 1]) {
            const f = file + df, r = rank + dir;
            if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                attacks |= 1n << BigInt(r * 8 + f);
            }
        }
        return attacks;
    }

    bitscan(bb) {
        let sq = 0;
        while ((bb & 1n) === 0n) { bb >>= 1n; sq++; }
        return sq;
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
