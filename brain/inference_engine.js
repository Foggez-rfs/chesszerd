// brain/inference_engine.js — Преобразование доски в тензор
// "64 клетки. 12 типов фигур. 768 измерений. Я вижу всё." — Айзен

export class InferenceEngine {
    constructor(board) {
        this.board = board;
    }

    // Преобразование позиции в 768-мерный вектор
    boardToTensor() {
        const tensor = new Array(768).fill(0);
        let idx = 0;
        
        // 6 типов фигур × 2 цвета × 64 клетки = 768
        for (let color = 0; color < 2; color++) {
            for (let type = 0; type < 6; type++) {
                const bb = this.board.pieces[type * 2 + color];
                for (let sq = 0; sq < 64; sq++) {
                    tensor[idx + sq] = (bb & (1n << BigInt(sq))) ? 1 : 0;
                }
                idx += 64;
            }
        }
        
        return tensor;
    }

    // Оценка позиции через нейросеть
    evaluate(nn) {
        const tensor = this.boardToTensor();
        return nn.forward(tensor);
    }
}
