(function(){
'use strict';
const N=0,P=1,Nt=2,B=3,R=4,Q=5,K=6, W=0,Bk=1;
let b=new Array(64).fill(N);
let c=new Array(64).fill(W);
let stm=W, cr=15, ep=-1, hmc=0, fmn=1, h=[];
function on(sq){return sq>=0&&sq<64;}
function fl(sq){return sq&7;}
function rk(sq){return sq>>3;}
function go(coll){
  let m=[], opp=1-coll, pd=coll===W?-8:8, sr=coll===W?6:1, pr=coll===W?0:7;
  for(let s=0;s<64;s++){
    if(b[s]===N||c[s]!==coll)continue;
    let p=b[s];
    if(p===P){
      let fw=s+pd;
      if(on(fw)&&b[fw]===N){
        if(rk(fw)===pr)for(let x of[Q,R,B,Nt])m.push({f:s,t:fw,pr:x});
        else{m.push({f:s,t:fw});let db=s+2*pd;if(rk(s)===sr&&on(db)&&b[db]===N)m.push({f:s,t:db});}
      }
      for(let d of[pd-1,pd+1]){
        let cs=s+d;if(!on(cs))continue;
        if(fl(cs)===fl(s)-1||fl(cs)===fl(s)+1){
          if((b[cs]!==N&&c[cs]===opp)||cs===ep){
            if(rk(cs)===pr)for(let x of[Q,R,B,Nt])m.push({f:s,t:cs,pr:x,ep:cs===ep});
            else m.push({f:s,t:cs,ep:cs===ep});
          }
        }
      }
    }else if(p===Nt){
      for(let d of[-17,-15,-10,-6,6,10,15,17]){
        let t=s+d;if(!on(t))continue;
        if(Math.abs(fl(t)-fl(s))<=2)if(b[t]===N||c[t]===opp)m.push({f:s,t});
      }
    }else if(p===B||p===R||p===Q){
      let dirs=p===B?[-9,-7,7,9]:p===R?[-8,8,-1,1]:[-9,-8,-7,-1,1,7,8,9];
      for(let d of dirs){
        let t=s+d;
        while(on(t)){
          let df=Math.abs(fl(t)-fl(t-d));
          if((d===-9||d===-7||d===7||d===9)&&df>1)break;
          if(b[t]===N){m.push({f:s,t});}
          else{if(c[t]===opp)m.push({f:s,t});break;}
          t+=d;
        }
      }
    }else if(p===K){
      for(let d of[-9,-8,-7,-1,1,7,8,9]){
        let t=s+d;if(!on(t))continue;
        if(Math.abs(fl(t)-fl(s))<=1)if(b[t]===N||c[t]===opp)m.push({f:s,t});
      }
      if(coll===W&&s===60){
        if((cr&1)&&b[61]===N&&b[62]===N&&b[63]===R&&c[63]===W)m.push({f:60,t:62,cs:true});
        if((cr&2)&&b[59]===N&&b[58]===N&&b[57]===N&&b[56]===R&&c[56]===W)m.push({f:60,t:58,cs:true});
      }else if(coll===Bk&&s===4){
        if((cr&4)&&b[5]===N&&b[6]===N&&b[7]===R&&c[7]===Bk)m.push({f:4,t:6,cs:true});
        if((cr&8)&&b[3]===N&&b[2]===N&&b[1]===N&&b[0]===R&&c[0]===Bk)m.push({f:4,t:2,cs:true});
      }
    }
  }
  return m;
}
function mk(mv){
  mv.pcr=cr; mv.pep=ep; mv.phmc=hmc; mv.cap=b[mv.t];
  b[mv.t]=b[mv.f]; c[mv.t]=c[mv.f]; b[mv.f]=N;
  if(mv.pr)b[mv.t]=mv.pr;
  if(mv.ep){let cp=mv.t+(stm===W?8:-8);b[cp]=N;}
  if(mv.cs){
    if(mv.t===62){b[61]=R;c[61]=W;b[63]=N;}
    else if(mv.t===58){b[59]=R;c[59]=W;b[56]=N;}
    else if(mv.t===6){b[5]=R;c[5]=Bk;b[7]=N;}
    else if(mv.t===2){b[3]=R;c[3]=Bk;b[0]=N;}
  }
  ep=-1;
  if(b[mv.t]===P&&Math.abs(rk(mv.t)-rk(mv.f))===2)ep=mv.t+(stm===W?8:-8);
  hmc=(b[mv.t]===P||mv.cap!==N)?0:hmc+1;
  stm=1-stm;if(stm===W)fmn++;h.push(mv);
}
function um(){
  if(!h.length)return;let mv=h.pop();
  b[mv.f]=b[mv.t];c[mv.f]=c[mv.t];b[mv.t]=mv.cap||N;
  if(mv.cap)c[mv.t]=1-stm;
  cr=mv.pcr;ep=mv.pep;hmc=mv.phmc;stm=1-stm;if(stm===W)fmn--;
}
function ev(){
  let v={1:100,2:320,3:330,4:500,5:900,6:20000},s=0;
  for(let i=0;i<64;i++)if(b[i]!==N)s+=(c[i]===W?1:-1)*(v[b[i]]||0);
  return stm===W?s:-s;
}
function isAt(sq,by){return go(by).some(m=>m.t===sq);}
function ab(d,a,bt){
  if(d===0)return ev();
  let ms=go(stm);if(!ms.length){
    for(let i=0;i<64;i++)if(b[i]===K&&c[i]===stm)return isAt(i,1-stm)?-99999:0;
    return 0;
  }
  for(let mv of ms){mk(mv);let sc=-ab(d-1,-bt,-a);um();if(sc>=bt)return bt;if(sc>a)a=sc;}
  return a;
}
function best(d=4){
  let ms=go(stm);if(!ms.length)return null;
  let bm=null,bs=-Infinity;
  for(let mv of ms){mk(mv);let sc=-ab(d-1,-Infinity,-bs);um();if(sc>bs||(sc===bs&&Math.random()>0.5)){bs=sc;bm=mv;}}
  return bm;
}
window.ChesszerdEngine={
  board:()=>b,pieceColorAt:(s)=>c[s],sideToMove:()=>stm,
  generateMoves:go,makeMove:mk,undoMove:um,searchBestMove:best,
  gameHistory:()=>h,
  reset:()=>{
    b=new Array(64).fill(N);c=new Array(64).fill(W);
    for(let i=8;i<16;i++){b[i]=P;c[i]=Bk;}
    for(let i=48;i<56;i++){b[i]=P;c[i]=W;}
    b[0]=R;c[0]=Bk;b[1]=Nt;c[1]=Bk;b[2]=B;c[2]=Bk;b[3]=Q;c[3]=Bk;b[4]=K;c[4]=Bk;b[5]=B;c[5]=Bk;b[6]=Nt;c[6]=Bk;b[7]=R;c[7]=Bk;
    b[56]=R;c[56]=W;b[57]=Nt;c[57]=W;b[58]=B;c[58]=W;b[59]=Q;c[59]=W;b[60]=K;c[60]=W;b[61]=B;c[61]=W;b[62]=Nt;c[62]=W;b[63]=R;c[63]=W;
    stm=W;cr=15;ep=-1;hmc=0;fmn=1;h=[];
  },
  onPlayerWin:()=>{}
};
ChesszerdEngine.reset();
})();
