const G={
  t:['الدخول الملكي · Royal Gate','Royal Entrance'],
  n:['الاسم (جليل أو ابتسام)','Name (Jalil or Ibtissam)'],
  p:['الرمز السري','Passcode'],
  go:['دخول','Enter'],
  bad:['الاسم أو الرمز غير صحيح، حاول مجدداً','Wrong name or passcode, try again']
};
const g=k=>G[k][lang==='ar'?0:1];
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
  const n = norm(gname);
  const p = dig(gpInput ? gpInput.value : '');

  // 1. دخول الأمير جليل بصفحته الخاصة عبر الرمز 080314
  if(p === '080314'){
    enter('jalil', 'jalil');
  } 
  // 2. دخول الأدمن بالرمز القديم لوحة التحكم
  else if(window.CFG && p === window.CFG.ADMIN.pass){
    enter('admin', 'admin');
  } 
  // 3. دخول الأميرة ابتسام
  else if(window.CFG && window.CFG.PRINCESS.names.some(x=>norm(x)===n) && p === window.CFG.PRINCESS.pass){
    enter('princess', 'princess');
  } 
  else {
    gerr = g('bad');
    gate();
  }
}

function enter(role, view){
  sessionStorage.role = role;
  sessionStorage.view = view;
  gerr = '';
  boot();
}

const setView = v => { sessionStorage.view = v; boot(); },
      logout = () => { sessionStorage.clear(); gname = ''; boot(); };

function boot(){
  if(typeof TM !== 'undefined' && Array.isArray(TM)){ TM.forEach(clearInterval); TM=[]; }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang==='ar'?'rtl':'ltr';
  const role = sessionStorage.role;
  const view = sessionStorage.view;

  if(!role) return gate();
  
  if(role === 'admin' || view === 'admin'){
    if(typeof drawAdmin === 'function') drawAdmin();
  } else if(role === 'jalil' || view === 'jalil'){
    if(typeof renderJalil === 'function') renderJalil();
  } else {
    if(typeof render === 'function') render();
  }
}

window.addEventListener('hashchange', () => {
  if(sessionStorage.role && sessionStorage.view !== 'admin' && sessionStorage.view !== 'jalil'){
    if(typeof render === 'function') render();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  boot();
});
