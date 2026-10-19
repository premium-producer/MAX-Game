export const V5_QR_HOLD_MS=15000;
export const V5_QR_SIZE=625/1.5;
export const V5_QR_CARD_WIDTH=640;
export const V5_QR_CARD_HEIGHT=V5_QR_SIZE+48*2+32+80;
export const V5_QR_CAPTION='Узнать больше о возможностях MAX';
export function v5QrAsset(catalog,qr){
 // Reviewed PNG has the embedded brand and has been independently decoded.
 return catalog.assets['official.max-qr-png']??qr?.asset;
}
export function v5QrFinaleEligible(snapshot,videoFinale=false){
 return !videoFinale&&['completed','incomplete','expired'].includes(snapshot?.state?.status)&&!!snapshot?.view?.qr;
}
export function installV5QrFinaleStyles(document){
 if(document.getElementById('v5-qr-finale-styles'))return;
 const style=document.createElement('style');style.id='v5-qr-finale-styles';style.textContent=`
 html[data-visual=webgl-bfm-v5] #circles .field-success.v5-mission-qr{position:absolute;left:calc(50% - ${V5_QR_CARD_WIDTH/2}px);top:calc(50% - ${V5_QR_CARD_HEIGHT/2}px);width:${V5_QR_CARD_WIDTH}px;height:${V5_QR_CARD_HEIGHT}px;max-width:none;box-sizing:border-box;padding:48px;gap:32px;border:0;border-radius:64px;box-shadow:none;background:none;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
 html[data-visual=webgl-bfm-v5] #circles .v5-mission-qr .presentation-qr{display:block;width:${V5_QR_SIZE}px;height:${V5_QR_SIZE}px;margin:0;max-width:none;flex-shrink:0}
 html[data-visual=webgl-bfm-v5] #circles .v5-mission-qr .v5-qr-caption{width:100%;max-width:544px;margin:0;font-size:32px;line-height:40px;font-weight:400;color:#fff;flex-shrink:0;overflow-wrap:normal;word-break:normal}
 `;document.head.append(style);
}
