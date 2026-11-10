// دالة لتحديث نقاط الحب في المتجر المحلي وفي جدول السحاب (لوحة الشرف)
async function addGamePoints(points){
  try {
    // 1. تحديث نقاط الحب المحلية للواجهة وعرضها
    if(typeof Prog !== 'undefined' && Prog.d){
      Prog.d.love_points = Math.max(0, (Prog.d.love_points || 0) + points);
      if(typeof Prog.save === 'function') Prog.save();
    }
    
    // 2. تحديث النقاط في جدول game_scores في سحاب Supabase (حسب دور المستخدم الحالي)
    const role = sessionStorage.role || 'princess';
    const playerKey = (role === 'admin' || role === 'jalil') ? 'prince' : 'princess';
    
    if(typeof cloud === 'function' && cloud() && typeof CFG !== 'undefined'){
      const K = CFG.SUPABASE_KEY, U = CFG.SUPABASE_URL;
      const res = await fetch(`${U}/rest/v1/game_scores?player=eq.${playerKey}`, {
        headers: {apikey: K, Authorization: 'Bearer ' + K}
      });
      const data = await res.json();
      const currentPoints = (data && data.length > 0) ? (data[0].points || 0) : 0;
      const newTotal = Math.max(0, currentPoints + points);

      await fetch(`${U}/rest/v1/game_scores?player=eq.${playerKey}`, {
        method: 'PATCH',
        headers: {apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json'},
        body: JSON.stringify({ points: newTotal })
      });
    }
  } catch(e) {
    console.error('Error updating game points:', e);
  }
}

// قائمة العقوبات العشوائية الطريفة عند الخطأ
const PENALTIES = [
  "😂 عقاب: ابعت رسالة حب صوتية حالا للشخص الآخر!",
  "🥺 عقاب: اعترف بثلاث عيوب ظريفة في روحك!",
  "🔥 عقاب: ممنوع تستعمل حرف 'الياء' في الجواب القادم!",
  "👑 عقاب: اعترف بلي الأمير هو الأذك والأسرع!",
  "💖 عقاب: ابعت 5 قلبات حمراء ورا بعض في الشات المباشر!"
];
const getRandomPenalty = () => PENALTIES[Math.floor(Math.random() * PENALTIES.length)];

// تعريف الألعاب مع دعم النقاط الموحدة والتخطي والعقوبات
const GAMES = [
  ['loveq','💕','اختبار الحب','Love Quiz', function(el){
    const items = typeof loveQ === 'function' ? loveQ() : [['من يحب الآخر أكثر؟','نحن متساويان 💞','أنا 😏','أنتِ 😘']];
    const q = sh(items).slice(0,5);
    let i = 0, s = 0, skipsLeft = 1;
    const go = () => {
      if(i >= q.length) {
        const earned = Math.min(15, s * 3);
        addGamePoints(earned);
        return end(el, earned, s + '/' + q.length + ' ✨');
      }
      const [a, ...o] = q[i];
      el.innerHTML = `<h3>${esc(a)}</h3>` + sh(o).map(x => `<button class="opt">${esc(x)}</button>`).join('') +
        `<div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
          ${skipsLeft > 0 ? `<button class="chip" id="skip-btn">⏭️ تخطي السؤال (متبقي ${skipsLeft})</button>` : `<span class="mut" style="font-size:0.85rem;">لا توجد تخطيات متبقية</span>`}
        </div>
        <p id="q-penalty" style="margin-top:10px; font-weight:bold; font-size:0.95rem;"></p>`;
      
      if(skipsLeft > 0) {
        el.querySelector('#skip-btn').onclick = () => {
          skipsLeft--;
          i++;
          go();
        };
      }

      el.querySelectorAll('.opt').forEach(b => {
        b.onclick = () => {
          const penaltyEl = el.querySelector('#q-penalty');
          if(b.textContent === o[0]) {
            s++;
            if(penaltyEl) { penaltyEl.style.color = '#2ecc71'; penaltyEl.textContent = "✨ إجابة صحيحة! (+3 نقاط)"; }
            setTimeout(() => { i++; go(); }, 900);
          } else {
            const pen = getRandomPenalty();
            if(penaltyEl) { penaltyEl.style.color = '#e74c3c'; penaltyEl.textContent = `❌ خطأ! ${pen}`; }
            addGamePoints(-3); // عقاب خصم نقاط
            setTimeout(() => { i++; go(); }, 2800);
          }
        };
      });
    };
    go();
  }],

  ['emoji','🎬','خمّني الفيلم','Guess the Movie', quiz([['🦁👑','الأسد الملك','علاء الدين','بامبي'],['❄️👸','فروزن','سندريلا','مولان'],['🚢💔','تايتانيك','أفاتار','جاسوس'],['🧞‍♂️🪔','علاء الدين','شريك','بامبي']])],
  ['riddle','🧩','ألغاز','Riddles', quiz([['شيء يكبر كلما أخذت منه؟','الحفرة','الجبل','البحر'],['يمشي بلا أرجل؟','الوقت','الكرسي','الحجر'],['له أسنان ولا يعض؟','المشط','القرش','الأسد'],['كلما زاد نقص؟','العمر','المال','الماء']])],
  ['tf','✅','صح أم خطأ','True or False', quiz([['الشمس نجم؟','صح','خطأ'],['الحوت سمكة؟','خطأ','صح'],['الذهب أخف من الحديد؟','خطأ','صح'],['القمر يدور حول الأرض؟','صح','خطأ']])],
  ['proverb','📖','أكمل المثل','Proverbs', quiz([['الصديق وقت ...','الضيق','الفرح','الراحة'],['من جدّ ...','وجد','نام','ضحك'],['العلم في الصغر كالنقش على ...','الحجر','الماء','الرمل'],['الوقت كالسيف إن لم تقطعه ...','قطعك','كسره','أجله']])],
  ['math','🔢','حساب سريع','Quick Math', quiz(Array.from({length:6},()=>{const a=2+Math.random()*18|0,b=2+Math.random()*18|0;return[`${a} + ${b} = ?`,a+b,a+b+1,a+b-2]}))],
  
  ['dare','🔥','تحدّي','Daring Cards', cards(['أرسلي لي رسالة صوتية عن أجمل ما فيّ 🎙️','ارقصي ٣٠ ثانية 💃','قلّدي ضحكتي 😂','اكتبي لي بيت شعر الآن ✍️','أرسلي سيلفي بأجمل ابتسامة 🤳'], 3)],
  ['truth','🤫','صراحة','Truth', cards(['ما أول شيء لفت انتباهك فيّ؟','ما أجمل لحظة جمعتنا؟','متى اشتقتِ لي أكثر؟','ما أكثر عادة عندي تحبينها؟','ما الشيء الذي تخجلين من قوله لي؟'], 3)],
  ['wyr','⚖️','ماذا تفضلين','Would You Rather', cards(['عشاء رومانسي 🌙 أم رحلة مفاجئة ✈️؟','رسالة حب 💌 أم هدية 🎁؟','شاطئ 🏖️ أم جبل ⛰️؟','فيلم 🎬 أم مشي تحت المطر 🌧️؟','حلوى 🍰 أم ورد 🌹؟'], 3)],
  ['comp','🌹','كلمة حلوة','Compliments', cards(['ابتسامتك تضيء يومي ✨','أنتِ أجمل صدفة في حياتي 🌹','معكِ كل شيء أجمل 💖','صوتك أحلى موسيقى 🎶','أنتِ أميرتي وملكة قلبي 👑'], 3)],
  ['date','🕯️','أفكار مواعيد','Date Ideas', cards(['عشاء على ضوء الشموع 🕯️','نزهة عند الغروب 🌅','ليلة أفلام وفشار 🍿','طبخ وجبة معًا 🍝','جلسة تصوير 📸'], 3)],
  ['talk','💬','أسئلة للحديث','Conversation', cards(['ما حلمك الذي لم تخبري به أحدًا؟','أين نعيش بعد خمس سنوات؟','ما أغنية تذكّرك بي؟','ما أول شيء نفعله حين نلتقي؟'], 3)],
  ['wish','🌠','أمنيات','Wishes', cards(['أتمنى أن نسافر معًا ✈️','أتمنى أن نبقى معًا للأبد ♾️','أتمنى لكِ يومًا مليئًا بالفرح 🌸','أتمنى أن أراكِ قريبًا 🤍'], 3)],

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
      if(tm <= 0) {
        clearInterval(i);
        const earned = Math.min(10, n / 2 | 0);
        addGamePoints(earned);
        end(el, earned, n + ' 💖');
      }
    }, 1000);
  }],

  ['whack','💗','اضربي القلب','Whack-a-Heart', el => {
    let n = 0, tm = 12, c = -1;
    el.innerHTML = '<b id="hd"></b><div class="grid3">' + '<button class="cell"></button>'.repeat(9) + '</div>';
    const cs = [...el.querySelectorAll('.cell')], hd = el.querySelector('#hd');
    cs.forEach((b, i) => b.onclick = () => { if(i === c) { n++; b.textContent = ''; c = -1; } });
    iv(() => { cs.forEach(x => x.textContent = ''); c = Math.random() * 9 | 0; cs[c].textContent = '💗'; }, 800);
    const i = iv(() => {
      tm--; hd.textContent = `⏱ ${tm} · ${n}`;
      if(tm <= 0) {
        TM.forEach(clearInterval);
        const earned = Math.min(10, n / 2 | 0);
        addGamePoints(earned);
        end(el, earned, n + ' ✨');
      }
    }, 1000);
  }],

  ['memory','🃏','الذاكرة','Memory Match', el => {
    const e = sh(['❤️','🌹','💍','👑','🎁','🌙','⭐','🍓'].flatMap(x => [x, x]));
    let o = [], m = 0, mv = 0;
    el.innerHTML = '<div class="grid4">' + e.map(() => '<button class="cell">❔</button>').join('') + '</div>';
    const bs = [...el.querySelectorAll('.cell')];
    bs.forEach((b, i) => b.onclick = () => {
      if(o.length > 1 || o.includes(i) || b.disabled) return;
      b.textContent = e[i]; o.push(i);
      if(o.length === 2) {
        mv++; const [a, c] = o;
        if(e[a] === e[c]) {
          bs[a].disabled = bs[c].disabled = true; o = [];
          if(++m === 8) {
            const earned = mv < 14 ? 12 : 6;
            addGamePoints(earned);
            end(el, earned, mv + ' محاولات ✓');
          }
        } else {
          setTimeout(() => { bs[a].textContent = bs[c].textContent = '❔'; o = []; }, 700);
        }
      }
    });
  }],

  ['react','⚡','سرعة البديهة','Reaction', el => {
    el.innerHTML = '<button class="big-btn" id="r">⏳</button>';
    const b = el.querySelector('#r');
    let st = 0, rd = 0;
    setTimeout(() => { rd = 1; st = Date.now(); b.textContent = '💖'; b.classList.add('go'); }, 1000 + Math.random() * 2500);
    b.onclick = () => {
      if(!rd) return end(el, 0, '😅 مبكر جداً!');
      const ms = Date.now() - st;
      const earned = ms < 350 ? 10 : ms < 600 ? 5 : 2;
      addGamePoints(earned);
      end(el, earned, ms + ' ms');
    };
  }],

  ['guess','🎯','خمّني الرقم','Guess the Number', el => {
    const n = 1 + Math.random() * 20 | 0;
    let k = 5;
    el.innerHTML = '<p id="h">اختر رقماً بين 1 و 20</p><input id="i" type="number"><button class="gold" id="g">تحقق</button>';
    const h = el.querySelector('#h'), i = el.querySelector('#i');
    el.querySelector('#g').onclick = () => {
      const v = +i.value;
      if(v === n) {
        const earned = k * 3;
        addGamePoints(earned);
        return end(el, earned, '🎯 الرقم صحيح: ' + n);
      }
      k--;
      if(!k) {
        addGamePoints(1);
        return end(el, 1, 'انتهت المحاولات! الرقم كان: ' + n);
      }
      h.textContent = (v < n ? '⬆️ اصعد أعلى! ' : '⬇️ انزل أسفل! ') + k + ' محاولات متبقية ❤️';
    };
  }],

  ['rps','✌️','حجر ورقة مقص','Rock Paper Scissors', el => {
    const o = ['✊','✋','✌️'];
    let s = 0, r = 0;
    const go = () => {
      el.innerHTML = `<p class="center" style="font-size:1.2rem; font-weight:bold; margin-bottom:10px;">أنت: ${s} | المنافس: ${r}</p><div class="grid3">` +
        o.map((x, i) => `<button class="cell" data-i="${i}" style="font-size:2rem;">${x}</button>`).join('') + '</div>';
      el.querySelectorAll('.cell').forEach(b => b.onclick = () => {
        const m = +b.dataset.i, c = Math.random() * 3 | 0;
        if(m !== c) { (m - c + 3) % 3 === 1 ? s++ : r++; }
        if(s === 3 || r === 3) {
          const earned = s === 3 ? 10 : 3;
          addGamePoints(earned);
          return end(el, earned, s === 3 ? '🏆 فوز ملكي!' : '💪 حاول مجدداً!');
        }
        go();
      });
    };
    go();
  }],

  ['ttt','❌','إكس أو','Tic-Tac-Toe', el => {
    const b = Array(9).fill(''), L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]], w = p => L.some(l => l.every(i => b[i] === p));
    const d = () => {
      el.innerHTML = '<div class="grid3">' + b.map((x, i) => `<button class="cell" data-i="${i}" style="font-size:1.8rem;">${x}</button>`).join('') + '</div>';
      el.querySelectorAll('.cell').forEach(c => c.onclick = () => {
        const i = +c.dataset.i;
        if(b[i]) return;
        b[i] = '❤️';
        if(w('❤️')) { addGamePoints(10); return end(el, 10, '🏆 فوز رائع!'); }
        const f = b.map((x, j) => x ? -1 : j).filter(j => j >= 0);
        if(!f.length) { addGamePoints(3); return end(el, 3, '🤝 تعادل!'); }
        b[R(f)] = '🖤';
        if(w('🖤')) { addGamePoints(2); return end(el, 2, '🤖 فاز الذكاء الاصطناعي!'); }
        d();
      });
    };
    d();
  }],

  ['wheel','🎡','عجلة الحظ','Lucky Wheel', el => {
    el.innerHTML = '<div class="wheel" id="w" style="font-size:4rem; text-align:center; margin:15px 0;">🎡</div><div class="row"><button class="gold" id="s">دوران الحظ 🎰</button></div>';
    const w = el.querySelector('#w');
    el.querySelector('#s').onclick = function() {
      this.disabled = 1;
      w.style.transform = `rotate(${720 + Math.random() * 360}deg)`;
      setTimeout(() => {
        const earned = 2 + Math.random() * 8 | 0;
        addGamePoints(earned);
        end(el, earned, '🎁 مبروك جائزة الحظ!');
      }, 1900);
    };
  }],

  ['coin','🪙','وجه أم كتابة','Coin Flip', el => {
    el.innerHTML = '<div class="big-btn" style="font-size:3rem; text-align:center; margin:15px 0;">🪙</div><div class="grid2"><button class="cell" id="h">👑 تاج</button><button class="cell" id="t">🌹 وردة</button></div>';
    const f = s => {
      const r = +(Math.random() < .5);
      const earned = (r === s) ? 5 : 1;
      addGamePoints(earned);
      end(el, earned, r ? '👑 تاج' : '🌹 وردة');
    };
    el.querySelector('#h').onclick = () => f(1);
    el.querySelector('#t').onclick = () => f(0);
  }],

  ['simon','🎹','سيمون الذاكرة','Simon', el => {
    const C = ['🔴','🟡','🟢','🔵'];
    let seq = [], i = 0, lock = 1;
    el.innerHTML = '<p class="center" id="h" style="font-weight:bold; margin-bottom:10px;"></p><div class="grid2">' + C.map(c => `<button class="cell" style="font-size:2rem;">${c}</button>`).join('') + '</div>';
    const bs = [...el.querySelectorAll('.cell')], h = el.querySelector('#h');
    const play = () => {
      seq.push(Math.random() * 4 | 0); i = 0; lock = 1; h.textContent = '👀 تتبع التسلسل: ' + seq.length;
      seq.forEach((k, j) => setTimeout(() => { bs[k].classList.add('lit'); setTimeout(() => bs[k].classList.remove('lit'), 350); }, j * 600 + 400));
      setTimeout(() => { lock = 0; h.textContent = '👆 دورك!'; }, seq.length * 600 + 400);
    };
    bs.forEach((b, k) => b.onclick = () => {
      if(lock) return;
      if(k !== seq[i]) {
        const earned = Math.max(2, seq.length - 1);
        addGamePoints(earned);
        return end(el, earned, 'انتهت اللعبة! النتيجة: ' + (seq.length - 1));
      }
      if(++i === seq.length) setTimeout(play, 500);
    });
    play();
  }],

  ['calc','💘','حاسبة الحب','Love Calculator', el => {
    el.innerHTML = '<input id="a" placeholder="اسمك أو صفتك"><input id="b" placeholder="اسم الطرف الآخر"><button class="gold" id="g">احسب نسبة الحب 💘</button>';
    el.querySelector('#g').onclick = () => {
      const s = el.querySelector('#a').value + el.querySelector('#b').value;
      const p = [...s].reduce((x, c) => x + c.charCodeAt(0), 0) % 21 + 80;
      addGamePoints(5);
      end(el, 5, p + '% 💞 تناغم مذهل');
    };
  }],

  ['gift','🎁','اختاري هدية','Lucky Gift', el => {
    el.innerHTML = '<div class="grid3">' + '<button class="cell" style="font-size:2rem;">🎁</button>'.repeat(3) + '</div>';
    const p = sh([2, 5, 10]);
    el.querySelectorAll('.cell').forEach((b, i) => b.onclick = () => {
      addGamePoints(p[i]);
      end(el, p[i], '🎁 مفاجأة السعادة!');
    });
  }],

  ['hilo','📈','أعلى أم أقل','Higher or Lower', el => {
    let c = 1 + Math.random() * 12 | 0, s = 0;
    const go = () => {
      el.innerHTML = `<div class="big-card" style="font-size:3rem; text-align:center; margin:15px 0;">${c}</div><div class="grid2"><button class="cell" id="u">⬆️ أعلى</button><button class="cell" id="d">⬇️ أقل</button></div><p class="center" style="margin-top:10px;">النقاط المتراكمة: ${s}</p>`;
      const f = up => {
        const n = 1 + Math.random() * 12 | 0;
        if(n === c) return go();
        if((n > c) !== !!up) {
          const earned = Math.min(12, s * 2);
          addGamePoints(earned);
          return end(el, earned, 'انتهت الجولة! الرصيد: ' + s);
        }
        c = n; s++; go();
      };
      el.querySelector('#u').onclick = () => f(1);
      el.querySelector('#d').onclick = () => f(0);
    };
    go();
  }],

  ['dice','🎲','مبارزة النرد','Dice Duel', el => {
    el.innerHTML = '<div class="row"><button class="gold big-btn" id="r" style="padding:15px 30px; font-size:1.5rem;">ارمِ النرد 🎲</button></div>';
    el.querySelector('#r').onclick = () => {
      const a = 1 + Math.random() * 6 | 0, b = 1 + Math.random() * 6 | 0;
      const earned = a > b ? 6 : a === b ? 3 : 1;
      addGamePoints(earned);
      end(el, earned, `🎲 النرد: ${a} مقابل ${b}`);
    };
  }]
];
