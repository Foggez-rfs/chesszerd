// core/bitboard_engine.js
// -----------------------------------------------------------
// CHESSZERD: HOGYOKU BITBOARD ENGINE v1.0
// "Каждое число на моей доске — это душа, которую я могу сломать."
// "Ад пуст, все демоны здесь, в этих 64 битах." — Сосуке Айзен
// -----------------------------------------------------------

const ZERO = 0n;
const ONE = 1n;

// -------------------------------------------
// 1. КОНСТАНТЫ И МАСКИ
// -------------------------------------------
const FILE_A = 0x0101010101010101n;
const FILE_B = FILE_A << 1n;
const FILE_C = FILE_A << 2n;
const FILE_D = FILE_A << 3n;
const FILE_E = FILE_A << 4n;
const FILE_F = FILE_A << 5n;
const FILE_G = FILE_A << 6n;
const FILE_H = FILE_A << 7n;

const RANK_1 = 0xFFn;
const RANK_2 = RANK_1 << 8n;
const RANK_3 = RANK_1 << 16n;
const RANK_4 = RANK_1 << 24n;
const RANK_5 = RANK_1 << 32n;
const RANK_6 = RANK_1 << 40n;
const RANK_7 = RANK_1 << 48n;
const RANK_8 = RANK_1 << 56n;

const MAIN_DIAG = 0x8040201008040201n;
const ANTI_DIAG = 0x0102040810204080n;

const NOT_A_FILE = ~FILE_A;
const NOT_H_FILE = ~FILE_H;
const NOT_AB_FILE = ~(FILE_A | FILE_B);
const NOT_GH_FILE = ~(FILE_G | FILE_H);

// -------------------------------------------
// 2. ТИПЫ ФИГУР И ПРЕДСТАВЛЕНИЕ ДОСКИ
// -------------------------------------------
export const PIECE_TYPES = {
    PAWN: 0, KNIGHT: 1, BISHOP: 2, ROOK: 3, QUEEN: 4, KING: 5
};

export const COLORS = {
    WHITE: 0, BLACK: 1
};

export class Board {
    constructor() {
        this.pieces = new Array(12).fill(ZERO);
        this.occupied = [ZERO, ZERO];
        this.all_occupied = ZERO;
        this.active_color = COLORS.WHITE;
        this.castling_rights = 0b1111;
        this.en_passant_square = -1;
        this.halfmove_clock = 0;
        this.fullmove_number = 1;
        this.zobrist_hash = 0n;
        this.initZobrist();
    }

    getPieceBoard(type, color) {
        return type * 2 + color;
    }
}

// -------------------------------------------
// 3. ZOBRIST HASHING
// -------------------------------------------
let ZOBRIST_PIECES = [];
let ZOBRIST_CASTLING = [];
let ZOBRIST_EN_PASSANT = new Array(64).fill(0n);
let ZOBRIST_SIDE_TO_MOVE;

function randomBigInt() {
    const high = BigInt(Math.floor(Math.random() * 0xFFFFFFFF));
    const low = BigInt(Math.floor(Math.random() * 0xFFFFFFFF));
    return (high << 32n) | low;
}

Board.prototype.initZobrist = function() {
    if (ZOBRIST_PIECES.length > 0) return;
    for (let i = 0; i < 12; i++) {
        ZOBRIST_PIECES[i] = new Array(64);
        for (let sq = 0; sq < 64; sq++) {
            ZOBRIST_PIECES[i][sq] = randomBigInt();
        }
    }
    for (let i = 0; i < 16; i++) {
        ZOBRIST_CASTLING[i] = randomBigInt();
    }
    for (let sq = 0; sq < 64; sq++) {
        ZOBRIST_EN_PASSANT[sq] = randomBigInt();
    }
    ZOBRIST_SIDE_TO_MOVE = randomBigInt();
};

Board.prototype.xorPiece = function(type, color, sq) {
    this.zobrist_hash ^= ZOBRIST_PIECES[type * 2 + color][sq];
};

