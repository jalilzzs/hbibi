let jalilLang = localStorage.lang || 'ar', jalilRoute = 'home', jalilGid = '';
let jalilContent = {};
const JL = k => jalilContent[k] || [];

async function loadJalilContent(){
  let data = { start_date: '2024-01-01', next_date: '', next_label: 'موعدنا القادم' };
  const SEC_KEYS = ['notes','voice','songs','photos','phrases','poems','reasons','letters','quiz'];
  SEC_KEYS.forEach(k => data[k] = []);
  if(cloud()){
    try {
      const [settings, items] = await Promise.all([
        sbFetch('site_settings?select=*'),
        sbFetch('content_items?select=*')
      ]);
      if(settings && Array.isArray(settings)) settings.forEach(s => data[s.key] = s.value);
      if(items && Array.isArray(items)) items.forEach(x => {
        if(data[x.section]) data[x.section].push({t: x.title||'', b: x.body||'', u: x.media_url||''});
      });
    } catch(e){ console.error(e); }
  }
  return data;
}

// تشات خاص بالأمير جليل
let jalilChatMsgs = [];
async function loadJalilChat(){
  if(!cloud()) return;
  try{
    const r = await sbFetch('chat_messages?select=*&order=created_at.asc');
    jalilChatMsgs = r || [];
    const box = $('jalil-chat-box');
    if(box){
      box.innerHTML = renderJalilChatList();
      box.scrollTop = box.scrollHeight;
    }
  }catch(e){console.error(e);}
}

function renderJalilChatList(){
  if(!jalilChatMsgs.length) return `<p class="mut center" style="padding:20px;">لا توجد رسائل بعد. راسل الأميرة ابتسام! 💌</p>`;
  return jalilChatMsgs.map(m=>{
    const isPrince = m.sender === 'prince';
    const name = isPrince ? '👑 الأمير جليل' : '👸 الأميرة ابتسام';
    const bg = isPrince ? 'background: rgba(212, 175, 55, 0.15); border-color: rgba(212, 175, 55, 0.4);' : 'background: rgba(255, 255, 255, 0.08);';
    return `<div class="item" style="display:flex; flex-direction:column; margin-bottom:10px; padding:10px; border-radius:8px; ${bg}">
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; opacity:0.8; margin-bottom:4px;">
        <strong>${name}</strong>
        <small>${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
      </div>
      <div dir="auto" style="word-break: break-word; font-size:1.05rem;">${esc(m.message)}</div>
    </div>`;
  }).join('');
}

