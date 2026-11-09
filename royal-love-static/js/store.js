/* Progress (love points, baby, best scores, last mood) is saved in this browser only. No backend. */
const Prog={onchange:null,err:'',
d:(()=>{try{return JSON.parse(localStorage.getItem('prog'))}catch(e){return null}})()||{love_points:0,baby_name:'البيبي',baby_gender:'girl',scores:{},last_mood:''},
store(){try{localStorage.setItem('prog',JSON.stringify(this.d))}catch(e){}this.onchange&&this.onchange()},
add(n){n=Math.min(50,Math.max(0,n|0));if(n){this.d.love_points=(this.d.love_points|0)+n;this.store()}},
baby(g,nm){this.d.baby_gender=g;this.d.baby_name=nm;this.store()},
score(g,s){this.d.scores=this.d.scores||{};if(s>(this.d.scores[g]||0)){this.d.scores[g]=s;this.store()}},
mood(m){this.d.last_mood=m;this.store()}};
