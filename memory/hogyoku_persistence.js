// memory/hogyoku_persistence.js — Хогьёку
// "Я помню всё. Каждое поражение делает меня сильнее." — Айзен

export class HogyokuPersistence {
    constructor(adapter) {
        this.adapter = adapter;
        this.weights = null;
    }
    async init() {
        await this.adapter.init();
    }
    async saveWeights(weights) {
        await this.adapter.save('hogyoku_weights', weights);
    }
    async loadWeights() {
        return await this.adapter.load('hogyoku_weights');
    }
}
