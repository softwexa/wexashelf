import Link from 'next/link';
import {useI18n} from '@/lib/i18n';
import {parseArticleParagraph} from '@/lib/article-content';
import {appIconUrl} from '@/lib/asset-url';
import type {ArticleImage,AppRecord} from '@/lib/domain';
import {AppIcon,Platforms} from './Shared';
export type InlineArticleImage=ArticleImage;
export type ArticleSection={heading:string;paragraphs:string[]};
export function ArticleContent({sections,images=[],apps,basePath='',privateMedia=false}:{sections:ArticleSection[];images?:InlineArticleImage[];apps:AppRecord[];basePath?:string;privateMedia?:boolean}){
 const {t}=useI18n();
 return <>{sections.map((section,index)=><section className="article-content-section" key={index}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph,p)=>parseArticleParagraph(paragraph).map((token,i)=>{
  const key=`${p}:${i}`;
  if(token.type==='text')return token.text.trim()?<p key={key} style={{whiteSpace:'pre-wrap'}}>{token.text}</p>:null;
  if(token.type==='app'){
   const app=apps.find(app=>app.id===token.id);
   if(!app)return <p key={key} className="article-embed-unavailable">{t('This app has no published record in this language.')}</p>;
   return <aside key={key} className="article-app-embed" aria-label={t('Referenced app')}><AppIcon app={app} large/><div><h3><Link href={`/uygulama/${app.id}`}>{app.name}</Link></h3><p>{app.tagline}</p><Platforms platforms={app.platforms}/><Link className="text-link" href={`/uygulama/${app.id}`}>{t('View app')}</Link></div></aside>;
  }
  const image=images.find(image=>image.assetId===token.id);
  if(!image||!(/^[a-f0-9]{64}$/.test(image.assetId))||!['png','jpg','webp'].includes(image.format)||!(image.width>0&&image.height>0))return <p className="article-embed-unavailable" key={key}>{t('This image is unavailable.')}</p>;
  const src=privateMedia?appIconUrl(`/api/admin/media?id=${image.assetId}&format=${image.format}`):`${basePath}/media/${image.assetId}.${image.format}`;
  return <figure className="article-inline-image" key={key}><img src={src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async"/><figcaption>{image.caption}{image.aiGenerated&&<span className="article-image-disclosure">{t('AI-generated illustrative image.')}</span>}</figcaption></figure>;
 }))}</section>)}</>;
}
