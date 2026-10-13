(function(){
const D=window.GRAPH_DATA; if(!D){document.body.innerHTML='<p style="padding:20px">数据加载失败</p>';return;}
const COLORS={'眼睛':'#5fb3ff','妆容':'#ff6fa8','眼妆细分':'#ff9ad1','表情':'#ffc857','面部特征':'#f0915a','眼镜·配饰':'#7ee0b8','发色':'#c9a0ff','绘画教程':'#8fa3bf','其他':'#7b7b8c','专题文章':'#9d7bff','作品':'#ffffff'};
const ORDER=Object.keys(COLORS);
const byId={};D.nodes.forEach(n=>{byId[n.id]=n;n.nb=new Set();n.ln=new Set();});
D.links.forEach(l=>{const a=byId[l.source],b=byId[l.target];if(!a||!b)return;a.nb.add(b);b.nb.add(a);a.ln.add(l);b.ln.add(l);});
const imgs={};D.nodes.forEach(n=>{if(n.thumb){const i=new Image();i.src=n.thumb;imgs[n.id]=i;}});
const isMobile=matchMedia('(max-width:640px)').matches;
const off=new Set();let hover=null,sel=null,hl=new Set(),hlL=new Set();
const R=n=>n.type==='work'?7:Math.max(2.5,Math.sqrt(n.deg)*(n.type==='tag'?1.6:1.1));
const visible=n=>!off.has(n.cat);
const el=document.getElementById('graph');
const G=ForceGraph()(el).width(innerWidth).height(innerHeight).backgroundColor('#1e1e24')
 .graphData({nodes:D.nodes,links:D.links}).nodeId('id').nodeVal(n=>R(n)**2).nodeRelSize(1)
 .nodeVisibility(visible).linkVisibility(l=>visible(l.source)&&visible(l.target))
 .linkColor(l=>hlL.size?(hlL.has(l)?'rgba(190,160,255,.85)':'rgba(120,120,140,.05)'):'rgba(140,140,160,.16)')
 .linkWidth(l=>hlL.has(l)?1.4:.5).cooldownTicks(isMobile?120:250).d3VelocityDecay(.3)
 .nodeLabel(()=>'' ).enableNodeDrag(!isMobile)
 .nodeCanvasObject((n,ctx,k)=>{
   const r=R(n),dim=hl.size&&!hl.has(n);ctx.globalAlpha=dim?.15:1;
   const c=COLORS[n.cat]||'#999';
   if(n.type==='work'&&imgs[n.id]&&imgs[n.id].complete&&imgs[n.id].naturalWidth){
     ctx.save();ctx.beginPath();ctx.arc(n.x,n.y,r,0,7);ctx.clip();ctx.drawImage(imgs[n.id],n.x-r,n.y-r,2*r,2*r);ctx.restore();
     ctx.beginPath();ctx.arc(n.x,n.y,r,0,7);ctx.lineWidth=(n===sel?2:1)/k*2;ctx.strokeStyle=n===sel?'#fff':'#ff9ad1';ctx.stroke();
   }else{ctx.beginPath();ctx.arc(n.x,n.y,r,0,7);ctx.fillStyle=c;ctx.fill();
     if(n===sel){ctx.lineWidth=2/k;ctx.strokeStyle='#fff';ctx.stroke();}}
   const show=n===hover||n===sel||(hl.size&&hl.has(n)&&n.type!=='work')||(n.type==='tag'&&(k>1.6||n.deg>14))||(n.type==='article'&&k>3.2);
   if(show){const fs=Math.max(11/k,(n.type==='tag'?2.6:2));ctx.font=`${fs}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';
     ctx.fillStyle=dim?'#666':'#dcddde';let t=n.name;if(t.length>18)t=t.slice(0,17)+'…';ctx.fillText(t,n.x,n.y+r+1.5/k*2);}
   ctx.globalAlpha=1;})
 .nodePointerAreaPaint((n,c,ctx)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(n.x,n.y,R(n)+2,0,7);ctx.fill();})
 .onNodeHover(n=>{hover=n||null;el.style.cursor=n?'pointer':'';if(!sel)setHL(n);})
 .onNodeClick(n=>select(n,true)).onBackgroundClick(()=>{select(null);});
G.d3Force('charge').strength(-38);G.d3Force('link').distance(l=>l.kind==='work-tag'?40:28);
addEventListener('resize',()=>G.width(innerWidth).height(innerHeight));
function setHL(n){hl=new Set();hlL=new Set();if(n){hl.add(n);n.nb.forEach(x=>hl.add(x));n.ln.forEach(l=>hlL.add(l));}}
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const panel=document.getElementById('panel'),pb=document.getElementById('pbody');
function chip(n){return `<span class="tag" data-id="${n.id}" style="border-left:3px solid ${COLORS[n.cat]}">${esc(n.name)}</span>`;}
function sortDeg(a){return a.sort((x,y)=>y.deg-x.deg);}
function select(n,center){sel=n||null;setHL(sel);if(!n){panel.classList.add('hidden');return;}
  if(off.has(n.cat)){off.delete(n.cat);renderFilters();refresh();}
  const nb=[...n.nb],works=nb.filter(x=>x.type==='work'),tags=sortDeg(nb.filter(x=>x.type==='tag')),arts=nb.filter(x=>x.type==='article');
  let h='';
  if(n.type==='work'){
    h+=`<h2>${esc(n.name)}</h2><div class="sub">画师：${esc(n.artist)}</div>`;
    if(n.img)h+=`<img class="main" src="${n.img}" alt="">`;
    if(n.note)h+=`<div class="note">眼妆简评（个人观察）：${esc(n.note)}</div>`;
    h+=`<h3>标签</h3><div class="tags">${tags.map(chip).join('')}</div>`;
    if(arts.length)h+=`<h3>收录于专题</h3><div class="alist">${arts.map(a=>`<div data-id="${a.id}">${esc(a.name)}</div>`).join('')}</div>`;
    h+=`<h3>原作地址（纯文本）</h3><div class="plain">${esc(n.url)}</div>`;
  }else if(n.type==='tag'){
    h+=`<h2>#${esc(n.name)}</h2><div class="sub">${esc(n.en)} · ${esc(n.cat)} · 关联 ${n.deg}</div>`;
    h+=`<h3>相关作品（${works.length}）</h3>`+(works.length?`<div class="grid">${works.map(w=>`<img src="${w.thumb}" data-id="${w.id}" title="${esc(w.name)}" loading="lazy">`).join('')}</div>`:'<div class="sub">暂无收录作品</div>');
    if(arts.length)h+=`<h3>相关专题（${arts.length}）</h3><div class="alist">${arts.map(a=>`<div data-id="${a.id}">${esc(a.name)}</div>`).join('')}</div>`;
    if(n.url)h+=`<h3>pixivision 标签页（纯文本）</h3><div class="plain">${esc(n.url)}</div>`;
  }else{
    h+=`<h2>${esc(n.name)}</h2><div class="sub">${esc(n.en)}</div>`;if(n.img)h+=`<img class="main" src="${n.img}" alt="">`;
    h+=`<h3>标签</h3><div class="tags">${tags.map(chip).join('')}</div>`;
    if(works.length)h+=`<h3>收录作品（${works.length}）</h3><div class="grid">${works.map(w=>`<img src="${w.thumb}" data-id="${w.id}" loading="lazy">`).join('')}</div>`;
    h+=`<h3>原文地址（纯文本）</h3><div class="plain">${esc(n.url)}</div>`;
  }
  pb.innerHTML=h;panel.classList.remove('hidden');panel.scrollTop=0;
  if(center&&n.x!=null){const z=Math.max(G.zoom(),2.6);G.zoom(z,600);G.centerAt(n.x+(isMobile?0:170/z),n.y+(isMobile?innerHeight*0.27/z:0),600);}}
pb.addEventListener('click',e=>{const id=e.target.dataset.id;if(id&&byId[id])select(byId[id],true);});
document.getElementById('close').onclick=()=>select(null);
// filters
const fl=document.getElementById('filters');
function renderFilters(){fl.innerHTML=ORDER.map(c=>`<span class="chip ${off.has(c)?'off':''}" data-c="${c}"><i class="dot" style="background:${COLORS[c]}"></i>${c}</span>`).join('')+'<span class="chip" data-c="__all">全部显示</span>';}
fl.onclick=e=>{const c=e.target.closest('.chip');if(!c)return;const k=c.dataset.c;if(k==='__all')off.clear();else off.has(k)?off.delete(k):off.add(k);renderFilters();refresh();};
function refresh(){G.nodeVisibility(visible);G.linkVisibility(l=>visible(l.source)&&visible(l.target));}
document.getElementById('ftoggle').onclick=()=>fl.classList.toggle('hidden');renderFilters();
document.getElementById('legend').innerHTML=ORDER.map(c=>`<span><i class="dot" style="background:${COLORS[c]}"></i>${c}</span>`).join('');
// search
const q=document.getElementById('q'),sg=document.getElementById('sugg');let hits=[],hi=0;
q.oninput=()=>{const s=q.value.trim().toLowerCase();if(!s){sg.style.display='none';return;}
 hits=D.nodes.filter(n=>[n.name,n.en,n.artist,n.note].some(v=>v&&v.toLowerCase().includes(s))).sort((a,b)=>b.deg-a.deg).slice(0,12);hi=0;
 sg.innerHTML=hits.map((n,i)=>`<li data-i="${i}" class="${i?'':'on'}"><i class="dot" style="background:${COLORS[n.cat]}"></i>${esc(n.name)}<small style="color:#888;margin-left:auto">${n.type==='work'?esc(n.artist):n.cat}</small></li>`).join('')||'<li>无结果</li>';sg.style.display='block';};
sg.onclick=e=>{const li=e.target.closest('li');if(li&&li.dataset.i){pick(hits[+li.dataset.i]);}};
q.onkeydown=e=>{if(e.key==='Enter'&&hits[hi])pick(hits[hi]);};
function pick(n){sg.style.display='none';q.blur();select(n,true);}
G.onEngineStop(()=>{if(!window.__fit){window.__fit=1;G.zoomToFit(500,isMobile?20:60);const m=location.hash.match(/sel=(\w+)/);if(m&&byId[m[1]])setTimeout(()=>select(byId[m[1]],true),700);}});
window.__G=G;window.__select=id=>select(byId[id],true);
})();
