const fs=require('fs'),crypto=require('crypto'),path=require('path');
const input=process.argv[2],s=fs.readFileSync(input,'utf8'),words={};
for(const language of ['russian','english']){
 const expr=s.match(new RegExp('var '+language+'_default = (\\{[\\s\\S]*?\\n\\});'))[1].replace(/^\{\s*words:/,'{"words":').replace(/\\x([0-9a-f]{2})/gi,'\\u00$1').replace(/\\u\{([0-9a-f]+)\}/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
 words[language]=JSON.parse(expr).words;
}
fs.writeFileSync(path.join(__dirname,'words.mjs'),'// Dictionaries extracted unchanged from glin-profanity@3.3.0; see LICENSE and provenance.json.\nexport const PROFANITY_DICTIONARIES='+JSON.stringify(words,null,2)+';\n');
fs.writeFileSync(path.join(__dirname,'provenance.json'),JSON.stringify({package:'glin-profanity',version:'3.3.0',repository:'https://github.com/glincker/glin-profanity/tree/v3.3.0',tarball:'https://registry.npmjs.org/glin-profanity/-/glin-profanity-3.3.0.tgz',integrity:'sha512-YhLhVjWaVjlWClm1DIJJdW1eGp8z6i65WscLV9fbrNpt9H1usoQwDtwmqVjGVtZvr3XP1yl7vQlIU7UfQW27HA==',distIndexSha256:crypto.createHash('sha256').update(s).digest('hex'),packageLicenseField:'ISC',licenseFile:'Upstream v3.3.0 LICENSE (MIT), retained verbatim; package metadata differs.',scope:'Unchanged Russian and English dictionary data only. Library engine, ML and integrations are not imported.'},null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(words).map(([k,v])=>[k,v.length]))));
