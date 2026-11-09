const SEC=[['notes','💌','رسائل حب · Love notes',['t','b']],['voice','🎙️','رسائل صوتية · Voice notes',['t','u']],['songs','🎵','أغاني (+كلمات) · Songs',['t','u','b']],['photos','📷','صور · Photos',['t','u']],['phrases','💬','كلماتي · Catchphrases',['b']],['poems','📜','شعر · Poetry',['t','b']],['reasons','💖','أسباب أحبك · Reasons',['b']],['letters','✉️','افتحي عندما · Open when',['t','b']],['quiz','💕','أسئلة اختبار الحب · Love quiz',['t','b']]];
const FL={t:'العنوان · Title',b:'النص · Text',u:'رابط أو مسار الملف · URL / path'};
const EMPTY={start_date:'2024-01-01',next_date:'',next_label:'موعدنا القادم'};SEC.forEach(s=>EMPTY[s[0]]=[]);
let AC=null,tab='content',msg='',FILES=[],ups=[];
const cloud=()=>!!CFG.SUPABASE_URL&&!/YOUR-/.test(CFG.SUPABASE_URL+CFG.SUPABASE_KEY),safe=n=>n.replace(/[^\w.\-]/g,'_');

// دالة الاتصال المباشر بـ Supabase REST API
async function sbReq(path, method='GET', body=null){
  const K=CFG.SUPABASE_KEY, U=CFG.SUPABASE_URL;
  if(!cloud()) throw new Error('Supabase not configured');
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

async function upload(f){const K=CFG.SUPABASE_KEY,B=CFG.SUPABASE_BUCKET||'media',p=Date.now()+'_'+safe(f.name),h={apikey:K,'Content-Type':f.type||'application/octet-stream'};if(K.startsWith('eyJ'))h.Authorization='Bearer '+K;
const r=await fetch(`${CFG.SUPABASE_URL}/storage/v1/object/${B}/${p}`,{method:'POST',headers:h,body:f});if(!r.ok)throw new Error(await r.text());return `${CFG.SUPABASE_URL}/storage/v1/object/public/${B}/${p}`}

const fld=(s,i,f,v,q)=>`<label><small class="l">${q&&f==='t'?'السؤال · Question':q&&f==='b'?'الصحيحة|خطأ|خطأ · correct|wrong|wrong':FL[f]}</small>${f==='b'?`<textarea rows="3" dir="auto" oninput="ed('${s}',${i},'b',this.value)">${esc(v)}</textarea>`:`<input dir="auto" value="${esc(v)}" oninput="ed('${s}',${i},'${f}',this.value)">`}</label>`+(f==='u'?`<input type="file" accept="audio/*,image/*" onchange="pick('${s}',${i},this.files[0])">`:'');
const ed=(s,i,f,v)=>{AC[s][i][f]=v;},add=s=>{(AC[s]=AC[s]||[]).push({t:'',b:'',u:''});drawAdmin()},del=(s,i)=>{AC[s].splice(i,1);drawAdmin()};

async function pick(s,i,f){if(!f)return;let u='';if(cloud()){try{u=await upload(f)}catch(e){msg='⚠️ Upload failed ('+String(e.message).slice(0,90)+')'}}
if(!u){u='media/'+safe(f.name);}AC[s][i].u=u;drawAdmin()}
async function upMany(fs){for(const f of fs){try{ups.unshift(await upload(f))}catch(e){msg='⚠️ '+String(e.message).slice(0,120)}}drawAdmin()}

// حفظ البيانات أوتوماتيكياً في Supabase
async function saveToCloud(){
  if(!cloud()){msg='⚠️ Supabase غير مُعرّف في config.js';drawAdmin();return;}
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

const T={
content:()=>`<div class="card"><h3>⚙️ عام · General</h3><label>معًا منذ · Together since<input type="date" value="${esc(AC.start_date)}" oninput="AC.start_date=this.value"></label>
<label>الموعد القادم · Next date<input type="date" value="${esc(AC.next_date)}" oninput="AC.next_date=this.value"></label><label>عنوان الموعد · Label<input dir="auto" value="${esc(AC.next_label)}" oninput="AC.next_label=this.value"></label></div>
${SEC.map(([k,ic,lb,fs])=>`<div class="card"><h3>${ic} ${lb} (${(AC[k]||[]).length})</h3>${(AC[k]||[]).map((x,i)=>`<div class="item">${fs.map(f=>fld(k,i,f,x[f]||'',k==='quiz')).join('')}<button onclick="del('${k}',${i})">🗑</button></div>`).join('')}<button class="gold" onclick="add('${k}')">➕</button></div>`).join('')}
<div class="card center"><button class="gold" onclick="saveToCloud()">☁️ حفظ وإرسال إلى السحاب · Save to Cloud</button><p class="mut">${esc(msg)}</p><button onclick="initAdmin()">↺ إعادة تحميل · Refresh</button></div>`,
media:()=>`<div class="card"><h3>🖼️ Supabase Storage: ${cloud()?'ON':'OFF'}</h3>${cloud()?`<input type="file" multiple accept="audio/*,image/*" onchange="upMany(this.files)"><p class="err">${esc(msg)}</p>`:'<p class="mut">Not configured.</p>'}
${ups.map(u=>`<div class="item"><small>${esc(u)}</small><button onclick="navigator.clipboard.writeText('${esc(u)}')">📋 Copy</button></div>`).join('')}</div>`,
guide:()=>`<div class="card pre"><h3>📘 Cloud Sync Active</h3>1) Edit content freely in ✍️ Content.
2) Click ☁️ <b>Save to Cloud</b>.
3) Everything updates instantly on Ibtissam's screen automatically!</div>`};

// دالة رسم واجهة الأدمن بشكل متزامن وسلس
function drawAdmin(){
  document.documentElement.dir='rtl';
  if(!AC){
    AC = Object.assign({}, EMPTY, JSON.parse(JSON.stringify(window.CONTENT||{})));
  }
  $('app').innerHTML=`<div class="wrap"><header><h1>🛡️ جليل · Admin</h1><div class="row"><button class="chip" onclick="setView('princess')">👁 Preview</button><button class="chip" onclick="logout()">خروج · Exit</button></div></header>
<nav class="chips">${[['content','✍️ المحتوى · Content'],['media','🖼️ الوسائط · Media'],['guide','📘 الدليل · Guide']].map(([k,l])=>`<a class="chip ${tab===k?'on':''}" href="javascript:tab='${k}';drawAdmin()">${l}</a>`).join('')}</nav>${T[tab]()}</div>`;
}

// دالة تهيئة وتحميل بيانات الأدمن أولاً ثم عرض الواجهة
async function initAdmin(){
  msg='⏳ جاري جلب البيانات من السحاب...';
  if(!AC){
    await loadFromDB();
  }
  msg='';
  drawAdmin();
}
