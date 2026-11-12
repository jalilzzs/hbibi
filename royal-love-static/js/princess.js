let lang=localStorage.lang||'ar',route='home',gid='',err='',gm='code';window.CUR='';let C={};const L=k=>C[k]||[];
let liveSettings = { battery_level: '100', popup_status: 'none' };
let settingsTimer = null;

const cloud=()=>!!CFG.SUPABASE_URL&&!/YOUR-/.test(CFG.SUPABASE_URL+CFG.SUPABASE_KEY);
async function sbFetch(path){
  const K=CFG.SUPABASE_KEY, U=CFG.SUPABASE_URL;
  if(!cloud()) return null;
  const h={apikey:K,Authorization:'Bearer '+K};
  const r=await fetch(`${U}/rest/v1/${path}`,{headers:h});
  if(!r.ok) return null;
  return await r.json();
}

async function loadPrincessContent(){
  let data = { start_date: '2024-01-01', next_date: '', next_label: 'موعدنا القادم' };
  const SEC_KEYS = ['notes','voice','songs','photos','phrases','poems','reasons','letters','quiz'];
  SEC_KEYS.forEach(k => data[k] = []);

  if(cloud()){
    try {
      const [settings, items] = await Promise.all([
        sbFetch('site_settings?select=*'),
        sbFetch('content_items?select=*')
      ]);
      if(settings && Array.isArray(settings)){
        settings.forEach(s => {
          data[s.key] = s.value;
          if(s.key === 'battery_level' || s.key === 'popup_status') {
            liveSettings[s.key] = s.value;
          }
        });
      }
      if(items && Array.isArray(items)){
        items.forEach(x => {
          if(data[x.section]){
            data[x.section].push({t: x.title||'', b: x.body||'', u: x.media_url||''});
          }
        });
      }
    } catch(e) {
      console.error('Error loading from cloud, falling back to local', e);
      let d = null;
      try{ d = JSON.parse(localStorage.getItem('draft')) }catch(err){}
      data = d || window.CONTENT || data;
    }
  } else {
    let d = null;
    try{ d = JSON.parse(localStorage.getItem('draft')) }catch(e){}
    data = d || window.CONTENT || data;
  }
  return data;
}

// دالة لجلب إعدادات البطارية واللوحات بشكل دوري (Real-time polling)
async function checkLiveSettings(){
  if(!cloud()) return;
  try{
    const settings = await sbFetch('site_settings?select=*');
    if(settings && Array.isArray(settings)){
      let changed = false;
      settings.forEach(s => {
        if((s.key === 'battery_level' || s.key === 'popup_status') && liveSettings[s.key] !== s.value){
          liveSettings[s.key] = s.value;
          changed = true;
        }
      });
      // إذا تغيرت الإعدادات من طرف الأدمن، نعيد تحديث الواجهة فوراً لتظهر اللوحة المطلوبة
      if(changed) {
        const overlayBox = $('royal-popup-overlay');
        if(overlayBox) {
          overlayBox.outerHTML = renderRoyalPopup();
        } else {
          render();
        }
      }
    }
  }catch(e){console.error('Settings sync error:', e);}
}

