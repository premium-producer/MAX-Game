// Presentation strings only. Catalog IDs, annotations and asset pixels stay intact.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function v5Text(value){
 return String(value??'').replace(/Все возможности с Цифровым\s+ID/gu,'Все возможности: Цифровой ID')
  .replace(/(?:Цифров(?:ой|ого|ому|ым|ом)\s*)?(?<![A-Za-z0-9_])ID(?![A-Za-z0-9_])/gu,'Цифровой\u00a0ID');
}
export function v5CopyMarkup(value){
 return esc(v5Text(value)).replace(/Цифровой\u00a0ID|видео-сообщение/gu,term=>`<span class="v5-copy-nowrap">${term}</span>`);
}
export function syncV5InstructionVisibility(instruction,fresh){
 const changed=instruction.hidden!==fresh.hidden;instruction.hidden=fresh.hidden;
 return changed;
}
export const V5_COPY_STYLES=`
html[data-visual=webgl-bfm-v5] #circles .v5-copy-nowrap{display:inline-block;white-space:nowrap;word-break:normal;overflow-wrap:normal;hyphens:none}
html[data-visual=webgl-bfm-v5][data-reveal=true][data-service=false] #circles .task-dialog .instruction{width:min(760px,calc(100% - var(--instruction-left,20px) - 32px));max-width:none;min-width:0;box-sizing:border-box}
html[data-visual=webgl-bfm-v5] #circles .task-dialog .instruction[hidden]{display:none!important}
html[data-visual=webgl-bfm-v5] #circles .task-dialog .instruction-copy{width:100%;min-width:0;height:auto}
html[data-visual=webgl-bfm-v5] #circles .task-dialog .instruction h2{word-break:normal;overflow-wrap:normal;hyphens:none}
`;
export function installV5CopyStyles(document){
 if(document.getElementById('v5-copy-styles'))return;
 const style=document.createElement('style');style.id='v5-copy-styles';style.textContent=V5_COPY_STYLES;document.head.append(style);
}
