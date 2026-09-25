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
