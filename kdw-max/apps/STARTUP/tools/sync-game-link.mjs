import fs from 'node:fs';
const here=new URL('./',import.meta.url);
for(const app of ['stela','max-game']){
 for(const name of ['lan-screen.cjs','runtime-crashes.cjs','Control.ps1','Install-RuntimeWatchdog.ps1','runtime-main.cjs','runtime-worker-host.cjs','runtime-ipc.cjs','runtime-http.cjs','runtime-panel.html','runtime-policy.cjs','runtime-journal.cjs','runtime-performance.cjs','renderer-recovery.cjs','async-link.cjs','game-link.cjs','game-link-network.cjs','stand-settings.cjs','operator-http.cjs','sound-library.cjs','sound-events.cjs','Launch.ps1'])fs.copyFileSync(new URL(name,here),new URL(`../../${app}/launcher/${name}`,here));
 fs.cpSync(new URL('sound-panel',here),new URL(`../../${app}/launcher/sound-panel`,here),{recursive:true});
 fs.copyFileSync(new URL('lan-admin.cjs',here),new URL(`../../${app}/launcher/lan-admin.cjs`,here));
 fs.copyFileSync(new URL('lan-admin-panel.js',here),new URL(`../../${app}/launcher/lan-admin-panel.js`,here));
}
console.log('Shared game link copied to both portable launchers.');
fs.copyFileSync(new URL('layout-settings.cjs',here),new URL('../../max-game/launcher/layout-settings.cjs',here));

fs.copyFileSync(new URL('renderer-recovery.cjs',here),new URL('../../max-game/launcher/renderer-recovery.cjs',here));
