export type Language = 'ru' | 'en';
export type Preference = Language | 'system';
export function resolveLanguage(preference:unknown,languages:readonly string[]):Language{
 if(preference==='ru'||preference==='en')return preference;
 for(const language of languages){if(/^ru(?:-|$)/i.test(language))return 'ru';if(/^en(?:-|$)/i.test(language))return 'en';}
 return 'en';
}
export const text={
 ru:{
  title:'Чувашские узоры',description:'SVG-узоры, фигуры и рамки.',language:'Язык',system:'Авто',design:'Узор',newDesigns:'Готовые узоры',basic:'Простые формы',
  category:'Тип узора',categories:{frame:'Рамки',band:'Полосы',headpiece:'Заставки',tailpiece:'Концовки',divider:'Разделители',background:'Фоны'},
  motif:'Одна фигура',divider:'Разделитель',band:'Полоса',tile:'Фон',border:'Рамка',corners:'Углы',
  sourceMotif:'Фигура',seed:'Вариант',newVariant:'Другой вариант',another:'Другой',color:'Цвет',accentColor:'Второй цвет',width:'Ширина',height:'Высота',stroke:'Толщина линий',size:'Размер фигур',figureSize:'Размер фигуры',treeSize:'Размер дерева',frameSize:'Толщина рамки',cornerSize:'Размер углов',gap:'Интервал',sequence:'Повтор',
  repeat:'Одинаковые',alternate:'Чередовать',mirror:'Зеркально',seeded:'По варианту',layout:'Раскладка',grid:'В ряд',checkerboard:'В шахматном порядке',rotation:'Поворот',reflect:'Зеркало',none:'Нет',horizontal:'Горизонтально',vertical:'Вертикально',both:'В обе стороны',
  outline:'Без заливки',hatch:'Штриховка',opacity:'Плотность заливки',
  download:'Скачать SVG',copy:'Копировать',copied:'Скопировано',copyFail:'Выделите и скопируйте код',downloaded:'SVG скачан',code:'Код',choose:'Все узоры',
  previewMode:'Просмотр',inContext:'В тексте',specimen:'Образец',
  tileSize:'Размер плитки',backgroundScale:'Масштаб фона',
  format:'Размер файла',appearance:'Рисунок',placement:'Расположение',
  cardTitle:'Тихий берег',cardText:'Вечерний свет над тихою водой.\nНеспешный шаг по узкой тропке.\nИ целый мир — на белом листе.',resize:'Потяните за нижний правый угол, чтобы изменить размер.',
 },
 en:{
  title:'Chuvash ornaments',description:'SVG patterns, motifs and frames.',language:'Language',system:'Auto',design:'Pattern',newDesigns:'Ready-made patterns',basic:'Simple layouts',
  category:'Pattern type',categories:{frame:'Frames',band:'Bands',headpiece:'Headpieces',tailpiece:'Tailpieces',divider:'Dividers',background:'Backgrounds'},
  motif:'Single motif',divider:'Divider',band:'Band',tile:'Background',border:'Frame',corners:'Corners',
  sourceMotif:'Motif',seed:'Variation',newVariant:'New variation',another:'New',color:'Color',accentColor:'Second ink',width:'Width',height:'Height',stroke:'Line width',size:'Motif size',figureSize:'Figure size',treeSize:'Tree size',frameSize:'Border width',cornerSize:'Corner size',gap:'Spacing',sequence:'Repeat',
  repeat:'Same motif',alternate:'Alternate',mirror:'Mirror',seeded:'By variation',layout:'Layout',grid:'Rows',checkerboard:'Checkerboard',rotation:'Rotation',reflect:'Mirror',none:'None',horizontal:'Horizontal',vertical:'Vertical',both:'Both ways',
  outline:'Outline only',hatch:'Hatching',opacity:'Fill opacity',
  download:'Download SVG',copy:'Copy',copied:'Copied',copyFail:'Select and copy the code',downloaded:'SVG downloaded',code:'Code',choose:'All patterns',
  previewMode:'Preview',inContext:'In context',specimen:'Specimen',
  tileSize:'Tile size',backgroundScale:'Background scale',
  format:'File size',appearance:'Pattern',placement:'Arrangement',
  cardTitle:'The quiet shore',cardText:'Evening light across the water.\nA narrow path beneath the trees.\nA quiet moment on the page.',resize:'Drag the bottom-right corner to resize.',
 },
} as const;
export const englishMotifs:Record<string,string>={wing_r:'Wing',chelovech:'Little person',chelovek:'Person',snezhinka1:'Kĕskĕ 1',snezhinka2:'Kĕskĕ 2',snezhinka3:'Kĕskĕ 3',krab:'Beetle',keske_iz_serdtsa:'Heart Kĕskĕ',zvezda:'Sun',serdtse:'Heart',bolshoe_serdtse:'Large heart',vzaimoponimanie:'Mutual understanding',kuritsa:'Bird',kuritsa_fill:'Filled bird',tsvetok:'Flower',tree:'Tree'};
