(function(root){
  'use strict';
  function loadPortrait(person){return new Promise(resolve=>{const image=new Image();let settled=false;const done=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value)};const timer=setTimeout(()=>done(null),4000);image.onload=()=>done(image);image.onerror=()=>done(null);image.src=new URL(`portraits/${person.image}`,location.href).href})}
  async function create(data){
    const {vector,people,person,evidence,dimensions,stance,poleVector,poleLabels,position,date,questionCount}=data;
    if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});
    const images=await Promise.all(people.map(loadPortrait));
    const width=1200,scale=1.5,maxHeight=3600,canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=maxHeight*scale;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('当前浏览器无法生成图片，请换一个浏览器重试。');ctx.scale(scale,scale);ctx.textBaseline='top';
    const c={paper:'#f8f3ed',white:'#fffcf8',ink:'#493851',body:'#7f6a8c',purple:'#87609b',coral:'#b78569',line:'#dfd0e5'};
    const font=(size,serif=false)=>{ctx.font=`400 ${size}px ${serif?'Georgia,"Songti SC","STSong",serif':'"PingFang SC","Microsoft YaHei",sans-serif'}`};
    const text=(value,x,y,size=24,color=c.body,align='left',serif=false)=>{font(size,serif);ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(value),x,y);ctx.textAlign='left'};
    const lines=(value,maxWidth,size=24,serif=false)=>{font(size,serif);let line='',result=[];for(const char of Array.from(value)){if(char==='\n'){result.push(line);line='';continue}if(line&&ctx.measureText(line+char).width>maxWidth){result.push(line);line=char}else line+=char}if(line)result.push(line);return result};
    const wrap=(value,x,y,maxWidth,size=24,lineHeight=37,color=c.body,serif=false)=>{const output=lines(value,maxWidth,size,serif);output.forEach((line,i)=>text(line,x,y+i*lineHeight,size,color,'left',serif));return y+output.length*lineHeight};
    const rounded=(x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke()}};
    const line=(x1,y1,x2,y2,color,width=1.5,dash=[])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])};
    ctx.fillStyle=c.paper;ctx.fillRect(0,0,width,maxHeight);text('philome.',64,50,66,c.purple,'left',true);text(date,1136,74,23,c.body,'right');line(64,147,1136,147,c.line);text('你的哲学立场，从这里展开。',64,183,44,c.ink,'left',true);text(`${questionCount} 句回答 · 4 组哲学立场 · 循着问题对读思想家`,64,252,25,c.body);
    let y=321;const detailW=524,detailGap=24,summaries=evidence.map((e,i)=>stance(e,i));
    const rowHeights=[0,1].map(row=>Math.max(...summaries.slice(row*2,row*2+2).map(s=>205+lines(s.copy,detailW-48,22).length*34)));
    dimensions.forEach((d,i)=>{const x=64+(i%2)*(detailW+detailGap),row=Math.floor(i/2),top=y+(row?rowHeights[0]+22:0),s=summaries[i];rounded(x,top,detailW,rowHeights[row],18,c.white,c.line);text(`0${i+1} · ${d.name}`,x+24,top+22,20,c.purple);text(s.title,x+24,top+60,29,c.ink,'left',true);const tx=x+26,ty=top+119,tw=detailW-52;line(tx,ty,tx+tw,ty,c.line,5);line(tx+tw/2,ty-7,tx+tw/2,ty+7,'#baa7c5');ctx.beginPath();ctx.arc(tx+tw*(vector[i]+1)/2,ty,7,0,Math.PI*2);ctx.fillStyle=c.purple;ctx.fill();text(d.leftLabel,tx,ty+20,21,c.body);text(d.rightLabel,tx+tw,ty+20,21,c.body,'right');wrap(s.copy,x+24,top+170,detailW-48,22,34)});
    y+=rowHeights[0]+rowHeights[1]+65;if(people.length){text('循着问题，遇见思想家',64,y,34,c.ink,'left',true);y+=61;}
    const cardTop=y,cardW=(1072-16*(Math.max(people.length,1)-1))/Math.max(people.length,1),cardH=398;
    people.forEach((p,i)=>{const x=64+i*(cardW+16);rounded(x,cardTop,cardW,cardH,20,c.white,c.line);text(`从${dimensions[p.recommendationAxis].name}读起`,x+20,cardTop+21,20,c.purple);const image=images[i],imgX=x+32,imgY=cardTop+63,imgW=cardW-64,imgH=218;if(image){const fit=Math.min(imgW/image.naturalWidth,imgH/image.naturalHeight),iw=image.naturalWidth*fit,ih=image.naturalHeight*fit;ctx.drawImage(image,imgX+(imgW-iw)/2,imgY+(imgH-ih)/2,iw,ih)}else{text(p.name.slice(0,1),x+cardW/2,imgY+70,65,c.purple,'center',true)}text(p.name,x+cardW/2,cardTop+298,p.name.length>6?26:32,c.ink,'center',true);text(`${position(p.v[p.recommendationAxis],p.recommendationAxis)} · 可对读 ${p.coverage}/4 组`,x+cardW/2,cardTop+351,20,c.body,'center')});
    y+=people.length?cardH+47:0;text('四组立场，八个方向',64,y,34,c.ink,'left',true);y+=62;
    const chartY=y,chartH=930;rounded(64,chartY,1072,chartH,22,'#373044');text('你的取向',person?440:600,chartY+28,23,'#dec0f4',person?'right':'center');if(person){line(462,chartY+40,500,chartY+40,'#d6b9ee',4);text(person.name,677,chartY+28,23,'#e2ab8e');line(623,chartY+40,657,chartY+40,'#e2ab8e',3,[7,5]);}
    const cx=600,cy=chartY+447,radius=280,labelR=374,point=(v,i,r=radius)=>{const angle=-Math.PI/2+i*Math.PI/4;return {x:cx+Math.cos(angle)*r*v,y:cy+Math.sin(angle)*r*v}};
    function polygon(values,fill,stroke,width=1.5){ctx.beginPath();values.forEach((v,i)=>{const p=point(v,i);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
    [.25,.5,.75,1].forEach(v=>{ctx.setLineDash(v===.5?[4,5]:[]);polygon(Array(8).fill(v),null,'#d6c5e035');ctx.setLineDash([])});
    poleLabels.forEach((label,i)=>{const end=point(1,i),p=point(1,i,labelR);line(cx,cy,end.x,end.y,'#d6c5e024');text(label,p.x,p.y-15,27,'#d6c6e0','center',true)});
    const own=poleVector(vector),reference=poleVector(person?.v||[null,null,null,null]),gradient=ctx.createLinearGradient(350,cy-200,850,cy+200);gradient.addColorStop(0,'#deb9f599');gradient.addColorStop(1,'#9e70c42e');polygon(own,gradient,'#d6b9ee',4);
    reference.forEach((v,i)=>{if(v===null)return;const p=point(v,i),next=(i+1)%8;if(reference[next]!==null){const q=point(reference[next],next);line(p.x,p.y,q.x,q.y,'#e2ab8e',3,[9,6])}ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fillStyle='#e2ab8e';ctx.fill()});own.forEach((v,i)=>{const p=point(v,i);ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fillStyle='#d6b9ee';ctx.fill()});
    text('同一直径连接一组立场；图形表示相对取向。',600,chartY+875,22,'#c9b8d2','center');y+=chartH+33;
    y=wrap(`${person?person.name+'有据可对读 '+person.coverage+'/4 组，其余留空。':''}两侧都认同或都保留，请结合上方四组摘要一起看。`,64,y,1072,23,36)+32;
    const strongest=vector.map((v,i)=>({v,i})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v))[0].i;text('留给自己的一个问题',64,y,29,c.ink,'left',true);y+=52;const q=dimensions[strongest].question,qHeight=lines(q,1008,29,true).length*46+44;rounded(64,y,1072,qHeight,16,'#eae0ef');wrap(q,96,y+23,1008,29,46,c.purple,true);y+=qHeight+33;line(64,y,1136,y,c.line);y+=26;text('philome · 遇见你的思想轮廓',64,y,21,c.purple);text('coihan.github.io/philome/',1136,y,21,c.body,'right');y+=58;
    if(y>maxHeight)throw new Error('本次总结排版未完成，请稍后重试。');const output=document.createElement('canvas');output.width=canvas.width;output.height=Math.ceil(y*scale);const out=output.getContext('2d');if(!out)throw new Error('图片生成失败，请稍后重试。');out.drawImage(canvas,0,0,output.width,output.height,0,0,output.width,output.height);return output;
  }
  root.PhilomeReport={create};
})(globalThis);
