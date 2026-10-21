// One content boundary for all business-owned labels and imagery. Historical
// receipt IDs stay distinct; hotel/theater are never renamed into new sectors.
export const BUSINESS_PROFILES=Object.freeze({
 cafe:{id:'cafe',name:'Кофейня',symbol:'☕',handle:'coffee_shop',description:'Свежий кофе, любимые десерты и уютные встречи. Поможем выбрать напиток и оформить заказ.',order:'кофейных зёрен',logo:'assets/kdw-native/business-ui/cafe.webp',accent:'#875c39'},
 sports:{id:'sports',name:'Спортивный магазин',symbol:'⚽',handle:'sport_shop',description:'Одежда, обувь и инвентарь для тренировок. Поможем подобрать экипировку и оформить заказ.',order:'спортивных товаров',accent:'#217ebc'},
 flowers:{id:'flowers',name:'Цветочный магазин',symbol:'✿',handle:'flower_shop',description:'Букеты и цветы для особенных моментов. Поможем выбрать композицию и оформить доставку.',order:'букета',accent:'#b55988'},
 hotel:{id:'hotel',name:'Отель',symbol:'▤',handle:'hotel',description:'Комфортные номера и забота о гостях. Поможем с бронированием и ответим на вопросы.',order:'заказа',accent:'#587f9c'},
 theater:{id:'theater',name:'Театр',symbol:'🎭',handle:'theatre',description:'Спектакли и встречи со сценой. Поможем выбрать представление и забронировать билеты.',order:'билетов',accent:'#8d579e'},
});
export const CURRENT_BUSINESSES=Object.freeze(['cafe','sports','flowers']);
export const BUSINESS_PHONE='+7 912 000-00-00';
export function businessProfile(value){const id=typeof value==='string'?value:value?.progress?.business?.answers?.businessType;return BUSINESS_PROFILES[id]??BUSINESS_PROFILES.cafe;}
