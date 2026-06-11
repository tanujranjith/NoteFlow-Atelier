'use strict';

// Edit scene durations here. Values are seconds.
const FILM_TIMING = {
  chaos: 20,
  transitionToClarity: 1.5,
  clarity: 44,
  transitionToIdentity: 2.5,
  identity: 24,
  finalHold: 5
};

const LABELS = ['Notes','Assignments','Timeline','Tasks','AP Study','Review','Focus','Deadline Radar','Grades','Schedule'];
const SHAPES = ['pane','slice','tile','curve'];
const ASPECTS = {'16:9':16/9,'9:16':9/16,'1:1':1};
const RESOLUTIONS = {'1920x1080':[1920,1080],'2560x1440':[2560,1440],'3840x2160':[3840,2160],'1080x1920':[1080,1920]};
const params = new URLSearchParams(location.search);

const dom = {
  shell: document.getElementById('filmShell'), canvas: document.getElementById('ambientCanvas'), glass: document.getElementById('glassLayer'),
  back: document.getElementById('threadBack'), front: document.getElementById('threadFront'), logo: document.getElementById('logoLayer'),
  beta: document.getElementById('betaBadge'), tagline: document.getElementById('tagline'), guide: document.getElementById('safeZoneGuide'), controls: document.getElementById('controls'),
  timeline: document.getElementById('timeline'), timelineValue: document.getElementById('timelineValue'), sceneReadout: document.getElementById('sceneReadout'),
  playPause: document.getElementById('playPause'), restart: document.getElementById('restart'), fullscreen: document.getElementById('fullscreen'), hideControls: document.getElementById('hideControls'),
  sceneSelect: document.getElementById('sceneSelect'), zoneSelect: document.getElementById('zoneSelect'), aspectSelect: document.getElementById('aspectSelect'), resolutionSelect: document.getElementById('resolutionSelect'), speedSelect: document.getElementById('speedSelect'), chromaSelect: document.getElementById('chromaSelect'),
  labelsToggle: document.getElementById('labelsToggle'), logoToggle: document.getElementById('logoToggle'), particlesToggle: document.getElementById('particlesToggle'), filamentsToggle: document.getElementById('filamentsToggle'), guidesToggle: document.getElementById('guidesToggle'), betaToggle: document.getElementById('betaToggle'), taglineToggle: document.getElementById('taglineToggle')
};
const ctx = dom.canvas.getContext('2d');
const threadPaths = Array.from(document.querySelectorAll('[data-thread-layer]'));
const VIEW = {w:1600,h:900};
const TOTAL = Object.values(FILM_TIMING).reduce((a,b)=>a+b,0);
const START = {
  chaos: 0,
  transitionToClarity: FILM_TIMING.chaos,
  clarity: FILM_TIMING.chaos + FILM_TIMING.transitionToClarity,
  transitionToIdentity: FILM_TIMING.chaos + FILM_TIMING.transitionToClarity + FILM_TIMING.clarity,
  identity: FILM_TIMING.chaos + FILM_TIMING.transitionToClarity + FILM_TIMING.clarity + FILM_TIMING.transitionToIdentity,
  finalHold: TOTAL - FILM_TIMING.finalHold
};
const RANGES = {
  full:[0,TOTAL], chaos:[0,START.clarity], clarity:[START.transitionToClarity,START.identity], identity:[START.transitionToIdentity,TOTAL]
};

