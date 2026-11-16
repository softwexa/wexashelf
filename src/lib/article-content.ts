import type { ArticleRecord } from './domain';

export type ArticleContentToken = {type:'text';text:string}|{type:'app'|'image';id:string};
/** Only these two literal tags are executable content. Everything else is plain text. */
export function parseArticleParagraph(text:string):ArticleContentToken[]{
 const expression=/\[(app|image) id="([a-z0-9-]+)"\]/g;
 const tokens:ArticleContentToken[]=[];let offset=0;
 for(const match of text.matchAll(expression)){
  const type=match[1] as 'app'|'image',id=match[2];
  if(type==='app'?!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id):!/^[a-f0-9]{64}$/.test(id))continue;
  if(match.index!>offset)tokens.push({type:'text',text:text.slice(offset,match.index)});
  tokens.push({type,id});offset=match.index!+match[0].length;
 }
 if(offset<text.length)tokens.push({type:'text',text:text.slice(offset)});
 return tokens;
}
export function articleReferences(text:string):{type:'app'|'image';id:string}[]{return parseArticleParagraph(text).filter((token):token is {type:'app'|'image';id:string}=>token.type!=='text');}
export function articleAppIds(article:Pick<ArticleRecord,'appIds'|'sections'>):string[]{return [...new Set([...article.appIds,...article.sections.flatMap(section=>section.paragraphs.flatMap(text=>articleReferences(text).filter(token=>token.type==='app').map(token=>token.id)))])];}
export function articleImageIds(article:Pick<ArticleRecord,'sections'>):string[]{return [...new Set(article.sections.flatMap(section=>section.paragraphs.flatMap(text=>articleReferences(text).filter(token=>token.type==='image').map(token=>token.id))))];}
