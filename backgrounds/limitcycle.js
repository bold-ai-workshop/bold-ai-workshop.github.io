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
