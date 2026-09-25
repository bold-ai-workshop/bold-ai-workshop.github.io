/* ============================================================
   Cursor fields — each main section drives a different pointer-
   reactive animation on one shared full-page canvas. Sections
   carry a data-mode attribute; the field in view follows you.
   Every field responds to the cursor, and a click acts on it.
   ============================================================ */

(function(){
  const canvas = document.getElementById('swarm');
  const ctx = canvas.getContext('2d', { alpha:true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let CYAN,TEAL,AMBER,VIOLET,GROUND,LIGHT=false,PAL=[];
  function setThemeColors(isLight){
    LIGHT=isLight;
    if(isLight){CYAN='#0e9e86';TEAL='#12b89b';AMBER='#c2661f';VIOLET='#5b46d6';GROUND='238,241,246';}
    else{CYAN='#4fe3c1';TEAL='#7ef0da';AMBER='#f6a15a';VIOLET='#8f7bff';GROUND='7,8,16';}
    PAL=[CYAN,CYAN,TEAL,AMBER,VIOLET];
  }
  setThemeColors(document.documentElement.getAttribute('data-theme')==='light');
  let W=0,H=0,DPR=1,t=0,raf=0;
  const P={x:-9999,y:-9999,px:-9999,py:-9999,active:false,down:false};

  const rand=(a,b)=>a+Math.random()*(b-a);
  function hexA(hex,a){const h=hex.replace('#','');return 'rgba('+parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)+','+a+')';}
  function limit(x,y,m){const d=Math.hypot(x,y);return (d>m&&d>0)?[x/d*m,y/d*m]:[x,y];}
  function fade(a){ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba('+GROUND+','+a+')';ctx.fillRect(0,0,W,H);}
  const glow=()=>{ctx.globalCompositeOperation=LIGHT?'source-over':'lighter';};
  const norm=()=>{ctx.globalCompositeOperation='source-over';};
  function cursorGlow(col,r){if(!P.active)return;const g=ctx.createRadialGradient(P.x,P.y,0,P.x,P.y,r);g.addColorStop(0,hexA(col,.3));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(P.x,P.y,r,0,6.2832);ctx.fill();}

  //BACKGROUNDS

  /* ---------------- manager ---------------- */
  const MODES={swarm,limitcycle,network,automata,mouse,crystal,oscillators,orbit,lattice,ripple,comet};
  const LABELS={swarm:'swarm',limitcycle:'limit cycles',network:'network',automata:'cellular automata',mouse:'mouse',crystal:'crystal lattice',oscillators:'coupled oscillators',orbit:'orbit',lattice:'elastic lattice',ripple:'wavefronts',comet:'comet trails'};
  const ACCENT={swarm:CYAN,limitcycle:VIOLET,network:AMBER,automata:TEAL,mouse:'#e58fb0',crystal:CYAN,oscillators:CYAN,orbit:VIOLET,lattice:AMBER,ripple:CYAN,comet:AMBER};
  let current='swarm',mode=MODES.swarm;

  const badge=document.getElementById('modeBadge');
  const badgeName=document.getElementById('modeName');
  let badgeTimer;
  function setMode(name){
    if(!MODES[name]||name===current)return;
    current=name;mode=MODES[name];
    canvas.style.opacity = name==='mouse' ? '0.95' : '';   /* mouse reads crisp; others use CSS default */
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,W,H);
    mode.enter();
    if(badge){badgeName.textContent=LABELS[name];badge.querySelector('i').style.background=ACCENT[name];badge.querySelector('i').style.boxShadow='0 0 9px '+ACCENT[name];badge.classList.add('show');clearTimeout(badgeTimer);badgeTimer=setTimeout(()=>badge.classList.remove('show'),2600);}
  }

  function resize(){
    DPR=Math.min(window.devicePixelRatio||1,2);
    W=window.innerWidth;H=window.innerHeight;
    canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    mode.enter();
  }

  function setPointer(x,y){P.x=x;P.y=y;P.active=true;}
  window.addEventListener('mousemove',e=>setPointer(e.clientX,e.clientY),{passive:true});
  window.addEventListener('mouseleave',()=>{P.active=false;});
  window.addEventListener('touchmove',e=>{if(e.touches[0])setPointer(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  window.addEventListener('touchend',()=>{P.active=false;});
  if(!reduced){
    window.addEventListener('pointerdown',e=>{P.down=true;setPointer(e.clientX,e.clientY);if(mode.grab)mode.grab(e.clientX,e.clientY);if(mode.click)mode.click(e.clientX,e.clientY);},{passive:true});
    window.addEventListener('pointerup',()=>{P.down=false;if(mode.release)mode.release();},{passive:true});
    window.addEventListener('pointercancel',()=>{P.down=false;if(mode.release)mode.release();},{passive:true});
  }

  let rTimer;
  window.addEventListener('resize',()=>{clearTimeout(rTimer);rTimer=setTimeout(()=>{resize();if(reduced)staticFrame();},160);});

  // pick the field for whichever section holds the viewport's upper third.
  // secs is populated by __initCanvas(), after the panels have been injected.
  let secs=[];
  // shuffle(on): draw distinct fields at random from the full pool (incl. the
  // otherwise-unused ones); shuffle(off): restore each section's designed field.
  // Exposed so the header switch can flip it live. Default is OFF.
  window.__shuffleModes=function(on){
    if(on){
      const pool=Object.keys(MODES);
      for(let i=pool.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;const tmp=pool[i];pool[i]=pool[j];pool[j]=tmp;}
      secs.forEach((s,i)=>s.setAttribute('data-mode',pool[i%pool.length]));
    }else{
      secs.forEach(s=>s.setAttribute('data-mode',s.dataset.modeDefault));
    }
    pickMode();
    if(reduced)staticFrame();
  };
  let scheduled=false;
  function pickMode(){
    scheduled=false;
    const mid=window.innerHeight*0.42;let best=null;
    for(const s of secs){const r=s.getBoundingClientRect();if(r.top<=mid&&r.bottom>=mid){best=s;break;}}
    if(!best){let dmin=1e9;for(const s of secs){const r=s.getBoundingClientRect();const d=Math.abs((r.top+r.bottom)/2-mid);if(d<dmin){dmin=d;best=s;}}}
    if(best)setMode(best.getAttribute('data-mode'));
  }
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(pickMode);}},{passive:true});

  function loop(){t+=16;mode.frame();P.px=P.x;P.py=P.y;raf=requestAnimationFrame(loop);}
  function staticFrame(){ctx.fillStyle='#070810';ctx.fillRect(0,0,W,H);swarm.enter();for(let i=0;i<48;i++)swarm.frame();}

  // let the theme toggle re-skin the canvas live
  window.__setCanvasTheme=function(isLight){
    setThemeColors(isLight);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,W,H);
    mode.enter();
    if(reduced)staticFrame();
  };

  // Deferred start — called once the panels have been fetched and injected.
  window.__initCanvas=function(){
    secs=Array.prototype.slice.call(document.querySelectorAll('[data-mode]'));
    secs.forEach(s=>{if(!s.dataset.modeDefault)s.dataset.modeDefault=s.getAttribute('data-mode');});
    resize();
    if(reduced){mode=swarm;staticFrame();}
    else{
      pickMode();
      document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);}else{raf=requestAnimationFrame(loop);}});
      loop();
    }
  };
})();

