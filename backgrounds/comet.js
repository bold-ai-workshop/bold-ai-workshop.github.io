  /* ---------------- COMET trails ---------------- */
  const comet=(()=>{
    let heads=[],sparks=[];const cols=[CYAN,AMBER,VIOLET];
    function init(){heads=[];for(let k=0;k<3;k++)heads.push({x:W/2,y:H/2,ease:.12+k*.05,c:cols[k],tail:[]});sparks=[];}
    return{
      enter(){init();},
      click(x,y){for(let i=0;i<28;i++){const a=rand(0,6.2832),s=rand(1,6);sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,c:cols[(Math.random()*3)|0]});}},
      frame(){
        fade(.16);
        const tx=P.active?P.x:W/2+Math.cos(t*.001)*W*.2,ty=P.active?P.y:H/2+Math.sin(t*.0013)*H*.2;
        glow();
        for(const h of heads){
          h.x+=(tx-h.x)*h.ease;h.y+=(ty-h.y)*h.ease;
          h.tail.unshift({x:h.x,y:h.y});if(h.tail.length>22)h.tail.pop();
          for(let i=0;i<h.tail.length-1;i++){const p=h.tail[i],q=h.tail[i+1],al=(1-i/h.tail.length)*.6;ctx.strokeStyle=hexA(h.c,al);ctx.lineWidth=(1-i/h.tail.length)*4+.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
          const g=ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,12);g.addColorStop(0,hexA(h.c,.9));g.addColorStop(1,hexA(h.c,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(h.x,h.y,12,0,6.2832);ctx.fill();
        }
        for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx;s.y+=s.vy;s.vx*=.95;s.vy*=.95;s.life-=.02;if(s.life<=0){sparks.splice(i,1);continue;}ctx.fillStyle=hexA(s.c,s.life);ctx.beginPath();ctx.arc(s.x,s.y,2,0,6.2832);ctx.fill();}
        norm();
      }
    };
  })();
