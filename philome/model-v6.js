(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PhilomeModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const version=6;
  const dimensions=[
    {key:'knowledge',name:'知识根据',leftLabel:'经验根据',rightLabel:'先验根据',question:'关于现实的认识，最终需要什么样的根据？',copy:'比较经验材料与先于经验的认识根据，不把经验和推理当成互斥能力。'},
    {key:'ethics',name:'伦理根据',leftLabel:'后果理由',rightLabel:'义务约束',question:'行为的正当性，最终来自后果还是独立约束？',copy:'比较总体后果与承诺、权利、对人的尊重等独立约束。'},
    {key:'politics',name:'政治正当性',leftLabel:'权利边界',rightLabel:'共同义务',question:'共同生活的要求，与个人权利的边界怎样相处？',copy:'比较限制公共权力的权利边界与共同生活产生的政治义务。'},
    {key:'meaning',name:'意义根据',leftLabel:'客观价值',rightLabel:'主体赋义',question:'生活的意义，需要怎样的价值根据与主体认同？',copy:'比较独立于个人认同的价值根据与主体认同、投入所构成的意义。'}
  ].map(d=>({...d,left:d.leftLabel,right:d.rightLabel,short:`${d.leftLabel} ↔ ${d.rightLabel}`}));
  function createModel(questions,people){
    const dimensionCount=dimensions.length;
    if(!Array.isArray(questions)||!questions.length||questions.length%(dimensionCount*2)!==0||!Array.isArray(people))throw new Error('题目资料暂未完整加载。');
    const questionCount=questions.length,questionsPerDimension=questionCount/dimensionCount;
    const coverage=Array.from({length:dimensionCount},()=>({left:0,right:0,total:0})),ids=new Set();
    questions.forEach(q=>{if(!q.id||ids.has(q.id)||!q.text||!Number.isInteger(q.d)||q.d<0||q.d>=dimensionCount||![-1,1].includes(q.p))throw new Error('题目格式有误。');ids.add(q.id);coverage[q.d][q.p===-1?'left':'right']++;coverage[q.d].total++});
    if(coverage.some(c=>c.total!==questionsPerDimension||c.left!==questionsPerDimension/2||c.right!==questionsPerDimension/2))throw new Error('两侧题目覆盖尚未配平。');
    const maxima=coverage.map(c=>c.left*6),chapterSize=dimensionCount,chapters=Array.from({length:questionCount/chapterSize},(_,i)=>`立场片段 ${String(i+1).padStart(2,'0')}`);
    function evidenceFrom(responses,supportedAxes=null){
      if(!Array.isArray(responses)||responses.length!==questionCount)throw new Error(`请提供全部${questionCount}句的回答。`);
      const totals=dimensions.map(()=>({leftTotal:0,rightTotal:0,leftCount:0,rightCount:0,neutralCount:0}));
      responses.forEach((answer,i)=>{const q=questions[i],known=supportedAxes===null||supportedAxes.includes(q.d);if(!known){if(answer!==null)throw new Error('缺乏依据的参考维度必须留空。');return}if(!Number.isInteger(answer)||answer<0||answer>6)throw new Error(`第${i+1}题尚未作答。`);const row=totals[q.d],side=q.p===-1?'left':'right';row[side+'Total']+=answer;row[side+'Count']++;if(answer===3)row.neutralCount++});
      return totals.map((row,i)=>{
        if(!row.leftCount&&!row.rightCount)return {...row,supported:false,leftMean:null,rightMean:null,contrast:null,kind:'unknown',direction:null};
        const leftMean=row.leftTotal/(row.leftCount*6),rightMean=row.rightTotal/(row.rightCount*6),contrast=rightMean-leftMean;
        const direction=contrast<-.2?'left':contrast>.2?'right':'middle';
        let kind;if(leftMean>=.67&&rightMean>=.67)kind='both-high';else if(leftMean<=.33&&rightMean<=.33)kind='both-low';else if(row.neutralCount>=Math.ceil(coverage[i].total*2/3))kind='mostly-neutral';else if(direction==='left'||direction==='right')kind=direction;else kind='mixed';
        return {...row,supported:true,leftMean,rightMean,contrast,kind,direction};
      });
    }
    function scoreResponses(responses){const evidence=evidenceFrom(responses);return {vector:evidence.map(e=>e.contrast),raw:evidence.map(e=>e.rightTotal-e.leftTotal),evidence,scoreEvidence:evidence}}
    function scoreEvidence(responses){return scoreResponses(responses).evidence}
    const allPeople=people.map(person=>{
      const notes=dimensions.map(d=>person.axisEvidence?.[d.key]||null),supported=notes.map((note,i)=>note&&note.supported!==false&&note.weight!==0?i:null).filter(i=>i!==null);
      if(person.kind==='readingEcho'){if(supported.length)throw new Error('阅读回声不参与轴匹配。');return {...person,v:dimensions.map(()=>null),coverage:0,matchedDimensions:[],missingDimensions:dimensions.map((_,i)=>i),axisEvidence:dimensions.map(()=>null),matchingWeights:dimensions.map(()=>0),eligible:false}}
      const referenceEvidence=evidenceFrom(person.referenceAnswers,supported),v=referenceEvidence.map(e=>e.contrast),missing=dimensions.map((_,i)=>i).filter(i=>!supported.includes(i));
      const directionalDimensions=supported.filter(i=>Math.abs(v[i])>.2);
      return {...person,v,referenceEvidence,axisEvidence:notes,coverage:supported.length,matchedDimensions:supported,missingDimensions:missing,directionalDimensions,matchingWeights:notes.map(n=>n&&n.supported!==false&&n.weight!==0?(n.weight??1):0),eligible:supported.length>=3&&directionalDimensions.length>=2};
    });
    const profiles=allPeople.filter(person=>person.kind!=='readingEcho'),readingEchoes=allPeople.filter(person=>person.kind==='readingEcho');
    function validateVector(vector){if(!Array.isArray(vector)||vector.length!==dimensionCount||vector.some(v=>!Number.isFinite(v)||v< -1||v>1))throw new Error('立场坐标格式有误。')}
    function rank(vector){validateVector(vector);return profiles.filter(p=>p.eligible).map(p=>{const distance=Math.sqrt(p.matchedDimensions.reduce((sum,i)=>sum+(vector[i]-p.v[i])**2,0)/p.coverage),sortDistance=distance+.08*(dimensionCount-p.coverage);return {...p,distance,sortDistance}}).sort((a,b)=>a.sortDistance-b.sortDistance||b.coverage-a.coverage)}
    function forAxis(axis,vector,evidence=null){
      validateVector(vector);if(!Number.isInteger(axis)||axis<0||axis>=dimensionCount)throw new Error('未知的立场维度。');
      const userEvidence=Array.isArray(evidence)?evidence[axis]:evidence;
      if(userEvidence&&['both-low','mostly-neutral'].includes(userEvidence.kind))return [];
      const candidates=profiles.filter(p=>p.v[axis]!==null&&(!userEvidence||userEvidence.kind!=='both-high'||p.referenceEvidence[axis].leftMean>=.67&&p.referenceEvidence[axis].rightMean>=.67));
      return candidates.map(p=>{
        const reference=p.referenceEvidence[axis],axisDistance=Math.abs(vector[axis]-p.v[axis]),hasMeans=userEvidence&&Number.isFinite(userEvidence.leftMean)&&Number.isFinite(userEvidence.rightMean);
        const evidenceDistance=hasMeans?Math.hypot(userEvidence.leftMean-reference.leftMean,userEvidence.rightMean-reference.rightMean)/Math.SQRT2:null;
        const sameSide=userEvidence?.kind==='both-high'?reference.kind==='both-high':Math.abs(vector[axis])<=.2?Math.abs(p.v[axis])<=.2:Math.abs(p.v[axis])>.2&&Math.sign(vector[axis])===Math.sign(p.v[axis]);
        return {...p,axis,axisDistance,evidenceDistance,comparisonKind:hasMeans?'two-sided':'contrast-only',sameSide};
      }).sort((a,b)=>Number(b.sameSide)-Number(a.sameSide)||(a.evidenceDistance??a.axisDistance)-(b.evidenceDistance??b.axisDistance));
    }
    function neighbors(vector,evidence){
      validateVector(vector);
      if(!Array.isArray(evidence)||evidence.length!==dimensionCount||evidence.some((e,i)=>!e||![e.leftMean,e.rightMean].every(x=>Number.isFinite(x)&&x>=0&&x<=1)||Math.abs(e.rightMean-e.leftMean-vector[i])>1e-8))throw new Error('请提供四组完整的两侧认同。');
      // Every completed answer set gets relative reading neighbours. Missing reference axes stay unknown.
      const candidates=profiles.filter(p=>p.coverage>0).map(p=>{
        const axisDistances=p.matchedDimensions.map(i=>({i,distance:Math.hypot(evidence[i].leftMean-p.referenceEvidence[i].leftMean,evidence[i].rightMean-p.referenceEvidence[i].rightMean)/Math.SQRT2}));
        const distance=Math.sqrt(axisDistances.reduce((sum,a)=>sum+a.distance*a.distance,0)/p.coverage),sortDistance=distance+.035*(dimensionCount-p.coverage);
        axisDistances.sort((a,b)=>a.distance-b.distance||Math.abs(vector[b.i])-Math.abs(vector[a.i]));
        return {...p,distance,evidenceDistance:distance,sortDistance,axisDistances};
      }).sort((a,b)=>a.sortDistance-b.sortDistance||b.coverage-a.coverage||a.name.localeCompare(b.name,'zh-CN'));
      const usedAxes=new Set();
      return candidates.slice(0,3).map(p=>{
        const closest=p.axisDistances[0],alternative=p.axisDistances.find(a=>!usedAxes.has(a.i)&&a.distance<=closest.distance+.12),axis=(alternative||closest).i;
        usedAxes.add(axis);
        const sameSide=Math.abs(vector[axis])>.2&&Math.abs(p.v[axis])>.2&&Math.sign(vector[axis])===Math.sign(p.v[axis]);
        const bothHigh=evidence[axis].kind==='both-high'&&p.referenceEvidence[axis].kind==='both-high';
        return {...p,recommendationAxis:axis,axis:axis,axisDistance:p.axisDistances.find(a=>a.i===axis).distance,neighborKind:sameSide||bothHigh?'resonance':'perspective'};
      });
    }
    return {version,dimensions,questionCount,questionsPerDimension,questions,coverage,maxima,chapterSize,chapters,profiles,philosophers:profiles,readingEchoes,allPeople,scoreResponses,scoreEvidence,rank,forAxis,neighbors,getAxisCandidates:forAxis};
  }
  return {version,dimensions,createModel};
});
