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
