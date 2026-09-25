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
