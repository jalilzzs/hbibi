const SEC=[['notes','💌','رسائل حب · Love notes',['t','b']],['voice','🎙️','رسائل صوتية · Voice notes',['t','u']],['songs','🎵','أغاني (+كلمات) · Songs',['t','u','b']],['photos','📷','صور · Photos',['t','u']],['phrases','💬','كلماتي · Catchphrases',['b']],['poems','📜','شعر · Poetry',['t','b']],['reasons','💖','أسباب أحبك · Reasons',['b']],['letters','✉️','افتحي عندما · Open when',['t','b']],['quiz','💕','أسئلة اختبار الحب · Love quiz',['t','b']]];
const FL={t:'العنوان · Title',b:'النص · Text',u:'رابط أو مسار الملف · URL / path'};
const EMPTY={start_date:'2024-01-01',next_date:'',next_label:'موعدنا القادم'};SEC.forEach(s=>EMPTY[s[0]]=[]);
let AC=null,tab='content',msg='',FILES=[],ups=[];
const cloud=()=>!!CFG.SUPABASE_URL&&!/YOUR-/.test(CFG.SUPABASE_URL+CFG.SUPABASE_KEY),safe=n=>n.replace(/[^\w.\-]/g,'_');
const draft=()=>{try{localStorage.setItem('draft',JSON.stringify(AC))}catch(e){}};
async function upload(f){const K=CFG.SUPABASE_KEY,B=CFG.SUPABASE_BUCKET||'media',p=Date.now()+'_'+safe(f.name),h={apikey:K,'Content-Type':f.type||'application/octet-stream'};if(K.startsWith('eyJ'))h.Authorization='Bearer '+K;
const r=await fetch(`${CFG.SUPABASE_URL}/storage/v1/object/${B}/${p}`,{method:'POST',headers:h,body:f});if(!r.ok)throw new Error(await r.text());return `${CFG.SUPABASE_URL}/storage/v1/object/public/${B}/${p}`}
const fld=(s,i,f,v,q)=>`<label><small class="l">${q&&f==='t'?'السؤال · Question':q&&f==='b'?'الصحيحة|خطأ|خطأ · correct|wrong|wrong':FL[f]}</small>${f==='b'?`<textarea rows="3" dir="auto" oninput="ed('${s}',${i},'b',this.value)">${esc(v)}</textarea>`:`<input dir="auto" value="${esc(v)}" oninput="ed('${s}',${i},'${f}',this.value)">`}</label>`+(f==='u'?`<input type="file" accept="audio/*,image/*" onchange="pick('${s}',${i},this.files[0])">`:'');
const ed=(s,i,f,v)=>{AC[s][i][f]=v;draft()},add=s=>{(AC[s]=AC[s]||[]).push({t:'',b:'',u:''});draft();drawAdmin()},del=(s,i)=>{AC[s].splice(i,1);draft();drawAdmin()};
async function pick(s,i,f){if(!f)return;let u='';if(cloud()){try{u=await upload(f)}catch(e){msg='⚠️ Upload failed ('+String(e.message).slice(0,90)+') → local media/ path'}}
if(!u){u='media/'+safe(f.name);FILES.push(f.name)}AC[s][i].u=u;draft();drawAdmin()}
async function upMany(fs){for(const f of fs){try{ups.unshift(await upload(f))}catch(e){msg='⚠️ '+String(e.message).slice(0,120)}}drawAdmin()}
function exp(){const o=JSON.parse(JSON.stringify(AC));SEC.forEach(([k,,,fs])=>o[k]=(o[k]||[]).map(x=>{const r={};fs.forEach(f=>r[f]=x[f]||'');return r}));
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['window.CONTENT='+JSON.stringify(o,null,1)+';'],{type:'text/javascript'}));a.download='content.js';a.click();msg='✅ content.js'+(FILES.length?' — copy to /media: '+FILES.join(', '):'');drawAdmin()}
const T={
content:()=>`<div class="card"><h3>⚙️ عام · General</h3><label>معًا منذ · Together since<input type="date" value="${esc(AC.start_date)}" oninput="AC.start_date=this.value;draft()"></label>
<label>الموعد القادم · Next date<input type="date" value="${esc(AC.next_date)}" oninput="AC.next_date=this.value;draft()"></label><label>عنوان الموعد · Label<input dir="auto" value="${esc(AC.next_label)}" oninput="AC.next_label=this.value;draft()"></label></div>
${SEC.map(([k,ic,lb,fs])=>`<div class="card"><h3>${ic} ${lb} (${(AC[k]||[]).length})</h3>${(AC[k]||[]).map((x,i)=>`<div class="item">${fs.map(f=>fld(k,i,f,x[f]||'',k==='quiz')).join('')}<button onclick="del('${k}',${i})">🗑</button></div>`).join('')}<button class="gold" onclick="add('${k}')">➕</button></div>`).join('')}
<div class="card center"><button class="gold" onclick="exp()">⬇️ تصدير · Export content.js</button><p class="mut">${esc(msg)}</p><button onclick="if(confirm('Discard draft?')){localStorage.removeItem('draft');AC=null;drawAdmin()}">↺ Reset to deployed content</button></div>`,
media:()=>`<div class="card"><h3>🖼️ Supabase Storage (optional): ${cloud()?'ON':'OFF'}</h3>${cloud()?`<input type="file" multiple accept="audio/*,image/*" onchange="upMany(this.files)"><p class="err">${esc(msg)}</p>`:'<p class="mut">Not configured. Put files in the /media folder and use paths like media/photo1.jpg, or fill SUPABASE_URL / SUPABASE_KEY in js/config.js.</p>'}
${ups.map(u=>`<div class="item"><small>${esc(u)}</small><button onclick="navigator.clipboard.writeText('${esc(u)}')">📋 Copy</button></div>`).join('')}</div>`,
guide:()=>`<div class="card pre"><h3>📘 Publish on Render</h3>1) Edit in ✍️ Content (or paste links from 🖼️ Media).
2) ⬇️ Export <b>content.js</b> and replace <b>js/content.js</b> in your repo.
3) Photos/audio not uploaded to Supabase → put them in <b>media/</b>.
4) Commit & push → Render redeploys automatically.
Tip: 👁 Preview shows your unsaved draft exactly as she will see it.</div>`};
function drawAdmin(){document.documentElement.dir='rtl';if(!AC){let d=null;try{d=JSON.parse(localStorage.getItem('draft'))}catch(e){}AC=d||Object.assign({},EMPTY,JSON.parse(JSON.stringify(window.CONTENT||{})))}
$('app').innerHTML=`<div class="wrap"><header><h1>🛡️ جليل · Admin</h1><div class="row"><button class="chip" onclick="setView('princess')">👁 Preview</button><button class="chip" onclick="logout()">خروج · Exit</button></div></header>
<nav class="chips">${[['content','✍️ المحتوى · Content'],['media','🖼️ الوسائط · Media'],['guide','📘 الدليل · Guide']].map(([k,l])=>`<a class="chip ${tab===k?'on':''}" href="javascript:tab='${k}';drawAdmin()">${l}</a>`).join('')}</nav>${T[tab]()}</div>`}