window.__initUI=function(){

/* mobile nav toggle */
(function(){
  const t=document.getElementById('menuToggle');
  const l=document.getElementById('navlinks');
  if(!t)return;
  t.addEventListener('click',()=>{const open=l.classList.toggle('open');t.setAttribute('aria-expanded',open?'true':'false');});
  l.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{l.classList.remove('open');t.setAttribute('aria-expanded','false');}));
})();

/* theme toggle */
(function(){
  const root=document.documentElement, btn=document.getElementById('themeToggle');
  if(!btn) return;
  const cur=()=>root.getAttribute('data-theme')==='light'?'light':'dark';
  function set(mode){
    root.setAttribute('data-theme',mode);
    try{localStorage.setItem('uai-theme',mode);}catch(e){}
    btn.setAttribute('aria-pressed',mode==='light'?'true':'false');
    if(window.__setCanvasTheme)window.__setCanvasTheme(mode==='light');
  }
  set(cur());
  btn.addEventListener('click',()=>set(cur()==='light'?'dark':'light'));
})();

/* shuffle switch: randomize each panel's background field, or keep the designed set.
   Default OFF; choice remembered per viewer. */
(function(){
  const btn=document.getElementById('shuffleToggle');
  if(!btn) return;
  let on=false;
  try{on=localStorage.getItem('uai-shuffle')==='1';}catch(e){}
  function apply(state,persist){
    on=state;
    btn.setAttribute('aria-pressed',on?'true':'false');
    btn.title='Shuffle backgrounds: '+(on?'on':'off');
    if(persist){try{localStorage.setItem('uai-shuffle',on?'1':'0');}catch(e){}}
    if(window.__shuffleModes)window.__shuffleModes(on);
  }
  apply(on,false);                 // reflect saved state on load (default OFF)
  btn.addEventListener('click',()=>apply(!on,true));
})();

