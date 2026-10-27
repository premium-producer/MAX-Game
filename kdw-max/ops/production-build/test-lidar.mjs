import {build} from '../../apps/max-game/source/client/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const source=path.resolve('apps/max-game/source/stand-output'),out=path.resolve('.cache/stand-lidar-tests');fs.mkdirSync(out,{recursive:true});
const tests=['hokuyo-osc.test.mjs','calibration.test.mjs','lidar.test.mjs'];
for(const name of tests)await build({entryPoints:[path.join(source,name)],outfile:path.join(out,name.replace('.mjs','.cjs')),bundle:true,platform:'node',format:'cjs',nodePaths:[path.join(source,'vendor')],external:['serialport','bufferutil','utf-8-validate']});
const run=spawnSync(process.execPath,['--test',...tests.map(n=>path.join(out,n.replace('.mjs','.cjs')))],{stdio:'inherit'});process.exitCode=run.status??1;
