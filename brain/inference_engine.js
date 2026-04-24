export class InferenceEngine {
    constructor(board) {
        this.board = board;
    }
    boardToTensor() {
        return new Float32Array(768);
    }
}
