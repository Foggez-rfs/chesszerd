/**
 * Chesszerd Engine v1.1 — разнообразный ИИ + мутация весов
 */
(function () {
  'use strict';

  const PIECE_NONE = 0, PIECE_PAWN = 1, PIECE_KNIGHT = 2, PIECE_BISHOP = 3,
        PIECE_ROOK = 4, PIECE_QUEEN = 5, PIECE_KING = 6;
  const COLOR_WHITE = 0, COLOR_BLACK = 1;

  let board = new Array(64).fill(PIECE_NONE);
  let color = new Array(64).fill(COLOR_WHITE);
  let sideToMove = COLOR_WHITE;
  let castlingRights = 15;
  let enPassantSquare = -1;
  let halfMoveClock = 0, fullMoveNumber = 1;
  let gameHistory = [];
  let currentWeights = null;
  let initialSeedWeights = null;

  const KNIGHT_MOVES = [-17,-15,-10,-6,6,10,15,17];
  const KING_MOVES = [-9,-8,-7,-1,1,7,8,9];
  const SLIDING_DIRS = {
    bishop: [-9,-7,7,9],
    rook: [-8,-1,1,8],
    queen: [-9,-8,-7,-1,1,7,8,9]
  };

  function isOnBoard(sq) { return sq >= 0 && sq < 64; }
  function fileOf(sq) { return sq & 7; }
  function rankOf(sq) { return sq >> 3; }

  function attacksFromSliding(sq, dirs, ownOcc, oppOcc) {
    let att = 0n;
    for (let d of dirs) {
      let t = sq;
      while (true) {
        t += d;
        if (!isOnBoard(t)) break;
        if (Math.abs(fileOf(t)-fileOf(t-d))>1 && (d===-9||d===-7||d===7||d===9)) break;
        att |= (1n << BigInt(t));
        if ((ownOcc>>BigInt(t))&1n) break;
        if ((oppOcc>>BigInt(t))&1n) break;
      }
    }
    return att;
  }

  function generateMoves(col) {
    const moves = [];
    const opp = 1-col;
    const ownOcc = getAllOccupied();
    for (let sq=0; sq<64; sq++) {
      if (board[sq]===PIECE_NONE||color[sq]!==col) continue;
      const pc = board[sq];
      if (pc===PIECE_PAWN) {
        let dir = col===COLOR_WHITE ? -8 : 8;
        let startRank = col===COLOR_WHITE ? 6 : 1;
        let promRank = col===COLOR_WHITE ? 0 : 7;
        let to = sq+dir;
        if (isOnBoard(to) && board[to]===PIECE_NONE) {
          if (rankOf(to)===promRank) {
            for (let p of [PIECE_QUEEN,PIECE_ROOK,PIECE_BISHOP,PIECE_KNIGHT]) moves.push({from:sq,to,promotion:p});
          } else {
            moves.push({from:sq,to});
            let to2 = sq+2*dir;
            if (rankOf(sq)===startRank && board[to2]===PIECE_NONE) moves.push({from:sq,to:to2});
          }
        }
        for (let d of [dir-1, dir+1]) {
          let cap = sq+d;
          if (isOnBoard(cap) && ((board[cap]!==PIECE_NONE&&color[cap]===opp)||cap===enPassantSquare)) {
            if (rankOf(cap)===promRank) {
              for (let p of [PIECE_QUEEN,PIECE_ROOK,PIECE_BISHOP,PIECE_KNIGHT]) moves.push({from:sq,to:cap,promotion:p,enPassant:cap===enPassantSquare});
            } else {
              moves.push({from:sq,to:cap,enPassant:cap===enPassantSquare});
            }
          }
        }
      } else if (pc===PIECE_KNIGHT) {
        for (let d of KNIGHT_MOVES) {
          let to = sq+d;
          if (!isOnBoard(to)) continue;
          if (Math.abs(fileOf(to)-fileOf(sq))>2) continue;
          if (board[to]===PIECE_NONE||color[to]===opp) moves.push({from:sq,to});
        }
      } else if (pc===PIECE_BISHOP) {
        let att = attacksFromSliding(sq, SLIDING_DIRS.bishop, ownOcc, getAllOccupied()^ownOcc);
        for (let t=0;t<64;t++) if ((att>>BigInt(t))&1n) if (board[t]===PIECE_NONE||color[t]===opp) moves.push({from:sq,to:t});
      } else if (pc===PIECE_ROOK) {
        let att = attacksFromSliding(sq, SLIDING_DIRS.rook, ownOcc, getAllOccupied()^ownOcc);
        for (let t=0;t<64;t++) if ((att>>BigInt(t))&1n) if (board[t]===PIECE_NONE||color[t]===opp) moves.push({from:sq,to:t});
      } else if (pc===PIECE_QUEEN) {
        let att = attacksFromSliding(sq, SLIDING_DIRS.queen, ownOcc, getAllOccupied()^ownOcc);
        for (let t=0;t<64;t++) if ((att>>BigInt(t))&1n) if (board[t]===PIECE_NONE||color[t]===opp) moves.push({from:sq,to:t});
      } else if (pc===PIECE_KING) {
        for (let d of KING_MOVES) {
          let to = sq+d;
          if (!isOnBoard(to)) continue;
          if (Math.abs(fileOf(to)-fileOf(sq))>1) continue;
          if (board[to]===PIECE_NONE||color[to]===opp) moves.push({from:sq,to});
        }
        // castling
        if (col===COLOR_WHITE&&sq===60) {
          if ((castlingRights&1)&&board[61]===PIECE_NONE&&board[62]===PIECE_NONE) moves.push({from:60,to:62,castling:true});
          if ((castlingRights&2)&&board[59]===PIECE_NONE&&board[58]===PIECE_NONE&&board[57]===PIECE_NONE) moves.push({from:60,to:58,castling:true});
        } else if (col===COLOR_BLACK&&sq===4) {
          if ((castlingRights&4)&&board[5]===PIECE_NONE&&board[6]===PIECE_NONE) moves.push({from:4,to:6,castling:true});
          if ((castlingRights&8)&&board[3]===PIECE_NONE&&board[2]===PIECE_NONE&&board[1]===PIECE_NONE) moves.push({from:4,to:2,castling:true});
        }
      }
    }
    return moves;
  }

  function getAllOccupied() {
    let bb=0n; for (let i=0;i<64;i++) if (board[i]!==PIECE_NONE) bb|=1n<<BigInt(i);
    return bb;
  }

  function makeMove(m) {
    m.captured = board[m.to];
    board[m.to] = board[m.from];
    color[m.to] = color[m.from];
    board[m.from] = PIECE_NONE;
    if (m.promotion) board[m.to] = m.promotion;
    if (m.castling) {
      if (m.to===62) { board[61]=board[63]; color[61]=color[63]; board[63]=PIECE_NONE; }
      else if (m.to===58) { board[59]=board[56]; color[59]=color[56]; board[56]=PIECE_NONE; }
      else if (m.to===6) { board[5]=board[7]; color[5]=color[7]; board[7]=PIECE_NONE; }
      else if (m.to===2) { board[3]=board[0]; color[3]=color[0]; board[0]=PIECE_NONE; }
    }
    if (m.enPassant) {
      let captureSq = sideToMove===COLOR_WHITE ? m.to+8 : m.to-8;
      board[captureSq] = PIECE_NONE;
    }
    sideToMove = 1 - sideToMove;
    gameHistory.push(m);
  }

  function undoMove() {
    if (!gameHistory.length) return;
    let m = gameHistory.pop();
    board[m.from] = board[m.to];
    color[m.from] = color[m.to];
    board[m.to] = m.captured||PIECE_NONE;
    if (m.captured) color[m.to] = 1-sideToMove;
    else color[m.to] = COLOR_WHITE;
    if (m.castling) { /* simplified undo */ }
    if (m.enPassant) { /* simplified undo */ }
    sideToMove = 1 - sideToMove;
  }

  function boardToTensor() {
    let t = new Float32Array(768);
    for (let i=0;i<64;i++) {
      let p = board[i];
      if (p===PIECE_NONE) continue;
      let idx = (color[i]*6 + (p-1))*64 + i;
      t[idx]=1.0;
    }
    return t;
  }

  function forwardPass(weights, tensor) {
    function relu(x){return Math.max(0,x);}
    let l1=new Float32Array(256);
    for (let i=0;i<256;i++) { let s=0; for(let j=0;j<768;j++) s+=tensor[j]*weights.w1[j*256+i]; l1[i]=relu(s+weights.b1[i]); }
    let l2=new Float32Array(128);
    for (let i=0;i<128;i++) { let s=0; for(let j=0;j<256;j++) s+=l1[j]*weights.w2[j*128+i]; l2[i]=relu(s+weights.b2[i]); }
    let out=0; for(let i=0;i<128;i++) out+=l2[i]*weights.w3[i];
    return out+weights.b3[0];
  }

  function initNNWeights(seed=42) {
    function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
    let r=mulberry32(seed);
    let w={w1:new Float32Array(768*256),b1:new Float32Array(256),w2:new Float32Array(256*128),b2:new Float32Array(128),w3:new Float32Array(128),b3:new Float32Array(1)};
    for(let i=0;i<w.w1.length;i++) w.w1[i]=r()*0.1-0.05;
    for(let i=0;i<w.b1.length;i++) w.b1[i]=0;
    for(let i=0;i<w.w2.length;i++) w.w2[i]=r()*0.1-0.05;
    for(let i=0;i<w.b2.length;i++) w.b2[i]=0;
    for(let i=0;i<w.w3.length;i++) w.w3[i]=r()*0.1-0.05;
    w.b3[0]=0;
    return w;
  }

  let openingBook = { "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": ["e2e4","d2d4"] };

  function searchBestMove(depth=3) {
    let moves = generateMoves(sideToMove);
    if (!moves.length) return null;
    let bestMoves = [];
    let bestScore = -Infinity;
    for (let m of moves) {
      makeMove(m);
      let score = -alphaBeta(depth-1, -100000, 100000);
      undoMove();
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [m];
      } else if (Math.abs(score - bestScore) < 1) {
        bestMoves.push(m);
      }
    }
    // Выбираем случайный ход из лучших
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  function alphaBeta(depth, alpha, beta) {
    if (depth <= 0) return forwardPass(currentWeights, boardToTensor());
    let moves = generateMoves(sideToMove);
    if (!moves.length) {
      // checkmate or stalemate
      return -99999 + (10-depth);
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

  function mutateWeights(weights, strength=0.01) {
    for (let i=0;i<weights.w1.length;i++) weights.w1[i] += (Math.random()-0.5)*strength;
    for (let i=0;i<weights.w2.length;i++) weights.w2[i] += (Math.random()-0.5)*strength;
    for (let i=0;i<weights.w3.length;i++) weights.w3[i] += (Math.random()-0.5)*strength;
  }

  window.ChesszerdEngine = {
    board: () => board,
    pieceColorAt: (sq) => color[sq],
    sideToMove: () => sideToMove,
    generateMoves,
    makeMove,
    undoMove,
    searchBestMove,
    reset: () => {
      board = new Array(64).fill(0);
      color = new Array(64).fill(0);
      for(let i=0;i<8;i++) { board[8+i]=PIECE_PAWN; color[8+i]=COLOR_BLACK; board[48+i]=PIECE_PAWN; color[48+i]=COLOR_WHITE; }
      board[0]=PIECE_ROOK;color[0]=COLOR_BLACK; board[1]=PIECE_KNIGHT;color[1]=COLOR_BLACK; board[2]=PIECE_BISHOP;color[2]=COLOR_BLACK; board[3]=PIECE_QUEEN;color[3]=COLOR_BLACK; board[4]=PIECE_KING;color[4]=COLOR_BLACK; board[5]=PIECE_BISHOP;color[5]=COLOR_BLACK; board[6]=PIECE_KNIGHT;color[6]=COLOR_BLACK; board[7]=PIECE_ROOK;color[7]=COLOR_BLACK;
      board[56]=PIECE_ROOK;color[56]=COLOR_WHITE; board[57]=PIECE_KNIGHT;color[57]=COLOR_WHITE; board[58]=PIECE_BISHOP;color[58]=COLOR_WHITE; board[59]=PIECE_QUEEN;color[59]=COLOR_WHITE; board[60]=PIECE_KING;color[60]=COLOR_WHITE; board[61]=PIECE_BISHOP;color[61]=COLOR_WHITE; board[62]=PIECE_KNIGHT;color[62]=COLOR_WHITE; board[63]=PIECE_ROOK;color[63]=COLOR_WHITE;
      sideToMove=COLOR_WHITE; castlingRights=15; enPassantSquare=-1; halfMoveClock=0; fullMoveNumber=1; gameHistory=[];
      if (!currentWeights) {
        let saved = localStorage.getItem('hogyoku_weights');
        if (saved) {
          try {
            let arr = JSON.parse(saved);
            currentWeights = { w1:new Float32Array(arr.w1), b1:new Float32Array(arr.b1), w2:new Float32Array(arr.w2), b2:new Float32Array(arr.b2), w3:new Float32Array(arr.w3), b3:new Float32Array(arr.b3) };
          } catch(e) { currentWeights = initialSeedWeights; }
        } else {
          currentWeights = initialSeedWeights;
        }
      }
    },
    currentWeights: () => currentWeights,
    saveWeights: () => {
      let w = currentWeights;
      localStorage.setItem('hogyoku_weights', JSON.stringify({
        w1: Array.from(w.w1), b1: Array.from(w.b1),
        w2: Array.from(w.w2), b2: Array.from(w.b2),
        w3: Array.from(w.w3), b3: Array.from(w.b3)
      }));
    },
    onPlayerWin: () => {
      // Игрок выиграл – мутируем веса
      mutateWeights(currentWeights, 0.02);
      currentWeights = currentWeights; // не обязательно
    }
  };

  initialSeedWeights = initNNWeights(42);
  currentWeights = initialSeedWeights;
  ChesszerdEngine.reset();
})();
