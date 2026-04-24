// ui/achievements.js — Система достижений
export class AchievementSystem {
    constructor() {
        this.achievements = [
            { id: 'first_move', name: 'Первый ход', desc: 'Сделайте первый ход', icon: '♟️' },
            { id: 'first_win', name: 'Первая победа', desc: 'Победите ИИ впервые', icon: '🏆' },
            { id: 'speed_demon', name: 'Демон скорости', desc: 'Поставьте мат менее чем за 20 ходов', icon: '⚡' },
            { id: 'queen_sac', name: 'Жертва ферзя', desc: 'Пожертвуйте ферзя и выиграйте', icon: '👑' },
            { id: 'knight_fork', name: 'Вилка', desc: 'Сделайте вилку конём', icon: '🐴' },
            { id: 'castle_early', name: 'Рокировка', desc: 'Сделайте рокировку', icon: '🏰' },
            { id: 'ten_games', name: '10 партий', desc: 'Сыграйте 10 партий', icon: '🔟' },
            { id: 'ai_trainer', name: 'Тренер ИИ', desc: 'Обучите ИИ на 5 партиях', icon: '🧠' },
            { id: 'daily_solver', name: 'Ежедневный решатель', desc: 'Решите 7 ежедневных задач', icon: '📅' },
            { id: 'collector', name: 'Коллекционер тем', desc: 'Используйте все 6 тем доски', icon: '🎨' },
        ];
        this.unlocked = JSON.parse(localStorage.getItem('chesszerd_achievements') || '[]');
    }

    unlock(id) {
        if (this.unlocked.includes(id)) return false;
        this.unlocked.push(id);
        localStorage.setItem('chesszerd_achievements', JSON.stringify(this.unlocked));
        this.showToast(id);
        return true;
    }

    showToast(id) {
        const ach = this.achievements.find(a => a.id === id);
        if (!ach) return;
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
            background:#1a1a1a; border:2px solid #c71585; color:#d4d4d4;
            padding:15px 25px; border-radius:10px; z-index:3000;
            font-family:'Courier New',monospace; text-align:center;
            animation: slideUp 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
        `;
        toast.innerHTML = `<b>${ach.icon} ДОСТИЖЕНИЕ!</b><br>${ach.name}<br><small>${ach.desc}</small>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    getStats() {
        return {
            total: this.achievements.length,
            unlocked: this.unlocked.length
        };
    }
}

// CSS-анимации для тостов
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
    @keyframes fadeOut { from { opacity:1; } to { opacity:0; } }
`;
document.head.appendChild(style);
