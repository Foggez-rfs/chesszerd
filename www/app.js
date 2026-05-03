/**
 * Chesszerd App vFinal — UI, Sound, Speech, Aizen Personality
 * All global functions & variables, no imports
 */
(function () {
  'use strict';

  const ENGINE = window.ChesszerdEngine;
  let selectedSquare = -1;
  let playerColor = 0;
  let gameActive = false;
  let soundsEnabled = true;
  let speechEnabled = true;
  let currentTheme = 'classic';
  let language = 'ru';

  /* ---------- Web Audio synthesis ---------- */
  let audioCtx = null;
  function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function playTone(freq, duration, type='sine') {
    if (!soundsEnabled || !audioCtx) return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.value = 0.1;
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    setTimeout(() => osc.stop(), duration*1000+50);
  }
  function moveSound() { playTone(500, 0.1); setTimeout(()=>playTone(700,0.1), 100); }
  function captureSound() { playTone(300, 0.05); playTone(200, 0.15, 'triangle'); }

  /* ---------- Speech (Web Speech API with fallback) ---------- */
  function speak(text) {
    if (!speechEnabled) return;
    if (window.speechSynthesis) {
      let utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'ru' ? 'ru-RU' : 'en-US';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }

  const AIZEN_QUOTES = {
    ru: [
      "Добро пожаловать в мою шахматную реальность.",
      "Ты думаешь, что контролируешь доску? Это иллюзия.",
      "Каждый твой ход ведёт тебя к поражению.",
      "Шахматы — это отражение души. Твоя душа трепещет.",
      "Ты даже не осознаёшь, насколько ты слаб.",
      "Моя сила — Hogyoku. Она эволюционирует с каждым твоим поражением.",
      "Интересно... Ты пытаешься сопротивляться.",
      "Твоя стратегия — всего лишь пыль на моём пути."
    ],
    en: [
      "Welcome to my chess reality.",
      "You think you control the board? That is an illusion.",
      "Every move you make leads you to defeat.",
      "Chess is a reflection of the soul. Your soul trembles.",
      "You don't even realize how weak you are.",
      "My power is the Hogyoku. It evolves with your every loss.",
      "Interesting... You are trying to resist.",
      "Your strategy is but dust in my path."
    ]
  };

  function getRandomQuote() {
    let arr = AIZEN_QUOTES[language] || AIZEN_QUOTES.en;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ---------- UI Rendering ---------- */
  function renderBoard() {
    let boardEl = document.getElementById('chessboard');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    let boardArr = ENGINE.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        let sq = r * 8 + f;
        let piece = boardArr[sq];
        let cell = document.createElement('div');
        cell.className = `cell ${ (r+f)%2===0 ? 'light' : 'dark' }`;
        cell.dataset.sq = sq;
        if (piece !== 0) {
          let col = ENGINE.pieceColorAt(sq);
          let symbol = getPieceSymbol(piece, col);
          cell.textContent = symbol;
        }
        cell.addEventListener('click', (e) => onSquareClick(sq));
        cell.addEventListener('touchstart', (e) => { e.preventDefault(); onSquareClick(sq); });
        boardEl.appendChild(cell);
      }
    }
    let quoteEl = document.getElementById('aizen-quote');
    if (quoteEl) quoteEl.textContent = getRandomQuote();
  }

  function getPieceSymbol(piece, col) {
    const map = { 1:'♙',2:'♘',3:'♗',4:'♖',5:'♕',6:'♔' };
    let sym = map[piece] || '';
    return col === 1 ? sym.toLowerCase() : sym;
  }

  function onSquareClick(sq) {
    if (!gameActive || ENGINE.sideToMove() !== playerColor) return;
    if (selectedSquare === -1) {
      if (ENGINE.board()[sq] !== 0 && ENGINE.pieceColorAt(sq) === playerColor) selectedSquare = sq;
    } else {
      let moves = ENGINE.generateMoves(playerColor).filter(m => m.from === selectedSquare && m.to === sq);
      if (moves.length > 0) {
        let move = moves[0];
        ENGINE.makeMove(move);
        moveSound();
        selectedSquare = -1;
        renderBoard();
        if (ENGINE.sideToMove() !== playerColor) setTimeout(aiMove, 300);
      } else {
        if (ENGINE.board()[sq] !== 0 && ENGINE.pieceColorAt(sq) === playerColor) selectedSquare = sq;
        else selectedSquare = -1;
      }
    }
  }

  function aiMove() {
    if (!gameActive) return;
    let best = ENGINE.searchBestMove(4);
    if (best) {
      ENGINE.makeMove(best);
      captureSound();
    }
    renderBoard();
    checkGameEnd();
  }

  function checkGameEnd() {
    let moves = ENGINE.generateMoves(ENGINE.sideToMove());
    if (moves.length === 0) {
      gameActive = false;
      speak(language==='ru'?'Мат. Игра окончена.':'Checkmate. Game over.');
      window.dispatchEvent(new CustomEvent('gameEnd', { detail: { result: 'loss' } }));
    }
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.trim() === (tabId==='tab-game'?'Игра':tabId==='tab-profile'?'Профиль':'Айзен')) btn.classList.add('active');
    });
  }

  function initUI() {
    ENGINE.reset();
    playerColor = 0;
    gameActive = true;
    selectedSquare = -1;
    renderBoard();
    switchTab('tab-game');
  }

  function saveWeights() {
    let w = ENGINE.currentWeights();
    if (w) localStorage.setItem('hogyoku_weights', JSON.stringify(Array.from(w.w1)));
  }

  window.addEventListener('gameEnd', (e) => {
    if (e.detail.result === 'loss') {
      speak(getRandomQuote());
      saveWeights();
    }
  });

  window.ChesszerdApp = {
    init: initUI,
    renderBoard,
    switchTab,
    setTheme: (t) => { currentTheme=t; renderBoard(); }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initUI();
    document.getElementById('btn-new-game')?.addEventListener('click', ()=>{
      ENGINE.reset(); gameActive=true; selectedSquare=-1; renderBoard();
    });
  });
})();
