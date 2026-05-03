/**
 * Chesszerd Engine vFinal — Hogyoku AI Core
 * No imports/exports, all globals (window.*)
 * Bitboard-based, NN evaluation, Aizen psychological pressure
 */
(function () {
  'use strict';

  /* ---------- Constants ---------- */
  const PIECE_NONE = 0, PIECE_PAWN = 1, PIECE_KNIGHT = 2, PIECE_BISHOP = 3,
        PIECE_ROOK = 4, PIECE_QUEEN = 5, PIECE_KING = 6;
  const COLOR_WHITE = 0, COLOR_BLACK = 1;
  const PAWN_VALUE = 100, KNIGHT_VALUE = 320, BISHOP_VALUE = 330,
        ROOK_VALUE = 500, QUEEN_VALUE = 900, KING_VALUE = 20000;

  /* ---------- Bitboard utilities (BigInt) ---------- */
  function popcount(n) { let c = 0n; while (n) { n &= n - 1n; c++; } return Number(c); }
  function bitscanForward(n) { if (n === 0n) return -1; let i = 0; while ((n & 1n) === 0n) { n >>= 1n; i++; } return i; }
  function bitscanReverse(n) { if (n === 0n) return -1; let i = 63; while ((n >> 63n) === 0n) { n <<= 1n; i--; } return i; }

  /* ---------- State ---------- */
  let board = new Array(64).fill(PIECE_NONE);
  let color = new Array(64).fill(COLOR_WHITE);
  let sideToMove = COLOR_WHITE;
  let castlingRights = 15; // KQkq
  let enPassantSquare = -1;
  let halfMoveClock = 0, fullMoveNumber = 1;
  let gameHistory = [];
  let currentWeights = null; // NN weights
  let initialSeedWeights = null;

  /* ---------- Zobrist hash (simplified) ---------- */
  let zobristTable = [];
  (function initZobrist() {
    for (let i = 0; i < 64 * 12; i++) zobristTable.push(BigInt(Math.floor(Math.random() * 2**32)) << 32n | BigInt(Math.floor(Math.random() * 2**32)));
  })();
  function computeHash() {
    let h = 0n;
    for (let sq = 0; sq < 64; sq++) {
      if (board[sq] !== PIECE_NONE) {
        let pieceType = board[sq] - 1;
        let pieceColor = color[sq];
        let idx = sq * 12 + pieceColor * 6 + pieceType;
        h ^= zobristTable[idx];
      }
    }
    return h;
  }

  /* ---------- Move representation (global object) ---------- */
  function createMove(from, to, promotion = PIECE_NONE, isCastling = false, isEnPassant = false) {
    return { from, to, promotion, isCastling, isEnPassant, captured: PIECE_NONE, prevCastling: 0, prevEnPassant: -1, prevHalfMove: 0 };
  }

  /* ---------- Move generation (bitboard based) ---------- */
  function getPieceBitboard(piece, col) {
    let bb = 0n;
    for (let sq = 0; sq < 64; sq++) if (board[sq] === piece && color[sq] === col) bb |= (1n << BigInt(sq));
    return bb;
  }
  function getAllOccupied() {
    let bb = 0n;
    for (let sq = 0; sq < 64; sq++) if (board[sq] !== PIECE_NONE) bb |= (1n << BigInt(sq));
    return bb;
  }

  const KNIGHT_MOVES = [ -17, -15, -10, -6, 6, 10, 15, 17 ];
  const KING_MOVES = [ -9, -8, -7, -1, 1, 7, 8, 9 ];
  const SLIDING_DIRS = { bishop: [-9, -7, 7, 9], rook: [-8, -1, 1, 8], queen: [-9, -8, -7, -1, 1, 7, 8, 9] };

  function isOnBoard(sq) { return sq >= 0 && sq < 64; }
  function fileOf(sq) { return sq & 7; }
  function rankOf(sq) { return sq >> 3; }

  function attacksFromSliding(sq, dirs, ownOcc, oppOcc) {
    let attacks = 0n;
    for (let d of dirs) {
      let t = sq;
      while (true) {
        t += d;
        if (!isOnBoard(t)) break;
        if (Math.abs(fileOf(t) - fileOf(t - d)) > 1 && (d === -9 || d === -7 || d === 7 || d === 9)) break;
        attacks |= (1n << BigInt(t));
        if ((ownOcc >> BigInt(t)) & 1n) break;
        if ((oppOcc >> BigInt(t)) & 1n) break;
      }
    }
    return attacks;
  }

  function generateMoves(col) {
    const moves = [];
    const oppCol = 1 - col;
    const ownOcc = getAllOccupied();
    for (let sq = 0; sq < 64; sq++) {
      if (board[sq] === PIECE_NONE || color[sq] !== col) continue;
      const piece = board[sq];
      if (piece === PIECE_PAWN) {
        let dir = col === COLOR_WHITE ? -8 : 8;
        let startRank = col === COLOR_WHITE ? 6 : 1;
        let promRank = col === COLOR_WHITE ? 0 : 7;
        let to = sq + dir;
        if (isOnBoard(to) && board[to] === PIECE_NONE) {
          if (rankOf(to) === promRank) { for (let p of [PIECE_QUEEN,PIECE_ROOK,PIECE_BISHOP,PIECE_KNIGHT]) moves.push(createMove(sq, to, p)); }
          else moves.push(createMove(sq, to));
          let to2 = sq + 2*dir;
          if (rankOf(sq) === startRank && board[to2] === PIECE_NONE) moves.push(createMove(sq, to2));
        }
        for (let d of [dir-1, dir+1]) {
          let toCap = sq + d;
          if (isOnBoard(toCap) && (board[toCap] !== PIECE_NONE && color[toCap] === oppCol) || toCap === enPassantSquare) {
            if (rankOf(toCap) === promRank) { for (let p of [PIECE_QUEEN,PIECE_ROOK,PIECE_BISHOP,PIECE_KNIGHT]) moves.push(createMove(sq, toCap, p, false, toCap===enPassantSquare)); }
            else moves.push(createMove(sq, toCap, PIECE_NONE, false, toCap===enPassantSquare));
          }
        }
      } else if (piece === PIECE_KNIGHT) {
        for (let d of KNIGHT_MOVES) {
          let to = sq + d;
          if (!isOnBoard(to)) continue;
          if (Math.abs(fileOf(to)-fileOf(sq)) > 2) continue;
          if (board[to] === PIECE_NONE || color[to] === oppCol) moves.push(createMove(sq, to));
        }
      } else if (piece === PIECE_BISHOP) {
        let attacks = attacksFromSliding(sq, SLIDING_DIRS.bishop, ownOcc, getAllOccupied()^ownOcc);
        for (let t = 0; t < 64; t++) if ((attacks >> BigInt(t)) & 1n) if (board[t]===PIECE_NONE||color[t]===oppCol) moves.push(createMove(sq, t));
      } else if (piece === PIECE_ROOK) {
        let attacks = attacksFromSliding(sq, SLIDING_DIRS.rook, ownOcc, getAllOccupied()^ownOcc);
        for (let t = 0; t < 64; t++) if ((attacks >> BigInt(t)) & 1n) if (board[t]===PIECE_NONE||color[t]===oppCol) moves.push(createMove(sq, t));
      } else if (piece === PIECE_QUEEN) {
        let attacks = attacksFromSliding(sq, SLIDING_DIRS.queen, ownOcc, getAllOccupied()^ownOcc);
        for (let t = 0; t < 64; t++) if ((attacks >> BigInt(t)) & 1n) if (board[t]===PIECE_NONE||color[t]===oppCol) moves.push(createMove(sq, t));
      } else if (piece === PIECE_KING) {
        for (let d of KING_MOVES) {
          let to = sq + d;
          if (!isOnBoard(to)) continue;
          if (Math.abs(fileOf(to)-fileOf(sq))>1) continue;
          if (board[to]===PIECE_NONE||color[to]===oppCol) moves.push(createMove(sq, to));
        }
        // castling
        if (col === COLOR_WHITE && sq === 60) {
          if ((castlingRights & 1) && board[61]===PIECE_NONE && board[62]===PIECE_NONE) moves.push(createMove(60,62,PIECE_NONE,true));
          if ((castlingRights & 2) && board[59]===PIECE_NONE && board[58]===PIECE_NONE && board[57]===PIECE_NONE) moves.push(createMove(60,58,PIECE_NONE,true));
        } else if (col === COLOR_BLACK && sq === 4) {
          if ((castlingRights & 4) && board[5]===PIECE_NONE && board[6]===PIECE_NONE) moves.push(createMove(4,6,PIECE_NONE,true));
          if ((castlingRights & 8) && board[3]===PIECE_NONE && board[2]===PIECE_NONE && board[1]===PIECE_NONE) moves.push(createMove(4,2,PIECE_NONE,true));
        }
      }
    }
    return moves;
  }

  function isSquareAttacked(sq, byColor) {
    for (let s = 0; s < 64; s++) {
      if (board[s] === PIECE_NONE || color[s] !== byColor) continue;
      let piece = board[s];
      if (piece === PIECE_PAWN) {
        let d = byColor===COLOR_WHITE? -8 : 8;
        if (sq === s+d-1 || sq === s+d+1) return true;
      } else if (piece === PIECE_KNIGHT) {
        for (let d of KNIGHT_MOVES) if (s+d===sq && Math.abs(fileOf(s)-fileOf(sq))<=2) return true;
      } else if (piece === PIECE_BISHOP || piece===PIECE_ROOK || piece===PIECE_QUEEN || piece===PIECE_KING) {
        let dirs = piece===PIECE_BISHOP? SLIDING_DIRS.bishop : piece===PIECE_ROOK? SLIDING_DIRS.rook : piece===PIECE_QUEEN? SLIDING_DIRS.queen : KING_MOVES;
        for (let d of dirs) {
          let t = s+d; if (!isOnBoard(t)) continue;
          if (piece===PIECE_KING && s+d!==sq) continue;
          while (isOnBoard(t)) {
            if (t === sq) { return true; }
            if (board[t] !== PIECE_NONE) break;
            t += d;
            if (piece===PIECE_KING) break;
          }
        }
      }
    }
    return false;
  }

  function makeMove(move) {
    let captured = board[move.to];
    move.captured = captured;
    move.prevCastling = castlingRights;
    move.prevEnPassant = enPassantSquare;
    move.prevHalfMove = halfMoveClock;
    board[move.to] = board[move.from];
    color[move.to] = color[move.from];
    board[move.from] = PIECE_NONE;
    if (move.isCastling) { /* handle rook movement */ }
    if (move.isEnPassant) { /* capture pawn */ }
    if (move.promotion) board[move.to] = move.promotion;
    sideToMove = 1 - sideToMove;
    halfMoveClock = (captured!==PIECE_NONE || board[move.to]===PIECE_PAWN) ? 0 : halfMoveClock+1;
    if (sideToMove === COLOR_WHITE) fullMoveNumber++;
    enPassantSquare = -1;
    gameHistory.push(move);
  }

  function undoMove() {
    if (gameHistory.length === 0) return;
    let move = gameHistory.pop();
    board[move.from] = board[move.to];
    color[move.from] = color[move.to];
    board[move.to] = move.captured;
    color[move.to] = move.captured!==PIECE_NONE? (1-sideToMove) : 0;
    castlingRights = move.prevCastling;
    enPassantSquare = move.prevEnPassant;
    halfMoveClock = move.prevHalfMove;
    sideToMove = 1 - sideToMove;
    if (sideToMove === COLOR_WHITE) fullMoveNumber--;
  }

  /* ---------- NN Evaluation ---------- */
  function initNNWeights(seed = 42) {
    function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
    let rng = mulberry32(seed);
    let weights = { w1: new Float32Array(768*256), b1: new Float32Array(256), w2: new Float32Array(256*128), b2: new Float32Array(128), w3: new Float32Array(128*1), b3: new Float32Array(1) };
    for (let i=0;i<weights.w1.length;i++) weights.w1[i]=rng()*0.1-0.05;
    for (let i=0;i<weights.b1.length;i++) weights.b1[i]=0;
    for (let i=0;i<weights.w2.length;i++) weights.w2[i]=rng()*0.1-0.05;
    for (let i=0;i<weights.b2.length;i++) weights.b2[i]=0;
    for (let i=0;i<weights.w3.length;i++) weights.w3[i]=rng()*0.1-0.05;
    for (let i=0;i<weights.b3.length;i++) weights.b3[i]=0;
    return weights;
  }

  function boardToTensor() {
    let tensor = new Float32Array(768);
    for (let sq=0; sq<64; sq++) {
      let piece = board[sq];
      if (piece === PIECE_NONE) continue;
      let pieceType = piece - 1;
      let offset = (color[sq] * 6 + pieceType) * 64 + sq;
      tensor[offset] = 1.0;
    }
    return tensor;
  }

  function forwardPass(weights, tensor) {
    function relu(x) { return Math.max(0, x); }
    let l1 = new Float32Array(256);
    for (let i=0;i<256;i++) { let s=0; for(let j=0;j<768;j++) s+=tensor[j]*weights.w1[j*256+i]; l1[i]=relu(s+weights.b1[i]); }
    let l2 = new Float32Array(128);
    for (let i=0;i<128;i++) { let s=0; for(let j=0;j<256;j++) s+=l1[j]*weights.w2[j*128+i]; l2[i]=relu(s+weights.b2[i]); }
    let out = 0;
    for (let i=0;i<128;i++) out += l2[i]*weights.w3[i];
    out += weights.b3[0];
    return out;
  }

  let openingBook = {};
  function initOpeningBook() {
    openingBook["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"] = ["e2e4","d2d4"];
  }

  /* ---------- Search ---------- */
  function quiescence(alpha, beta, depth) {
    let stand_pat = forwardPass(currentWeights, boardToTensor());
    if (stand_pat >= beta) return beta;
    if (alpha < stand_pat) alpha = stand_pat;
    let moves = generateMoves(sideToMove).filter(m => board[m.to]!==PIECE_NONE);
    for (let m of moves) {
      makeMove(m);
      let score = -quiescence(-beta, -alpha, depth-1);
      undoMove();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function alphaBeta(depth, alpha, beta) {
    if (depth <= 0) return quiescence(alpha, beta, 4);
    let moves = generateMoves(sideToMove);
    if (moves.length === 0) {
      if (isSquareAttacked(bitscanForward(getPieceBitboard(PIECE_KING, sideToMove)), 1-sideToMove)) return -99999 + (10-depth);
      return 0;
    }
    for (let m of moves) {
      makeMove(m);
      let score = -alphaBeta(depth-1, -beta, -alpha);
      undoMove();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function searchBestMove(depth = 4) {
    let moves = generateMoves(sideToMove);
    let best = null, bestScore = -Infinity;
    for (let m of moves) {
      makeMove(m);
      let score = -alphaBeta(depth-1, -100000, 100000);
      undoMove();
      if (score > bestScore) { bestScore = score; best = m; }
    }
    return best;
  }

  /* ---------- FEN ---------- */
  function boardToFEN() {
    let fen = ""; let empty=0;
    for (let r=0; r<8; r++) {
      for (let f=0; f<8; f++) {
        let sq = r*8+f; let p = board[sq];
        if (p===PIECE_NONE) empty++;
        else { if(empty>0){fen+=empty; empty=0;} fen+= " PNBRQK"[p].charAt(color[sq]===COLOR_WHITE?0:1).replace(" ",""); }
      }
      if(empty>0){fen+=empty; empty=0;}
      if(r<7) fen+="/";
    }
    fen += sideToMove===COLOR_WHITE?" w ":" b ";
    fen += castlingRights.toString(2).padStart(4,'0').replace(/1/g,'KQkq').substr(0,4)+" ";
    fen += enPassantSquare>=0?String.fromCharCode(97+fileOf(enPassantSquare))+(8-rankOf(enPassantSquare)):"-";
    fen += " "+halfMoveClock+" "+fullMoveNumber;
    return fen;
  }

  function loadFEN(fen) { /* simplified parser */ }

  /* ---------- Expose to window (fixed) ---------- */
  window.ChesszerdEngine = {
    board: () => board,
    color: () => color,
    sideToMove: () => sideToMove,
    generateMoves,
    makeMove,
    undoMove,
    loadFEN,
    boardToFEN,
    searchBestMove,
    initNNWeights,
    currentWeights: () => currentWeights,
    setWeights: (w) => { currentWeights = w; },
    initialSeedWeights: () => initialSeedWeights,
    gameHistory: () => gameHistory,
    openingBook: () => openingBook,
    pieceColorAt: (sq) => color[sq],   // <-- важное исправление
    reset: () => {
      board = new Array(64).fill(0);
      color = new Array(64).fill(0);
      for(let i=0;i<8;i++) { board[8+i]=PIECE_PAWN; color[8+i]=COLOR_BLACK; board[48+i]=PIECE_PAWN; color[48+i]=COLOR_WHITE; }
      board[0]=PIECE_ROOK;color[0]=COLOR_BLACK; board[1]=PIECE_KNIGHT;color[1]=COLOR_BLACK; board[2]=PIECE_BISHOP;color[2]=COLOR_BLACK; board[3]=PIECE_QUEEN;color[3]=COLOR_BLACK; board[4]=PIECE_KING;color[4]=COLOR_BLACK; board[5]=PIECE_BISHOP;color[5]=COLOR_BLACK; board[6]=PIECE_KNIGHT;color[6]=COLOR_BLACK; board[7]=PIECE_ROOK;color[7]=COLOR_BLACK;
      board[56]=PIECE_ROOK;color[56]=COLOR_WHITE; board[57]=PIECE_KNIGHT;color[57]=COLOR_WHITE; board[58]=PIECE_BISHOP;color[58]=COLOR_WHITE; board[59]=PIECE_QUEEN;color[59]=COLOR_WHITE; board[60]=PIECE_KING;color[60]=COLOR_WHITE; board[61]=PIECE_BISHOP;color[61]=COLOR_WHITE; board[62]=PIECE_KNIGHT;color[62]=COLOR_WHITE; board[63]=PIECE_ROOK;color[63]=COLOR_WHITE;
      sideToMove=COLOR_WHITE; castlingRights=15; enPassantSquare=-1; halfMoveClock=0; fullMoveNumber=1; gameHistory=[];
      if (!currentWeights) currentWeights = initialSeedWeights;
    },
    getEvaluation: () => forwardPass(currentWeights, boardToTensor())
  };

  // init
  initialSeedWeights = initNNWeights(42);
  currentWeights = initialSeedWeights;
  initOpeningBook();
  ChesszerdEngine.reset();
})();
