const G={t:['الدخول الملكي','Royal Entrance'],n:['الاسم','Name'],p:['الرمز السري','Passcode'],go:['دخول','Enter'],bad:['الاسم أو الرمز غير صحيح','Wrong name or passcode']},g=k=>G[k][lang==='ar'?0:1];
const norm=s=>String(s||'').trim().toLowerCase().replace(/[\u064B-\u065F\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,'');
const dig=s=>String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim();
let gerr='',gname='';
function gate(){$('app').innerHTML=`<div class="gate"><div class="card glow"><div class="row" style="justify-content:flex-end"><button class="chip" onclick="setLang()">${lang==='ar'?'EN':'عربي'}</button></div><h1>👑 ${g('t')}</h1>
<input id="gn" autocomplete="off" placeholder="${g('n')}" value="${esc(gname)}" onkeydown="event.key==='Enter'&&$('gp').focus()"><input id="gp" type="password" autocomplete="off" placeholder="${g('p')}" onkeydown="event.key==='Enter'&&login()">
<button class="gold" onclick="login()">${g('go')}</button><p class="err">${gerr}</p></div></div>`}
function login(){gname=$('gn').value;const n=norm(gname),p=dig($('gp').value),m=U=>U.names.some(x=>norm(x)===n)&&p===U.pass;
if(m(CFG.PRINCESS))enter('princess');else if(m(CFG.ADMIN))enter('admin');else{gerr=g('bad');gate()}}
function enter(r){sessionStorage.role=r;sessionStorage.view=r==='admin'?'admin':'princess';gerr='';boot()}
const setView=v=>{sessionStorage.view=v;boot()},logout=()=>{sessionStorage.clear();gname='';boot()};
function boot(){TM.forEach(clearInterval);TM=[];document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';const r=sessionStorage.role;
if(!r)return gate();if(r==='admin'&&sessionStorage.view!=='princess')drawAdmin();else render()}
window.addEventListener('hashchange',()=>sessionStorage.role&&sessionStorage.view!=='admin'&&render());boot();
