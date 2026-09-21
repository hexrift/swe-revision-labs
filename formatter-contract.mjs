import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { LESSONS } from './curriculum.js';
import { formatJavaScript } from './lesson-utils.js';

const samples=LESSONS.flatMap(lesson=>[
  [`${lesson.id}:code`,lesson.code],
  [`${lesson.id}:compare.bad`,lesson.compare.bad],
  [`${lesson.id}:compare.good`,lesson.compare.good],
  ...(lesson.debug?[[`${lesson.id}:debug.fix`,lesson.debug.fix]]:[])
]);
function syntaxChecks(source){
  return [source,`({${source}})`,`function __check(){${source}}`,`function* __check(){${source}}`,`async function __check(){${source}}`,`(${source})`];
}
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
function parses(source){
  if(/\b(?:import|export)\b/.test(source)){
    const names=[...source.matchAll(/\bexport\s*\{([^}]+)\}/g)].flatMap(match=>match[1].split(',')).map(name=>name.trim().split(/\s+as\s+/)[0]).filter(name=>/^[A-Za-z_$][\w$]*$/.test(name));
    const prefix=names.length?`const ${names.map(name=>`${name}=undefined`).join(',')};\n`:'';
    const check=spawnSync(process.execPath,['--input-type=module','--check'],{input:prefix+source,encoding:'utf8'});
    if(check.status===0)return true;
  }
  for(const candidate of syntaxChecks(source)){
    try{new vm.Script(candidate);return true}catch{}
    try{new Function(candidate);return true}catch{}
    try{new AsyncFunction(candidate);return true}catch{}
  }
  return false;
}
for(const [kind,source] of samples){
  const formatted=formatJavaScript(source);
  assert.equal(formatJavaScript(formatted),formatted,`${kind} formatter output must be idempotent`);
  assert.equal(parses(formatted),parses(source),`${kind} formatting must preserve parseability`);
}
assert.equal(formatJavaScript("const matches=str.replace( /a{2}/g , '');"),"const matches=str.replace( /a{2}/g , '');",'regex literals after whitespace must remain intact');
console.log(`Formatter contracts passed: ${samples.length} samples.`);
