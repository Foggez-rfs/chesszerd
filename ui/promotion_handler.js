// ui/promotion_handler.js — Диалог выбора фигуры при превращении (200 строк)
// "Выбери своё оружие." — Айзен

export class PromotionHandler {
    constructor(canvas, board, renderer) {
        this.canvas = canvas;
        this.board = board;
        this.renderer = renderer;
        this.resolve = null;
        this.createUI();
    }

    createUI() {
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 3000;
            display: none; justify-content: center; align-items: center;
        `;

        const pieces = [
            { type: 4, name: 'Ферзь', symbol: '♕' },
            { type: 3, name: 'Ладья', symbol: '♖' },
            { type: 2, name: 'Слон', symbol: '♗' },
            { type: 1, name: 'Конь', symbol: '♘' }
        ];

        const buttonsHTML = pieces.map(p => `
            <div onclick="window._promoResolve(${p.type})" style="
                cursor: pointer; padding: 20px; margin: 10px;
                background: #1a1a1a; border: 2px solid #c71585;
                border-radius: 12px; text-align: center;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='#2a1a2a'" 
               onmouseout="this.style.background='#1a1a1a'">
                <div style="font-size:50px;">${p.symbol}</div>
                <div style="color:#c71585; margin-top:5px;">${p.name}</div>
            </div>
        `).join('');

        this.panel.innerHTML = `
            <div style="background:#111; border:2px solid #c71585; border-radius:12px; padding:25px; text-align:center;">
                <h3 style="color:#c71585; margin-bottom:15px;">⚡ Превращение пешки</h3>
                <p style="color:#888; margin-bottom:20px;">Выбери фигуру:</p>
                <div style="display:flex; justify-content:center; flex-wrap:wrap;">
                    ${buttonsHTML}
                </div>
            </div>
        `;

        document.body.appendChild(this.panel);
    }

    // Показывает диалог и возвращает промис
    show() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.panel.style.display = 'flex';
            window._promoResolve = (type) => {
                this.hide();
                resolve(type);
            };
        });
    }

    hide() {
        this.panel.style.display = 'none';
        this.resolve = null;
        delete window._promoResolve;
    }
}