// توليد اللوحات التفاعلية الشفافة بناءً على طاقة البطارية أو تحكم الأمير
function renderRoyalPopup(){
  const bat = parseInt(liveSettings.battery_level || '100', 10);
  const status = liveSettings.popup_status || 'none';

  let popupHTML = '';

  // 1. إذا كانت البطارية 0%
  if(bat === 0 || status === 'dead_battery') {
    popupHTML = `
      <div style="background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); border:2px solid #e74c3c;">
        <h2 style="color:#e74c3c; font-size:1.8rem; margin-bottom:15px;">🪫 نفاذ الطاقة الملكية</h2>
        <p style="font-size:1.15rem; line-height:1.6; margin-bottom:20px;">سيتم إغلاق الموقع بواسطة الأمير لأن بطاريته نفدت تماماً... يرجى الانتظار حتى يعيد شحن طاقته الملكية ⚡</p>
        <div style="font-size:3rem;">👑💤</div>
      </div>`;
  } 
  // 2. إذا كانت البطارية بين 1% و 20%
  else if(bat > 0 && bat <= 20) {
    popupHTML = `
      <div style="background:rgba(20,10,15,0.85); backdrop-filter:blur(8px); border:2px solid #d4af37;">
        <h2 style="color:#d4af37; font-size:1.6rem; margin-bottom:15px;">⚠️ تحذير طاقة منخفضة (${bat}%)</h2>
        <p style="font-size:1.1rem; line-height:1.6; margin-bottom:20px;">إذا أردتِ فالأمير متشوق لرسالتك المليئة بالحب بعد تحطيمه 🙏🏽</p>
        <button class="gold" onclick="location.hash='#/chat'">إرسال رسالة حب الآن 💌</button>
      </div>`;
  } 
  // 3. لوحات تحكم الأدمن الخاصة
  else if(status === 'no_energy') {
    popupHTML = `
      <div style="background:rgba(15,10,20,0.85); backdrop-filter:blur(8px); border:2px solid #d4af37;">
        <h2 style="color:#d4af37; font-size:1.6rem; margin-bottom:15px;">👑 رسالة خاصة من الأمير</h2>
        <p style="font-size:1.1rem; line-height:1.6; margin-bottom:20px;">لا للأمير طاقة لاسعادك... ربما حان دورك يا أميرة لإسعاده اليوم 💕</p>
        <button class="gold" onclick="$('royal-popup-overlay').style.display='none'">حسناً فهمت 🙏🏽</button>
      </div>`;
  }
  else if(status === 'shame') {
    popupHTML = `
      <div style="background:rgba(25,10,10,0.85); backdrop-filter:blur(8px); border:2px solid #e74c3c;">
        <h2 style="color:#e74c3c; font-size:1.6rem; margin-bottom:15px;">🧐 عتاب ملكي</h2>
        <p style="font-size:1.1rem; line-height:1.6; margin-bottom:20px;">ألن تخجلي على نفسك؟ كل هذا من أجلك وأنتِ غارقة في الصمت! 🥺</p>
        <button class="gold" onclick="location.hash='#/chat'">اعتذري للأمير فوراً 💬</button>
      </div>`;
  }
  else if(status === 'out_of_service') {
    popupHTML = `
      <div style="background:rgba(10,10,10,0.9); backdrop-filter:blur(8px); border:2px solid #7f8c8d;">
        <h2 style="color:#bdc3c7; font-size:1.6rem; margin-bottom:15px;">🌙 خارج الخدمة</h2>
        <p style="font-size:1.1rem; line-height:1.6; margin-bottom:20px;">الموقع خارج الخدمة حالياً، اسألي الأمير عن أحواله وما يدور في ذهنه...</p>
        <button class="gold" onclick="location.hash='#/chat'">السؤال عن الأمير 💬</button>
      </div>`;
  }

  if(!popupHTML) return '';

  return `
    <div id="royal-popup-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; animation: fadeIn 0.3s ease;">
      <div style="max-width:420px; width:100%; padding:25px; border-radius:16px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.5); color:#fff; position:relative;">
        ${popupHTML}
      </div>
    </div>
  `;
}

const D={title:['عالم الأميرة إبتسام','Princess Ibtissam’s World'],gateT:['صاحبة الجلالة الأميرة إبتسام','Her Majesty Princess Ibtissam'],code:['🔑 الرمز','🔑 Code'],face:['📸 الوجه','📸 Face'],ph:['الرمز الملكي','Royal passcode'],enter:['دخول','Enter'],wrong:['رمز خاطئ','Wrong code'],exit:['خروج','Exit'],
together:['معًا منذ','Together for'],days:['يوم','days'],points:['نقاط الحب','Love points'],empty:['لا شيء هنا بعد 💌','Nothing here yet 💌'],back:['← رجوع','← Back'],camMsg:['انظري إلى الكاميرا 👑','Look at the camera 👑'],
home:['الرئيسية','Home'],notes:['رسائل حب','Love notes'],voice:['رسائل صوتية','Voice notes'],songs:['أغاني والكاريوكي','Songs'],photos:['الصور','Gallery'],phrases:['كلماتي','Catchphrases'],poems:['شعر','Poetry'],games:['ألعاب التحدي','Challenge Games'],baby:['البيبي','Baby'],
reasons:['أسباب أحبك','Reasons I love you'],letters:['افتحي عندما…','Open when…'],countdown:['العد التنازلي','Countdown'],mood:['مزاجي اليوم','My mood'],another:['سبب آخر 💖','Another 💖'],moodAsk:['كيف تشعرين الآن؟','How do you feel?'],sent:['وصلت لحبيبك 💌','Sent to your love 💌'],noDate:['لم يُحدَّد موعد','No date set'],girl:['👧 بنت','👧 Girl'],boy:['👦 ولد','👦 Boy'],left:['يوم متبقٍ','days left'],admin:['🛡️ لوحة الأمير','🛡️ Prince Dashboard'],cloud:['☁️ التقدم محفوظ والمحتوى مباشر','☁️ Live Cloud Sync'],loc:['💾 محفوظ محلياً','💾 Local mode'],chat:['💬 الشات المباشر','💬 Live Chat'],leaderboard:['🏆 لوحة الشرف','🏆 Leaderboard']};

