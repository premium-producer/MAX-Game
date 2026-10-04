const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const header=document.querySelector('header');
const menuButton=header.querySelector('.menuButton');
const mobile=document.createElement('div');mobile.className='mobileMenu svelte-1elxaub';mobile.id='local-mobile-menu';mobile.hidden=true;
const nav=document.createElement('nav');nav.className='mobileNav svelte-1elxaub';
for(const link of header.querySelectorAll('.menuLink,.downloadLink')){const clone=link.cloneNode(true);clone.className='mobileLink svelte-1elxaub';nav.append(clone);}
mobile.append(nav);header.append(mobile);menuButton.setAttribute('aria-controls',mobile.id);
function setMenu(open){header.classList.toggle('header--open',open);mobile.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');}
setMenu(false);menuButton.addEventListener('click',()=>setMenu(mobile.hidden));
mobile.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){setMenu(false);menuButton.focus();}});
matchMedia('(min-width:1195px)').addEventListener('change',event=>{if(event.matches)setMenu(false);});

const data=await fetch('./content.json').then(response=>{if(!response.ok)throw Error('Content HTTP '+response.status);return response.json();});
const guideSection=document.querySelector('.create-guide-tabs');
const guideHost=guideSection.querySelector('.wrapper.svelte-nllo4u');
const guideButtons=[...guideSection.querySelectorAll('.create-guide-nav__button')];
const guidePanels=data.guides.map((markup,index)=>{const template=document.createElement('template');template.innerHTML=markup;const panel=template.content.firstElementChild;panel.id=`local-guide-${index}`;panel.hidden=index!==0;return panel;});
guideHost.replaceChildren(...guidePanels);
let guideAnimation;
for(const [index,button] of guideButtons.entries()){
 button.setAttribute('aria-controls',guidePanels[index].id);button.setAttribute('aria-pressed',String(index===0));
 button.addEventListener('click',()=>{
  if(!guidePanels[index].hidden)return;
  guideAnimation?.cancel();
  for(const [i,panel] of guidePanels.entries()){panel.hidden=i!==index;guideButtons[i].setAttribute('aria-pressed',String(i===index));guideButtons[i].parentElement.classList.toggle('create-guide-nav__item_active',i===index);}
  guideSection.className=`create-guide-tabs create-guide-tabs_clip-${index} svelte-u285rn`;
  if(!reduced.matches)guideAnimation=guidePanels[index].animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.2,.7,.2,1)'});
  playback();
 });
}

const faqHost=document.querySelector('.faq__content');
const oldGroup=faqHost.querySelector('.accordion-group');
const groups=[0,1].map(groupIndex=>{
 const group=document.createElement('div');group.className='accordion-group svelte-19ubtie';group.id=`local-faq-group-${groupIndex}`;group.hidden=groupIndex!==0;
 for(const [index,[title,content]] of data.faq.slice(groupIndex?7:0,groupIndex?13:7).entries()){
  const item=document.createElement('section');item.className='accordion-item svelte-1nl1uk4';
  const button=document.createElement('button');button.type='button';button.className='accordion-trigger svelte-1nl1uk4';button.setAttribute('aria-expanded','false');
  button.innerHTML=title+'<div class="accordion-trigger-icon svelte-1rwhs78"><span class="accordion-trigger-icon__line svelte-1rwhs78"></span><span class="accordion-trigger-icon__line accordion-trigger-icon__line_v svelte-1rwhs78"></span></div>';
  const panel=document.createElement('div');panel.className='local-faq-panel';panel.id=`local-answer-${groupIndex}-${index}`;panel.dataset.open='false';panel.inert=true;panel.setAttribute('aria-hidden','true');
  const inner=document.createElement('div');inner.className='local-faq-inner';inner.innerHTML='<div class="accordion-content svelte-1nl1uk4">'+content+'</div>';panel.append(inner);button.setAttribute('aria-controls',panel.id);
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));panel.dataset.open=String(open);panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));button.querySelector('.accordion-trigger-icon').classList.toggle('isOpen',open);});
  item.append(button,panel);group.append(item);
 }
 return group;
});
oldGroup.replaceWith(...groups);
const tabs=document.querySelector('.faq__tabs .tabs');
const faqButtons=[...tabs.querySelectorAll('button.tab')];
function indicator(){const active=tabs.querySelector('.active-item');for(const [prop,value] of Object.entries({width:active.offsetWidth,left:active.offsetLeft,height:active.offsetHeight,top:active.offsetTop}))tabs.style.setProperty(`--active-tab-${prop}`,`${value}px`);}
function selectFaq(index){for(const [i,group]of groups.entries()){group.hidden=i!==index;faqButtons[i].classList.toggle('tab--active',i===index);faqButtons[i].parentElement.classList.toggle('active-item',i===index);faqButtons[i].setAttribute('aria-pressed',String(i===index));}indicator();}
for(const [index,button]of faqButtons.entries()){button.setAttribute('aria-controls',groups[index].id);button.addEventListener('click',()=>selectFaq(index));}
new ResizeObserver(indicator).observe(tabs);selectFaq(location.hash==='#monetization'?1:0);

const tools=document.querySelector('.tools');let drag;
tools.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={id:event.pointerId,x:event.clientX,scroll:tools.scrollLeft};tools.setPointerCapture(event.pointerId);});
tools.addEventListener('pointermove',event=>{if(drag?.id!==event.pointerId)return;tools.scrollLeft=drag.scroll-(event.clientX-drag.x);tools.classList.toggle('tools_dragging',Math.abs(event.clientX-drag.x)>5);});
function release(event){if(drag?.id!==event.pointerId)return;drag=undefined;tools.classList.remove('tools_dragging');if(tools.hasPointerCapture(event.pointerId))tools.releasePointerCapture(event.pointerId);}
tools.addEventListener('pointerup',release);tools.addEventListener('pointercancel',release);tools.addEventListener('lostpointercapture',release);
tools.addEventListener('scroll',()=>{const maximum=tools.scrollWidth-tools.clientWidth;const index=maximum>0?Math.min(2,Math.floor(tools.scrollLeft/maximum*3)):0;for(const [i,dot]of document.querySelectorAll('.pagination__dot').entries())dot.classList.toggle('pagination__dot_active',i===index);},{passive:true});

const videos=[...guideHost.querySelectorAll('video')];const visible=new Set();
function playback(){for(const video of videos){if(!document.hidden&&!reduced.matches&&!video.closest('[hidden]')&&visible.has(video))video.play().catch(()=>{});else video.pause();}}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}playback();});
for(const video of videos){video.muted=true;observer.observe(video);}
document.addEventListener('visibilitychange',playback);reduced.addEventListener('change',()=>{guideAnimation?.cancel();playback();});
for(const link of document.querySelectorAll('a[href^="https://"]')){link.target='_blank';link.rel='noopener noreferrer';}
