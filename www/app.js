(function(){
'use strict';
const E=window.ChesszerdEngine;
let sel=-1,pc=0,ga=false,th='wood',st='neo',ac=null;
const AV=["👑","♛","🧠","♞","😈","♝"].map((e,i)=>'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23'+["e74c3c","3498db","2ecc71","f39c12","9b59b6","1abc9c"][i]+'"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="50"%3E'+e+'%3C/text%3E%3C/svg%3E');
const QT={ru:["Добро пожаловать в мою реальность.","Ты думаешь, что контролируешь доску?","Каждый твой ход ведёт к поражению.","Шахматы — отражение души.","Ты слаб.","Hogyoku эволюционирует.","Интересно... Ты сопротивляешься.","Твоя стратегия — пыль."],en:["Welcome.","Illusion.","Defeat.","Soul.","Weak.","Evolve.","Resist.","Dust."]};
function rq(){return(QT.ru||QT.en)[Math.floor(Math.random()*8)];}
function be(f,d=0.1){if(!ac)return;try{let o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.value=0.08;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+d);setTimeout(()=>o.stop(),d*1000+50);}catch(e){}}
function ps(p,c){const m={1:'♙',2:'♘',3:'♗',4:'♖',5:'♕',6:'♔'};let s=m[p]||'?';return c===1?s.toLowerCase():s;}
function rb(){
  let el=document.getElementById('chessboard');if(!el)return;el.innerHTML='';
  let b=E.board();
  for(let r=0;r<8;r++)for(let f=0;f<8;f++){
    let sq=r*8+f,p=b[sq],cell=document.createElement('div');
    cell.className='cell '+((r+f)%2===0?'light':'dark');cell.dataset.sq=sq;
    if(p!==0){let sp=document.createElement('span');sp.className='piece';sp.textContent=ps(p,E.pieceColorAt(sq));cell.appendChild(sp);}
    cell.addEventListener('click',()=>cl(sq));cell.addEventListener('touchstart',e=>{e.preventDefault();cl(sq);});
    el.appendChild(cell);
  }
  let qe=document.getElementById('aizen-quote');if(qe)qe.textContent=rq();
}
function cl(sq){
  if(!ga||E.sideToMove()!==pc)return;
  if(sel===-1){if(E.board()[sq]!==0&&E.pieceColorAt(sq)===pc)sel=sq;}
  else{
    let ms=E.generateMoves(pc).filter(m=>m.f===sel&&m.t===sq);
    if(ms.length>0){
      let cap=E.board()[sq]!==0||ms[0].ep;E.makeMove(ms[0]);
      be(cap?200:500,cap?0.2:0.1);sel=-1;rb();
      if(ga&&E.sideToMove()!==pc)setTimeout(ai,200);
    }else{if(E.board()[sq]!==0&&E.pieceColorAt(sq)===pc)sel=sq;else sel=-1;}
  }
}
function ai(){
  if(!ga)return;let bm=E.searchBestMove(4);
  if(bm){let cap=E.board()[bm.t]!==0||bm.ep;E.makeMove(bm);be(cap?180:400,cap?0.2:0.1);rb();cg();}
}
function cg(){
  if(E.generateMoves(E.sideToMove()).length===0){
    ga=false;let stm=E.sideToMove(),ks=-1,b=E.board();
    for(let i=0;i<64;i++)if(b[i]===6&&E.pieceColorAt(i)===stm){ks=i;break;}
    if(ks>=0){let at=E.generateMoves(1-stm).some(m=>m.t===ks);
      if(at){let pf=getP();if(stm!==pc){pf.w=(pf.w||0)+1;pf.el=Math.min(3000,(pf.el||1200)+25);E.onPlayerWin();}else{pf.l=(pf.l||0)+1;pf.el=Math.max(100,(pf.el||1200)-15);}saveP(pf);upP();}
    }be(300,0.5);
  }
}
function undo(){
  if(!ga||E.sideToMove()===pc)return;let h=E.gameHistory();if(!h.length)return;
  E.undoMove();if(h.length>1&&E.sideToMove()!==pc)E.undoMove();
  sel=-1;rb();
}
function getP(){let r=localStorage.getItem('cp');return r?JSON.parse(r):{n:'Игрок',a:0,el:1200,w:0,l:0};}
function saveP(p){localStorage.setItem('cp',JSON.stringify(p));}
function upP(){
  let p=getP(),ni=document.getElementById('username-input');if(ni)ni.value=p.n;
  let el=document.getElementById('elo');if(el)el.textContent=p.el;
  let wi=document.getElementById('wins');if(wi)wi.textContent=p.w;
  let lo=document.getElementById('losses');if(lo)lo.textContent=p.l;
  let gr=document.getElementById('profile-greeting');if(gr)gr.textContent=p.n;
  document.querySelectorAll('.avatar-img').forEach((im,i)=>im.classList.toggle('selected',i===p.a));
}
function bAv(){
  let g=document.getElementById('avatar-chooser');if(!g)return;g.innerHTML='';
  AV.forEach((u,i)=>{let d=document.createElement('div');d.className='avatar-img';d.style.backgroundImage=`url('${u}')`;d.addEventListener('click',()=>{let p=getP();p.a=i;saveP(p);upP();});g.appendChild(d);});
}
window.saveProfile=()=>{let ni=document.getElementById('username-input');if(!ni)return;let n=ni.value.trim();if(!n)return;let p=getP();p.n=n;saveP(p);upP();};
function swT(id){
  document.querySelectorAll('.tab-content').forEach(e=>e.style.display='none');
  let t=document.getElementById(id);if(t)t.style.display='block';
  document.querySelectorAll('.tab-btn').forEach(b=>{let l=b.textContent.trim();b.classList.toggle('active',(id==='tab-game'&&l==='Игра')||(id==='tab-profile'&&l==='Профиль')||(id==='tab-settings'&&l==='Стиль'));});
  if(id==='tab-profile')upP();
}
function apTh(theme){
  const ts={wood:{l:'#f0d9b5',d:'#b58863',a:'#c8a96e'},classic:{l:'#f0f0f0',d:'#7d7d7d',a:'#3498db'},night:{l:'#4a4a4a',d:'#1e1e1e',a:'#9b59b6'},neon:{l:'#1a1a2e',d:'#0f0f23',a:'#00ffcc'}};
  let t=ts[theme]||ts.wood,rt=document.documentElement;
  rt.style.setProperty('--cell-light',t.l);rt.style.setProperty('--cell-dark',t.d);rt.style.setProperty('--accent',t.a);
  th=theme;rb();
  document.querySelectorAll('#theme-selector .theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.theme===theme));
}
function apSt(style){st=style;rb();document.querySelectorAll('#style-selector .theme-btn').forEach(b=>b.classList.toggle('active',b.dataset.style===style));}
function bSt(){
  let ts=document.getElementById('theme-selector');if(ts){['wood','classic','night','neon'].forEach(t=>{let b=document.createElement('button');b.className='theme-btn';b.dataset.theme=t;b.textContent=t;b.addEventListener('click',()=>apTh(t));ts.appendChild(b);});}
  let ss=document.getElementById('style-selector');if(ss){['neo','standard','minimal'].forEach(s=>{let b=document.createElement('button');b.className='theme-btn';b.dataset.style=s;b.textContent=s;b.addEventListener('click',()=>apSt(s));ss.appendChild(b);});}
}
function init(){
  ac=new(window.AudioContext||window.webkitAudioContext)();E.reset();pc=0;ga=true;sel=-1;apTh('wood');apSt('neo');rb();swT('tab-game');bAv();bSt();upP();
  document.getElementById('btn-new-game')?.addEventListener('click',()=>{E.reset();ga=true;sel=-1;rb();});
}
window.ChesszerdApp={init,switchTab:swT,undoMove:undo,saveProfile:window.saveProfile};
document.addEventListener('DOMContentLoaded',init);
})();
