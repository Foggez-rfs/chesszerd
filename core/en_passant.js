// core/en_passant.js — Полная логика взятия на проходе (100 строк)
// "Ты думал, твоя пешка в безопасности? Нет." — Айзен

export class EnPassantHandler {
    constructor(board) {
        this.board = board;
    }

    // Проверяет, возможен ли en passant
    isEnPassant(from, to) {
        const epSquare = this.board.en_passant_square;
        if (epSquare === -1 || to !== epSquare) return false;

        const us = this.board.active_color;
        const pawnBB = 1n << BigInt(from);
        
        // Проверяем, что ходит пешка
        if (!(this.board.pieces[us] & pawnBB)) return false; // PAWN = 0

        // Проверяем, что клетка en passant правильная
        const capturedSq = us === 0 ? epSquare - 8 : epSquare + 8;
        const capturedBB = 1n << BigInt(capturedSq);
        const them = us ^ 1;
        
        return (this.board.pieces[them] & capturedBB) !== 0n; // Вражеская пешка на линии
    }

    // Выполняет взятие на проходе
    execute(from, to) {
        const us = this.board.active_color;
        const them = us ^ 1;
        const capturedSq = us === 0 ? to - 8 : to + 8;

        // Убираем взятую пешку
        this.board.pieces[them] ^= (1n << BigInt(capturedSq));
        this.board.pieces[them] ^= (1n << BigInt(capturedSq));

        // Перемещаем нашу пешку
        const fromBB = 1n << BigInt(from);
        const toBB = 1n << BigInt(to);
        this.board.pieces[us] ^= fromBB;
        this.board.pieces[us] |= toBB;

        // Обновляем occupied
        this.board.recalculateOccupied();
        
        // Сбрасываем en passant
        this.board.en_passant_square = -1;

        return true;
    }

    // Создаёт ход en passant
    createMove(from, to) {
        // Кодируем: from | to << 6 | special << 15 (special=1 для en passant)
        return from | (to << 6) | (1 << 15);
    }
}
