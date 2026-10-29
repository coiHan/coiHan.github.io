(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PhilomeModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const version=5;
  const dimensions=[
    {key:'evidence',name:'经验求证',short:'先看实际证据',copy:'你常先观察、尝试或核查具体材料，再判断一个说法是否可信。',question:'当观察结果与一个漂亮的解释冲突时，你愿意先重新检查哪一边？'},
    {key:'inquiry',name:'概念思辨',short:'先把问题想清楚',copy:'你常先澄清概念、前提和推理，让一个问题的结构慢慢显露。',question:'你最常使用的一个词，换个人来理解，意思还会一样吗？'},
    {key:'autonomy',name:'自主选择',short:'保留自己的选择',copy:'你常先辨认自己愿意选择什么，也把选择带来的责任留在自己手中。',question:'如果暂时放下他人的期待，你最想为自己保留哪一种选择？'},
    {key:'care',name:'共同关怀',short:'走近具体的人',copy:'你常先看见他人的具体处境，再思考怎样共同生活和彼此支持。',question:'在你最近参与的一件事里，谁的处境还没有被认真听见？'},
    {key:'commitment',name:'原则承诺',short:'守住重要的边界',copy:'你常先问哪些边界与承诺值得共同守住，再决定如何回应眼前的情境。',question:'哪一个你愿意坚持的原则，在真的付出代价时仍然重要？'},
    {key:'practice',name:'行动实践',short:'让改变实际发生',copy:'你常先找下一步可以实施的改变，在做事和承担后果中继续理解问题。',question:'一个你一直在想的问题，今天能迈出的最小一步是什么？'},
    {key:'reflection',name:'内在省察',short:'回看内心的来处',copy:'你常先回看自己的感受、欲望与旧经历，追问它们怎样影响判断。',question:'最近一次让你特别在意的事情，触动了哪一种未说出口的期待？'},
    {key:'imagination',name:'诗性想象',short:'借故事看见更多',copy:'你常借人物、故事和意象进入复杂经验，让另一种可能被看见。',question:'如果把最近的一段经历写成故事，换一个主角，它会变成什么样？'}
  ];
  const chapterNames=['日常想法','选择与回应','内心与表达','看待世界','关系与边界','实践与变化','解释与想象','继续靠近自己'];
  function createModel(questions,thinkers){
    const dimensionCount=dimensions.length;
    if(!Array.isArray(questions)||!questions.length||questions.length%dimensionCount!==0||!Array.isArray(thinkers)||!thinkers.length)throw new Error('题目资料暂未完整加载。');
    const questionCount=questions.length,questionsPerDimension=questionCount/dimensionCount;
    if(questionsPerDimension%2!==0)throw new Error('题目方向尚未配平。');
    const coverage=Array.from({length:dimensionCount},()=>({positive:0,negative:0,total:0})),ids=new Set();
    questions.forEach(q=>{if(!q.id||ids.has(q.id)||!q.text||!Number.isInteger(q.d)||q.d<0||q.d>=dimensionCount||![1,-1].includes(q.p))throw new Error('题目格式有误。');ids.add(q.id);coverage[q.d][q.p===1?'positive':'negative']++;coverage[q.d].total++});
    if(coverage.some(axis=>axis.positive!==questionsPerDimension/2||axis.negative!==questionsPerDimension/2||axis.total!==questionsPerDimension))throw new Error('题目方向尚未配平。');
    const maxima=coverage.map(axis=>axis.total*6),chapterSize=dimensionCount;
    const chapters=Array.from({length:Math.ceil(questionCount/chapterSize)},(_,i)=>chapterNames[i]||`继续探索 ${i+1}`);
    function scoreResponses(responses){
      if(!Array.isArray(responses)||responses.length!==questionCount)throw new Error(`请先完成全部${questionCount}句。`);
      const raw=Array(dimensionCount).fill(0);responses.forEach((answer,i)=>{if(!Number.isInteger(answer)||answer<0||answer>6)throw new Error(`第${i+1}题尚未作答。`);const q=questions[i];raw[q.d]+=q.p===1?answer:6-answer});
      return {raw,vector:raw.map((value,i)=>value/maxima[i])};
    }
    const philosophers=thinkers.map(person=>({...person,v:scoreResponses(person.referenceAnswers).vector}));
    function rank(vector){return philosophers.map(person=>({...person,distance:Math.hypot(...vector.map((value,i)=>value-person.v[i]))})).sort((a,b)=>a.distance-b.distance)}
    return {version,dimensions,chapters,chapterSize,questionCount,questionsPerDimension,questions,philosophers,maxima,coverage,scoreResponses,rank};
  }
  return {version,dimensions,createModel};
});