const t=k=>D[k][lang==='ar'?0:1],ix=lang=>lang==='ar'?0:1;
const NAV=[['home','🏠'],['notes','💌'],['voice','🎙️'],['songs','🎵'],['photos','📷'],['phrases','💬'],['poems','📜'],['games','🎮'],['baby','👶'],['reasons','💖'],['letters','✉️'],['countdown','⏳'],['mood','🥰'],['chat','💬'],['leaderboard','🏆']];
const SPECIAL=['reasons','letters','countdown','mood','chat','leaderboard'];
const start=()=>C.start_date||'2024-01-01',days=()=>Math.max(0,(Date.now()-new Date(start()))/864e5);
const clk=()=>{const m=Date.now()-new Date(start());return`${Math.floor(m/36e5)%24}h ${Math.floor(m/6e4)%60}m ${Math.floor(m/1e3)%60}s`};
const cdDays=()=>C.next_date?Math.ceil((new Date(C.next_date)-Date.now())/864e5):null;

function stage(){const g=Prog.d.baby_gender==='girl',d=days(),st=[[0,['مولود','Newborn'],'👶'],[30,['رضيع','Baby'],'🍼'],[180,['طفل صغير','Toddler'],'🧒'],[365,['طفل','Kid'],g?'👧':'👦'],[730,['مراهق','Teen'],g?'👩‍🎤':'🧑‍🎤'],[1460,['كبير','Grown-up'],g?'👩':'👨']];const i=st.filter(x=>d>=x[0]).length-1,n=st[i+1];return{s:st[i],n,p:n?(d-st[i][0])/(n[0]-st[i][0])*100:100}}
const list=(k,f)=>L(k).length?L(k).map(f).join(''):`<p class="mut center">${t('empty')}</p>`;
const card=(x,ex)=>`<div class="card">${x.t?`<h3>${esc(x.t)}</h3>`:''}${ex||''}${x.b?`<p class="pre">${esc(x.b)}</p>`:''}</div>`;
const aud=x=>x.u?`<audio controls preload="none" src="${esc(x.u)}"></audio>`:'';

let princessChatMsgs = [];
async function loadPrincessChat(){
  if(!cloud()) return;
  try{
    const r = await sbFetch('chat_messages?select=*&order=created_at.asc');
    princessChatMsgs = r || [];
    const box = $('princess-chat-box');
    if(box){
      box.innerHTML = renderPrincessChatList();
      box.scrollTop = box.scrollHeight;
    }
  }catch(e){console.error('Chat load error:', e);}
}

function renderPrincessChatList(){
  if(!princessChatMsgs.length) return `<p class="mut center" style="padding:20px;">لا توجد رسائل بعد. تحدثي مع الأمير! 💌</p>`;
  return princessChatMsgs.map(m=>{
    const isPrincess = m.sender === 'princess';
    const name = isPrincess ? '👸 الأميرة' : '👑 الأمير جليل';
    const bg = isPrincess ? 'background: rgba(212, 175, 55, 0.15); border-color: rgba(212, 175, 55, 0.4);' : 'background: rgba(255, 255, 255, 0.08);';
    return `<div class="item" style="display:flex; flex-direction:column; margin-bottom:10px; padding:10px; border-radius:8px; ${bg}">
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; opacity:0.8; margin-bottom:4px;">
        <strong>${name}</strong>
        <small>${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
      </div>
      <div dir="auto" style="word-break: break-word; font-size:1.05rem;">${esc(m.message)}</div>
    </div>`;
  }).join('');
}

