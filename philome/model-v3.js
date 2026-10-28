(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PhilomeModel=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const version=3;
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
  const chapters=['判断与相处','选择与表达','关系与生活','改变与投入'];
  function createModel(questions,thinkers){
    if(!Array.isArray(questions)||questions.length!==32||!Array.isArray(thinkers)||thinkers.length!==20)throw new Error('题目资料暂未完整加载。');
    const maxima=Array(8).fill(0),coverage=Array.from({length:8},()=>({main:0,support:0}));
    questions.forEach(q=>{if(!q.id||!Array.isArray(q.options)||q.options.length!==4)throw new Error('题目格式有误。');const axes=[];q.options.forEach(option=>{if(!Number.isInteger(option.main)||!Number.isInteger(option.support)||option.main<0||option.main>7||option.support<0||option.support>7||option.main===option.support)throw new Error('题目关注方向有误。');axes.push(option.main,option.support);maxima[option.main]+=2;maxima[option.support]+=1;coverage[option.main].main++;coverage[option.support].support++});if(new Set(axes).size!==8)throw new Error('题目关注覆盖有误。')});
    if(coverage.some(axis=>axis.main!==16||axis.support!==16)||maxima.some(value=>value!==48))throw new Error('题目关注机会尚未配平。');
    function scoreResponses(responses){
      if(!Array.isArray(responses)||responses.length!==questions.length)throw new Error('请先完成全部32个场景。');
      const raw=Array(8).fill(0);responses.forEach((id,i)=>{const option=questions[i].options.find(item=>item.id===id);if(!option)throw new Error(`第${i+1}题尚未作答。`);raw[option.main]+=2;raw[option.support]+=1});
      return {raw,vector:raw.map((value,i)=>value/maxima[i])};
    }
    const philosophers=thinkers.map(person=>({...person,v:scoreResponses(person.referenceAnswers).vector}));
    function rank(vector){return philosophers.map(person=>({...person,distance:Math.hypot(...vector.map((value,i)=>value-person.v[i]))})).sort((a,b)=>a.distance-b.distance)}
    return {version,dimensions,chapters,questions,philosophers,maxima,coverage,scoreResponses,rank};
  }
  return {version,dimensions,chapters,createModel};
});
