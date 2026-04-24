// ui/atmosphere_controller.js — Изменение атмосферы
export class AtmosphereController {
    constructor() {
        this.centipawnLoss = 0;
    }
    update(evaluation) {
        this.centipawnLoss = evaluation;
        if (evaluation > 100) {
            document.body.style.background = '#1a0000';
        }
    }
}
