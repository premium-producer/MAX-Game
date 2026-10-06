// Presentation strings only. Catalog IDs, annotations and asset pixels stay intact.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function v5Text(value){
 return String(value??'').replace(/видео-сообщение/giu,term=>term[0]==='В'?'Видеосообщение':'видеосообщение').replace(/Все возможности с Цифровым\s+ID/gu,'Все возможности: Цифровой ID')
  .replace(/(?:(Цифров(?:ой|ого|ому|ым|ом))\s*)?(?<![A-Za-z0-9_])ID(?![A-Za-z0-9_])/gu,(_term,declension)=>`${declension??'Цифровой'}\u00a0ID`);
}
export function v5CopyMarkup(value){
 const text=v5Text(value);
 let markup=esc(text).replace(/Цифров(?:ой|ого|ому|ым|ом)\u00a0ID/gu,term=>`<span class="v5-copy-nowrap">${term}</span>`);
 if(text==='А теперь отправим сообщение! Выберем формат: голосовое сообщение или видеосообщение')markup=markup.replace('! Выберем','! <br>Выберем');
 if(text==='Вы познакомились с возможностями общения в MAX.')markup=markup.replace('общения в MAX.','<br><span class="v5-copy-nowrap">общения в MAX.</span>');
 return markup;
}
// The button has one flex item; its label uses ordinary inline text flow,
// preserving spaces around protected terms instead of splitting them into columns.
export function v5ButtonMarkup(value){
 return `<span class="v5-button-label">${v5CopyMarkup(value)}</span>`;
}
export function syncV5InstructionVisibility(instruction,fresh){
 const changed=instruction.hidden!==fresh.hidden;instruction.hidden=fresh.hidden;
 return changed;
}
export const V5_COPY_STYLES=`
html[data-visual=webgl-bfm-v5] #circles .v5-copy-nowrap{display:inline-block;white-space:nowrap;word-break:normal;overflow-wrap:normal;hyphens:none}
html[data-visual=webgl-bfm-v5] #circles .v5-button-label{display:block;width:100%;min-width:0;max-width:100%;text-align:inherit;white-space:normal}
html[data-visual=webgl-bfm-v5][data-reveal=true] #circles .task-dialog .instruction{width:min(760px,calc(100% - var(--instruction-left,20px) - 32px));max-width:none;min-width:0;box-sizing:border-box}
html[data-visual=webgl-bfm-v5] #circles .task-dialog .instruction[hidden]{display:none!important}
html[data-visual=webgl-bfm-v5] #circles .task-dialog .instruction-copy{width:100%;min-width:0;height:auto;flex-shrink:0}
html[data-visual=webgl-bfm-v5] #circles .task-dialog .instruction h2{max-width:100%;word-break:normal;overflow-wrap:anywhere;hyphens:none}
`;
export function installV5CopyStyles(document){
 if(document.getElementById('v5-copy-styles'))return;
 const style=document.createElement('style');style.id='v5-copy-styles';style.textContent=V5_COPY_STYLES;document.head.append(style);
}
