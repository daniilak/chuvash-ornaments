/** Download the selected artwork without adding anything to the page. */
export function saveBlob(blob:Blob,filename:string):void{
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=filename;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/** Rasterize the same standalone SVG at its chosen dimensions, preserving transparency. */
export async function svgToPng(svg:string,width:number,height:number):Promise<Blob>{
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{
   image.onload=()=>resolve();image.onerror=()=>reject(new Error('SVG image could not be loaded'));
   image.src=url;
  });
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width));canvas.height=Math.max(1,Math.round(height));
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Canvas is not available');
  context.drawImage(image,0,0,canvas.width,canvas.height);
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG could not be encoded')),'image/png'));
 }finally{URL.revokeObjectURL(url);}
}
