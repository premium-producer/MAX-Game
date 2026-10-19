// Service name is UI text; the original brand symbol remains unchanged.
export function serviceBrandMarkup(className='') {
 return `<span class="service-brand ${className}"><img draggable="false" src="./brand/assets/logos/max-symbol-white.svg" alt="" aria-hidden="true"><span class="service-name">MAX</span></span>`;
}