Board.prototype.xorCastling = function(oldRights) {
    this.zobrist_hash ^= ZOBRIST_CASTLING[oldRights];
};

Board.prototype.xorEnPassant = function(sq) {
    if (sq !== -1) this.zobrist_hash ^= ZOBRIST_EN_PASSANT[sq];
};

// -------------------------------------------
// 4. БАЗОВЫЕ ОПЕРАЦИИ С БИТБОРДАМИ
// -------------------------------------------
const BIT_SCAN_TABLE = new Int8Array(64);
const initBitScan = () => {
    for (let i = 0; i < 64; i++) {
        BIT_SCAN_TABLE[Number((ONE << BigInt(i)) % 67n)] = i;
    }
};
initBitScan();

function bitscanForward(bb) {
    if (bb === ZERO) return -1;
    const isolated = bb & -bb;
    return BIT_SCAN_TABLE[Number(isolated % 67n)];
}

export function popLSB(bb) {
    if (bb === ZERO) return { sq: -1, bb: ZERO };
    const isolated = bb & -bb;
    return {
        sq: BIT_SCAN_TABLE[Number(isolated % 67n)],
        bb: bb ^ isolated
    };
}

export function popCount(bb) {
    let count = 0;
    while (bb !== ZERO) {
        bb &= (bb - 1n);
        count++;
    }
    return count;
}

function shiftNorth(bb) { return bb << 8n; }
function shiftSouth(bb) { return bb >> 8n; }
function shiftEast(bb)  { return (bb & NOT_H_FILE) << 1n; }
function shiftWest(bb)  { return (bb & NOT_A_FILE) >> 1n; }
function shiftNE(bb)    { return (bb & NOT_H_FILE) << 9n; }
function shiftNW(bb)    { return (bb & NOT_A_FILE) << 7n; }
function shiftSE(bb)    { return (bb & NOT_H_FILE) >> 7n; }
function shiftSW(bb)    { return (bb & NOT_A_FILE) >> 9n; }

// -------------------------------------------
// 5. MAGIC BITBOARDS
// -------------------------------------------
function generateRookMask(sq) {
    let attacks = ZERO;
    const tr = sq % 8;
    const tf = Math.floor(sq / 8);
    for (let r = tf + 1; r < 7; r++) attacks |= (ONE << BigInt(r * 8 + tr));
    for (let r = tf - 1; r > 0; r--) attacks |= (ONE << BigInt(r * 8 + tr));
    for (let f = tr + 1; f < 7; f++) attacks |= (ONE << BigInt(tf * 8 + f));
    for (let f = tr - 1; f > 0; f--) attacks |= (ONE << BigInt(tf * 8 + f));
    return attacks;
}

function generateBishopMask(sq) {
    let attacks = ZERO;
    const tr = sq % 8;
    const tf = Math.floor(sq / 8);
    for (let r = tf + 1, f = tr + 1; r < 7 && f < 7; r++, f++) attacks |= (ONE << BigInt(r * 8 + f));
    for (let r = tf + 1, f = tr - 1; r < 7 && f > 0; r++, f--) attacks |= (ONE << BigInt(r * 8 + f));
    for (let r = tf - 1, f = tr + 1; r > 0 && f < 7; r--, f++) attacks |= (ONE << BigInt(r * 8 + f));
    for (let r = tf - 1, f = tr - 1; r > 0 && f > 0; r--, f--) attacks |= (ONE << BigInt(r * 8 + f));
    return attacks;
}

