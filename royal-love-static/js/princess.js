let lang=localStorage.lang||'ar',route='home',gid='',err='',gm='code';window.CUR='';let C={};const L=k=>C[k]||[];

// دالة جلب البيانات الحية أوتوماتيكياً من Supabase
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
        settings.forEach(s => data[s.key] = s.value);
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

const D={title:['عالم الأميرة إبتسام','Princess Ibtissam’s World'],gateT:['صاحبة الجلالة الأميرة إبتسام','Her Majesty Princess Ibtissam'],code:['🔑 الرمز','🔑 Code'],face:['📸 الوجه','📸 Face'],ph:['الرمز الملكي','Royal passcode'],enter:['دخول','Enter'],wrong:['رمز خاطئ','Wrong code'],exit:['خروج','Exit'],
together:['معًا منذ','Together for'],days:['يوم','days'],points:['نقاط الحب','Love points'],empty:['لا شيء هنا بعد 💌','Nothing here yet 💌'],back:['← رجوع','← Back'],camMsg:['انظري إلى الكاميرا 👑','Look at the camera 👑'],
home:['الرئيسية','Home'],notes:['رسائل حب','Love notes'],voice:['رسائل صوتية','Voice notes'],songs:['أغاني وكاريوكي','Songs'],photos:['الصور','Gallery'],phrases:['كلماتي','Catchphrases'],poems:['شعر','Poetry'],games:['ألعاب','Games'],baby:['البيبي','Baby'],
reasons:['أسباب أحبك','Reasons I love you'],letters:['افتحي عندما…','Open when…'],countdown:['العد التنازلي','Countdown'],mood:['مزاجي اليوم','My mood'],another:['سبب آخر 💖','Another 💖'],moodAsk:['كيف تشعرين الآن؟','How do you feel?'],sent:['وصلت لحبيبك 💌','Sent to your love 💌'],noDate:['لم يُحدَّد موعد','No date set'],girl:['👧 بنت','👧 Girl'],boy:['👦 ولد','👦 Boy'],left:['يوم متبقٍ','days left'],admin:['🛡️ المشرف','🛡️ Admin'],cloud:['☁️ التقدم محفوظ والمحتوى مباشر','☁️ Live Cloud Sync'],loc:['💾 محفوظ محلياً','💾 Local mode']};
const t=k=>D[k][lang==='ar'?0:1],ix=lang=>lang==='ar'?0:1;
const NAV=[['home','🏠'],['notes','💌'],['voice','🎙️'],['songs','🎵'],['photos','📷'],['phrases','💬'],['poems','📜'],['games','🎮'],['baby','👶'],['reasons','💖'],['letters','✉️'],['countdown','⏳'],['mood','🥰']],SPECIAL=['reasons','letters','countdown','mood'];
const start=()=>C.start_date||'2024-01-01',days=()=>Math.max(0,(Date.now()-new Date(start()))/864e5);
const clk=()=>{const m=Date.now()-new Date(start());return`${Math.floor(m/36e5)%24}h ${Math.floor(m/6e4)%60}m ${Math.floor(m/1e3)%60}s`};
const cdDays=()=>C.next_date?Math.ceil((new Date(C.next_date)-Date.now())/864e5):null;
function stage(){const g=Prog.d.baby_gender==='girl',d=days(),st=[[0,['مولود','Newborn'],'👶'],[30,['رضيع','Baby'],'🍼'],[180,['طفل صغير','Toddler'],'🧒'],[365,['طفل','Kid'],g?'👧':'👦'],[730,['مراهق','Teen'],g?'👩‍🎤':'🧑‍🎤'],[1460,['كبير','Grown-up'],g?'👩':'👨']];const i=st.filter(x=>d>=x[0]).length-1,n=st[i+1];return{s:st[i],n,p:n?(d-st[i][0])/(n[0]-st[i][0])*100:100}}
const list=(k,f)=>L(k).length?L(k).map(f).join(''):`<p class="mut center">${t('empty')}</p>`;
const card=(x,ex)=>`<div class="card">${x.t?`<h3>${esc(x.t)}</h3>`:''}${ex||''}${x.b?`<p class="pre">${esc(x.b)}</p>`:''}</div>`;
const aud=x=>x.u?`<audio controls preload="none" src="${esc(x.u)}"></audio>`:'';
const V={
home:()=>{const st=stage(),c=cdDays();return`<div class="bento"><div class="tile hero span2"><small>${t('together')}</small><h2>${Math.floor(days())} ${t('days')}</h2><p id="clk">${clk()}</p></div>
<a class="tile accent" href="#/games"><i>💎</i><b class="pts">${Prog.d.love_points}</b><small>${t('points')}</small></a><a class="tile accent" href="#/baby"><i>${st.s[2]}</i><b>${esc(Prog.d.baby_name)}</b><small>${st.s[1][ix(lang)]}</small></a>
${NAV.slice(1).map(([k,i])=>`<a class="tile ${SPECIAL.includes(k)?'accent':''}" href="#/${k}"><i>${i}</i><b>${t(k)}</b>${k==='countdown'&&c!=null?`<small>${c} ${t('left')}</small>`:''}</a>`).join('')}</div>`},
notes:()=>list('notes',x=>card(x)),voice:()=>list('voice',x=>card(x,aud(x))),songs:()=>list('songs',x=>card(x,aud(x))),
photos:()=>L('photos').length?`<div class="pg">${L('photos').map(x=>`<div class="card" style="padding:8px;margin:0"><img loading="lazy" src="${esc(x.u)}" alt="">${x.t?`<p class="center">${esc(x.t)}</p>`:''}</div>`).join('')}</div>`:`<p class="mut center">${t('empty')}</p>`,
phrases:()=>list('phrases',x=>`<div class="big-card">${esc(x.b)}</div>`),poems:()=>list('poems',x=>card(x)),
letters:()=>list('letters',x=>`<details class="card"><summary><h3 style="display:inline">✉️ ${esc(x.t)}</h3></summary><p class="pre">${esc(x.b)}</p></details>`),
reasons:()=>{const r=L('reasons');return`<div class="card center"><div class="big-card" id="rs">${r.length?esc(R(r).b):t('empty')}</div><button class="gold" id="rb">${t('another')}</button></div>`},
baby:()=>{const s=stage(),g=Prog.d.baby_gender;return`<div class="card center"><div class="babe">${s.s[2]}</div><h2>${esc(Prog.d.baby_name)} · ${s.s[1][ix(lang)]}</h2><div class="bar"><i style="width:${s.p}%"></i></div><p class="mut">${s.n?`→ ${s.n[1][ix(lang)]} (${s.n[0]} ${t('days')})`:'💖'}</p>
<div class="row"><button class="chip ${g==='girl'?'on':''}" onclick="setBaby('girl')">${t('girl')}</button><button class="chip ${g==='boy'?'on':''}" onclick="setBaby('boy')">${t('boy')}</button></div><input id="bn" value="${esc(Prog.d.baby_name)}" onchange="setBaby('${g}',this.value)"></div>`},
games:()=>{if(gid){const g=GAMES.find(x=>x[0]===gid);return`<a class="chip" href="#/games">${t('back')}</a><div class="card"><h2>${g[1]} ${g[2+ix(lang)]} <small class="mut">💎 <span class="pts">${Prog.d.love_points}</span></small></h2><div id="gm"></div></div>`}
return`<p class="center">💎 <b class="pts">${Prog.d.love_points}</b></p><div class="bento">${GAMES.map(g=>`<a class="tile" href="#/games/${g[0]}"><i>${g[1]}</i><b>${g[2+ix(lang)]}</b>${Prog.d.scores&&Prog.d.scores[g[0]]?`<small>🏅 ${Prog.d.scores[g[0]]}</small>`:''}</a>`).join('')}</div>`},
countdown:()=>{const c=cdDays();return`<div class="card center hero"><h2>${esc(C.next_label||'')}</h2>${c==null?`<p>${t('noDate')}</p>`:`<h2 style="font-size:4rem">${Math.max(0,c)}</h2><p>${t('left')}</p>`}</div>`},
mood:()=>`<div class="card center"><h3>${t('moodAsk')}</h3><div class="row">${['😍','🥰','😊','🤗','😘','😴','😢','😡'].map(m=>`<button class="cell" onclick="sendMood('${m}')">${m}</button>`).join('')}</div><p id="ms" class="mut"></p></div>`};
const setBaby=(g,n)=>{Prog.baby(g,n||$('bn').value);render()},sendMood=m=>{Prog.mood(m);$('ms').textContent=t('sent')};
const B={reasons(){const r=L('reasons');$('rb').onclick=()=>{if(r.length)$('rs').textContent=R(r).b}},games(){window.CUR=gid;if(gid)GAMES.find(x=>x[0]===gid)[4]($('gm'))}};
Prog.onchange=()=>document.querySelectorAll('.pts').forEach(e=>e.textContent=Prog.d.love_points);
function shell(body){return`<div class="wrap"><header><h1>👑 ${t('title')}</h1><div class="row"><button class="chip" onclick="setLang()">${lang==='ar'?'EN':'عربي'}</button><button class="chip" onclick="logout()">${t('exit')}</button></div></header>
${Prog.err?`<div class="card err" style="padding:8px;font-size:.85rem">⚠️ ${esc(Prog.err)}</div>`:''}<nav class="chips">${NAV.map(([k,i])=>`<a class="chip ${route===k?'on':''}" href="#/${k}">${i} ${t(k)}</a>`).join('')}</nav>${body}
<footer>${sessionStorage.role==='admin'?`<a href="javascript:setView('admin')">${t('admin')}</a>`:''}<a href="#/home">🏠 ${t('home')}</a><a href="#/games">🎮 ${t('games')}</a><a href="#/notes">💌 ${t('notes')}</a><p class="mut">${cloud()?t('cloud'):t('loc')}</p></footer></div>`}
async function render(){
  TM.forEach(clearInterval);TM=[];
  C = await loadPrincessContent();
  window.ACTIVE=C;
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  document.title=t('title');
  const[r,g]=location.hash.slice(2).split('/');route=r||'home';gid=g||'';if(route!=='games')window.CUR='';
  $('app').innerHTML=shell(V[route]?V[route]():V.home());
  B[route]&&B[route]();
  if(route==='home')iv(()=>{const c=$('clk');c&&(c.textContent=clk())},1000);
}
function setLang(){lang=lang==='ar'?'en':'ar';localStorage.lang=lang;render()}
