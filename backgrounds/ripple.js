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
