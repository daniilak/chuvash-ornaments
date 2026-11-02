import React from 'react';
import type { FrameResult, Generated } from '@daniilak/chuvash-ornaments';
import type { Language } from './i18n';
import { svgUrl } from './svg-url';

export type ContextKind='band'|'headpiece'|'tailpiece'|'divider'|'frame'|'background';
export function contextKind(design:string,kind?:'band'|'divider'|'separator'|'rosette'|'frame'|'tailpiece'|'background'):ContextKind{
 if(design==='tile'||kind==='background')return'background';
 if(design==='border'||design==='corners'||kind==='frame')return'frame';
 if(kind==='divider')return'headpiece';
 if(kind==='separator')return'divider';
 if(design==='divider')return'divider';
 if(design==='motif'||kind==='rosette'||kind==='tailpiece')return'tailpiece';
 return'band';
}
type Story={title:string;lead:string;body:string;chapter?:string};
const stories:Record<Language,Record<ContextKind,Story>>={
 cv:{
  "band": {
    "title": "Аякран килнӗ ҫыру",
    "lead": "Эпӗ чӳречене уҫрӑм. Урамра ҫумӑр ҫӑватчӗ. Сӗтел ҫинче ҫыру выртатчӗ.",
    "body": "Унта ҫул ҫинчен, ҫӗнӗ кил ҫинчен тата аякри туссем ҫинчен ҫырнӑччӗ."
  },
  "headpiece": {
    "chapter": "Пӗрремӗш сыпӑк",
    "title": "Юханшыв патне",
    "lead": "Эпир ирех тухрӑмӑр. Ҫул вӑрман урлӑ пыратчӗ. Йывӑҫсем хушшинче шыв курӑнатчӗ.",
    "body": "Хӗвел ҫӗкленетчӗ. Кайӑксем юрлатчӗҫ. Эпир шыв хӗрринче чарӑнтӑмӑр."
  },
  "tailpiece": {
    "title": "Ҫил лӑплансан",
    "lead": "Каҫхине ҫил лӑпланчӗ. Юханшыв леш енче вӑрман курӑнатчӗ. Шыв ҫинче хӗвел ҫути вылятчӗ.",
    "body": "Эпир шыв хӗрринче тӑтӑмӑр, унтан килелле утрӑмӑр. Чӳречесенче ҫутӑсем ҫунатчӗҫ."
  },
  "divider": {
    "title": "Ирхи шухӑшсем",
    "lead": "Хула вӑранатчӗ. Урамра ҫынсем курӑна пуҫларӗҫ. Ҫӑкӑр лавкки уҫӑлчӗ.",
    "body": "Кӑнтӑрла ҫумӑр ҫума пуҫларӗ. Эпир хӳтӗ вырӑна кӗтӗмӗр те ҫумӑр иртсе кайиччен кӗтрӗмӗр."
  },
  "frame": {
    "title": "Шыв хӗрринче",
    "lead": "Шыв хӗрринче йывӑҫсем ӳсеҫҫӗ.\nКаҫхи хӗвел ҫути шывра вылять.\nТӑван ҫӗршыв чӗрене савӑнтарать.",
    "body": ""
  },
  "background": {
    "title": "Ҫырмалли кӗнеке",
    "lead": "Ҫулсем, тӗлпулусем тата аса юлнӑ вырӑнсем.",
    "body": "Шухӑшсем тата асӑмсем"
  }
},
 ru:{
  band:{title:'Письмо издалека',lead:'Я открыл окно, и в комнату вошёл запах дождя. На столе лежало письмо, которое я всё утро собирался прочесть.',body:'В нём было всего несколько строк: о дороге, о новом доме и о том, как далеко слышен колокол, когда над рекой поднимается туман.'},
  headpiece:{chapter:'Глава первая',title:'Дорога к реке',lead:'Тропа начиналась за последним домом и уходила между деревьями. Сквозь ветви уже была видна вода.',body:'Мы вышли рано. Солнце ещё не поднялось над лесом, и каждый звук казался особенно близким: шаги на песке, шорох травы, плеск у берега.'},
  tailpiece:{title:'Когда стихает ветер',lead:'К вечеру ветер стих. За рекой темнели деревья, а над водой ещё держался свет.',body:'Мы немного постояли у берега и пошли обратно. В окнах зажглись огни. Дорога была знакомой, но после долгого дня всё вокруг казалось новым.'},
  divider:{title:'Утренние заметки',lead:'Город просыпался медленно. В открытые двери пекарни тянуло тёплым хлебом, а на площади уже расставляли цветы.',body:'Позже пошёл дождь. Мы укрылись под навесом и смотрели, как вода собирается на краю крыши, прежде чем упасть на камни.'},
  frame:{title:'Тихий берег',lead:'Вечерний свет над тихою водой.\nНеспешный шаг по узкой тропке.\nИ целый мир — на белом листе.',body:''},
  background:{title:'Записная книжка',lead:'Дороги, встречи и места, к которым хочется вернуться.',body:'Мысли и наблюдения'},
 },
 en:{
  band:{title:'A letter from afar',lead:'I opened the window and the scent of rain entered the room. On the table lay a letter I had been meaning to read all morning.',body:'There were only a few lines: about a journey, a new house, and how far the bell can be heard when mist rises over the river.'},
  headpiece:{chapter:'Chapter one',title:'The path to the river',lead:'The path began beyond the last house and disappeared among the trees. Through the branches we could already see the water.',body:'We had set out early. The sun was still below the woods, and every sound seemed close: footsteps on sand, grass stirring, water moving along the shore.'},
  tailpiece:{title:'When the wind falls quiet',lead:'By evening the wind had fallen quiet. Trees darkened across the river, while a little light still lingered on the water.',body:'We stood by the shore for a moment, then turned for home. Lights appeared in the windows. The road was familiar, yet after the long day everything seemed new.'},
  divider:{title:'Morning notes',lead:'The town woke slowly. Warm bread scented the open bakery doorway, and someone was already arranging flowers in the square.',body:'Later it began to rain. We sheltered beneath an awning and watched water gather at the edge of the roof before falling onto the stones.'},
  frame:{title:'The quiet shore',lead:'Evening light across the water.\nA narrow path beneath the trees.\nA quiet moment on the page.',body:''},
  background:{title:'A small notebook',lead:'Roads, encounters and places to return to.',body:'Notes and observations'},
 },
};
export function ContextPreview({kind,result,inset,lang,repeatScale=1}:{kind:ContextKind;result:Generated;inset?:FrameResult['inset'];lang:Language;repeatScale?:number}){
 const story=stories[lang][kind];
 const Art=({className=''}:{className?:string})=><div className={`context-ornament ${className}`} data-testid="context-ornament" dangerouslySetInnerHTML={{__html:result.svg}}/>;
 const title=<h2>{story.title}</h2>;
 if(kind==='frame'&&inset)return<div className="context-frame art-stage" data-context={kind} style={{aspectRatio:`${result.width}/${result.height}`}}>
  <Art/>
  <article className="framed-copy context-frame-copy" style={{inset:`${inset.top/result.height*100}% ${inset.right/result.width*100}% ${inset.bottom/result.height*100}% ${inset.left/result.width*100}%`}}>{title}<p className="context-verse">{story.lead}</p></article>
 </div>;
 if(kind==='background')return<div className="context-background" data-context={kind} data-testid="tile-grid" style={{backgroundImage:`url("${svgUrl(result.svg)}")`,backgroundSize:`${result.width*repeatScale}px ${result.height*repeatScale}px`,backgroundPosition:'center center'}}><article className="context-paper">{title}<p>{story.lead}</p><p>{story.body}</p></article></div>;
 return<article className={`context-paper context-${kind}`} data-context={kind}>
  {kind==='headpiece'&&<Art/>}
  {story.chapter&&<p className="context-chapter">{story.chapter}</p>}
  {title}<p>{story.lead}</p>
  {(kind==='band'||kind==='divider')&&<Art/>}
  <p>{story.body}</p>
  {kind==='tailpiece'&&<Art/>}
 </article>;
}
