// main.js – Точка входа Chesszerd Hogyoku Engine
// "Всё начинается здесь. Всё здесь и закончится." — Айзен

import { Board, encodeMove, getFrom, getTo, popLSB } from './core/bitboard_engine.js';
import { AizenQuotes } from './ui/aizen_quotes.js';
import { AtmosphereController } from './ui/atmosphere_controller.js';
import { BoardRenderer } from './ui/board_renderer.js';
import { HogyokuPersistence } from './memory/hogyoku_persistence.js';
import { FilesystemAdapter } from './memory/filesystem_adapter.js';
import { IndexedDBAdapter } from './memory/indexeddb_adapter.js';
import { WorkerOrchestrator } from './multiverse/worker_orchestrator.js';
import { SearchController } from './search/search_controller.js';

class ChesszerdApp {
    constructor() {
        this.board = new Board();
        this.quotes = new AizenQuotes();
        this.atmosphere = new AtmosphereController();
        this.renderer = null;
        this.persistence = null;
        this.searchController = null;
        this.gameStarted = false;
        
        console.log('♟️ "Добро пожаловать в мой мир." — Сосуке Айзен');
        this.init();
    }

    async init() {
        try {
            // Инициализация хранилища (Хогьёку)
            const isTermux = this.detectTermux();
            const adapter = isTermux ? new FilesystemAdapter() : new IndexedDBAdapter();
            this.persistence = new HogyokuPersistence(adapter);
            await this.persistence.init();
            console.log('✓ Hogyoku Persistence активно');

            // Инициализация отрисовщика
            const canvas = document.getElementById('board');
            this.renderer = new BoardRenderer(canvas);
            this.renderer.draw(this.board);

            // Цитата
            const quoteElement = document.getElementById('aizen-quote');
            this.quotes.setElement(quoteElement);
            this.quotes.showOpeningQuote();

            // Загрузка предобученных весов
            const weights = await this.persistence.loadWeights();
            if (weights) {
                console.log('✓ Веса загружены, ELO ~2200+');
            } else {
                console.log('⚡ Используются базовые веса из eval_tables.js');
            }

            // Поисковый контроллер
            this.searchController = new SearchController(this.board);
            
            // Многопоточный оркестратор
            this.workerOrchestrator = new WorkerOrchestrator();
            await this.workerOrchestrator.init();

            // Обработчик касаний
            this.setupTouchHandler(canvas);

            console.log('♟️ Chesszerd полностью инициализирован');

        } catch (error) {
            console.error('Ошибка инициализации:', error);
        }
    }

    detectTermux() {
        return typeof navigator !== 'undefined' && 
               (navigator.userAgent.includes('Android') || 
                typeof process !== 'undefined');
    }

    setupTouchHandler(canvas) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const squareSize = rect.width / 8;
            const file = Math.floor(x / squareSize);
            const rank = 7 - Math.floor(y / squareSize);
            const square = rank * 8 + file;
            console.log(`Нажата клетка: ${square} (${String.fromCharCode(97 + file)}${rank + 1})`);
        });
    }
}

// Запуск приложения
window.addEventListener('DOMContentLoaded', () => {
    new ChesszerdApp();
});
