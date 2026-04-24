export class TrainingLoop {
    constructor(persistence) {
        this.persistence = persistence;
    }
    async train(gameResult) {
        await this.persistence.saveWeights({});
    }
}
