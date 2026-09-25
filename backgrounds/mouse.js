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
