// core/pgn_parser.js — Парсер PGN v2 (БЕЗ BigInt ошибок)
// "Каждая твоя партия — это пища для Хогьёку." — Айзен

export class PgnParser {
    static parse(pgn) {
        let clean = pgn.replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '');
        clean = clean.replace(/\d+\.\.\./g, '').replace(/\d+\./g, '');
        clean = clean.replace(/\!|\?/g, '');
        clean = clean.replace(/1\-0|0\-1|1\/2\-1\/2|\*/g, '');
        const tokens = clean.trim().split(/\s+/);
        const moves = [];
        for (const token of tokens) {
            if (this.isMove(token)) moves.push(token);
        }
        return moves;
    }

    static isMove(token) {
        if (!token || token.length < 2) return false;
        if (token === 'O-O' || token === 'O-O-O' || token === '0-0' || token === '0-0-0') return true;
        if (/^[a-h][1-8]$/.test(token)) return true;
        if (/^[a-h]x[a-h][1-8]$/.test(token)) return true;
        if (/^[KQRBN][a-h]?[1-8]?x?[a-h][1-8]$/.test(token)) return true;
        if (/^[a-h]x?[a-h][1-8]=[QRBN]$/.test(token)) return true;
        if (/^[a-h][1-8]=[QRBN]$/.test(token)) return true;
        if (/^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][\+#]$/.test(token)) return true;
        return false;
    }

    // Обучает нейросеть на одной партии (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    static trainOnGame(pgn, board, ai, result) {
        const moves = this.parse(pgn);
        console.log(`📚 Обучение на ${moves.length} ходах...`);
        
        if (moves.length === 0) {
            console.warn('⚠️ Не удалось распарсить ни одного хода');
            return 0;
        }
        
        let trained = 0;
        board.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        
        for (const moveNotation of moves) {
            try {
                const move = this.parseMove(moveNotation, board);
                if (move === null || move === undefined) continue;
                
                // Обучаем нейросеть
                const tensor = ai.inference.boardToTensor();
                ai.nn.forward(tensor);
                
                const target = result === '1-0'
                    ? (board.active_color === 0 ? 1 : -1)
                    : (board.active_color === 1 ? 1 : -1);
                
                ai.nn.backward(target, 0.001);
                
                // Делаем ход
                board.makeMove(move);
                trained++;
            } catch(e) {
                console.warn(`⚠️ Пропущен ход: ${moveNotation}`, e.message);
            }
        }
        
        return trained;
    }

    // Конвертирует PGN-нотацию в число-ход (БЕЗ BigInt смешивания)
    static parseMove(token, board) {
        token = token.replace(/[\+#]/g, '');
        
        // Рокировка
        if (token === 'O-O' || token === '0-0') {
            const row = board.active_color === 0 ? 0 : 7;
            return (row * 8 + 4) | ((row * 8 + 6) << 6);
        }
        if (token === 'O-O-O' || token === '0-0-0') {
            const row = board.active_color === 0 ? 0 : 7;
            return (row * 8 + 4) | ((row * 8 + 2) << 6);
        }
        
        // Превращение
        let promotion = 0;
        if (token.includes('=')) {
            const parts = token.split('=');
            token = parts[0];
            const promoMap = { 'Q': 4, 'R': 3, 'B': 2, 'N': 1 };
            promotion = promoMap[parts[1]] || 0;
        }
        
        // Убираем 'x' (взятие)
        token = token.replace(/x/g, '');
        
        if (token.length < 2) return null;
        
        // Получаем целевую клетку
        const toFile = token.charCodeAt(token.length - 2) - 97;
        const toRank = parseInt(token.charAt(token.length - 1)) - 1;
        const to = toRank * 8 + toFile;
        
        // Определяем тип фигуры
        const pieceMap = { 'K': 5, 'Q': 4, 'R': 3, 'B': 2, 'N': 1 };
        let pieceType = 0; // Пешка по умолчанию
        let disambig = '';
        
        const firstChar = token.charAt(0);
        if (pieceMap[firstChar] !== undefined) {
            pieceType = pieceMap[firstChar];
            disambig = token.substring(1, token.length - 2);
        } else {
            disambig = token.substring(0, token.length - 2);
        }
        
        // Ищем фигуру на доске
        const us = board.active_color;
        const allMoves = board.generatePseudoMoves();
        const candidates = [];
        
        for (const move of allMoves) {
            const fromSq = move & 0x3F;
            const toSq = (move >> 6) & 0x3F;
            const promo = (move >> 12) & 0x7;
            
            if (toSq !== to) continue;
            if (promo !== promotion) continue;
            
            // Проверяем, что на fromSq стоит фигура нужного типа
            const fromBB = board.pieces[pieceType * 2 + us];
            // ИСПРАВЛЕНИЕ: работаем с BigInt правильно
            const mask = 1n << BigInt(fromSq);
            if ((fromBB & mask) === 0n) continue;
            
            // Уточнение (если есть)
            if (disambig.length > 0) {
                const file = fromSq % 8;
                const rank = Math.floor(fromSq / 8);
                const disFile = disambig.length >= 1 && disambig >= 'a' && disambig <= 'h' 
                    ? disambig.charCodeAt(0) - 97 : -1;
                const disRank = disambig.length >= 1 && disambig >= '1' && disambig <= '8'
                    ? parseInt(disambig) - 1 : -1;
                
                if (disFile >= 0 && file !== disFile) continue;
                if (disRank >= 0 && rank !== disRank) continue;
            }
            
            candidates.push(move);
        }
        
        // Если несколько кандидатов — проверяем легальность
        if (candidates.length === 1) return candidates[0];
        
        for (const move of candidates) {
            const saved = {
                pieces: board.pieces.map(p => p),
                occupied: [board.occupied[0], board.occupied[1]],
                all_occupied: board.all_occupied,
                active_color: board.active_color,
                en_passant: board.en_passant_square,
                castling: board.castling_rights
            };
            
            board.makeMove(move);
            const inCheck = board.inCheck();
            
            board.pieces = saved.pieces;
            board.occupied = [saved.occupied[0], saved.occupied[1]];
            board.all_occupied = saved.all_occupied;
            board.active_color = saved.active_color;
            board.en_passant_square = saved.en_passant;
            board.castling_rights = saved.castling;
            
            if (!inCheck) return move;
        }
        
        // Если не нашли легальный ход — возвращаем первый попавшийся
        return candidates.length > 0 ? candidates[0] : null;
    }
}
