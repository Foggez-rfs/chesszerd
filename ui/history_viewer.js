// ui/history_viewer.js — Просмотр сыгранных партий
export class HistoryViewer {
    constructor() {
        this.games = JSON.parse(localStorage.getItem('chesszerd_games') || '[]');
    }

    addGame(pgn) {
        this.games.unshift({
            date: new Date().toISOString(),
            pgn: pgn,
            id: Date.now()
        });
        if (this.games.length > 50) this.games = this.games.slice(0, 50);
        localStorage.setItem('chesszerd_games', JSON.stringify(this.games));
    }

    getGames() { return this.games; }

    showPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.9); z-index:2001;
            display:flex; justify-content:center; align-items:center;
        `;
        
        let gamesHTML = this.games.length === 0 
            ? '<p style="color:#888;">Нет сохранённых партий</p>'
            : this.games.slice(0, 10).map((g, i) => `
                <div style="background:#1a1a1a; padding:10px; margin:5px 0; border-radius:5px; cursor:pointer;"
                     onclick="navigator.clipboard.writeText('${g.pgn.replace(/'/g, "\\'").substring(0, 100)}...')">
                    <b>#${i+1}</b> ${new Date(g.date).toLocaleDateString()}<br>
                    <span style="color:#888; font-size:11px;">${g.pgn.substring(0, 80)}...</span>
                </div>
            `).join('');
        
        panel.innerHTML = `
            <div style="background:#111; border:2px solid #c71585; border-radius:12px; padding:20px; max-width:90%; width:400px; max-height:80%; overflow-y:auto;">
                <h3 style="color:#c71585;">📜 История партий</h3>
                ${gamesHTML}
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    width:100%; margin-top:10px; background:#333; color:#d4d4d4;
                    border:1px solid #555; padding:10px; border-radius:6px; cursor:pointer;
                ">❌ Закрыть</button>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
}
