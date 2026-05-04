/**
 * Chesszerd App v1.2 — чистый UI, дерево, NEO, профиль
 */
(function () {
  'use strict';

  const E = window.ChesszerdEngine;
  let selectedSquare = -1;
  let playerColor = 0;
  let gameActive = false;
  let language = 'ru';
  let currentTheme = 'wood';
  let currentStyle = 'neo';
  let audioCtx = null;

  // ========== Аватары ==========
  const AVATARS = [
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23e74c3c"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E👑%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%233498db"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E♛%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%232ecc71"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E🧠%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23f39c12"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E♞%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%239b59b6"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E😈%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%231abc9c"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E♝%3C/text%3E%3C/svg%3E'
  ];

  // ========== Цитаты ==========
  const QUOTES = {
    ru: [
      "Добро пожаловать в мою шахматную реальность.",
      "Ты думаешь, что контролируешь доску? Это иллюзия.",
      "Каждый твой ход ведёт тебя к поражению.",
      "Шахматы — отражение души. Твоя душа трепещет.",
      "Ты даже не осознаёшь, насколько ты слаб.",
      "Моя сила — Hogyoku. Она эволюционирует.",
      "Интересно... Ты пытаешься сопротивляться.",
      "Твоя стратегия — всего лишь пыль на моём пути."
    ],
    en: [
      "Welcome to my chess reality.",
      "You think you control the board? That is an illusion.",
      "Every move you make leads you to defeat.",
      "Chess is a reflection of the soul. Your soul trembles.",
      "You don't even realize how weak you are.",
      "My power is the Hogyoku. It evolves.",
      "Interesting... You are trying to resist.",
      "Your strategy is but dust in my path."
    ]
  };

  function randomQuote() {
    let arr = QUOTES[language] || QUOTES.en;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ========== Аудио ==========
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function beep(freq, dur = 0.1) {
    if (!audioCtx) return;
    try {
      let o = audioCtx.createOscillator();
      let g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      setTimeout(() => o.stop(), dur * 1000 + 50);
    } catch(e) {}
  }

  // ========== Рендер доски ==========
  function getPieceSymbol(piece, color) {
    const map = { 1: '♙', 2: '♘', 3: '♗', 4: '♖', 5: '♕', 6: '♔' };
    let sym = map[piece] || '?';
    return color === 1 ? sym.toLowerCase() : sym;
  }

  function renderBoard() {
    let boardEl = document.getElementById('chessboard');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    let b = E.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        let sq = r * 8 + f;
        let piece = b[sq];
        let cell = document.createElement('div');
        cell.className = 'cell ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
        cell.dataset.sq = sq;
        if (piece !== 0) {
          let col = E.pieceColorAt(sq);
          let span = document.createElement('span');
          span.className = 'piece';
          span.textContent = getPieceSymbol(piece, col);
          cell.appendChild(span);
        }
        cell.addEventListener('click', () => onSquareClick(sq));
        cell.addEventListener('touchstart', (e) => { e.preventDefault(); onSquareClick(sq); });
        boardEl.appendChild(cell);
      }
    }
    let quoteEl = document.getElementById('aizen-quote');
    if (quoteEl) quoteEl.textContent = randomQuote();
  }

  // ========== Игровая логика ==========
  function onSquareClick(sq) {
    if (!gameActive) return;
    if (E.sideToMove() !== playerColor) return;

    if (selectedSquare === -1) {
      if (E.board()[sq] !== 0 && E.pieceColorAt(sq) === playerColor) {
        selectedSquare = sq;
      }
    } else {
      let moves = E.generateMoves(playerColor).filter(m => m.from === selectedSquare && m.to === sq);
      if (moves.length > 0) {
        let captured = E.board()[sq] !== 0 || moves[0].enPassant;
        E.makeMove(moves[0]);
        beep(captured ? 200 : 500, captured ? 0.2 : 0.1);
        selectedSquare = -1;
        renderBoard();
        if (gameActive && E.sideToMove() !== playerColor) {
          setTimeout(aiMove, 200);
        }
      } else {
        if (E.board()[sq] !== 0 && E.pieceColorAt(sq) === playerColor) {
          selectedSquare = sq;
        } else {
          selectedSquare = -1;
        }
      }
    }
  }

  function aiMove() {
    if (!gameActive) return;
    let best = E.searchBestMove(3);
    if (best) {
      let captured = E.board()[best.to] !== 0 || best.enPassant;
      E.makeMove(best);
      beep(captured ? 180 : 400, captured ? 0.2 : 0.1);
      renderBoard();
      checkGameEnd();
    }
  }

  function checkGameEnd() {
    if (E.generateMoves(E.sideToMove()).length === 0) {
      gameActive = false;
      let kingSq = -1;
      let b = E.board();
      let stm = E.sideToMove();
      for (let i = 0; i < 64; i++) {
        if (b[i] === 6 && E.pieceColorAt(i) === stm) { kingSq = i; break; }
      }
      if (kingSq >= 0) {
        let attacked = false;
        let oppMoves = E.generateMoves(1 - stm);
        for (let m of oppMoves) {
          if (m.to === kingSq) { attacked = true; break; }
        }
        if (attacked) {
          // Мат
          if (stm !== playerColor) {
            // Игрок выиграл
            updateStats(true);
          } else {
            updateStats(false);
          }
        } else {
          // Пат
        }
      }
      beep(300, 0.5);
    }
  }

  function updateStats(playerWin) {
    let prof = getProfile();
    if (playerWin) {
      prof.wins = (prof.wins || 0) + 1;
      prof.elo = Math.min(3000, (prof.elo || 1200) + 25);
      E.onPlayerWin?.();
    } else {
      prof.losses = (prof.losses || 0) + 1;
      prof.elo = Math.max(100, (prof.elo || 1200) - 15);
    }
    saveProfile(prof);
    updateProfileUI();
  }

  function undoMove() {
    if (!gameActive) return;
    if (E.sideToMove() === playerColor) return;
    let hist = E.gameHistory();
    if (hist.length === 0) return;
    E.undoMove();
    if (hist.length > 1 && E.sideToMove() !== playerColor) {
      E.undoMove();
    }
    selectedSquare = -1;
    renderBoard();
  }

  // ========== Профиль ==========
  function getProfile() {
    let raw = localStorage.getItem('chesszerd_profile');
    return raw ? JSON.parse(raw) : { name: 'Игрок', avatar: 0, elo: 1200, wins: 0, losses: 0 };
  }
  function saveProfile(p) {
    localStorage.setItem('chesszerd_profile', JSON.stringify(p));
  }
  function updateProfileUI() {
    let p = getProfile();
    let nameInput = document.getElementById('username-input');
    if (nameInput) nameInput.value = p.name;
    let eloEl = document.getElementById('elo');
    if (eloEl) eloEl.textContent = p.elo;
    let winsEl = document.getElementById('wins');
    if (winsEl) winsEl.textContent = p.wins;
    let lossesEl = document.getElementById('losses');
    if (lossesEl) lossesEl.textContent = p.losses;
    let greeting = document.getElementById('profile-greeting');
    if (greeting) greeting.textContent = p.name;
    document.querySelectorAll('.avatar-img').forEach((img, i) => {
      img.classList.toggle('selected', i === p.avatar);
    });
  }

  function buildAvatarChooser() {
    let grid = document.getElementById('avatar-chooser');
    if (!grid) return;
    grid.innerHTML = '';
    AVATARS.forEach((url, i) => {
      let div = document.createElement('div');
      div.className = 'avatar-img';
      div.style.backgroundImage = `url('${url}')`;
      div.addEventListener('click', () => {
        let p = getProfile();
        p.avatar = i;
        saveProfile(p);
        updateProfileUI();
      });
      grid.appendChild(div);
    });
  }

  window.saveProfile = function() {
    let input = document.getElementById('username-input');
    if (!input) return;
    let name = input.value.trim();
    if (!name) return;
    let p = getProfile();
    p.name = name;
    saveProfile(p);
    updateProfileUI();
  };

  // ========== Вкладки ==========
  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    let tab = document.getElementById(tabId);
    if (tab) tab.style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => {
      let label = btn.textContent.trim();
      let match = (tabId === 'tab-game' && label === 'Игра') ||
                  (tabId === 'tab-profile' && label === 'Профиль') ||
                  (tabId === 'tab-settings' && label === 'Стиль');
      btn.classList.toggle('active', match);
    });
    if (tabId === 'tab-profile') updateProfileUI();
  }

  // ========== Темы ==========
  function applyTheme(theme) {
    const root = document.documentElement;
    const themes = {
      wood:   { light: '#f0d9b5', dark: '#b58863', accent: '#c8a96e' },
      classic:{ light: '#f0f0f0', dark: '#7d7d7d', accent: '#3498db' },
      night:  { light: '#4a4a4a', dark: '#1e1e1e', accent: '#9b59b6' },
      neon:   { light: '#1a1a2e', dark: '#0f0f23', accent: '#00ffcc' }
    };
    let t = themes[theme] || themes.wood;
    root.style.setProperty('--cell-light', t.light);
    root.style.setProperty('--cell-dark', t.dark);
    root.style.setProperty('--accent', t.accent);
    currentTheme = theme;
    renderBoard();
    document.querySelectorAll('#theme-selector .theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  }

  function applyStyle(style) {
    currentStyle = style;
    renderBoard();
    document.querySelectorAll('#style-selector .theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.style === style);
    });
  }

  function buildSettings() {
    let themeSel = document.getElementById('theme-selector');
    if (themeSel) {
      ['wood', 'classic', 'night', 'neon'].forEach(t => {
        let btn = document.createElement('button');
        btn.className = 'theme-btn';
        btn.dataset.theme = t;
        btn.textContent = t;
        btn.addEventListener('click', () => applyTheme(t));
        themeSel.appendChild(btn);
      });
    }
    let styleSel = document.getElementById('style-selector');
    if (styleSel) {
      ['neo', 'standard', 'minimal'].forEach(s => {
        let btn = document.createElement('button');
        btn.className = 'theme-btn';
        btn.dataset.style = s;
        btn.textContent = s;
        btn.addEventListener('click', () => applyStyle(s));
        styleSel.appendChild(btn);
      });
    }
  }

  // ========== Инициализация ==========
  function init() {
    initAudio();
    E.reset();
    playerColor = 0;
    gameActive = true;
    selectedSquare = -1;
    applyTheme('wood');
    applyStyle('neo');
    renderBoard();
    switchTab('tab-game');
    buildAvatarChooser();
    buildSettings();
    updateProfileUI();

    let newGameBtn = document.getElementById('btn-new-game');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        E.reset();
        gameActive = true;
        selectedSquare = -1;
        renderBoard();
      });
    }
  }

  // ========== Экспорт ==========
  window.ChesszerdApp = {
    init,
    switchTab,
    undoMove,
    saveProfile: window.saveProfile
  };

  document.addEventListener('DOMContentLoaded', init);
})();
