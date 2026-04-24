// core/pgn_parser.js — Парсер PGN для обучения нейросети
// "Каждая твоя партия — это пища для Хогьёку." — Айзен

export class PgnParser {
    // Парсит PGN-текст в массив ходов
    static parse(pgn) {
        // Удаляем заголовки [Event ...] и комментарии { ... }
        let clean = pgn.replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '');
        
        // Удаляем номера ходов (1. 2. ...) и символы оценки (!, ?, ??)
        clean = clean.replace(/\d+\.\.\./g, '').replace(/\d+\./g, '');
        clean = clean.replace(/\!|\?/g, '');
        
        // Удаляем результат (1-0, 0-1, 1/2-1/2)
        clean = clean.replace(/1\-0|0\-1|1\/2\-1\/2|\*/g, '');
        
        // Разбиваем на токены
        const tokens = clean.trim().split(/\s+/);
        
        // Фильтруем: оставляем только шахматную нотацию
        const moves = [];
        for (const token of tokens) {
            if (this.isMove(token)) {
                moves.push(token);
            }
        }
        
        return moves;
    }

    // Проверяет, является ли токен шахматным ходом
    static isMove(token) {
        if (!token || token.length < 2) return false;
        
        // Рокировка
        if (token === 'O-O' || token === 'O-O-O' || token === '0-0' || token === '0-0-0') return true;
        
        // Ход пешки (e4, d5, exd5)
        if (/^[a-h][1-8]$/.test(token)) return true;
        if (/^[a-h]x[a-h][1-8]$/.test(token)) return true;
        
        // Ход фигуры (Nf3, Bc4, Qxd5, Rfe1)
        if (/^[KQRBN][a-h]?[1-8]?x?[a-h][1-8]$/.test(token)) return true;
        
        // Превращение (e8=Q, exd8=Q)
        if (/^[a-h]x?[a-h][1-8]=[QRBN]$/.test(token)) return true;
        if (/^[a-h][1-8]=[QRBN]$/.test(token)) return true;
        
        // Шах/мат (#, +)
        if (/^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][\+#]$/.test(token)) return true;
        
        return false;
    }

    // Конвертирует PGN-нотацию в объекты { from, to }
    static algebraicToSquare(token, board) {
        // Убираем + и #
        token = token.replace(/[\+#]/g, '');
        
        // Рокировка
        if (token === 'O-O' || token === '0-0') {
            const row = board.active_color === 0 ? 0 : 7;
            return { from: row * 8 + 4, to: row * 8 + 6 };
        }
        if (token === 'O-O-O' || token === '0-0-0') {
            const row = board.active_color === 0 ? 0 : 7;
            return { from: row * 8 + 4, to: row * 8 + 2 };
        }
        
        // Превращение
        let promotion = null;
        if (token.includes('=')) {
            const parts = token.split('=');
            token = parts[0];
            promotion = parts[1];
        }
        
        // Взятие
        let isCapture = token.includes('x');
        token = token.replace(/x/g, '');
        
        // Определяем целевую клетку (последние 2 символа)
        if (token.length < 2) return null;
        const toFile = token.charCodeAt(token.length - 2) - 97; // a=0, h=7
        const toRank = parseInt(token.charAt(token.length - 1)) - 1;
        const to = toRank * 8 + toFile;
        
        // Определяем тип фигуры
        let pieceType = 1; // По умолчанию пешка
        const pieceMap = { 'K': 5, 'Q': 4, 'R': 3, 'B': 2, 'N': 1 };
        const firstChar = token.charAt(0);
        
        if (pieceMap[firstChar] !== undefined) {
            pieceType = pieceMap[firstChar];
            token = token.substring(1); // Убираем букву фигуры
        } else {
            pieceType = 0; // Пешка
        }
        
        // Ищем from (уточняющая информация)
        let fromFile = -1, fromRank = -1;
        if (token.length > 2) {
            // Есть уточнение (Rfe1, Nbd7)
            const disambig = token.substring(0, token.length - 2);
            if (disambig.length === 1) {
                if (disambig >= 'a' && disambig <= 'h') {
                    fromFile = disambig.charCodeAt(0) - 97;
                } else if (disambig >= '1' && disambig <= '8') {
                    fromRank = parseInt(disambig) - 1;
                }
            }
        }
        
        // Ищем фигуру на доске, которая может пойти на to
        const us = board.active_color;
        const moves = board.generatePseudoMoves();
        const legalMoves = [];
        
        for (const move of moves) {
            const fromSq = move & 0x3F;
            const toSq = (move >> 6) & 0x3F;
            
            if (toSq !== to) continue;
            
            // Проверяем тип фигуры на from
            const fromBB = 1n << BigInt(fromSq);
            if (!(board.pieces[pieceType * 2 + us] & fromBB)) continue;
            
            // Проверяем уточнение
            if (fromFile !== -1 && (fromSq % 8) !== fromFile) continue;
            if (fromRank !== -1 && Math.floor(fromSq / 8) !== fromRank) continue;
            
            legalMoves.push(fromSq);
        }
        
        if (legalMoves.length === 1) {
            return { from: legalMoves[0], to };
        }
        
        // Если несколько вариантов — пробуем найти легальный
        for (const fromSq of legalMoves) {
            const move = fromSq | (to << 6) | ((promotion ? (pieceMap[promotion] || 0) : 0) << 12);
            const saved = board.pieces.map(p => p);
            const savedOcc = [board.occupied[0], board.occupied[1]];
            const savedAll = board.all_occupied;
            
            board.makeMove(move);
            const inCheck = board.inCheck();
            
            board.pieces = saved;
            board.occupied = [savedOcc[0], savedOcc[1]];
            board.all_occupied = savedAll;
            
            if (!inCheck) {
                return { from: fromSq, to };
            }
        }
        
        return null;
    }

    // Обучает нейросеть на одной партии
    static trainOnGame(pgn, board, ai, result) {
        const moves = this.parse(pgn);
        console.log(`📚 Обучение на ${moves.length} ходах...`);
        
        let trained = 0;
        board.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        
        for (const moveNotation of moves) {
            const squares = this.algebraicToSquare(moveNotation, board);
            if (!squares) {
                console.warn(`⚠️ Не удалось распарсить ход: ${moveNotation}`);
                continue;
            }
            
            const move = (squares.from) | (squares.to << 6);
            const tensor = ai.inference.boardToTensor();
            const evaluation = ai.nn.forward(tensor);
            
            // Целевое значение: победитель получает +1, проигравший -1
            const target = result === '1-0' 
                ? (board.active_color === 0 ? 1 : -1)
                : (board.active_color === 1 ? 1 : -1);
            
            ai.nn.backward(target, 0.001);
            
            board.makeMove(move);
            trained++;
        }
        
        return trained;
    }
}