/* BOLD brandmark: big intro that shrinks to the title, then cycles backronyms.
   Refactored so the replay button can re-run the whole sequence. */
(function(){
  const mark=document.getElementById('boldmark'), main=document.getElementById('top');
  if(!mark||!main) return;
  const tailEls=Array.prototype.slice.call(mark.querySelectorAll('.tail'));
  const TAILS=[
    ['eyond the','rthodox','earning &','esign'],      // Beyond the Orthodox Learning & Design
    ['eyond the','rthodoxy in','earning &','ynamics'],// Beyond the Orthodoxy in Learning & Dynamics
    ['rains,','rganisms,','attices &','ynamics'],      // Brains, Organisms, Lattices & Dynamics
    ['uilding','rthogonal','earning','irections']      // Building Orthogonal Learning Directions
  ];
  const connEl=mark.querySelector('.conn');
  const CONN=['of','of','of','in'];   // grammatical connector per backronym
  const setTails=a=>{for(let k=0;k<4;k++)tailEls[k].textContent=a[k];};
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx=0, timers=[];
  const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.push(t);return t;};
  const clearTimers=()=>{timers.forEach(clearTimeout);timers=[];};

  function cycle(){
    setTails(TAILS[idx]);                                   // set while collapsed (hidden)
    if(connEl)connEl.textContent=CONN[idx];                 // "of" / "in" to match the phrase
    requestAnimationFrame(()=>requestAnimationFrame(()=>mark.classList.add('expanded')));
    later(()=>{
      mark.classList.remove('expanded');                    // reduce back to B O L D
      later(()=>{ idx=(idx+1)%TAILS.length; cycle(); }, 1500);
    }, 3200);
  }

  function playIntro(){
    clearTimers();
    window.scrollTo(0,0);
    idx=0;
    mark.classList.remove('expanded');
    setTails(['','','','']);                                 // collapse to B O L D
    main.classList.add('intro');                            // hide the rest of the hero
    mark.style.transition='none';
    mark.style.transform='';
    void mark.offsetWidth;
    if(reducedMotion){ main.classList.remove('intro'); return; }   // reduced motion: just reset
    const r=mark.getBoundingClientRect();
    const scale=Math.min(1.7, (window.innerWidth*0.94)/Math.max(r.width,1));
    const tx=window.innerWidth/2-(r.left+r.width/2), ty=window.innerHeight*0.5-(r.top+r.height/2);
    mark.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')';
    mark.style.zIndex='40';
    void mark.offsetWidth;                                   // commit the start state
    later(()=>{
      mark.style.transition='transform 0.95s cubic-bezier(.2,.7,.2,1)';
      mark.style.transform='';
      later(()=>{ mark.style.zIndex=''; main.classList.remove('intro'); cycle(); }, 1000);
    }, 1050);
  }

  const rb=document.getElementById('replayBtn');
  if(rb) rb.addEventListener('click', playIntro);

  if(reducedMotion){ main.classList.remove('intro'); } else { playIntro(); }
})();

/* scroll reveals */
(function(){
  const els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(e=>e.classList.add('in'));return;}
  const io=new IntersectionObserver((ents)=>{ents.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:0.12,rootMargin:'0px 0px -8% 0px'});
  els.forEach(e=>io.observe(e));
})();

};  /* end __initUI */


/* ---------------- runtime assembly ----------------
   The page shell (index.html) is intentionally thin: it carries only the
   header, footer and canvas. The panels are fetched from panels/ at load,
   so editing a file in panels/ changes the site with no rebuild. (Served
   over http:// — GitHub Pages, or `python3 -m http.server` locally.) */
async function __loadPanels(){
  const main=document.getElementById('top');
  if(!main) return;
  let order;
  try{ order=await (await fetch('panels/_order.json',{cache:'no-cache'})).json(); }
  catch(e){ console.error('Could not load panels/_order.json — serve over http, not file://', e); return; }
  const visible=order.filter(p=>!p.hidden);
  const parts=await Promise.all(visible.map(p=>
    fetch('panels/'+p.file+'.html',{cache:'no-cache'})
      .then(r=>{ if(!r.ok) throw new Error(p.file+': '+r.status); return r.text(); })
      .catch(e=>{ console.error('panel failed:',e); return ''; })
  ));
  main.innerHTML=parts.join('\n\n');
}

(async function __boot(){
  await __loadPanels();   // fill <main> from panels/
  __initCanvas();         // start the cursor-field engine (reads the injected sections)
  __initUI();             // wire nav, theme, shuffle, brandmark, reveals
})();