async function sendPrincessMessage(txt){
  if(!txt || !txt.trim() || !cloud()) return;
  try{
    const K=CFG.SUPABASE_KEY, U=CFG.SUPABASE_URL;
    await fetch(`${U}/rest/v1/chat_messages`, {
      method: 'POST',
      headers: {apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json'},
      body: JSON.stringify({ sender: 'princess', message: txt.trim() })
    });
    $('princess-chat-input').value = '';
    loadPrincessChat();
  }catch(e){alert('❌ خطأ في الإرسال: '+e.message);}
}

async function sendPrincessPost(section, body){
  if(!body || !body.trim() || !cloud()) return;
  try{
    const K=CFG.SUPABASE_KEY, U=CFG.SUPABASE_URL;
    const r = await fetch(`${U}/rest/v1/content_items`, {
      method: 'POST',
      headers: {apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json', Prefer: 'return=representation'},
      body: JSON.stringify({
        section: section,
        title: 'منشور من الأميرة 👑',
        body: body.trim(),
        media_url: ''
      })
    });
    if(!r.ok) throw new Error(await r.text());
    alert('✅ وصلت رسالتك إلى الأمير جليل بنجاح تام! 💌');
    render();
  }catch(e){
    alert('❌ خطأ أثناء النشر: '+e.message);
  }
}

let scoreData = [];
async function loadLeaderboardData(){
  if(!cloud()) return;
  try{
    const res = await sbFetch('game_scores?select=*');
    scoreData = res || [];
    const box = $('leaderboard-box');
    if(box) box.innerHTML = renderLeaderboardHTML();
  }catch(e){console.error('Leaderboard load error:', e);}
}

function renderLeaderboardHTML(){
  const prince = scoreData.find(x=>x.player==='prince') || {points:0, wins:0};
  const princess = scoreData.find(x=>x.player==='princess') || {points:0, wins:0};
  
  let winnerText = "🤝 التعادل سيد الموقف!";
  if(prince.points > princess.points) winnerText = "👑 الأمير جليل متصدر التحدي حالياً!";
  else if(princess.points > prince.points) winnerText = "👸 الأميرة ابتسام متصدرة التحدي حالياً!";

  return `
    <div style="text-align:center; margin-bottom:20px;">
      <h3 style="color:#d4af37; font-size:1.3rem;">🏆 لوحة الشرف والتحدي</h3>
      <p class="mut" style="margin-top:5px;">${winnerText}</p>
    </div>
    <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap; margin-bottom:20px;">
      <div class="card" style="flex:1; min-width:140px; text-align:center; background:rgba(212,175,55,0.1);">
        <h4>👑 الأمير (جليل)</h4>
        <p style="font-size:1.8rem; font-weight:bold; color:#d4af37;">${prince.points}</p>
        <small class="mut">نقاط التحدي</small>
      </div>
      <div class="card" style="flex:1; min-width:140px; text-align:center; background:rgba(255,255,255,0.05);">
        <h4>👸 الأميرة (ابتسام)</h4>
        <p style="font-size:1.8rem; font-weight:bold; color:#fff;">${princess.points}</p>
        <small class="mut">نقاط التحدي</small>
      </div>
    </div>
  `;
}

async function addGamePoints(points){
  try {
    if(typeof Prog !== 'undefined' && Prog.d){
      Prog.d.love_points = Math.max(0, (Prog.d.love_points || 0) + points);
      if(typeof Prog.save === 'function') Prog.save();
    }
    const role = sessionStorage.role || 'princess';
    const playerKey = (role === 'admin' || role === 'jalil') ? 'prince' : 'princess';
    if(cloud() && typeof CFG !== 'undefined'){
      const K = CFG.SUPABASE_KEY, U = CFG.SUPABASE_URL;
      const res = await fetch(`${U}/rest/v1/game_scores?player=eq.${playerKey}`, {headers:{apikey:K,Authorization:'Bearer '+K}});
      const data = await res.json();
      const currentPoints = (data && data.length > 0) ? (data[0].points || 0) : 0;
      const newTotal = Math.max(0, currentPoints + points);
      await fetch(`${U}/rest/v1/game_scores?player=eq.${playerKey}`, {
        method: 'PATCH',
        headers: {apikey:K, Authorization:'Bearer '+K, 'Content-Type':'application/json'},
        body: JSON.stringify({points: newTotal})
      });
    }
  }catch(e){console.error(e);}
}

const R_g = a => a[Math.random() * a.length | 0], sh_g = a => [...a].sort(() => Math.random() - .5);
const pts_g = n => { if(n !== 0) addGamePoints(n); return n; };
const end_g = (el, n, tx) => { el.innerHTML = `<div class="res"><h2>${tx}</h2><p>${n >= 0 ? '+' : ''}${n} 💎</p></div>`; };
const quiz_g = items => el => {
  const q = sh_g(typeof items === 'function' ? items() : items).slice(0, 5);
  let i = 0, s = 0;
  const go = () => {
    if(i >= q.length) return end_g(el, pts_g(Math.min(10, s * 2)), s + '/' + q.length);
    const [a, ...o] = q[i];
    el.innerHTML = `<h3>${esc(a)}</h3>` + sh_g(o).map(x => `<button class="opt">${esc(x)}</button>`).join('');
    el.querySelectorAll('.opt').forEach(b => {
      b.onclick = () => { if(b.textContent === o[0]) s++; i++; go(); };
    });
  };
  go();
};

const cards_g = (items, p = 1) => el => {
  const d = () => {
    el.innerHTML = `<div class="big-card">${esc(R_g(items))}</div><div class="row"><button id="n">🔄</button><button class="gold" id="ok">✅ +${p}</button></div>`;
    el.querySelector('#n').onclick = d;
    el.querySelector('#ok').onclick = function() { pts_g(p); this.disabled = true; };
  };
  d();
};

const GAMES = [
  ['loveq','💕','اختبار الحب','Love Quiz', quiz_g([['من يحب الآخر أكثر؟','نحن متساويان 💞','أنا 😏','أنتِ 😘']])],
  ['riddle','🧩','ألغاز','Riddles', quiz_g([['شيء يكبر كلما أخذت منه؟','الحفرة','الجبل','البحر'],['يمشي بلا أرجل؟','الوقت','الكرسي','الحجر']])],
  ['tf','✅','صح أم خطأ','True or False', quiz_g([['الشمس نجم؟','صح','خطأ'],['الحوت سمكة؟','خطأ','صح']])],
  ['dare','🔥','تحدّي','Daring Cards', cards_g(['أرسلي لي رسالة صوتية 🎙️','ارقصي ٣٠ ثانية 💃','قلّدي ضحكتي 😂'], 3)],
  ['truth','🤫','صراحة','Truth', cards_g(['ما أول شيء لفت انتباهك فيّ؟','ما أجمل لحظة جمعتنا؟'], 3)],
  ['hearts','❤️','اصطادي القلوب','Catch Hearts', el => {
    let n = 0, tm = 10;
    el.innerHTML = '<b id="hd"></b><div class="arena"><button class="hrt" id="hb">❤️</button></div>';
    const b = el.querySelector('#hb'), hd = el.querySelector('#hd');
    const mv = () => { b.style.left = Math.random() * 85 + '%'; b.style.top = Math.random() * 80 + '%'; };
    const u = () => hd.textContent = `⏱ ${tm} · ${n}`;
    mv(); u();
    b.onclick = () => { n++; mv(); };
    const i = iv(() => {
      tm--; u();
      if(tm <= 0) { clearInterval(i); end_g(el, pts_g(Math.min(10, n / 2 | 0)), n + ' 💖'); }
    }, 1000);
  }]
];

let chatTimer = null;
let lbTimer = null;

const V={
home:()=>{const st=stage(),c=cdDays();return`<div class="bento"><div class="tile hero span2"><small>${t('together')}</small><h2>${Math.floor(days())} ${t('days')}</h2><p id="clk">${clk()}</p></div>
<a class="tile accent" href="#/games"><i>💎</i><b class="pts">${Prog.d.love_points}</b><small>${t('points')}</small></a><a class="tile accent" href="#/baby"><i>${st.s[2]}</i><b>${esc(Prog.d.baby_name)}</b><small>${st.s[1][ix(lang)]}</small></a>
${NAV.slice(1).map(([k,i])=>`<a class="tile ${SPECIAL.includes(k)?'accent':''}" href="#/${k}"><i>${i}</i><b>${t(k)}</b>${k==='countdown'&&c!=null?`<small>${c} ${t('left')}</small>`:''}</a>`).join('')}</div>`},
notes:()=>list('notes',x=>card(x))+`<div class="card"><h3>💌 أضفي رسالة أو خاطرة للأمير</h3><textarea id="prince-note-input" rows="3" dir="auto" placeholder="اكتبي ما في قلبك..." style="width:100%; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:#fff; margin-bottom:10px;"></textarea><button class="gold" onclick="sendPrincessPost('notes', $('prince-note-input').value)">إرسال إلى الأمير 💌</button></div>`,
voice:()=>list('voice',x=>card(x,aud(x))),songs:()=>list('songs',x=>card(x,aud(x))),
photos:()=>L('photos').length?`<div class="pg">${L('photos').map(x=>`<div class="card" style="padding:8px;margin:0"><img loading="lazy" src="${esc(x.u)}" alt="">${x.t?`<p class="center">${esc(x.t)}</p>`:''}</div>`).join('')}</div>`:`<p class="mut center">${t('empty')}</p>`,
phrases:()=>list('phrases',x=>`<div class="big-card">${esc(x.b)}</div>`),poems:()=>list('poems',x=>card(x)),
letters:()=>list('letters',x=>`<details class="card"><summary><h3 style="display:inline">✉️ ${esc(x.t)}</h3></summary><p class="pre">${esc(x.b)}</p></details>`),
reasons:()=>{const r=L('reasons');return`<div class="card center"><div class="big-card" id="rs">${r.length?esc(R(r).b):t('empty')}</div><button class="gold" id="rb">${t('another')}</button></div>`},
baby:()=>{const s=stage(),g=Prog.d.baby_gender;return`<div class="card center"><div class="babe">${s.s[2]}</div><h2>${esc(Prog.d.baby_name)} · ${s.s[1][ix(lang)]}</h2><div class="bar"><i style="width:${s.p}%"></i></div><p class="mut">${s.n?`→ ${s.n[1][ix(lang)]} (${s.n[0]} ${t('days')})`:'💖'}</p>
<div class="row"><button class="chip ${g==='girl'?'on':''}" onclick="setBaby('girl')">${t('girl')}</button><button class="chip ${g==='boy'?'on':''}" onclick="setBaby('boy')">${t('boy')}</button></div><input id="bn" value="${esc(Prog.d.baby_name)}" onchange="setBaby('${g}',this.value)"></div>`},
games:()=>{
  if(gid){
    const g = GAMES.find(x=>x[0]===gid);
    const titleText = g ? (g[2+ix(lang)] || g[1]) : gid;
    return `<a class="chip" href="#/games">${t('back')}</a><div class="card"><h2>🎮 ${esc(titleText)} <small class="mut">💎 <span class="pts">${Prog.d.love_points}</span></small></h2><div id="gm" style="margin-top:15px; min-height:200px;"></div></div>`;
  }
  return `<p class="center">💎 <b class="pts">${Prog.d.love_points}</b></p>
  <div class="bento">
    ${GAMES.map(g=>`<a class="tile" href="#/games/${g[0]}"><i>${g[1]}</i><b>${g[2+ix(lang)]||g[1]}</b></a>`).join('')}
  </div>`;
},
countdown:()=>{const c=cdDays();return`<div class="card center hero"><h2>${esc(C.next_label||'')}</h2>${c==null?`<p>${t('noDate')}</p>`:`<h2 style="font-size:4rem">${Math.max(0,c)}</h2><p>${t('left')}</p>`}</div>`},
mood:()=>`<div class="card center"><h3>${t('moodAsk')}</h3><div class="row">${['😍','🥰','😊','🤗','😘','😴','😢','😡'].map(m=>`<button class="cell" onclick="sendMood('${m}')">${m}</button>`).join('')}</div><p id="ms" class="mut"></p></div>`,
chat:()=>`<div class="card"><h3>💬 المحادثة الحية مع الأمير جليل · Live Chat</h3>
<div id="princess-chat-box" style="max-height:350px; overflow-y:auto; margin-bottom:15px; padding-right:5px;">${renderPrincessChatList()}</div>
<div style="display:flex; gap:10px;">
  <input id="princess-chat-input" dir="auto" type="text" placeholder="اكتبي رسالة إلى الأمير..." style="flex:1; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:#fff;" onkeydown="if(event.key==='Enter') sendPrincessMessage(this.value)">
  <button class="gold" onclick="sendPrincessMessage($('princess-chat-input').value)">إرسال ✉️</button>
</div></div>`,
leaderboard:()=>`<div class="card"><div id="leaderboard-box">${renderLeaderboardHTML()}</div></div>`};

const setBaby=(g,n)=>{Prog.baby(g,n||$('bn').value);render()},sendMood=m=>{Prog.mood(m);$('ms').textContent=t('sent')};

const B={
  reasons(){const r=L('reasons');if($('rb')&&r.length)$('rb').onclick=()=>{if(r.length)$('rs').textContent=R(r).b}},
  games(){
    window.CUR=gid;
    if(gid){
      const found = GAMES.find(x=>x[0]===gid);
      const gmEl = $('gm');
      if(found && typeof found[4] === 'function' && gmEl){
        found[4](gmEl);
      }
    }
  }
};

Prog.onchange=()=>document.querySelectorAll('.pts').forEach(e=>e.textContent=Prog.d.love_points);

function shell(body){
  // مؤشر البطارية الملكية يظهر في الهيدر
  const bat = parseInt(liveSettings.battery_level || '100', 10);
  const batColor = bat <= 20 ? '#e74c3c' : '#2ecc71';

  return`${renderRoyalPopup()}
<div class="wrap"><header><h1>👑 ${t('title')}</h1><div class="row">
<span class="chip" style="border-color:${batColor}; color:${batColor};">🔋 ${bat}%</span>
<button class="chip" onclick="setLang()">${lang==='ar'?'EN':'عربي'}</button><button class="chip" onclick="logout()">${t('exit')}</button></div></header>
${Prog.err?`<div class="card err" style="padding:8px;font-size:.85rem">⚠️ ${esc(Prog.err)}</div>`:''}<nav class="chips">${NAV.map(([k,i])=>`<a class="chip ${route===k?'on':''}" href="#/${k}">${i} ${t(k)}</a>`).join('')}</nav>${body}
<footer><a href="#/home">🏠 ${t('home')}</a><a href="#/games">🎮 ${t('games')}</a><a href="#/notes">💌 ${t('notes')}</a><p class="mut">${cloud()?t('cloud'):t('loc')}</p></footer></div>`;
}

async function render(){
  TM.forEach(clearInterval);TM=[];
  C = await loadPrincessContent();
  window.ACTIVE=C;
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  document.title=t('title');
  const hashParts = location.hash.slice(2).split('/');
  route = hashParts[0] || 'home';
  gid = hashParts[1] || '';
  if(route!=='games')window.CUR='';
  
  if(route === 'chat'){
    loadPrincessChat();
    if(!chatTimer) chatTimer = setInterval(loadPrincessChat, 3000);
  } else {
    if(chatTimer){ clearInterval(chatTimer); chatTimer = null; }
  }

  if(route === 'leaderboard'){
    loadLeaderboardData();
    if(!lbTimer) lbTimer = setInterval(loadLeaderboardData, 4000);
  } else {
    if(lbTimer){ clearInterval(lbTimer); lbTimer = null; }
  }

  // تفعيل الاستماع الفوري لتحديثات البطارية واللوحات كل 3 ثوانٍ
  if(!settingsTimer){
    settingsTimer = setInterval(checkLiveSettings, 3000);
  }

  const appEl = $('app');
  if(appEl) appEl.innerHTML = shell(V[route]?V[route]():V.home());
  
  if(B[route]) B[route]();
  if(route==='home')iv(()=>{const c=$('clk');c&&(c.textContent=clk())},1000);
}

function setLang(){lang=lang==='ar'?'en':'ar';localStorage.lang=lang;render()}
