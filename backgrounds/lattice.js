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
