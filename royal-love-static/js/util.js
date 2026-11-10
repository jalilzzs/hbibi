const $=id=>document.getElementById(id),
esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
iv=(f,t)=>(TM.push(setInterval(f,t)),TM[TM.length-1]),R=a=>a[Math.floor(Math.random()*a.length)];
let TM=[];
