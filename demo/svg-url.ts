/** Strict URI escaping also keeps SVG transforms valid in CSS URL parsers. */
export function svgUrl(svg:string):string{
 return 'data:image/svg+xml,'+encodeURIComponent(svg).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
}
