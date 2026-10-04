const header=document.querySelector('header');
const menuButton=header.querySelector('.menuButton');
const mobile=document.createElement('div');
mobile.className='mobileMenu svelte-1elxaub';
mobile.id='local-mobile-menu';
mobile.hidden=true;
const nav=document.createElement('nav');
nav.className='mobileNav svelte-1elxaub';
for(const link of header.querySelectorAll('.menuLink,.downloadLink')){
 const clone=link.cloneNode(true);clone.className='mobileLink svelte-1elxaub';nav.append(clone);
}
mobile.append(nav);header.append(mobile);
menuButton.setAttribute('aria-label','Открыть меню');
menuButton.setAttribute('aria-controls',mobile.id);
function toggleMenu(open){
 header.classList.toggle('header--open',open);mobile.hidden=!open;
 menuButton.setAttribute('aria-expanded',String(open));
 menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
}
toggleMenu(false);
menuButton.addEventListener('click',()=>toggleMenu(mobile.hidden));
mobile.addEventListener('click',event=>{if(event.target.closest('a'))toggleMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobile.hidden){toggleMenu(false);menuButton.focus();}});
matchMedia('(min-width:1195px)').addEventListener('change',event=>{if(event.matches)toggleMenu(false);});

for(const target of document.querySelectorAll('.logo-card__tap-target')){
 target.setAttribute('aria-expanded','false');
 target.addEventListener('click',()=>{
  const card=target.closest('.logo-card');
  const open=card.classList.toggle('logo-card--download-visible');
  target.setAttribute('aria-expanded',String(open));
  // The original full-card tap target otherwise covers its revealed download link.
  if(open)card.querySelector('.logo-card__download')?.focus();
 });
 target.closest('.logo-card').addEventListener('keydown',event=>{
  if(event.key==='Escape'){target.closest('.logo-card').classList.remove('logo-card--download-visible');target.setAttribute('aria-expanded','false');target.focus();}
 });
}

const copyRequests=new WeakMap();
for(const button of document.querySelectorAll('.swatch-card__copy')){
 button.addEventListener('click',async()=>{
  const version=(copyRequests.get(button)||0)+1;copyRequests.set(button,version);
  const value=button.closest('.swatch-card__meta-row').querySelector('p').textContent.trim();
  try{
   await navigator.clipboard.writeText(value);
   if(copyRequests.get(button)!==version)return;
   button.dataset.copied='true';button.title='Скопировано';
  }catch{button.title='Не удалось скопировать';}
 });
 const clear=()=>{delete button.dataset.copied;button.removeAttribute('title');};
 button.addEventListener('animationend',clear);button.addEventListener('blur',clear);
}

const reduced=matchMedia('(prefers-reduced-motion:reduce)');
for(const card of document.querySelectorAll('.hero-card--colors')){
 const gradient=card.querySelector('.hero-card__gradient-anim');
 card.addEventListener('pointermove',event=>{
  if(reduced.matches||event.pointerType==='touch')return;
  const r=card.getBoundingClientRect();
  gradient.style.setProperty('--glow-x',`${(event.clientX-r.left-r.width/2)*.12}px`);
  gradient.style.setProperty('--glow-y',`${(event.clientY-r.top-r.height/2)*.12}px`);
 });
 const reset=()=>{gradient.style.setProperty('--glow-x','0px');gradient.style.setProperty('--glow-y','0px');};
 card.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);
}
// Linked services and the Figma guides remain official external pages.
for(const link of document.querySelectorAll('a[href^="https://"]')){
 link.target='_blank';link.rel='noopener noreferrer';
}
