const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createModel,version}=require('../model-v3.js');
const project=path.resolve(__dirname,'..');
const questions=JSON.parse(fs.readFileSync(path.join(project,'data/questions-v3.json'),'utf8'));
const thinkers=JSON.parse(fs.readFileSync(path.join(project,'data/thinkers-v3.json'),'utf8'));
const model=createModel(questions,thinkers);
assert.equal(version,3);
assert.equal(questions.length,32);
assert.equal(model.dimensions.length,8);
assert.equal(model.philosophers.length,20);
assert.equal(new Set(questions.map(q=>q.id)).size,32);
assert.equal(new Set(questions.flatMap(q=>q.options.map(option=>option.id))).size,128);
const mainPositions=Array.from({length:8},()=>Array(4).fill(0));
const supportPositions=Array.from({length:8},()=>Array(4).fill(0));
questions.forEach(q=>{
 assert(q.title.length>10&&q.title.length<70,q.id);
 assert.equal(q.options.length,4);
 assert.equal(new Set(q.options.flatMap(option=>[option.main,option.support])).size,8);
 q.options.forEach((option,index)=>{
  assert(option.text.length>=16&&option.text.length<=65,option.id);
  assert.notEqual(option.main,option.support);
  mainPositions[option.main][index]++;
  supportPositions[option.support][index]++;
 });
});
model.coverage.forEach(axis=>assert.deepEqual(axis,{main:16,support:16}));
model.maxima.forEach(max=>assert.equal(max,48));
mainPositions.forEach(row=>assert.deepEqual(row,[4,4,4,4]));
supportPositions.forEach(row=>assert.deepEqual(row,[4,4,4,4]));
function checkScore(responses){
 const {raw,vector}=model.scoreResponses(responses);
 assert.equal(raw.reduce((a,b)=>a+b,0),96);
 assert(Math.abs(vector.reduce((a,b)=>a+b,0)-2)<1e-10);
 assert(vector.every(value=>Number.isFinite(value)&&value>=0&&value<=1));
 return {raw,vector};
}
for(let letter=0;letter<4;letter++){
 const result=checkScore(questions.map(q=>q.options[letter].id));
 assert.deepEqual(result.raw,Array(8).fill(12),'Constant letter positions must not create a directional profile.');
}
for(let axis=0;axis<8;axis++){
 const maximize=questions.map(q=>q.options.find(option=>option.main===axis||option.support===axis).id);
 const minimize=questions.map(q=>q.options.find(option=>option.main!==axis&&option.support!==axis).id);
 assert.equal(checkScore(maximize).vector[axis],1,model.dimensions[axis].name+' must reach its fixed upper bound.');
 assert.equal(checkScore(minimize).vector[axis],0,model.dimensions[axis].name+' must reach zero.');
}
assert.throws(()=>model.scoreResponses(Array(32).fill(null)));
assert.throws(()=>model.scoreResponses(Array(31).fill('bad')));
const seenVectors=new Set();
model.philosophers.forEach(person=>{
 assert.equal(person.referenceAnswers.length,32);
 const result=checkScore(person.referenceAnswers);
 assert.deepEqual(result.vector,person.v,'Prototypes must use the actual scoring rule.');
 const key=result.raw.join(',');assert(!seenVectors.has(key),'Duplicate thinker vector: '+person.name);seenVectors.add(key);
 const ranked=model.rank(result.vector);assert.equal(ranked[0].name,person.name,person.name+' must be reachable through their valid reference choices.');
 assert.equal(ranked[0].distance,0);
 assert(fs.existsSync(path.join(project,'portraits',person.image)),person.image);
});
const pairs=[];model.philosophers.forEach((first,i)=>model.philosophers.slice(i+1).forEach(second=>pairs.push({first:first.name,second:second.name,distance:Math.hypot(...first.v.map((value,axis)=>value-second.v[axis]))})));pairs.sort((a,b)=>a.distance-b.distance);
console.log(JSON.stringify({version,questions:questions.length,dimensions:8,thinkers:20,reachable:seenVectors.size,equalMainAndSupportCoverage:true,balancedLetterPositions:true,constantLettersHaveEqualAttention:true,allAxesReachZeroAndHundred:true,closestPairs:pairs.slice(0,5)},null,2));