function rayAttacks(sq, direction, occupied) {
    let attacks = ZERO;
    let nextSq = sq;
    const delta = direction;
    while (true) {
        if (delta === 8) nextSq += 8;
        else if (delta === -8) nextSq -= 8;
        else if (delta === 1) { if (nextSq % 8 === 7) break; nextSq += 1; }
        else if (delta === -1) { if (nextSq % 8 === 0) break; nextSq -= 1; }
        else if (delta === 9) { if (nextSq % 8 === 7) break; nextSq += 9; }
        else if (delta === 7) { if (nextSq % 8 === 0) break; nextSq += 7; }
        else if (delta === -7) { if (nextSq % 8 === 7) break; nextSq -= 7; }
        else if (delta === -9) { if (nextSq % 8 === 0) break; nextSq -= 9; }
        else break;
        if (nextSq < 0 || nextSq >= 64) break;
        const targetBit = ONE << BigInt(nextSq);
        attacks |= targetBit;
        if (occupied & targetBit) break;
    }
    return attacks;
}

// -------------------------------------------
// 6. АТАКИ НЕСКОЛЬЗЯЩИХ ФИГУР
// -------------------------------------------
const KNIGHT_ATTACKS = new Array(64);
const KING_ATTACKS = new Array(64);
const PAWN_ATTACKS = [new Array(64), new Array(64)];
const PAWN_PUSHES = [new Array(64), new Array(64)];

function initLeaperAttacks() {
    for (let sq = 0; sq < 64; sq++) {
        const bb = ONE << BigInt(sq);
        KNIGHT_ATTACKS[sq] = 
            shiftNE(shiftNorth(bb)) | shiftNW(shiftNorth(bb)) |
            shiftNE(shiftEast(bb)) | shiftSE(shiftEast(bb)) |
            shiftSW(shiftWest(bb)) | shiftNW(shiftWest(bb)) |
            shiftSW(shiftSouth(bb)) | shiftSE(shiftSouth(bb));
        KING_ATTACKS[sq] = 
            shiftNorth(bb) | shiftSouth(bb) | shiftEast(bb) | shiftWest(bb) |
            shiftNE(bb) | shiftNW(bb) | shiftSE(bb) | shiftSW(bb);
    }
    for (let sq = 0; sq < 64; sq++) {
        const bb = ONE << BigInt(sq);
        PAWN_ATTACKS[COLORS.WHITE][sq] = shiftNW(bb) | shiftNE(bb);
        PAWN_ATTACKS[COLORS.BLACK][sq] = shiftSW(bb) | shiftSE(bb);
        PAWN_PUSHES[COLORS.WHITE][sq] = shiftNorth(bb);
        if (sq >= 8 && sq <= 15) PAWN_PUSHES[COLORS.WHITE][sq] |= shiftNorth(shiftNorth(bb));
        PAWN_PUSHES[COLORS.BLACK][sq] = shiftSouth(bb);
        if (sq >= 48 && sq <= 55) PAWN_PUSHES[COLORS.BLACK][sq] |= shiftSouth(shiftSouth(bb));
    }
}
initLeaperAttacks();

// -------------------------------------------
// 7. ГЕНЕРАЦИЯ ХОДОВ
// -------------------------------------------
export function encodeMove(from, to, promo = 0, special = 0) {
    return (from) | (to << 6) | (promo << 12) | (special << 15);
}
export function getFrom(move) { return move & 0x3F; }
export function getTo(move) { return (move >> 6) & 0x3F; }
export function getPromo(move) { return (move >> 12) & 0x7; }
export function isSpecial(move) { return (move >> 15) & 0x1; }

