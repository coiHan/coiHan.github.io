const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createModel,version}=require('../model-v6.js');
const project=path.resolve(__dirname,'..'),questions=require('../data/questions-v6.json'),people=require('../data/thinkers-v6.json'),model=createModel(questions,people);
assert.equal(version,6);assert.equal(model.questionCount,48);assert.equal(model.dimensions.length,4);assert.equal(people.length,22);assert.equal(model.profiles.length,15);assert.equal(model.readingEchoes.length,7);assert.equal(new Set(questions.map(q=>q.id)).size,48);assert.equal(new Set(questions.map(q=>q.text)).size,48);
model.coverage.forEach(c=>assert.deepEqual(c,{left:6,right:6,total:12}));model.maxima.forEach(n=>assert.equal(n,36));questions.forEach(q=>{assert(q.text.length>=12&&q.text.length<=30,q.id);assert(!/我经常|我擅长|我会先/.test(q.text),q.id+' must ask about a philosophical claim.')});
for(let group=0;group<12;group++)assert.equal(new Set(questions.slice(group*4,group*4+4).map(q=>q.d)).size,4);
const leftAnswers=questions.map(q=>q.p===-1?6:0),rightAnswers=questions.map(q=>q.p===1?6:0);
assert.deepEqual(model.scoreResponses(leftAnswers).vector,[-1,-1,-1,-1]);assert.deepEqual(model.scoreResponses(rightAnswers).vector,[1,1,1,1]);
const high=model.scoreResponses(Array(48).fill(6)),low=model.scoreResponses(Array(48).fill(0)),neutral=model.scoreResponses(Array(48).fill(3));
assert.deepEqual(high.vector,[0,0,0,0]);assert.deepEqual(low.vector,[0,0,0,0]);assert.deepEqual(neutral.vector,[0,0,0,0]);
high.evidence.forEach(e=>{assert.equal(e.leftMean,1);assert.equal(e.rightMean,1);assert.equal(e.kind,'both-high')});low.evidence.forEach(e=>{assert.equal(e.leftMean,0);assert.equal(e.rightMean,0);assert.equal(e.kind,'both-low')});neutral.evidence.forEach(e=>assert.equal(e.kind,'mostly-neutral'));
for(const pole of [-1,1]){const i=questions.findIndex(q=>q.p===pole),answers=Array(48).fill(3);answers[i]=4;model.scoreResponses(answers).vector.forEach((v,d)=>assert(Math.abs(v-(d===questions[i].d?pole/36:0))<1e-12))}
assert.throws(()=>model.scoreResponses(Array(48).fill(null)));assert.throws(()=>model.scoreResponses(Array(47).fill(3)));assert.throws(()=>model.scoreResponses(Array(48).fill(7)));
const masks=new Set();for(const p of model.profiles){
 assert.equal(p.v.length,4);assert.equal(p.axisEvidence.length,4);assert.equal(p.coverage,p.matchedDimensions.length);assert.equal(p.coverage+p.missingDimensions.length,4);assert(!Object.hasOwn(people.find(x=>x.name===p.name),'v'),'Stored values must come from reference claims.');
 const signature=JSON.stringify(p.v);assert(!masks.has(signature),'Duplicate masked profile: '+p.name);masks.add(signature);
 for(let d=0;d<4;d++){
  const items=questions.map((q,i)=>q.d===d?i:-1).filter(i=>i>=0);
  if(p.matchedDimensions.includes(d)){assert(Number.isFinite(p.v[d])&&p.v[d]>=-1&&p.v[d]<=1);assert(p.axisEvidence[d].summary);assert(p.axisEvidence[d].scope);assert(p.axisEvidence[d].sources.length>0);assert(p.axisEvidence[d].sources.every(s=>/^https:\/\//.test(s.url)));items.forEach(i=>assert(Number.isInteger(p.referenceAnswers[i])&&p.referenceAnswers[i]>=0&&p.referenceAnswers[i]<=6));assert(Math.abs(p.referenceEvidence[d].rightMean-p.referenceEvidence[d].leftMean-p.v[d])<1e-12)}
  else{assert.equal(p.v[d],null);assert.equal(p.axisEvidence[d],null);assert.equal(p.referenceEvidence[d].kind,'unknown');items.forEach(i=>assert.equal(p.referenceAnswers[i],null))}
 }
 assert(fs.existsSync(path.join(project,'portraits',p.image)),p.image);
}
for(const p of model.readingEchoes){assert.deepEqual(p.v,[null,null,null,null]);assert.equal(p.coverage,0);assert(!p.eligible);assert(p.recommendedWork);assert(fs.existsSync(path.join(project,'portraits',p.image)))}
const sample=[-.7,.7,-.7,.7],ranked=model.rank(sample);ranked.forEach(p=>{assert(p.coverage>=3);assert(p.directionalDimensions.length>=2);const rms=Math.sqrt(p.matchedDimensions.reduce((s,i)=>s+(sample[i]-p.v[i])**2,0)/p.coverage);assert(Math.abs(p.distance-rms)<1e-12);assert(Math.abs(p.sortDistance-rms-.08*(4-p.coverage))<1e-12)});for(let i=1;i<ranked.length;i++)assert(ranked[i].sortDistance>=ranked[i-1].sortDistance);
for(const p of ranked){if(!p.missingDimensions.length)continue;const changed=sample.slice();changed[p.missingDimensions[0]]*=-1;assert.equal(model.rank(changed).find(q=>q.name===p.name).distance,p.distance,'Unknown axes must not affect distance.')}
const left=model.scoreResponses(leftAnswers),right=model.scoreResponses(rightAnswers);
for(let d=0;d<4;d++){
 const candidates=model.forAxis(d,left.vector,left.evidence);assert(candidates.every(p=>p.v[d]!==null));assert(candidates.every(p=>!p.sameSide||p.v[d]<-.2));assert.deepEqual(model.forAxis(d,low.vector,low.evidence),[]);assert.deepEqual(model.forAxis(d,neutral.vector,neutral.evidence),[]);assert(model.forAxis(d,high.vector,high.evidence).every(p=>p.referenceEvidence[d].leftMean>=.67&&p.referenceEvidence[d].rightMean>=.67));assert(model.forAxis(d,right.vector,right.evidence).every(p=>!p.sameSide||p.v[d]>.2));
}
assert.equal(model.forAxis(1,left.vector,left.evidence)[0].name,'密尔');assert(model.forAxis(2,left.vector,left.evidence).slice(0,2).every(p=>['密尔','洛克'].includes(p.name)));
const broad=people.filter(p=>p.kind==='philosopher');const fixtureQuestions=questions.slice(0,8),fixturePeople=broad.map(p=>({...p,referenceAnswers:p.referenceAnswers.slice(0,8)}));assert.equal(createModel(fixtureQuestions,fixturePeople).questionCount,8);
console.log(JSON.stringify({version,questions:48,axes:4,perPole:6,people:people.length,profiles:model.profiles.length,readingEchoes:model.readingEchoes.length,signedEndpoints:true,distinctMidpointMeanings:true,nullAxesPreserved:true,rmsAndCoveragePenalty:true,axisSpecificRecommendations:true,clearSameSideOnly:true,twoSidedEvidenceDistance:true,consequentialistAndRightsCoverage:true,portraitsPresent:true,eligibleGlobalProfiles:ranked.map(p=>p.name)},null,2));
