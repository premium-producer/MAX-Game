const header=document.querySelector('header');
const menuButton=header.querySelector('.menuButton');
const mobile=document.createElement('div');mobile.className='mobileMenu svelte-1elxaub';mobile.id='local-mobile-menu';mobile.hidden=true;
const nav=document.createElement('nav');nav.className='mobileNav svelte-1elxaub';
for(const link of header.querySelectorAll('.menuLink,.downloadLink')){const clone=link.cloneNode(true);clone.className='mobileLink svelte-1elxaub';nav.append(clone);}
mobile.append(nav);header.append(mobile);
menuButton.setAttribute('aria-controls',mobile.id);
function setMenu(open){header.classList.toggle('header--open',open);mobile.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');}
setMenu(false);menuButton.addEventListener('click',()=>setMenu(mobile.hidden));
mobile.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
matchMedia('(min-width:1195px)').addEventListener('change',event=>{if(event.matches)setMenu(false);});

const triggers=[...document.querySelectorAll('.accordion-trigger')];
// The archived FAQ strings are original markup from the public page bundle.
const faq=await fetch('./faq.json').then(response=>{if(!response.ok)throw Error('FAQ HTTP'+response.status);return response.json();});
if(faq.length!==triggers.length)throw Error('FAQ source mismatch');
for(const [index,trigger] of triggers.entries()){
 const panel=document.createElement('div');panel.className='local-faq-panel';panel.id=`local-faq-${index}`;panel.dataset.open='false';panel.inert=true;panel.setAttribute('aria-hidden','true');
 const inner=document.createElement('div');inner.className='local-faq-inner';
 const content=document.createElement('div');content.className='accordion-content svelte-1nl1uk4';content.innerHTML=faq[index];inner.append(content);panel.append(inner);trigger.closest('.accordion-item').append(panel);
 trigger.setAttribute('aria-controls',panel.id);
 trigger.addEventListener('click',()=>{const open=trigger.getAttribute('aria-expanded')!=='true';trigger.setAttribute('aria-expanded',String(open));panel.dataset.open=String(open);panel.inert=!open;panel.setAttribute('aria-hidden',String(!open));trigger.querySelector('.accordion-trigger-icon').classList.toggle('isOpen',open);});
}

const modal=document.querySelector('.digitalIdModal');
const overlay=modal.querySelector('.digitalIdModalOverlay');
const dialog=modal.querySelector('[role="dialog"]');dialog.tabIndex=-1;
let returnFocus;
function setModal(open,source){
 if(open===!modal.hidden)return;
 if(open){returnFocus=source;setMenu(false);}
 modal.hidden=!open;document.body.classList.toggle('local-modal-open',open);
 if(open)dialog.focus();else returnFocus?.focus();
}
for(const button of document.querySelectorAll('button.button'))button.addEventListener('click',()=>setModal(true,button));
overlay.addEventListener('click',()=>setModal(false));
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){if(!modal.hidden)setModal(false);else if(!mobile.hidden){setMenu(false);menuButton.focus();}}
 if(event.key==='Tab'&&!modal.hidden){event.preventDefault();dialog.focus();}
});

const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const videos=[...document.querySelectorAll('video[src]')];
const visible=new Set();
function playback(){for(const video of videos){if(!document.hidden&&!reduced.matches&&visible.has(video))video.play().catch(()=>{});else video.pause();}}
const videoObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}playback();});
for(const video of videos){video.muted=true;video.autoplay=false;video.preload='metadata';videoObserver.observe(video);}
document.addEventListener('visibilitychange',playback);reduced.addEventListener('change',playback);
const phone=document.querySelector('.phoneVideoWrapper');
let frame=0;
function parallax(){frame=0;phone.style.transform=reduced.matches?'none':`translateY(${Math.min(60,scrollY*.08)}px)`;}
window.addEventListener('scroll',()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(parallax);},{passive:true});
reduced.addEventListener('change',parallax);
for(const link of document.querySelectorAll('a[href^="https://"]')){link.target='_blank';link.rel='noopener noreferrer';}
