// ui/training_panel.js — Панель загрузки PGN и обучения
// "Давай свою партию. Я голоден." — Айзен

import { PgnParser } from '../core/pgn_parser.js';

export class TrainingPanel {
    constructor(board, ai, quotes) {
        this.board = board;
        this.ai = ai;
        this.quotes = quotes;
        this.createPanel();
    }

    createPanel() {
        // Создаём модальное окно
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 2000;
            display: none; justify-content: center; align-items: center;
            flex-direction: column; padding: 20px;
        `;
        
        this.panel.innerHTML = `
            <div style="background:#1a1a1a; border:2px solid #c71585; border-radius:12px; padding:20px; max-width:90%; width:400px; max-height:80%; overflow-y:auto;">
                <h3 style="color:#c71585; text-align:center; margin-bottom:15px;">📚 Обучение нейросети</h3>
                <p style="color:#888; font-size:12px; margin-bottom:10px;">Вставь PGN-текст партии (с любого сайта):</p>
                <textarea id="pgn-input" style="
                    width:100%; height:200px; background:#0a0a0a; color:#d4d4d4;
                    border:1px solid #333; border-radius:6px; padding:10px;
                    font-family:'Courier New',monospace; font-size:11px; resize:vertical;
                " placeholder="[Event &quot;My Game&quot;]&#10;1. e4 e5 2. Nf3 Nc6...&#10;1-0"></textarea>
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <button onclick="window.trainOnPGN()" style="
                        flex:1; background:linear-gradient(135deg,#c71585,#8b008b);
                        color:white; border:none; padding:12px; border-radius:6px;
                        font-family:'Courier New',monospace; font-size:14px; cursor:pointer;
                    ">🧠 Обучить</button>
                    <button onclick="window.closeTraining()" style="
                        flex:1; background:#333; color:#d4d4d4; border:1px solid #555;
                        padding:12px; border-radius:6px; font-family:'Courier New',monospace;
                        font-size:14px; cursor:pointer;
                    ">❌ Закрыть</button>
                </div>
                <div id="training-status" style="
                    margin-top:10px; color:#888; font-size:11px; text-align:center; min-height:20px;
                "></div>
                <div style="margin-top:15px; border-top:1px solid #333; padding-top:10px;">
                    <p style="color:#666; font-size:10px; text-align:center;">
                        💡 <b>Пример:</b> Скопируй свою партию с Chess.com или Lichess, вставь сюда и нажми "Обучить".<br>
                        ИИ проанализирует каждый ход и станет сильнее.
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
    }

    show() {
        this.panel.style.display = 'flex';
    }

    hide() {
        this.panel.style.display = 'none';
    }

    async train() {
        const textarea = document.getElementById('pgn-input');
        const statusEl = document.getElementById('training-status');
        const pgn = textarea.value.trim();
        
        if (!pgn) {
            statusEl.textContent = '❌ Вставь PGN-текст партии!';
            statusEl.style.color = '#ff4444';
            return;
        }
        
        // Определяем результат
        let result = '1/2-1/2';
        if (pgn.includes('1-0')) result = '1-0';
        else if (pgn.includes('0-1')) result = '0-1';
        
        statusEl.textContent = '⏳ Обучаю нейросеть...';
        statusEl.style.color = '#888';
        
        // Небольшая задержка для UI
        await new Promise(r => setTimeout(r, 100));
        
        try {
            const trained = PgnParser.trainOnGame(pgn, this.board, this.ai, result);
            
            statusEl.textContent = `✅ Обучено на ${trained} ходах! Нейросеть стала сильнее.`;
            statusEl.style.color = '#4caf50';
            
            this.quotes.show('training');
            
            // Сохраняем веса
            const weights = this.ai.nn.exportWeights();
            localStorage.setItem('hogyoku_weights', JSON.stringify(weights));
            
            console.log(`✅ Нейросеть обучена на ${trained} ходах. Веса сохранены.`);
            
        } catch (e) {
            statusEl.textContent = `❌ Ошибка: ${e.message}`;
            statusEl.style.color = '#ff4444';
            console.error('Ошибка обучения:', e);
        }
    }
}
