import{writeFileSync}from'node:fs';
import{Resvg}from'@resvg/resvg-js';
import{generateComposition}from'../dist/index.js';
const embed=(a,x,y,w,h)=>a.svg.replace(/^<svg[^>]*>/,`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${a.width} ${a.height}">`);
const band=generateComposition({composition:'diagonal-scrolls',width:1080,height:110,size:70,color:'#8b1a1a',accentColor:'#b66b51'});
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f4f3ef"/>${embed(band,60,38,1080,110)}<text x="600" y="307" text-anchor="middle" font-family="Georgia" font-size="80" fill="#292824">Chuvash Ornaments</text><text x="600" y="370" text-anchor="middle" font-family="Arial" font-size="29" fill="#4d4b46">SVG patterns, frames &amp; backgrounds</text><text x="600" y="423" text-anchor="middle" font-family="Arial" font-size="20" letter-spacing="2" fill="#8b1a1a">OPEN SOURCE · LIVE PLAYGROUND</text>${embed(band,60,482,1080,110)}</svg>`;
writeFileSync('demo/public/social-card.png',new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng());
console.log('Social preview generated: 1200 × 630.');
