// search/search_controller.js
export class SearchController {
    constructor(board) {
        this.board = board;
        console.log('SearchController: "Я вижу на 20 ходов вперёд."');
    }
    findBestMove(depth = 4) {
        return 0; // Заглушка: будет Alpha-Beta
    }
}
