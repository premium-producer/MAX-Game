// Local version of the original menu, sizing, scroll reveal and gradient reactions.
const header=document.querySelector('.header');
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.header__nav');
const headerContainer=document.querySelector('.header__container');
const overlay=document.querySelector('.overlay-button');
let scrollPosition=0;
function setMenu(open){
 if(open===header.classList.contains('header--open'))return;
 if(open)scrollPosition=scrollY;
 document.body.classList.toggle('menu-open',open);
 document.body.style.top=open?`-${scrollPosition}px`:'';
 header.classList.toggle('header--open',open);
 nav.classList.toggle('header__nav--open',open);
 headerContainer.classList.toggle('header__container--toggled-menu',open);
 toggle.classList.toggle('menu-toggle--active',open);
 toggle.setAttribute('aria-expanded',String(open));
 toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
 overlay.setAttribute('aria-hidden',String(!open));
 overlay.tabIndex=open?0:-1;
 if(!open)window.scrollTo({top:scrollPosition,behavior:'instant'});
}
overlay.tabIndex=-1;
toggle.addEventListener('click',()=>setMenu(!header.classList.contains('header--open')));
overlay.addEventListener('click',()=>setMenu(false));
nav.addEventListener('click',event=>{if(event.target.closest('.nav__link--mobile'))setMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.classList.contains('header--open')){setMenu(false);toggle.focus();}});
matchMedia('(min-width:1160px)').addEventListener('change',event=>{if(event.matches)setMenu(false);});

const containers=[...document.querySelectorAll('[data-container]')];
const sizes=new ResizeObserver(entries=>{for(const {target} of entries)target.style.setProperty('--container-width',`${target.offsetWidth}px`);});
for(const container of containers){container.style.setProperty('--container-width',`${container.offsetWidth}px`);sizes.observe(container);}
for(const year of document.querySelectorAll('[data-year]'))year.textContent=new Date().getFullYear();
const platform=/iPhone|iPad|iPod/i.test(navigator.userAgent)?'ios':/Android/i.test(navigator.userAgent)?'android':'desktop';
for(const item of document.querySelectorAll('.'+platform))item.style.display='flex';
function viewport(){document.documentElement.style.setProperty('--hero-container-height',`${(window.visualViewport?.height||innerHeight)-84-105}px`);}
viewport();window.visualViewport?.addEventListener('resize',viewport);

const businessSection=document.querySelector('.section--business-messenger');
const businessButtons=businessSection.querySelector('.section__buttons');
const narrow=matchMedia('(max-width:743px)');
let buttonsObserver;
function fixedButtons(){
 buttonsObserver?.disconnect();businessButtons.classList.remove('section__buttons--fixed');
 if(narrow.matches){buttonsObserver=new IntersectionObserver(entries=>{
  businessButtons.classList.toggle('section__buttons--fixed',!entries[0].isIntersecting);
 });buttonsObserver.observe(businessSection);}
}
fixedButtons();narrow.addEventListener('change',fixedButtons);

const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const parallax=[...document.querySelectorAll('[data-animation-parallax]')];
const uprising=new Set(document.querySelectorAll('[data-animation-uprise]'));
const reveal=new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){entry.target.style.opacity='1';entry.target.style.transform='translateY(0)';reveal.unobserve(entry.target);uprising.delete(entry.target);}
},{threshold:.08});
if(!reduced.matches)for(const el of uprising){el.style.opacity='0';el.style.transform='translateY(20px)';reveal.observe(el);}
let frame=0;
function update(){
 frame=0;if(reduced.matches||document.hidden)return;
 for(const element of parallax){
  const rect=element.getBoundingClientRect();
  if(rect.top<innerHeight&&rect.bottom>0){
   const progress=Math.min(Math.max((innerHeight-rect.top)/(innerHeight+rect.bottom),0),1);
   element.style.transform=`translateY(${Number(element.dataset.animationParallaxSpeed||40)*(1-progress)-40}px)`;
  }
 }
}
function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(update);}
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',()=>{viewport();schedule();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
reduced.addEventListener('change',()=>{
 if(reduced.matches){reveal.disconnect();for(const el of uprising){el.style.opacity='1';el.style.transform='none';}uprising.clear();for(const el of parallax)el.style.transform='none';}
 schedule();
});
schedule();
for(const text of document.querySelectorAll('[data-animation-gradient]')){
 text.addEventListener('pointermove',event=>{
  if(reduced.matches||event.pointerType==='touch')return;
  const rect=text.getBoundingClientRect();
  text.style.setProperty('--gradient-point',String(Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width))));
 });
}
for(const link of document.querySelectorAll('a[href^="https://"]')){link.target='_blank';link.rel='noopener noreferrer';}
