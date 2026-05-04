(function () {
  'use strict';
  const E = window.ChesszerdEngine;
  let selectedSquare = -1;
  let playerColor = 0; // 0 – белые
  let gameActive = false;
  let language = 'ru';

  // Настройки
  let currentTheme = 'wood';   // wood, classic, night, neon
  let currentStyle = 'neo';    // neo, standard, minimal

  // Аватары (base64 кружочки)
  const AVATARS = [
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23e74c3c"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E👑%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%233498db"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E♛%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%232ecc71"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E🧠%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23f39c12"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E♞%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%239b59b6"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E😈%3C/text%3E%3C/svg%3E',
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%231abc9c"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E♝%3C/text%3E%3C/svg%3E'
  ];

  // Аудио (упрощённый синтез)
  let audioCtx = null;
  function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
  function beep(f,d) {
    if (!audioCtx) return;
    let o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.value=f; g.gain.value=0.1;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+d);
    setTimeout(()=>o.stop(), d*1000+50);
  }

  const QUOTES = {
    ru: ["Добро пожаловать в мою реальность.","Ты думаешь, что контролируешь доску?","Каждый твой ход ведёт к поражению.","Шахматы — отражение души.","Ты слаб.","Hogyoku эволюционирует.","Интересно... Ты сопротивляешься.","Твоя стратегия — пыль."],
    en: ["Welcome to my chess reality.","You think you control the board?","Every move leads to defeat.","Chess reflects the soul.","You are weak.","Hogyoku evolves.","Interesting... You resist.","Your strategy is dust."]
  };
  function randomQuote() {
    return (QUOTES[language]||QUOTES.en)[Math.floor(Math.random()*8)];
  }

  // Рендер доски
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
          let sym = getPieceSymbol(piece, col);
          let span = document.createElement('span');
          span.className = 'piece';
          span.textContent = sym;
          cell.appendChild(span);
        }
        cell.addEventListener('click', ()=>onSquareClick(sq));
        cell.addEventListener('touchstart', (e)=>{ e.preventDefault(); onSquareClick(sq); });
        boardEl.appendChild(cell);
      }
    }
    document.getElementById('aizen-quote').textContent = randomQuote();
  }

  function getPieceSymbol(piece, color) {
    const map = {1:'♙',2:'♘',3:'♗',4:'♖',5:'♕',6:'♔'};
    let sym = map[piece] || '';
    if (currentStyle === 'neo') {
      // NEO стиль – меняем символы на более жирные
      const neoMap = {1:'♙',2:'♘',3:'♗',4:'♖',5:'♕',6:'♔'};
      sym = neoMap[piece];
    } else if (currentStyle === 'minimal') {
      sym = '●'; // пример
    }
    return color === 1 ? sym.toLowerCase() : sym;
  }

  // Игровые события
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
        beep(500, 0.1); if (captured) beep(200, 0.2);
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
      beep(400, 0.1); if (captured) beep(180, 0.2);
      selectedSquare = -1;
      renderBoard();
      checkGameEnd();
    }
  }

  function checkGameEnd() {
    let moves = E.generateMoves(E.sideToMove());
    if (moves.length === 0) {
      gameActive = false;
      // обновить статистику
      let profile = getProfile();
      profile.losses = (profile.losses||0) + 1;
      saveProfile(profile);
      updateProfileUI();
      beep(300, 0.5);
      E.onPlayerWin?.(); // мутация весов
      window.dispatchEvent(new CustomEvent('gameEnd', {detail:{result:'loss'}}));
    }
  }

  // Отмена хода (оба хода: игрока и ИИ)
  function undoMove() {
    if (!gameActive) return;
    // отменяем ход противника и свой
    if (E.gameHistory().length >= 2 && E.sideToMove() === playerColor) {
      E.undoMove(); // ход ИИ
      E.undoMove(); // ход игрока
      selectedSquare = -1;
      renderBoard();
    }
  }

  // Профиль (localStorage)
  function getProfile() {
    let raw = localStorage.getItem('chesszerd_profile');
    return raw ? JSON.parse(raw) : { name: 'Игрок', avatar: 0, elo: 1200, wins: 0, losses: 0 };
  }
  function saveProfile(prof) { localStorage.setItem('chesszerd_profile', JSON.stringify(prof)); }

  function updateProfileUI() {
    let p = getProfile();
    document.getElementById('username-input').value = p.name;
    document.getElementById('elo').textContent = p.elo;
    document.getElementById('wins').textContent = p.wins;
    document.getElementById('losses').textContent = p.losses;
    document.getElementById('profile-greeting').textContent = p.name;
    // выделить аватар
    document.querySelectorAll('.avatar-img').forEach((img, idx)=>{
      img.classList.toggle('selected', idx === p.avatar);
    });
  }

  function buildAvatarChooser() {
    let grid = document.getElementById('avatar-chooser');
    grid.innerHTML = '';
    AVATARS.forEach((url, idx)=>{
      let div = document.createElement('div');
      div.className = 'avatar-img';
      div.style.backgroundImage = `url('${url}')`;
      div.addEventListener('click', ()=>{
        let p = getProfile();
        p.avatar = idx;
        saveProfile(p);
        updateProfileUI();
      });
      grid.appendChild(div);
    });
  }

  window.saveProfile = function() {
    let name = document.getElementById('username-input').value.trim();
    if (!name) return;
    let p = getProfile();
    p.name = name;
    saveProfile(p);
    updateProfileUI();
  };

  // Переключение вкладок
  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el=>el.style.display='none');
    document.getElementById(tabId).style.display='block';
    document.querySelectorAll('.tab-btn').forEach(btn=>{
      btn.classList.remove('active');
      if (btn.textContent.trim() === (tabId==='tab-game'?'Игра':tabId==='tab-profile'?'Профиль':'Стиль')) btn.classList.add('active');
    });
    if (tabId === 'tab-profile') updateProfileUI();
  }

  // Смена темы и стиля
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'wood') {
      root.style.setProperty('--cell-light','#f0d9b5');
      root.style.setProperty('--cell-dark','#b58863');
      root.style.setProperty('--accent','#c8a96e');
    } else if (theme === 'classic') {
      root.style.setProperty('--cell-light','#f0f0f0');
      root.style.setProperty('--cell-dark','#7d7d7d');
      root.style.setProperty('--accent','#3498db');
    } else if (theme === 'night') {
      root.style.setProperty('--cell-light','#4a4a4a');
      root.style.setProperty('--cell-dark','#1e1e1e');
      root.style.setProperty('--accent','#9b59b6');
    } else if (theme === 'neon') {
      root.style.setProperty('--cell-light','#1a1a2e');
      root.style.setProperty('--cell-dark','#0f0f23');
      root.style.setProperty('--accent','#00ffcc');
    }
    currentTheme = theme;
    renderBoard();
    // подсветить кнопку активной темы
    document.querySelectorAll('#theme-selector .theme-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  }

  function applyStyle(style) {
    currentStyle = style;
    renderBoard();
    document.querySelectorAll('#style-selector .theme-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.style === style);
    });
  }

  // Инициализация
  function init() {
    initAudio();
    E.reset();
    playerColor = 0;
    gameActive = true;
    selectedSquare = -1;
    applyTheme('wood');   // по умолчанию дерево
    applyStyle('neo');
    renderBoard();
    switchTab('tab-game');
    buildAvatarChooser();
    updateProfileUI();

    // Кнопка новой игры
    document.getElementById('btn-new-game').addEventListener('click', ()=>{
      E.reset(); gameActive=true; selectedSquare=-1; renderBoard();
    });

    // Строим селекторы тем и стилей
    let themeSel = document.getElementById('theme-selector');
    ['wood','classic','night','neon'].forEach(theme=>{
      let btn = document.createElement('button');
      btn.className = 'theme-btn';
      btn.dataset.theme = theme;
      btn.textContent = theme;
      btn.addEventListener('click', ()=>applyTheme(theme));
      themeSel.appendChild(btn);
    });

    let styleSel = document.getElementById('style-selector');
    ['neo','standard','minimal'].forEach(style=>{
      let btn = document.createElement('button');
      btn.className = 'theme-btn';
      btn.dataset.style = style;
      btn.textContent = style;
      btn.addEventListener('click', ()=>applyStyle(style));
      styleSel.appendChild(btn);
    });
  }

  window.ChesszerdApp = {
    init,
    switchTab,
    undoMove,
    saveProfile: window.saveProfile
  };

  document.addEventListener('DOMContentLoaded', init);
})();
