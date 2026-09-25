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