const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const ease=t=>1-Math.pow(1-clamp(t),3);
const fmt=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`;
function seedHash(str){let h=2166136261>>>0;for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const seed=Number(params.get('seed')||42); const rand=mulberry32(seedHash(seed));
const rr=(a,b)=>mix(a,b,rand()); const pick=a=>a[Math.floor(rand()*a.length)];

const state = {
  time:0, playing:true, speed:Number(params.get('speed')||1), scene:params.get('scene')||'full', zone:params.get('zone')||'center-clear', aspect:params.get('aspect')||'16:9', resolution:params.get('resolution')||'1920x1080', chroma:params.get('chroma')||'none',
  labels:params.get('labels')!=='0', logo:params.get('logo')!=='0', particles:params.get('particles')!=='0', filaments:params.get('filaments')!=='0', guides:params.get('guides')==='1', beta:params.get('beta')!=='0', tagline:params.get('tagline')!=='0', backgroundOnly:params.get('backgroundOnly')==='1', controls:params.get('controls')!=='0', hidden:false, last:0, dpr:1, width:0, height:0
};
if(!RANGES[state.scene]) state.scene='full'; if(!ASPECTS[state.aspect]) state.aspect='16:9'; if(!RESOLUTIONS[state.resolution]) state.resolution='1920x1080'; if(!['none','green','blue','checker'].includes(state.chroma)) state.chroma='none';
if(state.backgroundOnly){state.labels=false;state.logo=false;state.tagline=false;state.controls=false}

function safeRect(zone){
  if(zone==='left-clear') return {x:.04,y:.12,w:.48,h:.76};
  if(zone==='right-clear') return {x:.48,y:.12,w:.48,h:.76};
  if(zone==='product-frame') return {x:.15,y:.13,w:.70,h:.74};
  if(zone==='full-atmosphere') return {x:0,y:0,w:0,h:0};
  return {x:.25,y:.2,w:.5,h:.6};
}
function insideSafe(x,y,pad=.02){const r=safeRect(state.zone);return r.w>0&&x>r.x-pad&&x<r.x+r.w+pad&&y>r.y-pad&&y<r.y+r.h+pad}
function nudgeOut(x,y,pad=.03){const r=safeRect(state.zone);if(!insideSafe(x,y,pad))return{x,y};const dl=Math.abs(x-(r.x-pad)),dr=Math.abs(x-(r.x+r.w+pad)),dt=Math.abs(y-(r.y-pad)),db=Math.abs(y-(r.y+r.h+pad));const m=Math.min(dl,dr,dt,db);if(m===dl)x=r.x-pad;else if(m===dr)x=r.x+r.w+pad;else if(m===dt)y=r.y-pad;else y=r.y+r.h+pad;return{x:clamp(x,.03,.97),y:clamp(y,.05,.95)}}

const fragments = Array.from({length:26},(_,i)=>{
  const chaos={x:rr(.05,.95),y:rr(.08,.92),z:rr(-240,280),rx:rr(-18,18),ry:rr(-26,26),rz:rr(-18,18),s:rr(.72,1.28)};
  const ring=Math.PI*2*(i/26)+rr(-.28,.28), radius=rr(.31,.48);
  const clarity=nudgeOut(.5+Math.cos(ring)*radius,.5+Math.sin(ring)*radius*.62,.06);
  const identity=nudgeOut(.5+Math.cos(ring)*rr(.43,.61),.5+Math.sin(ring)*rr(.37,.57),.10);
  return {i,label:i<LABELS.length?LABELS[i]:'',shape:pick(SHAPES),chaos,clarity:{...clarity,z:rr(-120,210),rx:rr(-8,8),ry:rr(-12,12),rz:rr(-8,8),s:rr(.74,1.1)},identity:{...identity,z:rr(-170,100),rx:rr(-5,5),ry:rr(-8,8),rz:rr(-5,5),s:rr(.60,.92)},w:rr(70,190),h:rr(24,78),phase:rr(0,Math.PI*2),el:null};
});
fragments.forEach(f=>{const el=document.createElement('div');el.className=`glass shape-${f.shape}${f.label?'':' no-label'}`;el.style.width=`${f.w}px`;el.style.height=`${f.h}px`;el.innerHTML=`<span class="glass-label">${f.label}</span>`;dom.glass.appendChild(el);f.el=el});
const particles=Array.from({length:150},()=>({x:rand(),y:rand(),z:rr(.2,1),r:rr(.4,1.7),a:rr(.04,.18),vx:rr(-.00004,.00004),vy:rr(-.00003,.00003),p:rr(0,7)}));
const filamentNodes=Array.from({length:18},()=>({x:rand(),y:rand(),p:rr(0,7)}));

const PRESETS={
 chaos:[[.02,.28],[.16,.15],[.29,.72],[.43,.2],[.57,.78],[.72,.26],[.84,.7],[.98,.42]],
 clarity:[[.02,.56],[.16,.43],[.30,.62],[.44,.40],[.58,.58],[.72,.38],[.86,.56],[.98,.47]],
 identity:[[.04,.56],[.22,.55],[.36,.58],[.45,.67],[.53,.68],[.61,.58],[.72,.54],[.96,.55]]
};
function route(points){return points.map(([x,y])=>{const q=nudgeOut(x,y,.025);return[q.x,q.y]})}
function pathPoints(scene,drift){return route(PRESETS[scene].map(([x,y],i)=>[x+Math.sin(drift*.42+i*1.7)*.012,y+Math.cos(drift*.35+i*1.31)*.018]))}
function catmull(points){const p=points.map(([x,y])=>[x*VIEW.w,y*VIEW.h]);let d=`M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;for(let i=0;i<p.length-1;i++){const p0=p[Math.max(0,i-1)],p1=p[i],p2=p[i+1],p3=p[Math.min(p.length-1,i+2)];const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];d+=` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`};return d}
function phase(t){
  if(t<START.transitionToClarity)return{a:'chaos',b:'chaos',u:0,local:t/FILM_TIMING.chaos};
  if(t<START.clarity)return{a:'chaos',b:'clarity',u:smooth((t-START.transitionToClarity)/FILM_TIMING.transitionToClarity),local:0};
  if(t<START.transitionToIdentity)return{a:'clarity',b:'clarity',u:0,local:(t-START.clarity)/FILM_TIMING.clarity};
  if(t<START.identity)return{a:'clarity',b:'identity',u:smooth((t-START.transitionToIdentity)/FILM_TIMING.transitionToIdentity),local:0};
  return{a:'identity',b:'identity',u:0,local:(t-START.identity)/(FILM_TIMING.identity+FILM_TIMING.finalHold)};
}
function getFragmentPose(f,t){const ph=phase(t),A=f[ph.a],B=f[ph.b],u=ph.u;let driftAmp=ph.a==='chaos'?.023:ph.a==='clarity'?.010:.003;const calm=t>=START.finalHold?0:1;let x=mix(A.x,B.x,u)+Math.sin(t*.28+f.phase)*driftAmp*calm,y=mix(A.y,B.y,u)+Math.cos(t*.24+f.phase*1.2)*driftAmp*.8*calm;return{x,y,z:mix(A.z,B.z,u),rx:mix(A.rx,B.rx,u),ry:mix(A.ry,B.ry,u),rz:mix(A.rz,B.rz,u),s:mix(A.s,B.s,u)} }
function threadScene(t){if(t<START.transitionToClarity)return'chaos';if(t<START.transitionToIdentity)return'clarity';return'identity'}
function threadDrawProgress(t){if(t<FILM_TIMING.chaos*.62)return clamp(t/(FILM_TIMING.chaos*.62))*.18;if(t<FILM_TIMING.chaos-.45)return mix(.18,.68,ease((t-FILM_TIMING.chaos*.62)/(FILM_TIMING.chaos*.33)));if(t<FILM_TIMING.chaos)return .68;return 1}

