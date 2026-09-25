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
