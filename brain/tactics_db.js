// brain/tactics_db.js — База тактических задач
// "Реши эту задачу. Или умри." — Айзен

export class TacticsDB {
    constructor() {
        this.tasks = this.generateTasks();
        this.currentIndex = 0;
    }

    generateTasks() {
        const tasks = [];
        
        // Задача 1: Мат в 1 ход
        tasks.push({
            id: 1,
            fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
            solution: 'd8h4',
            description: 'Мат в 1 ход. Чёрные начинают.',
            difficulty: 'easy',
            hint: 'Посмотри на диагональ h4-e1'
        });
        
        // Задача 2: Вилка
        tasks.push({
            id: 2,
            fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
            solution: 'c4f7',
            description: 'Вилка. Выиграй ферзя.',
            difficulty: 'medium',
            hint: 'Слон и конь могут атаковать f7'
        });
        
        // Задача 3: Связка
        tasks.push({
            id: 3,
            fen: 'r1bqkb1r/ppp2ppp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQ1RK1 b kq - 0 5',
            solution: 'c6d4',
            description: 'Связка. Выиграй материал.',
            difficulty: 'hard',
            hint: 'Конь на d4 атакует ферзя и слона'
        });
        
        // Задача 4: Двойной удар
        tasks.push({
            id: 4,
            fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5',
            solution: 'c1g5',
            description: 'Двойной удар. Атакуй две фигуры.',
            difficulty: 'medium',
            hint: 'Слон на g5 связывает коня и ферзя'
        });
        
        // Задача 5: Рентген
        tasks.push({
            id: 5,
            fen: 'r2qkb1r/ppp2ppp/2n2n2/3pp3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 6',
            solution: 'f8b4',
            description: 'Рентген. Найди скрытую атаку.',
            difficulty: 'hard',
            hint: 'Слон на b4 создаёт рентген через ферзя'
        });
        
        return tasks;
    }

    getRandomTask() {
        return this.tasks[Math.floor(Math.random() * this.tasks.length)];
    }

    getDailyTask(dayOfYear) {
        const index = dayOfYear % this.tasks.length;
        return this.tasks[index];
    }

    checkSolution(taskId, move) {
        const task = this.tasks.find(t => t.id === taskId);
        return task && task.solution === move;
    }
}
