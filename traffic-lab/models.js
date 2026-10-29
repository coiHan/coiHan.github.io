/* Traffic Lab — dependency-free forecasting models. All fits use only the supplied training series. */
(function (root) {
  'use strict';
  const pause = () => new Promise(resolve => setTimeout(resolve, 0));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mean = a => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1);
  const num = (o, key, fallback, min, max) => clamp(Number.isFinite(+o[key]) ? +o[key] : fallback, min, max);
  const p = (key, label, min, max, step, value) => ({key, label, min, max, step, value});
  const catalog = [
    {id:'last',name:'朴素预测',group:'统计基线',description:'将最近指定滞后位置的观测值持续外推。无可训练权重。',params:[p('lag','观测滞后',1,48,1,1)]},
    {id:'mean',name:'历史均值',group:'统计基线',description:'使用输入窗口末段的历史均值预测全部未来时刻。无可训练权重。',params:[p('window','均值窗口',2,168,1,24)]},
    {id:'moving',name:'移动平均',group:'统计基线',description:'递归计算最近窗口的平均值，将每步预测加入下一步输入。',params:[p('window','滑动窗口',2,72,1,6)]},
    {id:'weighted',name:'加权移动平均',group:'统计基线',description:'指数加权最近观测，越近权重越大，递归产生多步预测。',params:[p('window','滑动窗口',2,72,1,12),p('decay','历史衰减',0.1,1,0.05,0.8)]},
    {id:'seasonal',name:'季节朴素预测',group:'周期模型',description:'复用一个周期前的观测，可与历史均值加权，小时数据可选 24 小时周期。',params:[p('period','季节周期',2,168,1,24),p('blend','周期权重',0,1,0.05,1)]},
    {id:'drift',name:'阻尼趋势外推',group:'趋势模型',description:'通过窗口内首尾差估计平均趋势，并以阻尼控制远期增长。',params:[p('window','趋势窗口',2,168,1,24),p('damping','趋势阻尼',0.1,1,0.05,0.85)]},
    {id:'ses',name:'简单指数平滑',group:'平滑模型',description:'递推更新局部水平；alpha 决定对近期观测的敏感度。',params:[p('alpha','水平系数 α',0.01,0.99,0.01,0.3)]},
    {id:'holt',name:'Holt 双指数平滑',group:'平滑模型',description:'同时递推估计水平和趋势，使用阻尼控制长期外推。',params:[p('alpha','水平系数 α',0.01,0.99,0.01,0.3),p('beta','趋势系数 β',0.01,0.99,0.01,0.1),p('damping','趋势阻尼',0.1,1,0.05,0.9)]},
    {id:'ar',name:'自回归 AR',group:'机器学习',description:'用滞后窗口预测下一步，梯度下降拟合线性权重，再递归预测。',params:[p('epochs','训练轮数',10,200,10,80),p('learningRate','学习率',0.001,0.1,0.001,0.02)]},
    {id:'ridge',name:'岭回归 Ridge',group:'机器学习',description:'线性自回归加入 L2 惩罚以限制权重，适用于高度相关的滞后特征。',params:[p('lambda','正则强度 λ',0.001,2,0.01,0.1),p('epochs','训练轮数',10,200,10,80),p('learningRate','学习率',0.001,0.1,0.001,0.02)]},
    {id:'knn',name:'K 近邻回归',group:'机器学习',description:'从训练集寻找相似历史窗口，按距离加权其下一步观测。',params:[p('neighbors','邻居数量 K',1,30,1,5),p('distancePower','距离权重指数',0,2,0.1,1)]},
    {id:'mlp',name:'多层感知机 MLP',group:'神经网络',description:'一个 tanh 隐层的前馈神经网络，以反向传播拟合滑动窗口。',params:[p('hidden','隐层神经元',4,32,4,12),p('epochs','训练轮数',10,150,10,60),p('learningRate','学习率',0.001,0.05,0.001,0.01)]}
  ];

  function metrics(actual, predicted) {
    const pairs = actual.map((x,i)=>[+x,+predicted[i]]).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b));
    if (!pairs.length) return {mae:0,rmse:0,mape:0,smape:0,r2:0,wape:0,n:0};
    const avg = mean(pairs.map(x=>x[0]));
    let abs=0,sq=0,ape=0,apeN=0,sape=0,total=0,ss=0;
    pairs.forEach(([a,b])=>{const e=a-b;abs+=Math.abs(e);sq+=e*e;total+=Math.abs(a);ss+=(a-avg)**2;if(Math.abs(a)>1e-8){ape+=Math.abs(e/a);apeN++;}const den=Math.abs(a)+Math.abs(b);sape+=den>1e-8?2*Math.abs(e)/den:0;});
    return {mae:abs/pairs.length,rmse:Math.sqrt(sq/pairs.length),mape:apeN?ape/apeN*100:0,smape:sape/pairs.length*100,r2:ss>1e-12?1-sq/ss:(sq<1e-12?1:0),wape:total>1e-8?abs/total*100:0,n:pairs.length};
  }

  function statistical(id, series, o, horizon) {
    const n=Math.min(series.length,Math.round(num(o,'inputLength',24,2,720))), a=series.slice(-n), out=[];
    const win=Math.round(num(o,'window',id==='moving'?6:24,2,720));
    const alpha=num(o,'alpha',0.3,0.001,0.999),beta=num(o,'beta',0.1,0.001,0.999),damp=num(o,'damping',0.9,0.01,1);
    let level=a[0],trend=a.length>1?a[1]-a[0]:0;
    if(id==='ses'||id==='holt') for(let i=1;i<a.length;i++){const prev=level;level=alpha*a[i]+(1-alpha)*(id==='holt'?level+damp*trend:level);if(id==='holt')trend=beta*(level-prev)+(1-beta)*damp*trend;}
    let trendSum=0;
    for(let h=0;h<horizon;h++) {
      let value;
      if(id==='last')value=a[Math.max(0,a.length-Math.round(num(o,'lag',1,1,48)))];
      else if(id==='mean')value=mean(a.slice(-win));
      else if(id==='moving')value=mean(a.concat(out).slice(-win));
      else if(id==='weighted'){const v=a.concat(out).slice(-win),decay=num(o,'decay',0.8,0.01,1);let sum=0,ws=0;v.forEach((x,i)=>{const w=decay**(v.length-i-1);sum+=x*w;ws+=w;});value=sum/ws;}
      else if(id==='seasonal'){const period=Math.round(num(o,'period',24,2,168)),s=a.concat(out);const periodic=s[Math.max(0,s.length-Math.min(period,a.length))];const blend=num(o,'blend',1,0,1);value=blend*periodic+(1-blend)*mean(a);}
      else if(id==='drift'){const s=a.slice(-win),slope=s.length>1?(s[s.length-1]-s[0])/(s.length-1):0;trendSum+=damp**(h+1);value=s[s.length-1]+slope*trendSum;}
      else if(id==='ses')value=level;
      else if(id==='holt'){trendSum+=damp**(h+1);value=level+trend*trendSum;}
      else throw new Error('未知统计模型');
      out.push(Math.max(0,Number.isFinite(value)?value:a[a.length-1]));
    }
    return out;
  }

  function samples(series, inputLength) {
    const lags=Math.min(inputLength, Math.max(2,series.length-5));
    const mu=mean(series),sigma=Math.sqrt(mean(series.map(x=>(x-mu)**2)))||1;
    const norm=series.map(x=>(x-mu)/sigma),xs=[],ys=[];
    const stride=Math.max(1,Math.ceil((series.length-lags)/480));
    for(let i=lags;i<norm.length;i+=stride){xs.push(norm.slice(i-lags,i));ys.push(norm[i]);}
    return {lags,mu,sigma,norm,xs,ys};
  }

  async function train(id, series, options={}, onProgress=()=>{}) {
    if(!catalog.some(x=>x.id===id))throw new Error('未知预测算法：'+id);
    if(!Array.isArray(series)||series.length<8||series.some(x=>!Number.isFinite(+x)))throw new Error('训练至少需要 8 个有效数值观测。');
    series=series.map(Number);
    const o={...options},horizon=Math.round(num(o,'horizon',24,1,168)),inputLength=Math.round(num(o,'inputLength',24,2,168));
    const history=[];
    const report=async(epoch,total,loss)=>{const event={epoch,total,loss:Number.isFinite(loss)?Math.max(0,loss):0};history.push({...event});onProgress(event);await pause();};
    const safe=(v,fallback)=>Math.max(0,Number.isFinite(v)?v:fallback);
    if(!['ar','ridge','knn','mlp'].includes(id)){
      // Statistical models have no optimizer: progress is actual expanding-window one-step validation.
      const start=Math.max(3,series.length-Math.min(24,Math.floor(series.length/3))),actual=[],pred=[];
      const positions=[];for(let i=start;i<series.length;i+=Math.max(1,Math.ceil((series.length-start)/8)))positions.push(i);
      for(let j=0;j<positions.length;j++){const i=positions[j];actual.push(series[i]);pred.push(statistical(id,series.slice(0,i),{...o,inputLength},1)[0]);await report(j+1,positions.length,metrics(actual,pred).rmse);}
      return {modelId:id,predictions:statistical(id,series,{...o,inputLength},horizon),history,trainingSamples:series.length,progressLabel:'滚动回测',note:'统计模型无梯度训练；曲线为训练段内逐步累积的一步回测 RMSE。'};
    }
    const d=samples(series,inputLength),{xs,ys,lags}=d;
    if(!xs.length)throw new Error('输入窗口过长，无法构建训练样本。');
    let predict;
    if(id==='knn'){
      const k=Math.min(xs.length,Math.round(num(o,'neighbors',5,1,30))),power=num(o,'distancePower',1,0,2);
      predict=x=>{const near=xs.map((row,i)=>({i,d:Math.sqrt(mean(row.map((v,j)=>(v-x[j])**2)))})).sort((a,b)=>a.d-b.d).slice(0,k);if(near[0].d<1e-10)return ys[near[0].i];let sum=0,ws=0;near.forEach(n=>{const w=1/(Math.max(n.d,1e-6)**power);sum+=ys[n.i]*w;ws+=w;});return sum/ws;};
      // Leave-one-out error avoids reporting the trivially zero self-neighbour fit.
      let sum=0,count=0;const checks=Math.min(16,xs.length),step=Math.max(1,Math.floor(xs.length/checks));
      for(let j=0;j<checks;j++){const i=Math.min(j*step,xs.length-1),near=xs.map((row,z)=>({i:z,d:Math.sqrt(mean(row.map((v,t)=>(v-xs[i][t])**2)))})).filter(x=>x.i!==i).sort((a,b)=>a.d-b.d).slice(0,k);let estimate=near.length?mean(near.map(x=>ys[x.i])):ys[i];sum+=(estimate-ys[i])**2;count++;await report(j+1,checks,Math.sqrt(sum/count)*d.sigma);}
    }else if(id==='ar'||id==='ridge'){
      const weights=Array(lags).fill(0);let bias=0;
      // Initialize to persistence, then fit using the actual gradient of mean squared error.
      weights[lags-1]=1;
      const epochs=Math.round(num(o,'epochs',80,1,300)),rate=num(o,'learningRate',0.02,0.0001,0.1),lambda=id==='ridge'?num(o,'lambda',0.1,0,2):0;
      predict=x=>bias+x.reduce((s,v,j)=>s+v*weights[j],0);
      const period=Math.max(1,Math.floor(epochs/30));
      for(let e=1;e<=epochs;e++){
        const grad=Array(lags).fill(0);let gb=0;
        for(let i=0;i<xs.length;i++){const error=clamp(predict(xs[i])-ys[i],-30,30);gb+=error;for(let j=0;j<lags;j++)grad[j]+=error*xs[i][j];}
        const adaptiveRate=rate/Math.sqrt(Math.max(1,lags/4));
        for(let j=0;j<lags;j++)weights[j]-=adaptiveRate*clamp(2*grad[j]/xs.length+2*lambda*weights[j],-10,10);
        bias-=adaptiveRate*clamp(2*gb/xs.length,-10,10);
        if(e===1||e%period===0||e===epochs){const loss=Math.sqrt(mean(xs.map((x,i)=>(predict(x)-ys[i])**2)))*d.sigma;await report(e,epochs,loss);}
      }
    }else{
      const hidden=Math.round(num(o,'hidden',12,4,48)),epochs=Math.round(num(o,'epochs',60,1,200)),rate=num(o,'learningRate',0.01,0.0001,0.05);
      // Seeded initialization makes repeated classroom comparisons reproducible.
      let seed=271828;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
      const w1=Array.from({length:hidden},()=>Array.from({length:lags},()=>((rand()-0.5)*2)/Math.sqrt(lags))),b1=Array(hidden).fill(0),w2=Array.from({length:hidden},()=>((rand()-0.5)*2)/Math.sqrt(hidden));let b2=0;
      const forward=x=>{const a=w1.map((w,k)=>Math.tanh(b1[k]+w.reduce((s,v,j)=>s+v*x[j],0)));return {a,y:b2+a.reduce((s,v,k)=>s+v*w2[k],0)};};
      predict=x=>forward(x).y;
      const reportEvery=Math.max(1,Math.floor(epochs/30));
      for(let e=1;e<=epochs;e++){
        // Small sequential minibatches bound gradient variance and CPU time.
        const batch=24;
        for(let start=0;start<xs.length;start+=batch){
          const g1=w1.map(()=>Array(lags).fill(0)),gb1=Array(hidden).fill(0),g2=Array(hidden).fill(0);let gb2=0;
          const end=Math.min(xs.length,start+batch),n=end-start;
          for(let i=start;i<end;i++){const f=forward(xs[i]),error=clamp(f.y-ys[i],-10,10);gb2+=error;for(let k=0;k<hidden;k++){g2[k]+=error*f.a[k];const back=error*w2[k]*(1-f.a[k]**2);gb1[k]+=back;for(let j=0;j<lags;j++)g1[k][j]+=back*xs[i][j];}}
          for(let k=0;k<hidden;k++){for(let j=0;j<lags;j++)w1[k][j]-=rate*clamp(g1[k][j]/n,-2,2);b1[k]-=rate*clamp(gb1[k]/n,-2,2);w2[k]-=rate*clamp(g2[k]/n,-2,2);}b2-=rate*clamp(gb2/n,-2,2);
        }
        if(e===1||e%reportEvery===0||e===epochs){const loss=Math.sqrt(mean(xs.map((x,i)=>(predict(x)-ys[i])**2)))*d.sigma;await report(e,epochs,loss);}
      }
    }
    const state=d.norm.slice(),predictions=[];
    // Forecasting uses no future observations; the input advances with its own outputs.
    for(let h=0;h<horizon;h++){let z=predict(state.slice(-lags));z=clamp(Number.isFinite(z)?z:state[state.length-1],-8,8);const v=safe(z*d.sigma+d.mu,series[series.length-1]);predictions.push(v);state.push((v-d.mu)/d.sigma);}
    return {modelId:id,predictions,history,trainingSamples:xs.length,progressLabel:id==='knn'?'留一验证':'模型训练',note:id==='knn'?'曲线为训练窗口的留一邻居验证 RMSE；预测时检索完整训练样本。':'曲线为训练集 RMSE；最终评估须使用独立保留的未来观测。'};
  }
  root.TrafficModels={catalog,train,metrics};
})(typeof window!=='undefined'?window:globalThis);
