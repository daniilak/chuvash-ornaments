import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run through npm run check:package');
const packCache = mkdtempSync(join(tmpdir(),'chuvash-pack-cache-'));
const call = (args, options={}) => execFileSync(process.execPath, [npm,...args], {encoding:'utf8', env:{...process.env,npm_config_cache:packCache}, ...options});
const dry=JSON.parse(call(['pack','--dry-run','--json','--ignore-scripts']))[0];
const files=dry.files.map(f=>f.path);
assert(files.every(f=>/^(dist\/|data\/|README\.md$|NOTICE\.md$|LICENSE$|package\.json$)/.test(f)),files.join('\n'));
assert(files.includes('data/LICENSE-PatternFills'));assert(files.includes('data/patterns.json'));assert(files.includes('data/LICENSE-CC0'));
assert(files.includes('dist/react.d.ts'));assert(files.includes('dist/index.d.ts'));
const pkg=JSON.parse(readFileSync('package.json','utf8'));
assert.match(pkg.name,/^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/);
assert(!pkg.dependencies);assert(pkg.peerDependenciesMeta.react.optional);
const archive=JSON.parse(call(['pack','--json','--ignore-scripts']))[0];
const consumer=mkdtempSync(join(tmpdir(),'chuvash-consumer-'));
writeFileSync(join(consumer,'package.json'),JSON.stringify({private:true,type:'module'}));
// Skip optional React completely, install only the generated tarball, with no registry access.
call(['install',resolve(archive.filename),'--offline','--ignore-scripts','--omit=peer','--no-audit','--no-fund','--cache',join(consumer,'.npm-cache')],{cwd:consumer});
const dir=join(consumer,'node_modules');
assert(!readdirSync(dir).includes('react'));
writeFileSync(join(consumer,'test.mjs'),`
import assert from 'node:assert/strict';
import {MOTIFS,generateMotif,generateOrnament,generateTile,fitFrame,generateComposition,generateBackground} from '${pkg.name}';
assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined');
assert.equal(MOTIFS.length,16);
for(const result of [generateMotif({motif:'tsvetok'}),generateOrnament(),generateTile(),fitFrame({},600,400),generateComposition({composition:'sun-weave'}),generateComposition({composition:'diagonal-scrolls',compositionVersion:4,accentColor:'#c48a52'}),generateBackground({background:'woven-lattice'})])assert(result.svg.startsWith('<svg'));
console.log('Tarball installed offline; core runs in Node without React or DOM.');
`);
process.stdout.write(execFileSync(process.execPath,['test.mjs'],{cwd:consumer,encoding:'utf8'}));
writeFileSync(join(consumer,'types.ts'),`
import {generateMotif,generateOrnament,fitFrame,generateComposition,generateBackground,type MotifId,type Params} from '${pkg.name}';
const id: MotifId = 'serdtse';
const params: Params = generateMotif({motif:id}).params;
generateOrnament(params);fitFrame({motif:id},600,400);generateComposition({composition:'diamond-ribbon'});generateComposition({composition:'nested-chevrons',compositionVersion:5,accentColor:'#c48a52'});generateBackground({background:'keske-field',backgroundVersion:1});
// @ts-expect-error Unsupported background identifiers must fail.
generateBackground({background:'invented'});
// @ts-expect-error Invalid motif IDs must fail at compile time.
generateMotif({motif:'invented'});
`);
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','--strict','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',join(consumer,'types.ts')],{stdio:'inherit'});
// Verify /react declarations for an opt-in React consumer as well.
symlinkSync(resolve('node_modules/react'),join(dir,'react'),'dir');
symlinkSync(resolve('node_modules/@types'),join(dir,'@types'),'dir');
writeFileSync(join(consumer,'react-types.tsx'),`
import {Motif,Ornament,Framed,PatternBackground,Composition} from '${pkg.name}/react';
const view = <Framed motif="tree" seed={7}><Motif motif="serdtse" title="Heart"/><Ornament/><PatternBackground background="woven-lattice"/><Composition composition="stepped-frieze"/><Composition composition="panel-headpiece" compositionVersion={5} accentColor="#c48a52"/></Framed>;
`);
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','--strict','--jsx','react-jsx','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',join(consumer,'react-types.tsx')],{stdio:'inherit'});
console.log(`${pkg.name}@${pkg.version}: ${files.length} files, ${archive.size} bytes packed, ${archive.unpackedSize} bytes unpacked.`);
console.log(`Tarball: ${resolve(archive.filename)}`);
rmSync(consumer,{recursive:true,force:true});
rmSync(packCache,{recursive:true,force:true});
