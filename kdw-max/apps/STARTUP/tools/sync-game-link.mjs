import fs from 'node:fs';
const here=new URL('./',import.meta.url);
for(const app of ['stela','max-game'])for(const name of ['game-link.cjs','game-link-network.cjs','stand-settings.cjs'])fs.copyFileSync(new URL(name,here),new URL(`../../${app}/launcher/${name}`,here));
console.log('Shared game link copied to both portable launchers.');
