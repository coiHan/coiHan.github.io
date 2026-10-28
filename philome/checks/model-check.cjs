const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createModel,version}=require('../model-v4.js');
const project=path.resolve(__dirname,'..'),questions=require('../data/questions-v4.json'),thinkers=require('../data/thinkers-v4.json'),model=createModel(questions,thinkers);
assert.equal(version,4);assert.equal(questions.length,32);assert.equal(model.dimensions.length,8);assert.equal(model.philosophers.length,20);assert.equal(new Set(questions.map(q=>q.id)).size,32);
model.coverage.forEach(axis=>assert.deepEqual(axis,{positive:2,negative:2,total:4}));
model.maxima.forEach(value=>assert.equal(value,24));
questions.forEach(q=>assert(q.text.length>=14&&q.text.length<=24,q.id+' must stay short.'));
for(let group=0;group<4;group++)assert.equal(new Set(questions.slice(group*8,group*8+8).map(q=>q.d)).size,8,'Every pass must visit all eight axes.');
const score=answers=>{const result=model.scoreResponses(answers);assert(result.vector.every(v=>Number.isFinite(v)&&v>=0&&v<=1));return result};
for(const answer of [0,3,6])assert.deepEqual(score(Array(32).fill(answer)).vector,Array(8).fill(.5),'Balanced wording must not turn uniform assent into high endorsement.');
const maximum=questions.map(q=>q.p===1?6:0),minimum=questions.map(q=>q.p===1?0:6);
assert.deepEqual(score(maximum).vector,Array(8).fill(1),'All axes may be high together.');assert.deepEqual(score(minimum).vector,Array(8).fill(0),'All axes may be low together.');
for(let axis=0;axis<8;axis++){const high=questions.map(q=>q.d===axis?(q.p===1?6:0):3),low=questions.map(q=>q.d===axis?(q.p===1?0:6):3);assert.equal(score(high).vector[axis],1);assert.equal(score(low).vector[axis],0);score(high).vector.forEach((v,i)=>assert.equal(v,i===axis?1:.5))}
assert.throws(()=>model.scoreResponses(Array(32).fill(null)));assert.throws(()=>model.scoreResponses(Array(32).fill(7)));assert.throws(()=>model.scoreResponses(Array(32).fill('q01-a')));
const seen=new Set();model.philosophers.forEach(person=>{assert.equal(person.referenceAnswers.length,32);assert(person.referenceAnswers.every(value=>Number.isInteger(value)&&value>=0&&value<=6));const scored=score(person.referenceAnswers),key=scored.raw.join(',');assert(!seen.has(key),'Duplicate prototype: '+person.name);seen.add(key);assert.deepEqual(scored.vector,person.v);assert.equal(model.rank(scored.vector)[0].name,person.name);assert.equal(model.rank(scored.vector)[0].distance,0);assert(fs.existsSync(path.join(project,'portraits',person.image)))});
console.log(JSON.stringify({version,questions:32,dimensions:8,thinkers:20,reachable:seen.size,characters:[Math.min(...questions.map(q=>q.text.length)),Math.max(...questions.map(q=>q.text.length))],twoPositiveTwoNegative:true,interleavedAxes:true,allAxesCanBeHighOrLow:true,validReferenceAnswers:true},null,2));
