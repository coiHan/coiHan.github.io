const assert=require('assert/strict'),m=require('../assets/orbital-model.js');
for(let i=0;i<8;i++){for(let t=0;t<2000;t+=7.5){const p=m.position(i,t),again=m.position(i,t+m.period(i));assert(Math.abs(p.E-p.e*Math.sin(p.E)-p.mean)<1e-10);assert(Math.abs(p.x-again.x)<1e-10);assert(Math.abs(p.y-again.y)<1e-10);}if(i)assert(m.radii[i]*(1-m.eccentricity[i])>m.radii[i-1]*(1+m.eccentricity[i-1]));}
console.log(JSON.stringify({keplerResidual:true,periodic:true,nonCrossing:true,periods:m.AU.map((_,i)=>m.period(i))}));
