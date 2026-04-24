export class LegalMoveFilter {
    static filter(board, moves) {
        return moves.filter(move => {
            board.makeMove(move);
            const inCheck = board.inCheck();
            board.undoMove();
            return !inCheck;
        });
    }
}
