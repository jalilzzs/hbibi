const G={t:['الدخول الملكي','Royal Entrance'],n:['الاسم','Name'],p:['الرمز السري','Passcode'],go:['دخول','Enter'],bad:['الاسم أو الرمز غير صحيح','Wrong name or passcode']},g=k=>G[k][lang==='ar'?0:1];
const norm=s=>String(s||'').trim().toLowerCase().replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,'');
const dig=s=>String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim();
let gerr='',gname='';

function gate(){
  const appEl = $('app');
  if(!appEl) return;
  appEl.innerHTML=`<div class="gate"><div class="card glow"><div class="row" style="justify-content:flex-end"><button class="chip" onclick="setLang()">${lang==='ar'?'EN':'عربي'}</button></div><h1>👑 ${g('t')}</h1>
<input id="gn" autocomplete="off" placeholder="${g('n')}" value="${esc(gname)}" onkeydown="event.key==='Enter'&&$('gp').focus()"><input id="gp" type="password" autocomplete="off" placeholder="${g('p')}" onkeydown="event.key==='Enter'&&login()">
<button class="gold" onclick="login()">${g('go')}</button><p class="err">${gerr}</p></div></div>`;
}

function login(){
  const gnInput = $('gn');
  const gpInput = $('gp');
  if(gnInput) gname = gnInput.value;
  const n=norm(gname), p=dig(gpInput?gpInput.value:''), m=U=>U.names.some(x=>norm(x)===n)&&p===U.pass;
  if(window.CFG && window.CFG.PRINCESS && m(window.CFG.PRINCESS)) enter('princess');
  else if(window.CFG && window.CFG.ADMIN && m(window.CFG.ADMIN)) enter('admin');
  else { gerr=g('bad'); gate(); }
}

function enter(r){
  sessionStorage.role=r;
  sessionStorage.view=r==='admin'?'admin':'princess';
  gerr='';
  boot();
}

const setView=v=>{sessionStorage.view=v;boot();},
      logout=()=>{sessionStorage.clear();gname='';boot();};

function boot(){
  if(typeof TM !== 'undefined' && Array.isArray(TM)){ TM.forEach(clearInterval); TM=[]; }
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  const r=sessionStorage.role;
  if(!r) return gate();
  if(r==='admin' && sessionStorage.view!=='princess'){
    if(typeof drawAdmin === 'function') drawAdmin();
  } else {
    if(typeof render === 'function') render();
  }
}

window.addEventListener('hashchange',()=>{
  if(sessionStorage.role && sessionStorage.view!=='admin'){
    if(typeof render === 'function') render();
  }
});

// التشغيل التلقائي عند تحميل الملف
window.addEventListener('DOMContentLoaded', () => {
  boot();
});
