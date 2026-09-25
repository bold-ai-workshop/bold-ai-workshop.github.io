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

  /* ---------------- SWARM (boids + click disperse) ---------------- */
  const swarm=(()=>{
    let boids=[];const bursts=[];
    const C={perc:62,sep:26,ms:2.05,mf:.045,wS:1.55,wA:.85,wC:.7,wCur:.9,range:260,link:78};
    const count=()=>Math.max(45,Math.min(reduced?90:160,Math.round(W*H/13000)));
    function mk(){const a=rand(0,6.2832),s=rand(.6,C.ms);return{x:rand(0,W),y:rand(0,H),vx:Math.cos(a)*s,vy:Math.sin(a)*s,ax:0,ay:0,bx:0,by:0,scatter:0,c:PAL[(Math.random()*PAL.length)|0],r:rand(1.1,2.4)};}
    return{
      enter(){boids=[];const n=count();for(let i=0;i<n;i++)boids.push(mk());bursts.length=0;},
      click(x,y){const R=300;bursts.push({x,y,radius:R,life:1,ring:0});for(const b of boids){const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy)||1e-4;if(d<R){const f=1-d/R,k=6+f*14;b.bx+=dx/d*k;b.by+=dy/d*k;b.scatter=Math.round(45+f*45);}}},
      frame(){
        fade(.22);
        for(let i=0;i<boids.length;i++){const b=boids[i];let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,ns=0,na=0,nc=0;
          for(let j=0;j<boids.length;j++){if(i===j)continue;const o=boids[j];const dx=b.x-o.x,dy=b.y-o.y,d2=dx*dx+dy*dy;if(d2>C.perc*C.perc)continue;const d=Math.sqrt(d2)||1e-4;if(d<C.sep){sx+=dx/d;sy+=dy/d;ns++;}ax+=o.vx;ay+=o.vy;na++;cx+=o.x;cy+=o.y;nc++;}
          let fx=0,fy=0;const flock=b.scatter>0?.12:1;
          if(ns>0){let[a1,a2]=limit(sx/ns,sy/ns,C.ms);a1-=b.vx;a2-=b.vy;[a1,a2]=limit(a1,a2,C.mf);fx+=a1*C.wS;fy+=a2*C.wS;}
          if(na>0){let[a1,a2]=limit(ax/na,ay/na,C.ms);a1-=b.vx;a2-=b.vy;[a1,a2]=limit(a1,a2,C.mf);fx+=a1*C.wA;fy+=a2*C.wA;}
          if(nc>0){let a1=cx/nc-b.x,a2=cy/nc-b.y;[a1,a2]=limit(a1,a2,C.ms);a1-=b.vx;a2-=b.vy;[a1,a2]=limit(a1,a2,C.mf);fx+=a1*C.wC*flock;fy+=a2*C.wC*flock;}
          for(const s of bursts){const dx=b.x-s.x,dy=b.y-s.y,d=Math.hypot(dx,dy);if(d<s.radius&&d>.5){const push=(1-d/s.radius)*s.life*C.mf*6;fx+=dx/d*push;fy+=dy/d*push;}}
          if(P.active){const dx=P.x-b.x,dy=P.y-b.y,d=Math.hypot(dx,dy);if(d<C.range&&d>.5){const st=1-d/C.range;let ux=dx/d,uy=dy/d;const tx=-uy,ty=ux;ux=ux*.62+tx*.55;uy=uy*.62+ty*.55;fx+=ux*C.mf*C.wCur*(.5+st*2.2)*flock;fy+=uy*C.mf*C.wCur*(.5+st*2.2)*flock;}}
          b.ax=fx;b.ay=fy;
        }
        for(const b of boids){b.vx+=b.ax;b.vy+=b.ay;[b.vx,b.vy]=limit(b.vx,b.vy,C.ms);const sp=Math.hypot(b.vx,b.vy);if(sp<.35){const k=.35/(sp||1);b.vx*=k;b.vy*=k;}b.x+=b.vx+b.bx;b.y+=b.vy+b.by;b.bx*=.9;b.by*=.9;if(b.scatter>0)b.scatter--;const m=40;if(b.x<-m)b.x=W+m;else if(b.x>W+m)b.x=-m;if(b.y<-m)b.y=H+m;else if(b.y>H+m)b.y=-m;}
        for(let i=bursts.length-1;i>=0;i--){bursts[i].life-=.03;bursts[i].ring+=9;if(bursts[i].life<=0)bursts.splice(i,1);}
        glow();ctx.lineWidth=1;const LD=C.link,LD2=LD*LD;
        for(let i=0;i<boids.length;i++){const a=boids[i];for(let j=i+1;j<boids.length;j++){const c=boids[j];const dx=a.x-c.x,dy=a.y-c.y,d2=dx*dx+dy*dy;if(d2<LD2){const al=(1-Math.sqrt(d2)/LD)*.22;ctx.strokeStyle=hexA(CYAN,al);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke();}}}
        for(const b of boids){const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*4.5);g.addColorStop(0,b.c);g.addColorStop(.4,hexA(b.c,.5));g.addColorStop(1,hexA(b.c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r*4.5,0,6.2832);ctx.fill();ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r*.75,0,6.2832);ctx.fill();}
        for(const s of bursts){ctx.strokeStyle=hexA(CYAN,s.life*.5);ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,s.ring,0,6.2832);ctx.stroke();ctx.strokeStyle=hexA(AMBER,s.life*.28);ctx.beginPath();ctx.arc(s.x,s.y,s.ring*.6,0,6.2832);ctx.stroke();}
        cursorGlow(CYAN,26);norm();
      }
    };
  })();

  /* ---------------- LIMIT CYCLES (Van der Pol flow, streaks) -----------------
     Short streaks trace the vector field and fade in and out, revealing how the
     flow everywhere sweeps onto the one attracting closed orbit. A click
     flushes and re-seeds the field. --------------------------------------------*/
  const limitcycle=(()=>{
    let st=[],cx=0,cy=0,SC=100,guide=[],secEl=null;const MU=1.25,LEN=22;
    const count=()=>Math.max(90,Math.min(reduced?120:340,Math.round(W*H/4600)));
    const deriv=(x,y)=>[y, MU*(1-x*x)*y - x];
    function panelCenter(){const s=secEl||(secEl=document.getElementById('about'));if(!s)return[W/2,H/2];const r=s.getBoundingClientRect();const top=Math.max(r.top,0),bot=Math.min(r.bottom,H);return[r.left+r.width/2,(top+bot)/2];}
    function integ(x,y,dt){const sub=4,h=dt/sub;for(let s=0;s<sub;s++){const d1=deriv(x,y);const mx=x+d1[0]*h*.5,my=y+d1[1]*h*.5;const d2=deriv(mx,my);x+=d2[0]*h;y+=d2[1]*h;}return[x,y];}
    function buildGuide(){let x=0.5,y=0,r;for(let i=0;i<1600;i++){r=integ(x,y,0.02);x=r[0];y=r[1];}guide=[];for(let i=0;i<540;i++){r=integ(x,y,0.02);x=r[0];y=r[1];guide.push([x,y]);}}
    const pickC=()=>Math.random()<.66?CYAN:(Math.random()<.5?VIOLET:AMBER);
    function seed(s,fresh){const a=rand(0,6.2832),r=rand(0.15,4.0);s.x=Math.cos(a)*r;s.y=Math.sin(a)*r;s.trail=[];s.life=Math.round(rand(80,175));s.age=fresh?0:Math.floor(rand(0,s.life));s.c=pickC();}
    function mk(){const s={};seed(s,false);return s;}
    const envelope=a=>{const fi=.22,fo=.32;return a<fi?a/fi:(a>1-fo?(1-a)/fo:1);};
    return{
      enter(){SC=Math.min(W,H)/8;buildGuide();st=[];const n=count();for(let i=0;i<n;i++)st.push(mk());secEl=document.getElementById('about');const c=panelCenter();cx=c[0];cy=c[1];},
      click(){for(const s of st)seed(s,true);},
      frame(){
        fade(1);                          // clear each frame — streaks come and go
        const c=panelCenter();
        cx+=(c[0]-cx)*.08;cy+=(c[1]-cy)*.08;
        glow();
        // faint attracting limit cycle for reference
        ctx.strokeStyle=hexA(AMBER,.12);ctx.lineWidth=1.4;ctx.beginPath();
        for(let i=0;i<guide.length;i++){const gx=cx+guide[i][0]*SC,gy=cy-guide[i][1]*SC;if(i===0)ctx.moveTo(gx,gy);else ctx.lineTo(gx,gy);}
        ctx.stroke();
        // streaks tracing the flow, fading in and out
        for(const s of st){
          const r=integ(s.x,s.y,0.022);s.x=r[0];s.y=r[1];
          s.trail.push([cx+s.x*SC,cy-s.y*SC]);
          if(s.trail.length>LEN)s.trail.shift();
          s.age++;
          const e=envelope(s.age/s.life),T=s.trail;
          for(let i=1;i<T.length;i++){
            const a=T[i-1],b=T[i];
            if(Math.abs(a[0]-b[0])>120||Math.abs(a[1]-b[1])>120)continue;
            const seg=i/T.length;         // brighter toward the streak's head
            ctx.strokeStyle=hexA(s.c,e*seg*1.0);
            ctx.lineWidth=0.6+seg*2.1;
            ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
          }
          if(s.age>=s.life)seed(s,true);
        }
        norm();
      }
    };
  })();

  /* ---------------- NETWORK constellation ---------------- */
  const network=(()=>{
    let ns=[];const link=140;
    const count=()=>Math.max(30,Math.min(reduced?45:88,Math.round(W*H/24000)));
    function mk(){const a=rand(0,6.2832),s=rand(.25,.65);return{x:rand(0,W),y:rand(0,H),vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:rand(1.4,2.6),pulse:0,hot:false};}
    return{
      enter(){ns=[];const n=count();for(let i=0;i<n;i++)ns.push(mk());},
      click(x,y){for(const p of ns){const dx=p.x-x,dy=p.y-y;if(dx*dx+dy*dy<200*200)p.pulse=1;}},
      frame(){
        fade(.28);
        for(const p of ns){
          p.hot=false;
          p.x+=p.vx;p.y+=p.vy;
          if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
          p.x=Math.max(0,Math.min(W,p.x));p.y=Math.max(0,Math.min(H,p.y));
          const sp=Math.hypot(p.vx,p.vy);if(sp>0){const k=(sp*.985+.5*.015)/sp;p.vx*=k;p.vy*=k;}
          if(p.pulse>0)p.pulse-=.02;
        }
        glow();const L2=link*link;
        for(let i=0;i<ns.length;i++){const a=ns[i];for(let j=i+1;j<ns.length;j++){const b=ns[j];const dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2<L2){const al=(1-Math.sqrt(d2)/link)*.3;ctx.strokeStyle=hexA(CYAN,al);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
        if(P.active){for(const p of ns){const dx=P.x-p.x,dy=P.y-p.y,d=Math.hypot(dx,dy);if(d<link*1.4){p.hot=true;const al=(1-d/(link*1.4))*.6;ctx.strokeStyle=hexA(AMBER,al);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(p.x,p.y);ctx.stroke();}}}
        for(const p of ns){const col=p.hot?AMBER:CYAN;const r=p.r*(1+p.pulse*2.2);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*3.5);g.addColorStop(0,col);g.addColorStop(.4,hexA(col,.5));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r*3.5,0,6.2832);ctx.fill();ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,r*.8,0,6.2832);ctx.fill();}
        if(P.active){ctx.fillStyle=hexA(AMBER,.95);ctx.beginPath();ctx.arc(P.x,P.y,3,0,6.2832);ctx.fill();cursorGlow(AMBER,34);}
        norm();
      }
    };
  })();

  /* ---------------- CELLULAR AUTOMATA (Conway's Life; draw with cursor) ---------------- */
  const automata=(()=>{
    let cols,rows,cell,grid,age,acc=0;const STEP=7;
    function build(){cell=Math.max(13,Math.round(Math.min(W,H)/46));cols=Math.ceil(W/cell)+1;rows=Math.ceil(H/cell)+1;grid=new Uint8Array(cols*rows);age=new Uint16Array(cols*rows);seed();}
    function seed(){for(let i=0;i<grid.length;i++){grid[i]=Math.random()<.10?1:0;age[i]=grid[i];}}
    const idx=(c,r)=>((r%rows+rows)%rows)*cols+((c%cols+cols)%cols);
    function paint(x,y,R){const cc=Math.floor(x/cell),cr=Math.floor(y/cell);for(let dr=-R;dr<=R;dr++)for(let dc=-R;dc<=R;dc++){if(dc*dc+dr*dr<=R*R&&Math.random()<.55){const i=idx(cc+dc,cr+dr);if(!grid[i]){grid[i]=1;age[i]=1;}}}}
    function tick(){const ng=new Uint8Array(grid.length);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let n=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(dc||dr)n+=grid[idx(c+dc,r+dr)];}const i=r*cols+c,al=grid[i],nx=(al&&(n===2||n===3))||(!al&&n===3)?1:0;ng[i]=nx;age[i]=nx?Math.min(age[i]+1,999):0;}grid=ng;}
    return{
      enter(){build();},
      click(x,y){const cc=Math.floor(x/cell),cr=Math.floor(y/cell);const gl=[[0,-1],[1,0],[-1,1],[0,1],[1,1]];for(const g of gl){const i=idx(cc+g[0],cr+g[1]);grid[i]=1;age[i]=1;}paint(x,y,3);},
      frame(){
        fade(.34);
        if(P.active)paint(P.x,P.y,2);
        if(++acc>=STEP){acc=0;tick();}
        glow();
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*cols+c;if(!grid[i])continue;const x=c*cell,y=r*cell,a=age[i];const col=a<=1?CYAN:(a<5?TEAL:(a<12?AMBER:VIOLET));const cxp=x+cell/2,cyp=y+cell/2,s=cell*.8;const g=ctx.createRadialGradient(cxp,cyp,0,cxp,cyp,s);g.addColorStop(0,hexA(col,.85));g.addColorStop(.5,hexA(col,.35));g.addColorStop(1,hexA(col,0));ctx.fillStyle=g;ctx.fillRect(cxp-s,cyp-s,s*2,s*2);ctx.fillStyle=hexA(col,.95);ctx.fillRect(x+cell*.3,y+cell*.3,cell*.4,cell*.4);}
        cursorGlow(CYAN,cell*2.6);norm();
      }
    };
  })();

  /* ---------------- ORBIT (particles circle the cursor) ---------------- */
  const orbit=(()=>{
    let ps=[],cx=0,cy=0;
    const count=()=>Math.max(40,Math.min(reduced?60:130,Math.round(W*H/12000)));
    function mk(){const r=rand(20,Math.min(W,H)*.42),sp=rand(.004,.02)*(Math.random()<.5?1:-1);return{r,r0:r,a:rand(0,6.2832),sp,sp0:sp,c:Math.random()<.66?CYAN:(Math.random()<.5?AMBER:VIOLET),rad:rand(1,2.2),x:0,y:0,px:0,py:0};}
    return{
      enter(){ps=[];const n=count();for(let i=0;i<n;i++)ps.push(mk());cx=W/2;cy=H/2;},
      click(){for(const p of ps){p.r*=rand(1.15,1.5);p.sp*=1.5;}},
      frame(){
        fade(.16);
        const tx=P.active?P.x:W/2,ty=P.active?P.y:H/2;
        cx+=(tx-cx)*.06;cy+=(ty-cy)*.06;
        glow();
        for(const p of ps){
          p.a+=p.sp;p.r+=(p.r0-p.r)*.02;p.sp+=(p.sp0-p.sp)*.03;
          p.px=p.x;p.py=p.y;p.x=cx+Math.cos(p.a)*p.r;p.y=cy+Math.sin(p.a)*p.r;
          ctx.strokeStyle=hexA(p.c,.42);ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke();
          ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.rad,0,6.2832);ctx.fill();
        }
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,42);g.addColorStop(0,hexA(CYAN,.32));g.addColorStop(1,hexA(CYAN,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,42,0,6.2832);ctx.fill();
        norm();
      }
    };
  })();

  /* ---------------- MOUSE (the cursor is a little mouse that scurries) --------
     Note: the ORBIT field above is retained in the code and still registered in
     MODES — it is simply not assigned to a section right now, so it can be
     dropped back onto any cell by setting that section's data-mode="orbit". ----*/
  const mouse=(()=>{
    let mx=0,my=0,head=0,legPhase=0,prints=[],rings=[];
    let fields=[],sigma=40,spikes=[],lastSample=0;
    function buildFields(){
      fields=[];
      const spacing=Math.max(120,Math.min(W,H)/5.2), dyv=spacing*Math.sqrt(3)/2;
      const ang=0.26, ca=Math.cos(ang), sa=Math.sin(ang), cxc=W/2, cyc=H/2;
      sigma=spacing*0.20; const m=sigma*2, R=Math.hypot(W,H)/2+spacing;
      const rr=Math.ceil(R/dyv), cc=Math.ceil(R/spacing);
      for(let row=-rr;row<=rr;row++)for(let col=-cc;col<=cc;col++){
        const x=col*spacing+((row&1)?spacing/2:0), y=row*dyv;
        const rx=x*ca-y*sa+cxc, ry=x*sa+y*ca+cyc;
        if(rx>=-m&&rx<=W+m&&ry>=-m&&ry<=H+m)fields.push([rx,ry]);
      }
    }
    function rateAt(x,y){let best=0;const s2=2*sigma*sigma,cut=s2*9;for(const f of fields){const dx=x-f[0],dy=y-f[1],d2=dx*dx+dy*dy;if(d2>cut)continue;const g=Math.exp(-d2/s2);if(g>best)best=g;}return best;}
    const clk=()=>(typeof performance!=='undefined'?performance.now():Date.now());
    return{
      enter(){mx=P.active?P.x:W/2;my=P.active?P.y:H/2;head=0;prints=[];rings=[];spikes=[];buildFields();lastSample=clk();},
      click(x,y){rings.push({x,y,r:4,life:1});},
      frame(){
        fade(1);
        ctx.globalCompositeOperation='source-over';
        const tx=P.active?P.x:W/2, ty=P.active?P.y:H/2;
        const dx=tx-mx, dy=ty-my, dist=Math.hypot(dx,dy);
        const ease=0.16; mx+=dx*ease; my+=dy*ease;
        const spd=Math.hypot(dx*ease,dy*ease);
        if(dist>2){let da=Math.atan2(dy,dx)-head;while(da>Math.PI)da-=6.2832;while(da<-Math.PI)da+=6.2832;head+=da*0.25;}
        legPhase+=Math.min(spd*0.6,1.3)+0.05;
        const FUR=LIGHT?'#5b6480':'#cdd2e4', EAR=LIGHT?'#c96585':'#f2acc6', EYE=LIGHT?'#12151f':'#0a0c14';
        const FIELD=LIGHT?'#6f7bff':'#8f7bff', SPIKE=LIGHT?'#d1324f':'#ff5c7a';
        // grid-cell firing map: hexagonally-arranged firing fields
        for(const f of fields){const g=ctx.createRadialGradient(f[0],f[1],0,f[0],f[1],sigma*1.7);g.addColorStop(0,hexA(FIELD,LIGHT?0.13:0.17));g.addColorStop(1,hexA(FIELD,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(f[0],f[1],sigma*1.7,0,6.2832);ctx.fill();}
        // frequent location-dependent checks: a spike chance every 40ms (per-check probability unchanged)
        const now=clk();
        if(now-lastSample>=40){lastSample=now;if(spd>0.4){const pr=rateAt(mx,my);if(Math.random()<pr*0.9){spikes.push({x:mx,y:my,life:1,flash:1});if(spikes.length>500)spikes.shift();}}}
        // accumulated spikes reveal the hexagonal grid
        for(let i=spikes.length-1;i>=0;i--){const s=spikes[i];s.life-=0.0016;if(s.flash>0)s.flash-=0.06;if(s.life<=0){spikes.splice(i,1);continue;}if(s.flash>0){ctx.strokeStyle=hexA(SPIKE,s.flash*0.6);ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(s.x,s.y,(1-s.flash)*16+3,0,6.2832);ctx.stroke();}ctx.fillStyle=hexA(SPIKE,Math.min(1,s.life+0.2));ctx.beginPath();ctx.arc(s.x,s.y,2.1,0,6.2832);ctx.fill();}
        // footprints
        if(spd>1.4 && Math.random()<0.5)prints.push({x:mx-Math.cos(head)*15,y:my-Math.sin(head)*15,a:1});
        for(let i=prints.length-1;i>=0;i--){const p=prints[i];p.a-=0.02;if(p.a<=0){prints.splice(i,1);continue;}ctx.fillStyle=hexA(FUR,p.a*0.22);ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,6.2832);ctx.fill();}
        // squeak rings on click
        for(let i=rings.length-1;i>=0;i--){const s=rings[i];s.r+=2.4;s.life-=0.03;if(s.life<=0){rings.splice(i,1);continue;}ctx.strokeStyle=hexA(EAR,s.life*0.55);ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.2832);ctx.stroke();}
        // the mouse
        ctx.save();ctx.translate(mx,my);ctx.rotate(head);ctx.lineCap='round';ctx.lineJoin='round';
        // multi-jointed tail: many tapering segments carrying a travelling wave
        {const amp=5+Math.min(spd,6)*1.7, ph=legPhase*0.85, N=16, x0=-16, x1=-60; let px=x0, py=0;
         ctx.strokeStyle=EAR;
         for(let i=1;i<=N;i++){const f=i/N;const x=x0+(x1-x0)*f;const y=Math.sin(ph-i*0.5)*amp*f;ctx.lineWidth=3.6*(1-f)+0.5;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(x,y);ctx.stroke();px=x;py=y;}}
        ctx.fillStyle=FUR;
        ctx.beginPath();ctx.ellipse(-2,0,16,10,0,0,6.2832);ctx.fill();
        ctx.beginPath();ctx.ellipse(13,0,9,8,0,0,6.2832);ctx.fill();
        ctx.beginPath();ctx.arc(15,-8,5.5,0,6.2832);ctx.fill();ctx.beginPath();ctx.arc(15,8,5.5,0,6.2832);ctx.fill();
        ctx.fillStyle=EAR;ctx.beginPath();ctx.arc(16,-8,3,0,6.2832);ctx.fill();ctx.beginPath();ctx.arc(16,8,3,0,6.2832);ctx.fill();
        ctx.fillStyle=EYE;ctx.beginPath();ctx.arc(17,-3.2,1.5,0,6.2832);ctx.fill();ctx.beginPath();ctx.arc(17,3.2,1.5,0,6.2832);ctx.fill();
        ctx.fillStyle=EAR;ctx.beginPath();ctx.arc(22,0,2,0,6.2832);ctx.fill();
        ctx.strokeStyle=hexA(FUR,0.7);ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(21,-1);ctx.lineTo(33,-6);ctx.moveTo(21,0);ctx.lineTo(34,0);ctx.moveTo(21,1);ctx.lineTo(33,6);ctx.stroke();
        ctx.restore();
      }
    };
  })();

  /* ---------------- LATTICE (elastic mesh the cursor pushes) ---------------- */
  const lattice=(()=>{
    let pts=[],gx,gy,sp;
    function build(){sp=Math.max(50,Math.round(Math.min(W,H)/12));gx=Math.floor(W/sp)+2;gy=Math.floor(H/sp)+2;pts=[];for(let r=0;r<gy;r++)for(let c=0;c<gx;c++){const ox=c*sp,oy=r*sp;pts.push({ox,oy,x:ox,y:oy,vx:0,vy:0});}}
    function line(a,b){const disp=(Math.hypot(a.x-a.ox,a.y-a.oy)+Math.hypot(b.x-b.ox,b.y-b.oy))*.5;const al=Math.min(.5,.1+disp*.02);const col=disp>8?AMBER:CYAN;ctx.strokeStyle=hexA(col,al);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    return{
      enter(){build();},
      click(x,y){for(const p of pts){const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);if(d<280&&d>1){const f=(1-d/280)*24;p.vx+=dx/d*f;p.vy+=dy/d*f;}}},
      frame(){
        fade(.30);
        for(const p of pts){
          if(P.active){const dx=p.x-P.x,dy=p.y-P.y,d=Math.hypot(dx,dy);if(d<135&&d>1){const f=(1-d/135)*3.4;p.vx+=dx/d*f;p.vy+=dy/d*f;}}
          p.vx+=(p.ox-p.x)*.06;p.vy+=(p.oy-p.y)*.06;p.vx*=.86;p.vy*=.86;p.x+=p.vx;p.y+=p.vy;
        }
        glow();ctx.lineWidth=1;
        for(let r=0;r<gy;r++)for(let c=0;c<gx;c++){const i=r*gx+c,p=pts[i];if(c<gx-1)line(p,pts[i+1]);if(r<gy-1)line(p,pts[i+gx]);}
        for(const p of pts){const disp=Math.hypot(p.x-p.ox,p.y-p.oy);ctx.fillStyle=hexA(disp>6?AMBER:CYAN,.8);ctx.beginPath();ctx.arc(p.x,p.y,1.7,0,6.2832);ctx.fill();}
        cursorGlow(CYAN,26);norm();
      }
    };
  })();

  /* ---------------- RIPPLE wavefronts ---------------- */
  const ripple=(()=>{
    let rings=[];
    return{
      enter(){rings=[];},
      click(x,y){rings.push({x,y,r:0,life:1,w:3,vr:5});},
      frame(){
        fade(.13);
        if(P.active&&Math.hypot(P.x-P.px,P.y-P.py)>18)rings.push({x:P.x,y:P.y,r:0,life:1,w:1.5,vr:2.4});
        glow();
        for(let i=rings.length-1;i>=0;i--){const s=rings[i];s.r+=s.vr;s.life-=.012;if(s.life<=0){rings.splice(i,1);continue;}ctx.strokeStyle=hexA(i%2?AMBER:CYAN,s.life*.5);ctx.lineWidth=s.w;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.2832);ctx.stroke();}
        if(P.active){ctx.fillStyle=hexA(CYAN,.85);ctx.beginPath();ctx.arc(P.x,P.y,2.6,0,6.2832);ctx.fill();}
        norm();
      }
    };
  })();

  /* ---------------- COMET trails ---------------- */
  const comet=(()=>{
    let heads=[],sparks=[];const cols=[CYAN,AMBER,VIOLET];
    function init(){heads=[];for(let k=0;k<3;k++)heads.push({x:W/2,y:H/2,ease:.12+k*.05,c:cols[k],tail:[]});sparks=[];}
    return{
      enter(){init();},
      click(x,y){for(let i=0;i<28;i++){const a=rand(0,6.2832),s=rand(1,6);sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,c:cols[(Math.random()*3)|0]});}},
      frame(){
        fade(.16);
        const tx=P.active?P.x:W/2+Math.cos(t*.001)*W*.2,ty=P.active?P.y:H/2+Math.sin(t*.0013)*H*.2;
        glow();
        for(const h of heads){
          h.x+=(tx-h.x)*h.ease;h.y+=(ty-h.y)*h.ease;
          h.tail.unshift({x:h.x,y:h.y});if(h.tail.length>22)h.tail.pop();
          for(let i=0;i<h.tail.length-1;i++){const p=h.tail[i],q=h.tail[i+1],al=(1-i/h.tail.length)*.6;ctx.strokeStyle=hexA(h.c,al);ctx.lineWidth=(1-i/h.tail.length)*4+.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
          const g=ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,12);g.addColorStop(0,hexA(h.c,.9));g.addColorStop(1,hexA(h.c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(h.x,h.y,12,0,6.2832);ctx.fill();
        }
        for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx;s.y+=s.vy;s.vx*=.95;s.vy*=.95;s.life-=.02;if(s.life<=0){sparks.splice(i,1);continue;}ctx.fillStyle=hexA(s.c,s.life);ctx.beginPath();ctx.arc(s.x,s.y,2,0,6.2832);ctx.fill();}
        norm();
      }
    };
  })();

  /* ---------------- COUPLED OSCILLATORS (2D Kuramoto lattice, periodic) -------
     A torus of phase oscillators with nearest-neighbour coupling, coloured by
     phase. Click to perturb a patch of nodes and watch the disturbance spread
     and re-synchronise. (The RIPPLE field is retained in MODES, just unused.) --*/
  const oscillators=(()=>{
    let cols,rows,sp,ox,oy,th,om,tmp;const K=0.085;
    function build(){
      sp=Math.max(34,Math.round(Math.min(W,H)/16));
      cols=Math.ceil(W/sp)+1; rows=Math.ceil(H/sp)+1;
      ox=(W-(cols-1)*sp)/2; oy=(H-(rows-1)*sp)/2;
      const n=cols*rows; th=new Float32Array(n); om=new Float32Array(n); tmp=new Float32Array(n);
      for(let i=0;i<n;i++){th[i]=Math.random()*6.2832; om[i]=0.03+(Math.random()*2-1)*0.014;}
    }
    const idx=(c,r)=>((r%rows+rows)%rows)*cols+((c%cols+cols)%cols);
    function mix(h1,h2,t){const a=h1.replace('#',''),b=h2.replace('#','');const r=(parseInt(a.slice(0,2),16)*(1-t)+parseInt(b.slice(0,2),16)*t)|0;const g=(parseInt(a.slice(2,4),16)*(1-t)+parseInt(b.slice(2,4),16)*t)|0;const bl=(parseInt(a.slice(4,6),16)*(1-t)+parseInt(b.slice(4,6),16)*t)|0;return r+','+g+','+bl;}
    return{
      enter(){build();},
      click(x,y){const R=140;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const px=ox+c*sp,py=oy+r*sp,dx=px-x,dy=py-y,d=Math.hypot(dx,dy);if(d<R)th[r*cols+c]+=(1-d/R)*3.2;}},
      frame(){
        fade(.4);
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
          const i=r*cols+c,t0=th[i];
          const s=Math.sin(th[idx(c+1,r)]-t0)+Math.sin(th[idx(c-1,r)]-t0)+Math.sin(th[idx(c,r+1)]-t0)+Math.sin(th[idx(c,r-1)]-t0);
          let nt=t0+om[i]+K*s;
          if(P.active){const dx=ox+c*sp-P.x,dy=oy+r*sp-P.y,d=Math.hypot(dx,dy);if(d<120)nt+=(1-d/120)*0.05;}
          tmp[i]=nt;
        }
        const sw=th;th=tmp;tmp=sw;
        const rad=sp*0.36;
        for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
          const b=(Math.sin(th[r*cols+c])+1)*0.5;
          ctx.fillStyle='rgba('+mix(VIOLET,CYAN,b)+','+(0.18+b*0.55).toFixed(3)+')';
          ctx.beginPath();ctx.arc(ox+c*sp,oy+r*sp,rad,0,6.2832);ctx.fill();
        }
        cursorGlow(CYAN,22);
      }
    };
  })();

  /* ---------------- CRYSTAL LATTICE (mass-spring, drag to send waves) ---------
     A 2D lattice of masses joined to their neighbours by springs (pinned edges).
     Drag a node aside and release: the discrete wave equation carries a
     transverse wave out through the crystal. (OSCILLATORS retained in MODES.) --*/
  const crystal=(()=>{
    let rx,ry,ux,uy,vx,vy,nbr,deg,hexR=40,grab=-1;const K=0.14,DAMP=0;
    function build(){
      // Honeycomb via the graphene two-sublattice construction on INTEGER indices,
      // so shared bonds are identified by index — never by float rounding. This
      // keeps the coupling exactly symmetric at every resolution (no split nodes).
      const R=Math.max(30,Math.round(Math.min(W,H)/20)); hexR=R;
      const S=Math.sqrt(3)/2, marg=R*2, ox=0, oy=H/2;
      const aMap=new Map(), bMap=new Map(), px=[], py=[], adj=[];
      const add=(mp,i,j,x,y)=>{ if(x<-marg||x>W+marg||y<-marg||y>H+marg)return; const key=i+','+j; if(mp.has(key))return; const id=px.length; mp.set(key,id); px.push(x); py.push(y); adj.push([]); };
      const sMax=Math.ceil(W/(1.5*R))+2, tMax=Math.ceil((H/2)/(R*S))+3;
      for(let s=-2;s<=sMax;s++)for(let t=-tMax;t<=tMax;t++){
        if(((s+t)&1)!==0)continue;                    // s=i+j, t=i-j must share parity
        const i=(s+t)/2, j=(s-t)/2, ax=ox+1.5*R*s, ay=oy+R*S*t;
        add(aMap,i,j,ax,ay); add(bMap,i,j,ax+R,ay);
      }
      const link=(a,b)=>{ if(a===undefined||b===undefined)return; adj[a].push(b); adj[b].push(a); };
      for(const [key,aid] of aMap){ const p=key.split(','), i=+p[0], j=+p[1];
        link(aid,bMap.get(i+','+j)); link(aid,bMap.get((i-1)+','+j)); link(aid,bMap.get(i+','+(j-1)));
      }
      const n=px.length;
      rx=new Float32Array(px);ry=new Float32Array(py);
      ux=new Float32Array(n);uy=new Float32Array(n);vx=new Float32Array(n);vy=new Float32Array(n);
      nbr=new Int32Array(n*3).fill(-1);deg=new Int8Array(n);
      for(let k=0;k<n;k++){const a=adj[k];deg[k]=a.length>3?3:a.length;for(let m=0;m<deg[k];m++)nbr[k*3+m]=a[m];}
      grab=-1;
      let ci=-1,bd=1e18;for(let k=0;k<n;k++){if(deg[k]<3)continue;const dx=rx[k]-W/2,dy2=ry[k]-H/2,d=dx*dx+dy2*dy2;if(d<bd){bd=d;ci=k;}}
      if(ci>=0)uy[ci]=14;   // gentle intro pluck at the centre
    }
    const isEdge=(i)=>deg[i]<3;   // perimeter vertices (missing a bond) are pinned
    function mixC(h1,h2,t){const a=h1.replace('#',''),b=h2.replace('#','');const r=(parseInt(a.slice(0,2),16)*(1-t)+parseInt(b.slice(0,2),16)*t)|0,g=(parseInt(a.slice(2,4),16)*(1-t)+parseInt(b.slice(2,4),16)*t)|0,bl=(parseInt(a.slice(4,6),16)*(1-t)+parseInt(b.slice(4,6),16)*t)|0;return r+','+g+','+bl;}
    function spring(ax,ay,bx,by,st){
      const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||0.001,ux2=dx/L,uy2=dy/L,px=-uy2,py=ux2;
      const lead=Math.min(9,L*0.26),Lm=L-2*lead,Z=8,amp=3.8;
      ctx.strokeStyle='rgba('+mixC(CYAN,AMBER,st)+','+(0.18+st*0.5).toFixed(3)+')';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(ax,ay);
      if(Lm<=2){ctx.lineTo(bx,by);ctx.stroke();return;}
      ctx.lineTo(ax+ux2*lead,ay+uy2*lead);
      for(let k=1;k<Z;k++){const tt=k/Z,off=(k%2?amp:-amp);ctx.lineTo(ax+ux2*(lead+Lm*tt)+px*off,ay+uy2*(lead+Lm*tt)+py*off);}
      ctx.lineTo(ax+ux2*(lead+Lm),ay+uy2*(lead+Lm));ctx.lineTo(bx,by);ctx.stroke();
    }
    return{
      enter(){build();},
      grab(x,y){let best=-1,bd=1e18;for(let i=0;i<rx.length;i++){if(isEdge(i))continue;const px=rx[i]+ux[i],py=ry[i]+uy[i],d=(px-x)*(px-x)+(py-y)*(py-y);if(d<bd){bd=d;best=i;}}grab=(bd<(hexR*1.4)*(hexR*1.4))?best:-1;},
      release(){grab=-1;},
      frame(){
        fade(.34);
        const n=rx.length, CAP=hexR*2.4, VMAX=hexR*0.7;
        if(grab>=0&&P.down){
          const step=hexR*0.5; let dx2=(P.x-rx[grab])-ux[grab], dy2=(P.y-ry[grab])-uy[grab]; const dl=Math.hypot(dx2,dy2);
          if(dl>step){dx2=dx2/dl*step; dy2=dy2/dl*step;}
          ux[grab]+=dx2; uy[grab]+=dy2;
          const ul=Math.hypot(ux[grab],uy[grab]); if(ul>CAP){ux[grab]=ux[grab]/ul*CAP; uy[grab]=uy[grab]/ul*CAP;}
          vx[grab]=0; vy[grab]=0;
        }
        for(let i=0;i<n;i++){if(isEdge(i)||(i===grab&&P.down))continue;let sx=0,sy=0;const g=deg[i];for(let k=0;k<g;k++){const j=nbr[i*3+k];sx+=ux[j]-ux[i];sy+=uy[j]-uy[i];}let nvx=(vx[i]+K*sx)*(1-DAMP),nvy=(vy[i]+K*sy)*(1-DAMP);if(nvx>VMAX)nvx=VMAX;else if(nvx<-VMAX)nvx=-VMAX;if(nvy>VMAX)nvy=VMAX;else if(nvy<-VMAX)nvy=-VMAX;vx[i]=nvx;vy[i]=nvy;}
        for(let i=0;i<n;i++){if(isEdge(i)||(i===grab&&P.down))continue;let nx=ux[i]+vx[i],ny=uy[i]+vy[i];if(nx>CAP)nx=CAP;else if(nx<-CAP)nx=-CAP;if(ny>CAP)ny=CAP;else if(ny<-CAP)ny=-CAP;ux[i]=nx;uy[i]=ny;}
        // coil-shaped springs between neighbours (honeycomb lattice)
        ctx.lineJoin='round';ctx.lineCap='round';
        for(let i=0;i<n;i++){const xi=rx[i]+ux[i],yi=ry[i]+uy[i];const g=deg[i];for(let k=0;k<g;k++){const j=nbr[i*3+k];if(j>i){const st=Math.min(1,(Math.abs(ux[i]-ux[j])+Math.abs(uy[i]-uy[j]))/14);spring(xi,yi,rx[j]+ux[j],ry[j]+uy[j],st);}}}
        // diamond nodes (larger)
        for(let i=0;i<n;i++){const x=rx[i]+ux[i],y=ry[i]+uy[i],d=Math.min(1,Math.hypot(ux[i],uy[i])/22),s=6+d*4;ctx.fillStyle='rgba('+mixC(CYAN,AMBER,d)+','+(0.6+d*0.4).toFixed(3)+')';ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s,y);ctx.closePath();ctx.fill();}
        // grabbed node highlight (diamond outline)
        if(grab>=0){const x=rx[grab]+ux[grab],y=ry[grab]+uy[grab],s=11;ctx.strokeStyle=hexA(AMBER,.95);ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s,y);ctx.closePath();ctx.stroke();}
      }
    };
  })();

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