let currentPath=[],svgLength=1500;
function updateThread(t){
  const scene=threadScene(t),target=pathPoints(scene,t),ph=phase(t);let pts=target;
  if(ph.a!==ph.b){const a=pathPoints(ph.a,t),b=pathPoints(ph.b,t);pts=a.map((p,i)=>[mix(p[0],b[i][0],ph.u),mix(p[1],b[i][1],ph.u)])}
  currentPath=pts;const d=catmull(pts);threadPaths.forEach(p=>p.setAttribute('d',d));
  try{svgLength=threadPaths[2].getTotalLength()}catch(e){svgLength=1500}
  const draw=threadDrawProgress(t); threadPaths.forEach(p=>{p.style.strokeDasharray=`${svgLength}`; if(!p.classList.contains('thread-pulse'))p.style.strokeDashoffset=`${svgLength*(1-draw)}`});
  const pulse=threadPaths.find(p=>p.classList.contains('thread-pulse')); if(pulse){pulse.style.strokeDasharray=`${Math.max(34,svgLength*.045)} ${svgLength}`;pulse.style.strokeDashoffset=`${-(t*140)%svgLength}`}
  dom.back.style.opacity=String(t<START.clarity?.78:1);dom.front.style.opacity=String(t<START.clarity?.42:.72);
}
function pointSegDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,u=clamp(((px-ax)*dx+(py-ay)*dy)/l);return Math.hypot(px-(ax+u*dx),py-(ay+u*dy))}
function threadDistance(x,y){let best=99;for(let i=0;i<currentPath.length-1;i++)best=Math.min(best,pointSegDist(x,y,...currentPath[i],...currentPath[i+1]));return best}

function updateFragments(t){const ph=phase(t),chaos=ph.a==='chaos',labelOpacity=state.labels&&t<START.transitionToIdentity?1:0;fragments.forEach(f=>{const p=getFragmentPose(f,t),dist=threadDistance(p.x,p.y),near=clamp(1-dist/.14),visible=t<START.identity?1:clamp(1-(t-START.identity)/12)+.1;f.el.style.opacity=String(visible*(.22+p.s*.52));f.el.style.transform=`translate(-50%,-50%) translate3d(${(p.x-.5)*100}vw,${(p.y-.5)*100}vh,${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) scale(${p.s})`;f.el.style.setProperty('--glow',String(.03+near*.34));f.el.style.setProperty('--edge',String(.07+near*.32));f.el.classList.toggle('is-lit',near>.4);const label=f.el.querySelector('.glass-label');if(label)label.style.opacity=String(labelOpacity*(chaos?.82:.46))})}