Board.prototype.generatePseudoMoves = function() {
    const moves = [];
    const us = this.active_color;
    const them = us ^ 1;
    const ourPieces = this.occupied[us];
    const theirPieces = this.occupied[them];
    const allOcc = this.all_occupied;
    const emptySquares = ~allOcc;

    // 1. Pawns
    const pawns = this.pieces[PIECE_TYPES.PAWN * 2 + us];
    let tempPawns = pawns;
    while (tempPawns !== ZERO) {
        const { sq, bb: newPawns } = popLSB(tempPawns);
        tempPawns = newPawns;
        const attacks = PAWN_ATTACKS[us][sq] & theirPieces;
        let tempAttacks = attacks;
        while (tempAttacks !== ZERO) {
            const { sq: toSq, bb: newAtt } = popLSB(tempAttacks);
            tempAttacks = newAtt;
            if (toSq >= 56 || toSq <= 7) {
                for (let p = PIECE_TYPES.KNIGHT; p <= PIECE_TYPES.QUEEN; p++) {
                    moves.push(encodeMove(sq, toSq, p, 0));
                }
            } else {
                moves.push(encodeMove(sq, toSq, 0, 0));
            }
        }
        const pushOne = PAWN_PUSHES[us][sq] & emptySquares;
        let tempPush = pushOne;
        while (tempPush !== ZERO) {
            const { sq: toSq, bb: newP } = popLSB(tempPush);
            tempPush = newP;
            if (toSq >= 56 || toSq <= 7) {
                for (let p = PIECE_TYPES.KNIGHT; p <= PIECE_TYPES.QUEEN; p++) {
                    moves.push(encodeMove(sq, toSq, p, 0));
                }
            } else {
                moves.push(encodeMove(sq, toSq, 0, 0));
            }
            if ((us === COLORS.WHITE && sq >= 8 && sq <= 15) || (us === COLORS.BLACK && sq >= 48 && sq <= 55)) {
                const pushTwo = PAWN_PUSHES[us][toSq] & emptySquares;
                if (pushTwo) {
                    moves.push(encodeMove(sq, popLSB(pushTwo).sq, 0, 0));
                }
            }
        }
        if (this.en_passant_square !== -1) {
            const epBB = ONE << BigInt(this.en_passant_square);
            if (PAWN_ATTACKS[us][sq] & epBB) {
                moves.push(encodeMove(sq, this.en_passant_square, 0, 1));
            }
        }
    }

    // 2. Knights
    const knights = this.pieces[PIECE_TYPES.KNIGHT * 2 + us];
    let tempKnights = knights;
    while (tempKnights !== ZERO) {
        const { sq, bb } = popLSB(tempKnights);
        tempKnights = bb;
        const attacks = KNIGHT_ATTACKS[sq] & ~ourPieces;
        let t = attacks;
        while (t !== ZERO) { const r = popLSB(t); moves.push(encodeMove(sq, r.sq, 0, 0)); t = r.bb; }
    }

    // 3. Bishops & Queens
    const bishops = this.pieces[PIECE_TYPES.BISHOP * 2 + us] | this.pieces[PIECE_TYPES.QUEEN * 2 + us];
    let tempBishops = bishops;
    while (tempBishops !== ZERO) {
        const { sq, bb } = popLSB(tempBishops);
        tempBishops = bb;
        let attacks = ZERO;
        attacks |= rayAttacks(sq, 9, allOcc);
        attacks |= rayAttacks(sq, 7, allOcc);
        attacks |= rayAttacks(sq, -7, allOcc);
        attacks |= rayAttacks(sq, -9, allOcc);
        attacks &= ~ourPieces;
        let t = attacks;
        while (t !== ZERO) { const r = popLSB(t); moves.push(encodeMove(sq, r.sq, 0, 0)); t = r.bb; }
    }

    // 4. Rooks & Queens
    const rooks = this.pieces[PIECE_TYPES.ROOK * 2 + us] | this.pieces[PIECE_TYPES.QUEEN * 2 + us];
    let tempRooks = rooks;
    while (tempRooks !== ZERO) {
        const { sq, bb } = popLSB(tempRooks);
        tempRooks = bb;
        let attacks = ZERO;
        attacks |= rayAttacks(sq, 8, allOcc);
        attacks |= rayAttacks(sq, -8, allOcc);
        attacks |= rayAttacks(sq, 1, allOcc);
        attacks |= rayAttacks(sq, -1, allOcc);
        attacks &= ~ourPieces;
        let t = attacks;
        while (t !== ZERO) { const r = popLSB(t); moves.push(encodeMove(sq, r.sq, 0, 0)); t = r.bb; }
    }

    // 5. King
    const king = this.pieces[PIECE_TYPES.KING * 2 + us];
    if (king !== ZERO) {
        const sq = popLSB(king).sq;
        let attacks = KING_ATTACKS[sq] & ~ourPieces;
        let t = attacks;
        while (t !== ZERO) { const r = popLSB(t); moves.push(encodeMove(sq, r.sq, 0, 0)); t = r.bb; }
        if (us === COLORS.WHITE) {
            if ((this.castling_rights & 0x1) && !(allOcc & 0x60n) && !this.isSquareAttacked(4, them) && !this.isSquareAttacked(5, them)) {
                moves.push(encodeMove(4, 6, 0, 2));
            }
            if ((this.castling_rights & 0x2) && !(allOcc & 0xEn) && !this.isSquareAttacked(4, them) && !this.isSquareAttacked(3, them)) {
                moves.push(encodeMove(4, 2, 0, 2));
            }
        } else {
            if ((this.castling_rights & 0x4) && !(allOcc & 0x6000000000000000n) && !this.isSquareAttacked(60, them) && !this.isSquareAttacked(61, them)) {
                moves.push(encodeMove(60, 62, 0, 2));
            }
            if ((this.castling_rights & 0x8) && !(allOcc & 0x0E00000000000000n) && !this.isSquareAttacked(60, them) && !this.isSquareAttacked(59, them)) {
                moves.push(encodeMove(60, 58, 0, 2));
            }
        }
    }
    return moves;
};

