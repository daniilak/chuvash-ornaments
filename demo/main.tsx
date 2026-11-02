import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{MOTIFS,ELITE_STUDIES,BOOK_STUDIES,COMPOSITIONS,BACKGROUNDS,generateBackground,generateMotif,generateOrnament,generateTile,fitFrame,generateComposition,getMotif}from'@daniilak/chuvash-ornaments';
import{Framed}from'@daniilak/chuvash-ornaments/react';
import type{ParamsInput,Preset,Sequence,MotifId,FrameResult,CompositionKind}from'@daniilak/chuvash-ornaments';
import{text,englishMotifs,chuvashMotifs,chuvashBackgrounds,resolveLanguage,type Preference}from'./i18n';
import{designInfo,backgroundInfo,designCopy,sizeLimit,fitUiParams}from'./designs';
import{ContextPreview,contextKind}from'./context-preview';
import{svgUrl}from'./svg-url';
import'./vendor/hemingway/style.css';
import'./style.css';
const choices:readonly {id:string;kind?:CompositionKind|'background'}[]=[...COMPOSITIONS.slice(40),...COMPOSITIONS.slice(24,40),...COMPOSITIONS.slice(18,24),...COMPOSITIONS.slice(12,18),...COMPOSITIONS.slice(6,12),...COMPOSITIONS.slice(0,6),...BACKGROUNDS.map(b=>({id:b.id,kind:'background' as const})),...['border','corners','band','divider','motif','tile'].map(id=>({id}))];
const categories=['frame','band','headpiece','tailpiece','divider','background'] as const;
function thumbnail(id:string,seed:number,color:string){
 const c=COMPOSITIONS.find(c=>c.id===id),background=BACKGROUNDS.find(b=>b.id===id);
 const book=BOOK_STUDIES.find(b=>b.id===id);
 const style={seed,color:book?.twoTone?'#292824':color,strokeWidth:.36,fillOpacity:1};
 if(background)return generateBackground({...style,strokeWidth:.6,background:background.id}).svg;
 if(c)return generateComposition({...style,strokeWidth:c.kind==='rosette'?.36:['keske-lace','tree-procession','stitch-ribbon','hatched-diamonds','comb-band','ceremonial-tree'].includes(c.id)?.6:.42,composition:c.id,width:c.kind==='rosette'?240:c.kind==='frame'?400:c.id==='stitch-ribbon'?300:c.kind==='band'?400:640,height:c.kind==='rosette'?240:c.kind==='frame'?250:c.kind==='divider'?180:150,size:c.kind==='rosette'?210:c.kind==='frame'?36:c.kind==='divider'?200:76}).svg;
 style.strokeWidth=.8;
 const motif='serdtse';
 if(id==='motif')return generateMotif({...style,motif,width:160,height:160}).svg;
 if(id==='tile')return generateTile({...style,motif,width:160,height:160,size:52,gap:12,layout:'checkerboard'}).svg;
 if(id==='border'||id==='corners')return fitFrame({...style,motif,preset:id,size:58,gap:12},400,250).svg;
 return generateOrnament({...style,motif,preset:id as Preset,width:640,height:150,size:76,gap:12,count:7,sequence:'mirror'}).svg;
}
const storageKey='chuvash-ornaments.language';
function preference():Preference{try{const p=localStorage.getItem(storageKey);if(p==='ru'||p==='en'||p==='cv')return p;}catch{}return'system';}
function SVG({svg,...props}:{svg:string}&React.HTMLAttributes<HTMLDivElement>){return<div {...props} dangerouslySetInnerHTML={{__html:svg}}/>;}
function NumberField({label,value,min,max,onChange}:{label:string;value:number;min:number;max:number;onChange:(value:number)=>void}){
 const[draft,setDraft]=useState(String(value));
 useEffect(()=>setDraft(String(value)),[value]);
 const commit=()=>{const parsed=draft.trim()?Number(draft):value;const next=Number.isFinite(parsed)?Math.round(Math.max(min,Math.min(max,parsed))):value;setDraft(String(next));onChange(next);};
 return<label className="number-field"><span>{label}</span><input aria-label={label} type="number" min={min} max={max} step="1" value={draft} onChange={e=>{setDraft(e.target.value);const n=Number(e.target.value);if(e.target.value&&Number.isFinite(n)&&n>=min&&n<=max)onChange(Math.floor(n));}} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;
}
function App(){
 const[pref,setPref]=useState<Preference>(preference),[languages,setLanguages]=useState<readonly string[]>(()=>navigator.languages?.length?navigator.languages:[navigator.language]);
 const lang=resolveLanguage(pref,languages),t=text[lang];
 useEffect(()=>{document.documentElement.lang=lang;document.title=t.title;document.querySelector('meta[name="description"]')?.setAttribute('content',t.description);},[lang,t]);
 useEffect(()=>{const update=()=>setLanguages(navigator.languages?.length?navigator.languages:[navigator.language]);window.addEventListener('languagechange',update);return()=>window.removeEventListener('languagechange',update);},[]);
 const language=(v:Preference)=>{setPref(v);try{v==='system'?localStorage.removeItem(storageKey):localStorage.setItem(storageKey,v);}catch{}};
 const[design,setDesign]=useState('keske-treasure-frame');
 const[view,setView]=useState<'context'|'specimen'>('specimen');
 const[backgroundScale,setBackgroundScale]=useState(75);
 const[params,setParams]=useState<ParamsInput & {accentColor?:string}>({motif:'serdtse',seed:42,width:720,height:400,size:76,gap:12,count:128,strokeWidth:.36,color:'#762b32',accentColor:'#aa8247',fillOpacity:1,sequence:'seeded'});
 const[notice,setNotice]=useState<'copied'|'copyFail'|'downloaded'|''>('');
 const recipe=COMPOSITIONS.find(c=>c.id===design),backgroundRecipe=BACKGROUNDS.find(b=>b.id===design);
 const book=BOOK_STUDIES.find(b=>b.id===design);
 const elite=ELITE_STUDIES.find(b=>b.id===design),twoTone=!!elite||!!book?.twoTone;
 const info=recipe?designInfo[recipe.id]:backgroundRecipe?backgroundInfo[backgroundRecipe.id]:undefined;
 const baseFrame=design==='border'||design==='corners',frame=baseFrame||recipe?.kind==='frame',rosette=recipe?.kind==='rosette',tile=design==='tile'||!!backgroundRecipe,motif=design==='motif';
 const result=backgroundRecipe?generateBackground({...params,background:backgroundRecipe.id}):recipe?generateComposition({...params,composition:recipe.id}):motif?generateMotif(params):tile?generateTile(params):baseFrame?fitFrame({...params,preset:design as Preset},params.width!,params.height!):generateOrnament({...params,preset:design as Preset});
 const q=result.params;
 const secondInk='accentColor' in q?String(q.accentColor):'#a64c38';
 const category=contextKind(design,backgroundRecipe?'background':recipe?.kind);
 const visibleChoices=choices.filter(c=>contextKind(c.id,c.kind)===category);
 const choiceName=(id:string)=>{const c=COMPOSITIONS.find(c=>c.id===id);const b=BACKGROUNDS.find(b=>b.id===id);return c?designCopy(c.id,lang).name:b?(lang==='cv'?chuvashBackgrounds[b.id]:b.name[lang]):t[id as 'motif'];};
 const showVariation=!motif&&!rosette&&(!elite||elite.id==='heirloom-chain')&&(!!recipe||!!backgroundRecipe||q.sequence==='seeded');
 const update=(patch:ParamsInput & {accentColor?:string})=>{setParams(old=>fitUiParams(design,old,patch));setNotice('');};
 function selectDesign(id:string){
  const book=BOOK_STUDIES.find(b=>b.id===id),elite=ELITE_STUDIES.find(b=>b.id===id);
  const kind=COMPOSITIONS.find(c=>c.id===id)?.kind,bg=BACKGROUNDS.find(b=>b.id===id);
  if(bg||id==='tile')setBackgroundScale(75);
  const defaults={...(book&&['nested-chevrons','forked-frieze'].includes(id)?{gap:0}:{gap:12}),width:bg?160:kind==='rosette'?400:id==='tile'?160:720,height:bg?160:kind==='rosette'?400:kind==='frame'?400:kind==='divider'?220:kind==='separator'?120:id==='tile'?160:id==='motif'?300:id==='border'||id==='corners'?400:160,size:elite?elite.size:book?book.size:bg?bg.size:kind==='rosette'?320:kind==='frame'?72:kind==='divider'?200:id==='tile'?52:id==='border'||id==='corners'?36:80};
  setDesign(id);setParams(old=>fitUiParams(id,old,{...defaults,...(elite?{color:'#762b32',accentColor:'#aa8247'}:{}),...(book?{color:book.twoTone?'#292824':'#a64c38',accentColor:book.id==='nested-chevrons'?'#c4a56d':'#a64c38'}:{}),...(id==='tile'?{layout:'checkerboard' as const,sequence:'mirror' as const}:{}),count:128,fill:true,fillOpacity:1}));setNotice('');
 }
 const sizeName=design==='corners'?t.cornerSize:frame?t.frameSize:rosette?t.figureSize:design==='ceremonial-tree'?t.treeSize:t.size;
 const sourceHasFill=!!getMotif(q.motif).fills?.length;
 const fillMode=info?.fill??(sourceHasFill?'outline':'none');
 const opacity=(info?.opacity??sourceHasFill)&&(q.fill||fillMode==='fixed');
 const settings:Record<string,unknown>={};
 if(backgroundRecipe){settings.background=backgroundRecipe.id;settings.backgroundVersion=1;}else if(recipe){settings.composition=recipe.id;settings.compositionVersion=recipe.version;if(twoTone)settings.accentColor=secondInk;}else if(!motif&&!tile)settings.preset=design;
 if(!recipe&&!backgroundRecipe)settings.motif=q.motif;
 if(!recipe&&!backgroundRecipe&&!motif){settings.motifs=q.motifs;settings.sequence=q.sequence;}
 if(!motif)settings.seed=q.seed;
 Object.assign(settings,{width:q.width,height:q.height});
 if(!motif)settings.size=q.size;
 if(!motif&&!rosette&&!backgroundRecipe)settings.gap=q.gap;
 if((recipe&&!rosette&&!frame)||design==='band'||design==='divider')settings.count=q.count;
 Object.assign(settings,{strokeWidth:q.strokeWidth,color:q.color});
 if(!recipe&&!backgroundRecipe)Object.assign(settings,{rotation:q.rotation,reflect:q.reflect});
 Object.assign(settings,{fill:q.fill,fillOpacity:q.fillOpacity});if(tile&&!backgroundRecipe)settings.layout=q.layout;
 const repeatSize=`${q.width*backgroundScale/100}px ${q.height*backgroundScale/100}px`;
 const fn=backgroundRecipe?'generateBackground':recipe?'generateComposition':motif?'generateMotif':tile?'generateTile':baseFrame?'fitFrame':'generateOrnament';
 const usage=tile?['container.style.backgroundImage =', '  `url("data:image/svg+xml,${encodeURIComponent(art.svg)}")`;', "container.style.backgroundRepeat = 'repeat';", "container.style.backgroundPosition = 'center';", `container.style.backgroundSize = '${repeatSize}';`].join('\n'):'container.innerHTML = art.svg;';
 const code=`import { ${fn} }\n  from '@daniilak/chuvash-ornaments';\n\nconst art = ${fn}(${JSON.stringify(settings,null,2)}${baseFrame?', '+q.width+', '+q.height:''});\n\n${usage}`;
 async function copyCode(){try{await navigator.clipboard.writeText(code);setNotice('copied');}catch{setNotice('copyFail');}}
 function download(){const url=URL.createObjectURL(new Blob([result.svg],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`chuvash-${design}-${q.seed}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('downloaded');}
 function slider(label:string,key:'strokeWidth'|'size'|'gap'|'fillOpacity',min:number,max:number,step:number,unit=''){
  const value=Number(q[key]),formatted=key==='fillOpacity'?Math.round(value*100):value;
  return<label className="field"><span>{label}<output>{formatted.toLocaleString(lang,{maximumFractionDigits:2})}{unit&&<small> {unit}</small>}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>update({[key]:Number(e.target.value)})}/></label>;
 }
 const inset='inset'in result?result.inset as FrameResult['inset']|undefined:undefined;
 return<main className="page section-inner">
  <header className="page-header"><h1>{t.title}</h1><label className="language"><span>{t.language}</span><select aria-label={t.language} value={pref} onChange={e=>language(e.target.value as Preference)}><option value="system">{t.system}</option><option value="ru">Русский</option><option value="en">English</option><option value="cv">Чӑвашла</option></select></label></header>
  <section className="playground" id="playground">
   <aside className="controls-column">
    <section className="pattern-picker" aria-label={t.choose}>
     <div className="category-picker" role="group" aria-label={t.category}>{categories.map(kind=><button type="button" key={kind} data-category={kind} aria-pressed={category===kind} onClick={()=>{if(category!==kind)selectDesign(choices.find(c=>contextKind(c.id,c.kind)===kind)!.id);}}>{t.categories[kind]}</button>)}</div>
     <div className="composition-grid" role="group" aria-label={t.categories[category]}>{visibleChoices.map(c=><button key={c.id} data-design={c.id} aria-label={choiceName(c.id)} aria-pressed={design===c.id} onClick={()=>selectDesign(c.id)}><SVG svg={thumbnail(c.id,q.seed,q.color)}/></button>)}</div>
    </section>
    {showVariation&&<div className="variation"><NumberField label={t.seed} min={0} max={4294967295} value={q.seed} onChange={seed=>update({seed})}/><button title={t.newVariant} aria-label={t.newVariant} onClick={()=>update({seed:(q.seed+1)>>>0})}>↻ {t.another}</button></div>}
    <section className="settings-section"><h2>{tile?t.tileSize:t.format}</h2><div className="dimensions"><NumberField label={t.width} value={q.width} min={48} max={2400} onChange={width=>update({width})}/><NumberField label={t.height} value={q.height} min={48} max={1600} onChange={height=>update({height})}/></div></section>
    <section className="settings-section"><h2>{t.appearance}</h2>
     {!recipe&&!backgroundRecipe&&<label className="field motif-select"><span>{t.sourceMotif}</span><select aria-label={t.sourceMotif} value={q.motif} onChange={e=>update({motif:e.target.value as MotifId,motifs:undefined})}>{MOTIFS.map(m=><option key={m.id} value={m.id}>{lang==='ru'?m.name:lang==='cv'?chuvashMotifs[m.id]:englishMotifs[m.id]}</option>)}</select></label>}
     <label className="color-field"><span>{t.color}</span><div><input aria-label={t.color} type="color" value={q.color} onChange={e=>update({color:e.target.value})}/><code>{q.color}</code></div></label>
     {twoTone&&<label className="color-field"><span>{t.accentColor}</span><div><input aria-label={t.accentColor} type="color" value={secondInk} onChange={e=>update({accentColor:e.target.value})}/><code>{secondInk}</code></div></label>}
     {tile&&<label className="field"><span>{t.backgroundScale}<output>{backgroundScale}<small> %</small></output></span><input aria-label={t.backgroundScale} type="range" min="40" max="160" step="5" value={backgroundScale} onChange={e=>setBackgroundScale(Number(e.target.value))}/></label>}
     {!motif&&slider(sizeName,'size',8,sizeLimit(design,q),1,'px')}
     {!motif&&!rosette&&!backgroundRecipe&&book?.id!=='panel-headpiece'&&!elite?.id.includes('headpiece')&&recipe?.kind!=='separator'&&slider(t.gap,'gap',0,tile?Math.min(48,Math.max(0,Math.min(q.width,q.height)/(q.layout==='checkerboard'?2:1)-8)):48,1,'px')}
     {(!rosette||!q.fill||!!elite)&&!(book?.id==='stitch-ribbon'&&q.fill)&&!(backgroundRecipe?.id==='stepped-carpet'&&q.fill)&&slider(t.stroke,'strokeWidth',.04,.8,.02)}
     {(fillMode==='outline'||fillMode==='hatch')&&<label className="checkbox"><input aria-label={fillMode==='hatch'?t.hatch:t.outline} type="checkbox" checked={fillMode==='hatch'?q.fill:!q.fill} onChange={e=>update({fill:fillMode==='hatch'?e.target.checked:!e.target.checked})}/><span>{fillMode==='hatch'?t.hatch:t.outline}</span></label>}
     {opacity&&slider(t.opacity,'fillOpacity',0,1,.01,'%')}
    </section>
    {!recipe&&!backgroundRecipe&&<section className="settings-section"><h2>{t.placement}</h2><div className="arrangement">
     {!motif&&<label className="field"><span>{t.sequence}</span><select aria-label={t.sequence} value={q.sequence} onChange={e=>update({sequence:e.target.value as Sequence})}>{(['repeat','alternate','mirror','seeded']as const).map(k=><option key={k} value={k}>{t[k]}</option>)}</select></label>}
     {tile&&<label className="field"><span>{t.layout}</span><select aria-label={t.layout} value={q.layout} onChange={e=>update({layout:e.target.value as 'grid'|'checkerboard'})}><option value="grid">{t.grid}</option><option value="checkerboard">{t.checkerboard}</option></select></label>}
     <label className="field"><span>{t.rotation}</span><select aria-label={t.rotation} value={q.rotation} onChange={e=>update({rotation:Number(e.target.value)as 0|90|180|270})}>{[0,90,180,270].map(n=><option key={n} value={n}>{n}°</option>)}</select></label>
     <label className="field"><span>{t.reflect}</span><select aria-label={t.reflect} value={q.reflect} onChange={e=>update({reflect:e.target.value as 'none'|'x'|'y'|'both'})}><option value="none">{t.none}</option><option value="x">{t.horizontal}</option><option value="y">{t.vertical}</option><option value="both">{t.both}</option></select></label>
    </div></section>}
   </aside>
   <div className="result-column">
    <div className="preview-toolbar"><div className="preview-mode" role="group" aria-label={t.previewMode}><button type="button" aria-pressed={view==='context'} onClick={()=>setView('context')}>{t.inContext}</button><button type="button" aria-pressed={view==='specimen'} onClick={()=>setView('specimen')}>{t.specimen}</button></div><span className="preview-dimensions">{q.width} × {q.height} px</span></div>
    <div className={`preview ${view==='context'?'in-context':''}`} data-testid="preview">
     {view==='context'?<ContextPreview kind={contextKind(design,backgroundRecipe?'background':recipe?.kind)} result={result} inset={inset} lang={lang} repeatScale={backgroundScale/100}/>:tile?<div className="background-specimen" data-testid="tile-grid" style={{backgroundImage:`url("${svgUrl(result.svg)}")`,backgroundSize:repeatSize,backgroundPosition:'center'}}/>:<div className="art-stage" data-testid="art-stage" style={{aspectRatio:`${q.width}/${q.height}`,maxWidth:`${460*q.width/q.height}px`}}><SVG className="art-svg" svg={result.svg}/></div>}
    </div>
    <div className="actions"><button onClick={download}>{t.download}</button><a data-testid="layouts-download" href={`${import.meta.env.BASE_URL}collection-layouts.png`} download="chuvash-frames-dividers-headpieces.png">{t.layoutCollection}</a><a data-testid="collection-download" href={`${import.meta.env.BASE_URL}collection-16.png`} download="chuvash-16-patterns.png">{t.collection}</a><span role="status">{notice?t[notice]:''}</span></div>
    <section className="code-panel" aria-label={t.code}><div className="code-heading"><h2>{t.code}</h2><button onClick={copyCode}>{t.copy}</button></div><pre data-testid="example-code"><code>{code}</code></pre></section>
    {baseFrame&&<section className="live-frame"><p>{t.resize}</p><Framed preset={design as'border'|'corners'} motif={q.motif} seed={q.seed} motifs={q.motifs} sequence={q.sequence} size={q.size} gap={q.gap} strokeWidth={q.strokeWidth} fill={q.fill} fillOpacity={q.fillOpacity} rotation={q.rotation} reflect={q.reflect} color={q.color} style={{resize:'both',overflow:'auto',width:'100%',maxWidth:'100%',minWidth:160,minHeight:180,height:240,background:'#fff'}}><h2>{t.cardTitle}</h2><p>{t.cardText}</p></Framed></section>}
   </div>
  </section>

 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
