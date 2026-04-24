// core/game_state.js — Управление состоянием партии (200 строк)
// "Партия начинается. Партия заканчивается. Я выбираю когда." — Айзен

export class GameState {
    constructor(board) {
        this.board = board;
        this.status = 'waiting'; // waiting | playing | paused | ended
        this.result = null; // '1-0' | '0-1' | '1/2-1/2'
        this.resultReason = null;
        this.startTime = null;
        this.endTime = null;
        this.moveCount = 0;
        this.listeners = [];
    }

    // Начинает новую партию
    startNew() {
        this.board.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        this.status = 'playing';
        this.result = null;
        this.resultReason = null;
        this.startTime = Date.now();
        this.endTime = null;
        this.moveCount = 0;
        this.notify('game_started');
    }

    // Завершает партию
    end(result, reason) {
        this.status = 'ended';
        this.result = result;
        this.resultReason = reason;
        this.endTime = Date.now();
        this.notify('game_ended', { result, reason });
    }

    // Проверяет окончание партии после хода
    checkGameEnd(validator) {
        const status = validator.getGameStatus();

        if (status === 'checkmate') {
            const winner = this.board.active_color === 0 ? '0-1' : '1-0';
            this.end(winner, 'checkmate');
            return true;
        }

        if (status === 'stalemate') {
            this.end('1/2-1/2', 'stalemate');
            return true;
        }

        if (status === 'threefold') {
            this.end('1/2-1/2', 'threefold_repetition');
            return true;
        }

        if (status === 'fifty_move') {
            this.end('1/2-1/2', 'fifty_move_rule');
            return true;
        }

        if (status === 'insufficient_material') {
            this.end('1/2-1/2', 'insufficient_material');
            return true;
        }

        return false;
    }

    // Пауза (не используется в текущей версии)
    pause() {
        if (this.status === 'playing') {
            this.status = 'paused';
            this.notify('game_paused');
        }
    }

    // Возобновление
    resume() {
        if (this.status === 'paused') {
            this.status = 'playing';
            this.notify('game_resumed');
        }
    }

    // Сдаться
    resign() {
        const loser = this.board.active_color;
        this.end(loser === 0 ? '0-1' : '1-0', 'resignation');
    }

    // Предложить ничью (принимается автоматически в v1)
    offerDraw() {
        this.end('1/2-1/2', 'mutual_agreement');
    }

    // Получает длительность партии
    getDuration() {
        if (!this.startTime) return 0;
        const end = this.endTime || Date.now();
        return Math.floor((end - this.startTime) / 1000);
    }

    // Получает строку статуса
    getStatusString() {
        switch (this.status) {
            case 'waiting': return 'Ожидание начала партии';
            case 'playing': return `Ход ${Math.floor(this.moveCount / 2) + 1}. ${this.board.active_color === 0 ? 'Белые' : 'Чёрные'}`;
            case 'paused': return 'Партия на паузе';
            case 'ended':
                const resultMap = { '1-0': 'Белые выиграли', '0-1': 'Чёрные выиграли', '1/2-1/2': 'Ничья' };
                const reasonMap = {
                    'checkmate': 'Мат',
                    'stalemate': 'Пат',
                    'threefold_repetition': 'Троекратное повторение',
                    'fifty_move_rule': 'Правило 50 ходов',
                    'insufficient_material': 'Недостаток материала',
                    'resignation': 'Сдача',
                    'mutual_agreement': 'Соглашение'
                };
                return `${resultMap[this.result]} (${reasonMap[this.resultReason] || ''})`;
        }
        return '';
    }

    // Инкремент счётчика ходов
    incrementMoves() {
        this.moveCount++;
    }

    // Подписка на события
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    notify(event, data = {}) {
        for (const listener of this.listeners) {
            if (listener.event === event) listener.callback(data);
        }
    }
}
