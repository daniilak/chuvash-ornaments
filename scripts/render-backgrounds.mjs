import{writeFileSync,mkdirSync}from'node:fs';
import{Resvg}from'@resvg/resvg-js';
import{BACKGROUNDS,generateBackground}from'../dist/index.js';
mkdirSync('examples/backgrounds',{recursive:true});
const parts=[];
for(const[i,b]of BACKGROUNDS.entries()){
 const art=generateBackground({background:b.id,color:'#8b1a1a'});
 writeFileSync(`examples/backgrounds/${b.id}.svg`,art.svg);
 writeFileSync(`examples/backgrounds/${b.id}.json`,JSON.stringify(art.params,null,2)+'\n');
 const x=i%2*580,y=Math.floor(i/2)*495;
 parts.push(`<text x="${x+25}" y="${y+30}" font-family="Arial" font-size="20" font-weight="600" fill="#30343a">${b.name.ru}</text><svg x="${x+25}" y="${y+48}" width="530" height="420" viewBox="0 0 640 480"><rect width="640" height="480" fill="#f4f3ef"/>`);
 for(let row=0;row<3;row++)for(let col=0;col<4;col++)parts.push(art.svg.replace(/^<svg[^>]*>/,`<svg x="${col*160}" y="${row*160}" width="160" height="160" viewBox="0 0 ${art.width} ${art.height}">`));
 parts.push('</svg>');
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="${Math.ceil(BACKGROUNDS.length/2)*495}"><rect width="100%" height="100%" fill="#fff"/>${parts.join('')}</svg>`;
writeFileSync('docs/backgrounds.svg',svg);writeFileSync('docs/backgrounds.png',new Resvg(svg,{font:{loadSystemFonts:true,defaultFontFamily:'Arial'}}).render().asPng());
console.log(`${BACKGROUNDS.length} backgrounds rendered on 4×3 repeat fields.`);
