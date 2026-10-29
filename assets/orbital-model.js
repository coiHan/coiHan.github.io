(function(root){
  'use strict';
  // JPL J2000 approximate elements. Display distances are compressed; periods use AU.
  const AU=[.38709927,.72333566,1.00000261,1.52371034,5.202887,9.53667594,19.18916464,30.06992276];
  const eccentricity=[.20563593,.00677672,.01671123,.09339410,.04838624,.05386179,.04725744,.00859048];
  const radii=[.32,.41,.50,.60,.71,.81,.91,1];
  const phase=[40,150,270,335,200,70,125,315].map(v=>v*Math.PI/180);
  const earthPeriod=180,tau=Math.PI*2;
  const normal=value=>((value+Math.PI)%tau+tau)%tau-Math.PI;
  function solve(mean,e){const m=normal(mean);let E=m;for(let i=0;i<10;i++){const step=(E-e*Math.sin(E)-m)/(1-e*Math.cos(E));E-=step;if(Math.abs(step)<1e-12)break;}return E;}
  function period(index){return earthPeriod*Math.pow(AU[index]/AU[2],1.5);}
  function position(index,seconds,scale=1){const e=eccentricity[index],mean=phase[index]+tau*seconds/period(index),E=solve(mean,e),a=radii[index]*scale;return{x:a*(Math.cos(E)-e),y:a*Math.sqrt(1-e*e)*Math.sin(E),E,mean:normal(mean),a,e};}
  function project(point,cx,cy,q){return{x:cx+point.x,y:cy-q*point.y};}
  const api={AU,eccentricity,radii,phase,earthPeriod,period,solve,position,project};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.SolarMechanics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