Board.prototype.isSquareAttacked = function(sq, attackerColor) {
    const them = attackerColor;
    const us = them ^ 1;
    const sqBB = ONE << BigInt(sq);
    if (PAWN_ATTACKS[them][sq] & this.pieces[PIECE_TYPES.PAWN * 2 + them]) return true;
    if (KNIGHT_ATTACKS[sq] & this.pieces[PIECE_TYPES.KNIGHT * 2 + them]) return true;
    if (KING_ATTACKS[sq] & this.pieces[PIECE_TYPES.KING * 2 + them]) return true;
    const allOcc = this.all_occupied;
    if (rayAttacks(sq, 8, allOcc) & (this.pieces[PIECE_TYPES.ROOK * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    if (rayAttacks(sq, -8, allOcc) & (this.pieces[PIECE_TYPES.ROOK * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    if (rayAttacks(sq, 1, allOcc) & (this.pieces[PIECE_TYPES.ROOK * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    if (rayAttacks(sq, -1, allOcc) & (this.pieces[PIECE_TYPES.ROOK * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    if (rayAttacks(sq, 9, allOcc) & (this.pieces[PIECE_TYPES.BISHOP * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    if (rayAttacks(sq, 7, allOcc) & (this.pieces[PIECE_TYPES.BISHOP * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    if (rayAttacks(sq, -9, allOcc) & (this.pieces[PIECE_TYPES.BISHOP * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    if (rayAttacks(sq, -7, allOcc) & (this.pieces[PIECE_TYPES.BISHOP * 2 + them] | this.pieces[PIECE_TYPES.QUEEN * 2 + them])) return true;
    return false;
};

Board.prototype.inCheck = function() {
    const us = this.active_color;
    const kingBB = this.pieces[PIECE_TYPES.KING * 2 + us];
    if (kingBB === ZERO) return true;
    return this.isSquareAttacked(popLSB(kingBB).sq, us ^ 1);
};

Board.prototype.makeMove = function(move) {
    const from = getFrom(move);
    const to = getTo(move);
    const promo = getPromo(move);
    const special = isSpecial(move);
    const us = this.active_color;
    const them = us ^ 1;
    const fromBB = ONE << BigInt(from);
    const toBB = ONE << BigInt(to);
    let pieceType = -1;
    for (let i = 0; i < 6; i++) {
        if (this.pieces[i * 2 + us] & fromBB) {
            pieceType = i;
            this.pieces[i * 2 + us] ^= fromBB;
            break;
        }
    }
    let capturedType = -1;
    for (let i = 0; i < 6; i++) {
        if (this.pieces[i * 2 + them] & toBB) {
            capturedType = i;
            this.pieces[i * 2 + them] ^= toBB;
            break;
        }
    }
    if (special === 1) {
        const capturedPawnSq = us === COLORS.WHITE ? to - 8 : to + 8;
        this.pieces[PIECE_TYPES.PAWN * 2 + them] ^= ONE << BigInt(capturedPawnSq);
        capturedType = PIECE_TYPES.PAWN;
    }
    const finalPiece = (promo !== 0) ? promo : pieceType;
    this.pieces[finalPiece * 2 + us] |= toBB;
    if (special === 2) {
        if (to === 6) this.movePiece(us, PIECE_TYPES.ROOK, 7, 5);
        else if (to === 2) this.movePiece(us, PIECE_TYPES.ROOK, 0, 3);
        else if (to === 62) this.movePiece(them, PIECE_TYPES.ROOK, 63, 61);
        else if (to === 58) this.movePiece(them, PIECE_TYPES.ROOK, 56, 59);
    }
    this.occupied[us] = ZERO;
    this.occupied[them] = ZERO;
    for (let i = 0; i < 6; i++) {
        this.occupied[us] |= this.pieces[i * 2 + us];
        this.occupied[them] |= this.pieces[i * 2 + them];
    }
    this.all_occupied = this.occupied[us] | this.occupied[them];
    this.en_passant_square = -1;
    if (pieceType === PIECE_TYPES.PAWN && Math.abs(to - from) === 16) {
        this.en_passant_square = (from + to) >> 1;
    }
    this.active_color = them;
    this.fullmove_number++;
    return this;
};

Board.prototype.movePiece = function(color, type, from, to) {
    const fromBB = ONE << BigInt(from);
    const toBB = ONE << BigInt(to);
    this.pieces[type * 2 + color] ^= fromBB;
    this.pieces[type * 2 + color] |= toBB;
};

// -------------------------------------------
// 8. FEN ИМПОРТ
// -------------------------------------------
Board.prototype.loadFEN = function(fen) {
    this.pieces = new Array(12).fill(ZERO);
    const parts = fen.split(' ');
    const ranks = parts[0].split('/');
    let sq = 56;
    for (const rank of ranks) {
        for (const ch of rank) {
            if (ch >= '1' && ch <= '8') {
                sq += parseInt(ch);
            } else {
                const color = ch === ch.toUpperCase() ? COLORS.WHITE : COLORS.BLACK;
                const pc = ch.toLowerCase();
                let type;
                if (pc === 'p') type = PIECE_TYPES.PAWN;
                else if (pc === 'n') type = PIECE_TYPES.KNIGHT;
                else if (pc === 'b') type = PIECE_TYPES.BISHOP;
                else if (pc === 'r') type = PIECE_TYPES.ROOK;
                else if (pc === 'q') type = PIECE_TYPES.QUEEN;
                else if (pc === 'k') type = PIECE_TYPES.KING;
                this.pieces[type * 2 + color] |= ONE << BigInt(sq);
                sq++;
            }
        }
        sq -= 16;
    }
    this.active_color = parts[1] === 'w' ? COLORS.WHITE : COLORS.BLACK;
    this.recalculateOccupied();
};

Board.prototype.recalculateOccupied = function() {
    this.occupied = [ZERO, ZERO];
    for (let i = 0; i < 6; i++) {
        this.occupied[0] |= this.pieces[i * 2];
        this.occupied[1] |= this.pieces[i * 2 + 1];
    }
    this.all_occupied = this.occupied[0] | this.occupied[1];
};

// -------------------------------------------
// 9. ЭКСПОРТ
// -------------------------------------------
export { bitscanForward };
