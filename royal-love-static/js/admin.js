const SEC=[['notes','💌','رسائل حب · Love notes',['t','b']],['voice','🎙️','رسائل صوتية · Voice notes',['t','u']],['songs','🎵','أغاني (+كلمات) · Songs',['t','u','b']],['photos','📷','صور · Photos',['t','u']],['phrases','💬','كلماتي · Catchphrases',['b']],['poems','📜','شعر · Poetry',['t','b']],['reasons','💖','أسباب أحبك · Reasons',['b']],['letters','✉️','افتحي عندما · Open when',['t','b']],['quiz','💕','أسئلة اختبار الحب · Love quiz',['t','b']]];
const FL={t:'العنوان · Title',b:'النص · Text',u:'رابط أو مسار الملف · URL / path'};
const EMPTY={start_date:'2024-01-01',next_date:'',next_label:'موعدنا القادم'};SEC.forEach(s=>EMPTY[s[0]]=[]);
let AC=null,tab='content',msg='',FILES=[],ups=[],chatMessages=[],scoreData=[];
let chatInterval=null, adminLbTimer=null;

const isCloud=()=>!!CFG.SUPABASE_URL&&!/YOUR-/.test(CFG.SUPABASE_URL+CFG.SUPABASE_KEY);
const safe=n=>n.replace(/[^\w.\-]/g,'_');