function resize(){const rect=dom.shell.getBoundingClientRect();state.width=rect.width;state.height=rect.height;state.dpr=Math.min(devicePixelRatio||1,2);dom.canvas.width=Math.max(1,Math.floor(rect.width*state.dpr));dom.canvas.height=Math.max(1,Math.floor(rect.height*state.dpr));dom.canvas.style.width=`${rect.width}px`;dom.canvas.style.height=`${rect.height}px`;ctx.setTransform(state.dpr,0,0,state.dpr,0,0);updateGuide()}
function drawBackground(t){const w=state.width,h=state.height;ctx.clearRect(0,0,w,h);if(state.chroma!=='none')return;const g=ctx.createRadialGradient(w*.5+Math.sin(t*.13)*w*.08,h*.38+Math.cos(t*.11)*h*.05,0,w*.5,h*.48,Math.max(w,h)*.86);g.addColorStop(0,'rgba(7,17,31,.96)');g.addColorStop(.55,'rgba(5,9,20,.94)');g.addColorStop(1,'rgba(3,5,10,1)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);if(!state.particles)return;ctx.save();ctx.globalCompositeOperation='screen';particles.forEach(p=>{p.x=(p.x+p.vx+1)%1;p.y=(p.y+p.vy+1)%1;if(insideSafe(p.x,p.y,.015))return;const tw=.65+.35*Math.sin(t*.6+p.p);ctx.fillStyle=`rgba(180,205,255,${p.a*tw})`;ctx.beginPath();ctx.arc(p.x*w,p.y*h,p.r*p.z,0,Math.PI*2);ctx.fill()});ctx.restore()}
function drawFilaments(t){if(!state.filaments||state.chroma!=='none')return;const w=state.width,h=state.height,amount=threadScene(t)==='chaos'?6:threadScene(t)==='clarity'?4:1;ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';for(let i=0;i<amount;i++){const a=filamentNodes[(i*3+Math.floor(t*.18))%filamentNodes.length],b=filamentNodes[(i*5+7)%filamentNodes.length];let A=nudgeOut(a.x,a.y,.03),B=nudgeOut(b.x,b.y,.03);const pulse=.5+.5*Math.sin(t*.8+a.p);ctx.strokeStyle=`rgba(120,165,255,${.025+pulse*.055})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(A.x*w,A.y*h);ctx.quadraticCurveTo((A.x+B.x)*.5*w,(A.y+B.y)*.5*h+Math.sin(t*.4+i)*36,B.x*w,B.y*h);ctx.stroke()}ctx.restore()}
function updateLogo(t){const show=state.logo&&!state.backgroundOnly;const fade=smooth(clamp((t-(START.identity+FILM_TIMING.identity*.34))/3));dom.logo.style.opacity=String(show?fade:0);dom.logo.style.transform=`scale(${mix(.985,1,fade)})`;dom.beta.style.display=state.beta?'block':'none';dom.tagline.style.display=state.tagline?'block':'none'}
function updateGuide(){const r=safeRect(state.zone);dom.guide.style.left=`${r.x*100}%`;dom.guide.style.top=`${r.y*100}%`;dom.guide.style.width=`${r.w*100}%`;dom.guide.style.height=`${r.h*100}%`}
function applyAspect(){const ratio=ASPECTS[state.aspect];const vw=innerWidth,vh=innerHeight;let w=vw,h=vh;if(vw/vh>ratio)w=vh*ratio;else h=vw/ratio;dom.shell.style.width=`${w}px`;dom.shell.style.height=`${h}px`;resize()}
function applyChroma(){dom.shell.classList.remove('chroma-green','chroma-blue','chroma-checker');if(state.chroma!=='none')dom.shell.classList.add(`chroma-${state.chroma}`)}
function setScene(name,restart=true){if(!RANGES[name])name='full';state.scene=name;dom.sceneSelect.value=name;if(restart)state.time=RANGES[name][0];syncControls()}
function range(){return RANGES[state.scene]||RANGES.full}
function restart(){state.time=range()[0];syncControls()}
function togglePlay(){state.playing=!state.playing;syncControls()}
function setControls(show){state.controls=show;dom.controls.classList.toggle('is-hidden',!show)}
function syncControls(){const [a,b]=range();dom.timeline.min=String(a);dom.timeline.max=String(b);dom.timeline.value=String(state.time);dom.timelineValue.textContent=fmt(state.time);dom.sceneReadout.textContent=`${dom.sceneSelect.options[dom.sceneSelect.selectedIndex].text} · ${fmt(state.time)}`;dom.playPause.textContent=state.playing?'Pause':'Play';dom.zoneSelect.value=state.zone;dom.aspectSelect.value=state.aspect;dom.resolutionSelect.value=state.resolution;dom.speedSelect.value=String(state.speed);dom.chromaSelect.value=state.chroma;dom.labelsToggle.checked=state.labels;dom.logoToggle.checked=state.logo;dom.particlesToggle.checked=state.particles;dom.filamentsToggle.checked=state.filaments;dom.guidesToggle.checked=state.guides;dom.betaToggle.checked=state.beta;dom.taglineToggle.checked=state.tagline;dom.shell.classList.toggle('debug-guides',state.guides);setControls(state.controls);updateGuide()}
function setUrl(){const p=new URLSearchParams();p.set('scene',state.scene);p.set('zone',state.zone);p.set('aspect',state.aspect);p.set('speed',state.speed);p.set('seed',seed);if(!state.labels)p.set('labels','0');if(!state.logo)p.set('logo','0');if(!state.controls)p.set('controls','0');if(state.backgroundOnly)p.set('backgroundOnly','1');if(state.chroma!=='none')p.set('chroma',state.chroma);history.replaceState(null,'',`${location.pathname}?${p}`)}
function render(now){if(!state.last)state.last=now;const dt=Math.min(80,now-state.last)/1000;state.last=now;if(state.playing&&!document.hidden){state.time+=dt*state.speed;const [a,b]=range();if(state.time>b)state.time=state.scene==='full'?a:b}drawBackground(state.time);drawFilaments(state.time);updateThread(state.time);updateFragments(state.time);updateLogo(state.time);syncControls();requestAnimationFrame(render)}

function bind(){
  dom.playPause.onclick=togglePlay;dom.restart.onclick=restart;dom.fullscreen.onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();dom.hideControls.onclick=()=>setControls(false);
  dom.timeline.oninput=e=>{state.time=Number(e.target.value);syncControls()};dom.sceneSelect.onchange=e=>setScene(e.target.value,true);dom.zoneSelect.onchange=e=>{state.zone=e.target.value;updateGuide();setUrl()};dom.aspectSelect.onchange=e=>{state.aspect=e.target.value;applyAspect();setUrl()};dom.resolutionSelect.onchange=e=>{state.resolution=e.target.value;const [w,h]=RESOLUTIONS[state.resolution];state.aspect=w/h>1.3?'16:9':w/h<.8?'9:16':'1:1';applyAspect();syncControls()};dom.speedSelect.onchange=e=>{state.speed=Number(e.target.value);setUrl()};dom.chromaSelect.onchange=e=>{state.chroma=e.target.value;applyChroma();setUrl()};
  [['labelsToggle','labels'],['logoToggle','logo'],['particlesToggle','particles'],['filamentsToggle','filaments'],['guidesToggle','guides'],['betaToggle','beta'],['taglineToggle','tagline']].forEach(([id,key])=>dom[id].onchange=e=>{state[key]=e.target.checked;syncControls();setUrl()});
  addEventListener('resize',applyAspect);document.addEventListener('visibilitychange',()=>{state.last=0});
  addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;const step=e.shiftKey?5:1;if(e.code==='Space'){e.preventDefault();togglePlay()}else if(e.key==='r'||e.key==='R')restart();else if(e.key==='0')setScene('full');else if(e.key==='1')setScene('chaos');else if(e.key==='2')setScene('clarity');else if(e.key==='3')setScene('identity');else if(e.key==='h'||e.key==='H')setControls(!state.controls);else if(e.key==='l'||e.key==='L'){state.labels=!state.labels;syncControls()}else if(e.key==='g'||e.key==='G'){state.guides=!state.guides;syncControls()}else if(e.key==='f'||e.key==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}else if(e.key==='ArrowLeft'){state.time=clamp(state.time-step,range()[0],range()[1]);syncControls()}else if(e.key==='ArrowRight'){state.time=clamp(state.time+step,range()[0],range()[1]);syncControls()}})
}

bind();applyChroma();applyAspect();setScene(state.scene,false);syncControls();requestAnimationFrame(render);