async function sendJalilMessage(txt){
  if(!txt || !txt.trim() || !cloud()) return;
  try{
    const K=CFG.SUPABASE_KEY, U=CFG.SUPABASE_URL;
    await fetch(`${U}/rest/v1/chat_messages`, {
      method: 'POST',
      headers: {apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json'},
      body: JSON.stringify({ sender: 'prince', message: txt.trim() })
    });
    $('jalil-chat-input').value = '';
    loadJalilChat();
  }catch(e){alert('❌ خطأ: '+e.message);}
}

// لوحة الشرف والنقاط من صفحة الأمير
let jalilScores = [];
async function loadJalilScores(){
  if(!cloud()) return;
  try{
    const res = await sbFetch('game_scores?select=*');
    jalilScores = res || [];
    const box = $('jalil-lb-box');
    if(box) box.innerHTML = renderJalilLBHTML();
  }catch(e){console.error(e);}
}

async function jalilAddPoint(player, pts){
  try{
    const cur = jalilScores.find(x=>x.player===player) || {points:0};
    const newP = Math.max(0, cur.points + pts);
    const K=CFG.SUPABASE_KEY, U=CFG.SUPABASE_URL;
    await fetch(`${U}/rest/v1/game_scores?player=eq.${player}`, {
      method: 'PATCH',
      headers: {apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json'},
      body: JSON.stringify({ points: newP })
    });
    loadJalilScores();
  }catch(e){alert('خطأ: '+e.message);}
}

function renderJalilLBHTML(){
  const prince = jalilScores.find(x=>x.player==='prince') || {points:0};
  const princess = jalilScores.find(x=>x.player==='princess') || {points:0};
  return `
    <div style="text-align:center; margin-bottom:20px;">
      <h3 style="color:#d4af37;">🏆 لوحة الشرف وتحدي الأمير والأميرة</h3>
      <p class="mut">تحكم في النقاط ونافس الأميرة ابتسام!</p>
    </div>
    <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap;">
      <div class="card" style="flex:1; min-width:160px; text-align:center; background:rgba(212,175,55,0.1);">
        <h4>👑 الأمير جليل</h4>
        <p style="font-size:2rem; font-weight:bold; color:#d4af37;">${prince.points}</p>
        <div style="display:flex; gap:5px; justify-content:center; margin-top:10px;">
          <button class="chip" onclick="jalilAddPoint('prince', 1)">➕ نقطة</button>
          <button class="chip" onclick="jalilAddPoint('prince', -1)">➖ نقطة</button>
        </div>
      </div>
      <div class="card" style="flex:1; min-width:160px; text-align:center; background:rgba(255,255,255,0.05);">
        <h4>👸 الأميرة ابتسام</h4>
        <p style="font-size:2rem; font-weight:bold; color:#fff;">${princess.points}</p>
        <div style="display:flex; gap:5px; justify-content:center; margin-top:10px;">
          <button class="chip" onclick="jalilAddPoint('princess', 1)">➕ نقطة</button>
          <button class="chip" onclick="jalilAddPoint('princess', -1)">➖ نقطة</button>
        </div>
      </div>
    </div>
  `;
}

let jalilTimer = null;
let jalilLbTimer = null;

const JALIL_NAV=[['home','🏠 الرئيسية'],['chat','💬 الشات المباشر'],['leaderboard','🏆 لوحة الشرف'],['games','🎮 الألعاب']];

const JV={
  home:()=>`<div class="card center"><h2>👑 مرحباً بك يا سمو الأمير جليل</h2><p class="mut">هذه صفحتك الخاصة لإدارة التحدي، متابعة ابتسام، والدردشة معها مباشرة.</p><div class="row" style="justify-content:center; margin-top:20px;"><span style="color:#2ecc71; font-weight:bold;">🟢 متصل الآن (Online)</span></div></div>`,
  chat:()=>`<div class="card"><h3>💬 الشات المباشر مع الأميرة ابتسام</h3>
  <div id="jalil-chat-box" style="max-height:350px; overflow-y:auto; margin-bottom:15px; padding-right:5px;">${renderJalilChatList()}</div>
  <div style="display:flex; gap:10px;">
    <input id="jalil-chat-input" dir="auto" type="text" placeholder="اكتب رسالة إلى ابتسام..." style="flex:1; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:#fff;" onkeydown="if(event.key==='Enter') sendJalilMessage(this.value)">
    <button class="gold" onclick="sendJalilMessage($('jalil-chat-input').value)">إرسال ✉️</button>
  </div></div>`,
  leaderboard:()=>`<div class="card"><div id="jalil-lb-box">${renderJalilLBHTML()}</div></div>`,
  games:()=>`<div class="card center"><h3>🎮 الألعاب والتحديات</h3><p class="mut">قريباً يتم ربط الألعاب لتلعبها مباشرة هنا وتكسب النقاط أنت وابتسام!</p></div>`
};

function jalilShell(body){
  const r = jalilRoute || 'home';
  return `<div class="wrap"><header><h1>👑 واجهة الأمير جليل</h1><div class="row"><button class="chip" onclick="sessionStorage.clear(); boot();">خروج · Exit</button></div></header>
  <nav class="chips">${JALIL_NAV.map(([k,l])=>`<a class="chip ${r===k?'on':''}" href="javascript:jalilRoute='${k}';renderJalil()">${l}</a>`).join('')}</nav>
  ${body}
  <footer><a href="javascript:setView('admin')">🛡️ لوحة الأدمن</a><a href="javascript:jalilRoute='home';renderJalil()">🏠 الرئيسية</a><p class="mut">🟢 النظام متصل بالسحاب</p></footer></div>`;
}

async function renderJalil(){
  if(jalilTimer){ clearInterval(jalilTimer); jalilTimer = null; }
  if(jalilLbTimer){ clearInterval(jalilLbTimer); jalilLbTimer = null; }

  jalilContent = await loadJalilContent();
  document.documentElement.dir='rtl';

  if(jalilRoute === 'chat'){
    loadJalilChat();
    jalilTimer = setInterval(loadJalilChat, 3000);
  }
  if(jalilRoute === 'leaderboard'){
    loadJalilScores();
    jalilLbTimer = setInterval(loadJalilScores, 4000);
  }

  const viewFn = JV[jalilRoute] || JV.home;
  $('app').innerHTML = jalilShell(viewFn());
}

window.renderJalil = renderJalil;
window.jalilAddPoint = jalilAddPoint;