// دالة الاتصال المباشر بـ Supabase REST API
async function sbReq(path, method='GET', body=null){
  const K=CFG.SUPABASE_KEY, U=CFG.SUPABASE_URL;
  if(!isCloud()) throw new Error('Supabase not configured');
  const h={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=representation'};
  const r=await fetch(`${U}/rest/v1/${path}`,{method,headers:h,body:body?JSON.stringify(body):null});
  if(!r.ok) throw new Error(await r.text());
  const txt=await r.text();
  return txt?JSON.parse(txt):null;
}

// تحميل البيانات مباشرة من Supabase عند فتح الأدمن
async function loadFromDB(){
  try{
    const settings = await sbReq('site_settings?select=*');
    const items = await sbReq('content_items?select=*');
    let data = Object.assign({}, EMPTY);
    if(settings) settings.forEach(s=>data[s.key]=s.value);
    SEC.forEach(([k])=>{
      data[k] = items.filter(x=>x.section===k).map(x=>({t:x.title||'',b:x.body||'',u:x.media_url||''}));
    });
    AC = data;
  }catch(e){
    msg='⚠️ Failed to load from DB: '+e.message;
    AC = Object.assign({}, EMPTY, JSON.parse(JSON.stringify(window.CONTENT||{})));
  }
}

// جلب رسائل الشات
async function loadChatMessages(){
  try{
    const msgs = await sbReq('chat_messages?select=*&order=created_at.asc');
    chatMessages = msgs || [];
    if(tab === 'chat') {
      const box = $('chat-box-content');
      if(box) {
        box.innerHTML = renderChatList();
        box.scrollTop = box.scrollHeight;
      }
    }
  }catch(e){
    console.error('Chat load error:', e);
  }
}

// إرسال رسالة من الأمير
async function sendAdminMessage(txt){
  if(!txt || !txt.trim()) return;
  try{
    await sbReq('chat_messages', 'POST', {
      sender: 'prince',
      message: txt.trim()
    });
    $('chat-input').value = '';
    loadChatMessages();
  }catch(e){
    alert('❌ خطأ في الإرسال: ' + e.message);
  }
}

// جلب نقاط لوحة الشرف للأدمن
async function loadAdminLeaderboard(){
  if(!isCloud()) return;
  try{
    const res = await sbReq('game_scores?select=*');
    scoreData = res || [];
    const box = $('admin-leaderboard-box');
    if(box) box.innerHTML = renderAdminLeaderboardHTML();
  }catch(e){console.error('Leaderboard load error:', e);}
}

// تعديل النقاط يدوياً من طرف الأمير إذا اقتضى الأمر
async function updateScore(player, pointsChange){
  try{
    const current = scoreData.find(x=>x.player===player) || {points:0, wins:0};
    const newPoints = Math.max(0, current.points + pointsChange);
    await sbReq(`game_scores?player=eq.${player}`, 'PATCH', { points: newPoints });
    loadAdminLeaderboard();
  }catch(e){alert('❌ خطأ في تحديث النقاط: '+e.message);}
}

function renderAdminLeaderboardHTML(){
  const prince = scoreData.find(x=>x.player==='prince') || {points:0, wins:0};
  const princess = scoreData.find(x=>x.player==='princess') || {points:0, wins:0};
  
  let winnerText = "🤝 التعادل سيد الموقف!";
  if(prince.points > princess.points) winnerText = "👑 الأمير متصدر التحدي حالياً!";
  else if(princess.points > prince.points) winnerText = "👸 الأميرة متصدرة التحدي حالياً!";

  return `
    <div style="text-align:center; margin-bottom:20px;">
      <h3 style="color:#d4af37; font-size:1.3rem;">🏆 لوحة الشرف وتحدي النقاط</h3>
      <p class="mut" style="margin-top:5px;">${winnerText}</p>
    </div>
    <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap; margin-bottom:20px;">
      <div class="card" style="flex:1; min-width:180px; text-align:center; background:rgba(212,175,55,0.1);">
        <h4>👑 الأمير (جليل)</h4>
        <p style="font-size:2rem; font-weight:bold; color:#d4af37; margin:10px 0;">${prince.points}</p>
        <div style="display:flex; gap:5px; justify-content:center;">
          <button class="chip" onclick="updateScore('prince', 1)">➕ نقطة</button>
          <button class="chip" onclick="updateScore('prince', -1)">➖ نقطة</button>
        </div>
      </div>
      <div class="card" style="flex:1; min-width:180px; text-align:center; background:rgba(255,255,255,0.05);">
        <h4>👸 الأميرة (ابتسام)</h4>
        <p style="font-size:2rem; font-weight:bold; color:#fff; margin:10px 0;">${princess.points}</p>
        <div style="display:flex; gap:5px; justify-content:center;">
          <button class="chip" onclick="updateScore('princess', 1)">➕ نقطة</button>
          <button class="chip" onclick="updateScore('princess', -1)">➖ نقطة</button>
        </div>
      </div>
    </div>
  `;
}

async function upload(f){const K=CFG.SUPABASE_KEY,B=CFG.SUPABASE_BUCKET||'media',p=Date.now()+'_'+safe(f.name),h={apikey:K,'Content-Type':f.type||'application/octet-stream'};if(K.startsWith('eyJ'))h.Authorization='Bearer '+K;
const r=await fetch(`${CFG.SUPABASE_URL}/storage/v1/object/${B}/${p}`,{method:'POST',headers:h,body:f});if(!r.ok)throw new Error(await r.text());return `${CFG.SUPABASE_URL}/storage/v1/object/public/${B}/${p}`}

const fld=(s,i,f,v,q)=>`<label><small class="l">${q&&f==='t'?'السؤال · Question':q&&f==='b'?'الصحيحة|خطأ|خطأ · correct|wrong|wrong':FL[f]}</small>${f==='b'?`<textarea rows="3" dir="auto" oninput="ed('${s}',${i},'b',this.value)">${esc(v)}</textarea>`:`<input dir="auto" value="${esc(v)}" oninput="ed('${s}',${i},'${f}',this.value)">`}</label>`+(f==='u'?`<input type="file" accept="audio/*,image/*" onchange="pick('${s}',${i},this.files[0])">`:'');
const ed=(s,i,f,v)=>{AC[s][i][f]=v;},add=s=>{(AC[s]=AC[s]||[]).push({t:'',b:'',u:''});drawAdmin()},del=(s,i)=>{AC[s].splice(i,1);drawAdmin()};

async function pick(s,i,f){if(!f)return;let u='';if(isCloud()){try{u=await upload(f)}catch(e){msg='⚠️ Upload failed ('+String(e.message).slice(0,90)+')'}}
if(!u){u='media/'+safe(f.name);}AC[s][i].u=u;drawAdmin()}
async function upMany(fs){for(const f of fs){try{ups.unshift(await upload(f))}catch(e){msg='⚠️ '+String(e.message).slice(0,120)}}drawAdmin()}

// حفظ البيانات أوتوماتيكياً في Supabase
async function saveToCloud(){
  if(!isCloud()){msg='⚠️ Supabase غير مُعرّف في config.js';drawAdmin();return;}
  try{
    msg='⏳ جاري الحفظ في السحاب...'; drawAdmin();
    
    const settings = [
      {key:'start_date', value:AC.start_date||''},
      {key:'next_date', value:AC.next_date||''},
      {key:'next_label', value:AC.next_label||''}
    ];
    for(let s of settings){
      await sbReq(`site_settings?key=eq.${s.key}`,'PATCH',{value:s.value});
    }

    await sbReq('content_items?id=gt.0','DELETE');
    
    let bulkRows=[];
    SEC.forEach(([k])=>{
      if(AC[k] && AC[k].length){
        AC[k].forEach(x=>{
          bulkRows.push({section:k, title:x.t||'', body:x.b||'', media_url:x.u||''});
        });
      }
    });

    if(bulkRows.length > 0){
      await sbReq('content_items','POST',bulkRows);
    }

    msg='✅ تم الحفظ وإرسال كل شيء إلى ابتسام بنجاح تام!';
  }catch(e){
    msg='❌ خطأ أثناء الحفظ: '+e.message;
  }
  drawAdmin();
}

function renderChatList(){
  if(!chatMessages.length) return `<p class="mut center" style="padding:20px;">لا توجد رسائل بعد. ابدأ المحادثة مع الأميرة! 💌</p>`;
  return chatMessages.map(m=>{
    const isPrince = m.sender === 'prince';
    const name = isPrince ? '👑 الأمير' : '👸 الأميرة';
    const bg = isPrince ? 'background: rgba(212, 175, 55, 0.15); border-color: rgba(212, 175, 55, 0.4);' : 'background: rgba(255, 255, 255, 0.08);';
    return `<div class="item" style="display:flex; flex-direction:column; margin-bottom:10px; ${bg}">
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; opacity:0.8; margin-bottom:4px;">
        <strong>${name}</strong>
        <small>${new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
      </div>
      <div dir="auto" style="word-break: break-word; font-size:1.05rem;">${esc(m.message)}</div>
    </div>`;
  }).join('');
}

const T={
content:()=>`<div class="card"><h3>⚙️ عام · General</h3><label>معًا منذ · Together since<input type="date" value="${esc(AC.start_date)}" oninput="AC.start_date=this.value"></label>
<label>الموعد القادم · Next date<input type="date" value="${esc(AC.next_date)}" oninput="AC.next_date=this.value"></label><label>عنوان الموعد · Label<input dir="auto" value="${esc(AC.next_label)}" oninput="AC.next_label=this.value"></label></div>
${SEC.map(([k,ic,lb,fs])=>`<div class="card"><h3>${ic} ${lb} (${(AC[k]||[]).length})</h3>${(AC[k]||[]).map((x,i)=>`<div class="item">${fs.map(f=>fld(k,i,f,x[f]||'',k==='quiz')).join('')}<button onclick="del('${k}',${i})">🗑</button></div>`).join('')}<button class="gold" onclick="add('${k}')">➕</button></div>`).join('')}
<div class="card center"><button class="gold" onclick="saveToCloud()">☁️ حفظ وإرسال إلى السحاب · Save to Cloud</button><p class="mut">${esc(msg)}</p><button onclick="initAdmin()">↺ إعادة تحميل · Refresh</button></div>`,
media:()=>`<div class="card"><h3>🖼️ Supabase Storage: ${isCloud()?'ON':'OFF'}</h3>${isCloud()?`<input type="file" multiple accept="audio/*,image/*" onchange="upMany(this.files)"><p class="err">${esc(msg)}</p>`:'<p class="mut">Not configured.</p>'}
${ups.map(u=>`<div class="item"><small>${esc(u)}</small><button onclick="navigator.clipboard.writeText('${esc(u)}')">📋 Copy</button></div>`).join('')}</div>`,
chat:()=>`<div class="card"><h3>💬 المحادثة الحية مع الأميرة · Live Chat</h3>
<div id="chat-box-content" style="max-height:350px; overflow-y:auto; margin-bottom:15px; padding-right:5px;">${renderChatList()}</div>
<div style="display:flex; gap:10px;">
  <input id="chat-input" dir="auto" type="text" placeholder="اكتب رسالة إلى الأميرة..." style="flex:1; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:#fff;" onkeydown="if(event.key==='Enter') sendAdminMessage(this.value)">
  <button class="gold" onclick="sendAdminMessage($('chat-input').value)">إرسال ✉️</button>
</div></div>`,
leaderboard:()=>`<div class="card"><div id="admin-leaderboard-box">${renderAdminLeaderboardHTML()}</div></div>`,
guide:()=>`<div class="card pre"><h3>📘 Cloud Sync, Chat & Leaderboard Active</h3>1) Edit content freely in ✍️ Content.
2) Click ☁️ <b>Save to Cloud</b>.
3) Chat live with the Princess in 💬 الشات المباشر.
4) Manage scores in 🏆 لوحة الشرف!</div>`};

function drawAdmin(){
  document.documentElement.dir='rtl';
  if(!AC){
    AC = Object.assign({}, EMPTY, JSON.parse(JSON.stringify(window.CONTENT||{})));
  }
  
  // التحكم في التحديث الآلي للتشات ولوحة الشرف
  if(tab === 'chat') {
    if(!chatInterval) chatInterval = setInterval(loadChatMessages, 3000);
    loadChatMessages();
  } else {
    if(chatInterval) { clearInterval(chatInterval); chatInterval = null; }
  }

  if(tab === 'leaderboard') {
    loadAdminLeaderboard();
    if(!adminLbTimer) adminLbTimer = setInterval(loadAdminLeaderboard, 4000);
  } else {
    if(adminLbTimer) { clearInterval(adminLbTimer); adminLbTimer = null; }
  }

  $('app').innerHTML=`<div class="wrap"><header><h1>🛡️ جليل · Admin</h1><div class="row"><button class="chip" onclick="setView('princess')">👁 Preview</button><button class="chip" onclick="logout()">خروج · Exit</button></div></header>
<nav class="chips">${[['content','✍️ المحتوى · Content'],['media','🖼️ الوسائط · Media'],['chat','💬 الشات المباشر'],['leaderboard','🏆 لوحة الشرف'],['guide','📘 الدليل · Guide']].map(([k,l])=>`<a class="chip ${tab===k?'on':''}" href="javascript:tab='${k}';drawAdmin()">${l}</a>`).join('')}</nav>${T[tab]()}</div>`;
}

async function initAdmin(){
  msg='⏳ جاري جلب البيانات من السحاب...';
  if(!AC){
    await loadFromDB();
  }
  msg='';
  drawAdmin();
}

// ربط الدوال بالنافذة لكي تتعرف عليها main.js
window.drawAdmin = drawAdmin;
window.initAdmin = initAdmin;
window.updateScore = updateScore;
