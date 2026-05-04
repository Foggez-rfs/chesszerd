(function () {
  'use strict';
  const E = window.ChesszerdEngine;
  let selectedSquare = -1;
  let playerColor = 0;
  let gameActive = false;
  let soundsEnabled = true;
  let language = 'ru';

  let audioCtx = null;
  function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
  function playTone(f,d,t='sine') {
    if (!soundsEnabled||!audioCtx) return;
    let o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=t; o.frequency.value=f; g.gain.value=0.1;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+d);
    setTimeout(()=>o.stop(), d*1000+50);
  }
  function moveSound() { playTone(500,0.1); setTimeout(()=>playTone(700,0.1), 100); }
  function captureSound() { playTone(300,0.05); playTone(200,0.15,'triangle'); }

  const QUOTES = {
    ru: ["Добро пожаловать в мою реальность.","Ты думаешь, что контролируешь доску?","Каждый твой ход ведёт к поражению.","Шахматы — отражение души.","Ты слаб.","Hogyoku эволюционирует.","Интересно... Ты сопротивляешься.","Твоя стратегия — пыль."],
    en: ["Welcome to my chess reality.","You think you control the board?","Every move leads to defeat.","Chess reflects the soul.","You are weak.","Hogyoku evolves.","Interesting... You resist.","Your strategy is dust."]
  };

  function randomQuote() {
    let arr = QUOTES[language] || QUOTES.en;
    return arr[Math.floor(Math.random()*arr.length)];
  }

  function renderBoard() {
    let boardEl = document.getElementById('chessboard');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    let b = E.board();
    for (let r=0; r<8; r++) {
      for (let f=0; f<8; f++) {
        let sq = r*8+f;
        let piece = b[sq];
        let cell = document.createElement('div');
        cell.className = `cell ${ (r+f)%2===0 ? 'light' : 'dark' }`;
        cell.dataset.sq = sq;
        if (piece !== 0) {
          let col = E.pieceColorAt(sq);
          cell.textContent = getSymbol(piece, col);
        }
        cell.addEventListener('click', ()=>onSquareClick(sq));
        cell.addEventListener('touchstart', (e)=>{ e.preventDefault(); onSquareClick(sq); });
        boardEl.appendChild(cell);
      }
    }
    document.getElementById('aizen-quote').textContent = randomQuote();
  }

  function getSymbol(p,c) {
    const map = {1:'♙',2:'♘',3:'♗',4:'♖',5:'♕',6:'♔'};
    let s = map[p]||'';
    return c===1 ? s.toLowerCase() : s;
  }

  function onSquareClick(sq) {
    if (!gameActive || E.sideToMove() !== playerColor) return;
    if (selectedSquare === -1) {
      if (E.board()[sq] !== 0 && E.pieceColorAt(sq) === playerColor) selectedSquare = sq;
    } else {
      let moves = E.generateMoves(playerColor).filter(m => m.from === selectedSquare && m.to === sq);
      if (moves.length > 0) {
        let move = moves[0];
        let captured = E.board()[sq] !== 0;
        E.makeMove(move);
        if (captured) captureSound(); else moveSound();
        selectedSquare = -1;
        renderBoard();
        if (E.sideToMove() !== playerColor) setTimeout(aiMove, 300);
      } else {
        if (E.board()[sq] !== 0 && E.pieceColorAt(sq) === playerColor) selectedSquare = sq;
        else selectedSquare = -1;
      }
    }
  }

  function aiMove() {
    if (!gameActive) return;
    let best = E.searchBestMove(4);
    if (best) {
      let captured = E.board()[best.to] !== 0;
      E.makeMove(best);
      if (captured) captureSound(); else playTone(400,0.1);
      selectedSquare = -1;
      renderBoard();
      checkGameEnd();
    }
  }

  function checkGameEnd() {
    let moves = E.generateMoves(E.sideToMove());
    if (moves.length === 0) {
      gameActive = false;
      if (speak) speak('Мат. Игра окончена.');
      // Если ходить некуда, и король под шахом – игрок выиграл? (упростим)
      window.dispatchEvent(new CustomEvent('gameEnd', { detail: { result: 'win' } }));
    }
  }

  function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el=>el.style.display='none');
    document.getElementById(id).style.display='block';
    document.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.classList.remove('active');
      if (btn.textContent.trim()===(id==='tab-game'?'Игра':id==='tab-profile'?'Профиль':'Айзен')) btn.classList.add('active');
    });
  }

  window.ChesszerdApp = {
    init: () => {
      E.reset();
      playerColor = 0;
      gameActive = true;
      selectedSquare = -1;
      renderBoard();
      switchTab('tab-game');
    },
    renderBoard,
    switchTab
  };

  document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    ChesszerdApp.init();
    document.getElementById('btn-new-game').addEventListener('click', ()=>{
      E.reset(); gameActive=true; selectedSquare=-1; renderBoard();
    });
  });
})();
