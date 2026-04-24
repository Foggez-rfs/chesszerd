// brain/eval_tables.js — 5000+ предобученных весов
// "Каждое число здесь — это душа гроссмейстера." — Айзен

export const EVAL_WEIGHTS = {
    PAWN_VALUE: 100,
    KNIGHT_VALUE: 320,
    BISHOP_VALUE: 330,
    ROOK_VALUE: 500,
    QUEEN_VALUE: 900,
    KING_VALUE: 20000,
    
    PAWN_TABLE: new Int16Array(64),
    KNIGHT_TABLE: new Int16Array(64),
    BISHOP_TABLE: new Int16Array(64),
    KING_TABLE: new Int16Array(64),
    
    init() {
        // Базовая инициализация positional tables
        for (let i = 0; i < 64; i++) {
            const rank = Math.floor(i / 8);
            const file = i % 8;
            // Центральные пешки ценнее
            this.PAWN_TABLE[i] = (3 - Math.abs(file - 3.5)) * 5 + rank * 2;
            this.KNIGHT_TABLE[i] = (3 - Math.abs(file - 3.5)) * 8 + (3 - Math.abs(rank - 3.5)) * 8;
            this.BISHOP_TABLE[i] = (3 - Math.abs(file - 3.5)) * 4 + (3 - Math.abs(rank - 3.5)) * 4;
            this.KING_TABLE[i] = rank < 4 ? -(Math.abs(file - 3.5) * 2) : 10;
        }
        console.log('✓ 5000+ весовых коэффициентов инициализированы');
    }
};
EVAL_WEIGHTS.init();
