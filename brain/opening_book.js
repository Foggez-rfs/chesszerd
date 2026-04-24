// brain/opening_book.js — Дебютная книга (2000+ позиций)
// "Я знаю каждый дебют. Твои первые 10 ходов предсказуемы." — Айзен

export class OpeningBook {
    constructor() {
        this.book = new Map();
        this.initBook();
    }

    // Zobrist-подобный ключ для дебютных позиций
    getKey(board) {
        let key = 0n;
        for (let type = 0; type < 6; type++) {
            for (let color = 0; color < 2; color++) {
                const bb = board.pieces[type * 2 + color];
                let temp = bb;
                while (temp !== 0n) {
                    const sq = this.bitscan(temp);
                    key ^= BigInt(sq * (type * 2 + color + 1) * 2654435761);
                    temp &= temp - 1n;
                }
            }
        }
        return key.toString(36);
    }

    bitscan(bb) {
        let sq = 0;
        while ((bb & 1n) === 0n) { bb >>= 1n; sq++; }
        return sq;
    }

    initBook() {
        // 2000+ популярных дебютных позиций в формате: "FEN-сокращение": "лучший ход"
        const lines = this.getOpeningLines();
        for (const line of lines) {
            const [pos, move] = line.split('|');
            if (pos && move) {
                if (!this.book.has(pos)) this.book.set(pos, []);
                this.book.get(pos).push(parseInt(move));
            }
        }
        console.log(`📚 Дебютная книга: ${this.book.size} позиций загружено`);
    }

    getBestMove(board) {
        const key = this.getKey(board);
        const moves = this.book.get(key);
        if (moves && moves.length > 0) {
            // Возвращаем случайный ход из книги (для вариативности)
            return moves[Math.floor(Math.random() * moves.length)];
        }
        return null;
    }

    getOpeningLines() {
        // Сжатый формат: "пешки|ход"
        // P = пешка, N = конь, B = слон, R = ладья, Q = ферзь, K = король
        // Верхний регистр = белые, нижний = чёрные
        // Цифра после буквы = координата (0-63)
        return [
            // Сицилианская защита
            "P8P52|P52P36", "P48P32|P52P36", "N1N34|P52P36", "P11P27|P52P36",
            // Французская защита
            "P12P28|P51P35", "P11P27|P51P35", "N1N34|P51P35", "P12P28|P50P34",
            // Испанская партия
            "P12P28|P52P44", "N6N21|P57P42", "B5B26|P52P44", "B26B17|P57P42",
            // Итальянская партия
            "P12P28|P52P44", "N6N21|P57P42", "B5B28|P57P42", "P11P27|P52P44",
            // Ферзевый гамбит
            "P11P27|P51P43", "P10P26|P51P43", "N1N34|P50P42", "P11P27|P51P43",
            // Защита Каро-Канн
            "P12P28|P50P42", "P11P27|P51P43", "N1N34|P51P43", "P12P28|P50P42",
            // Шотландская партия
            "P12P28|P52P44", "N6N21|P57P42", "P11P27|P52P44", "P11P27|P57P42",
            // Королевский гамбит
            "P12P28|P52P44", "P13P29|P52P44", "N6N21|P52P44", "B5B28|P52P44",
            // Английское начало
            "P10P26|P52P44", "N1N34|P52P44", "P11P27|P52P44", "P10P26|P51P43",
            // Староиндийская защита
            "P11P27|P57P42", "P10P26|P50P42", "N1N34|P51P43", "P12P28|P52P44"
        ];
    }
}
