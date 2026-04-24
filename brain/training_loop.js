// brain/training_loop.js — Самообучение после каждой партии
// "Каждое твоё поражение питает Хогьёку." — Айзен

export class TrainingLoop {
    constructor(ai, persistence) {
        this.ai = ai;
        this.persistence = persistence;
        this.gamesPlayed = 0;
        this.totalLoss = 0;
    }

    async onGameEnd(result) {
        const loss = this.ai.train(result);
        this.totalLoss += loss;
        this.gamesPlayed++;
        
        console.log(`Партия #${this.gamesPlayed}: результат=${result}, loss=${loss.toFixed(4)}`);
        
        // Автосохранение каждые 5 партий
        if (this.gamesPlayed % 5 === 0) {
            await this.saveWeights();
        }
    }

    async saveWeights() {
        const weightsJson = this.ai.exportWeights();
        await this.persistence.save('hogyoku_weights', weightsJson);
        console.log('✓ Веса сохранены в Хогьёку');
    }

    async loadWeights() {
        const json = await this.persistence.load('hogyoku_weights');
        if (json) {
            this.ai.importWeights(json);
            return true;
        }
        return false;
    }
}
