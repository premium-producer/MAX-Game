import channelMenu from './kdw-business-screen-assets.json' with {type:'json'};
import channelPhone from './kdw-business-phone-asset.json' with {type:'json'};

export function applyBusinessScreens(catalog){
 const screen=catalog.tasks['business.channel'].screens['business.channel.continue'];
 catalog.assets[channelMenu.assetId]=channelMenu;
 screen.assetId=channelMenu.assetId;
 catalog.assets[channelPhone.assetId]=channelPhone;
 catalog.tasks['business.channel'].screens['business.channel.setup'].assetId=channelPhone.assetId;
 return catalog;
}
