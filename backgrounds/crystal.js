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
