"use client";
import Link from 'next/link';
import {useI18n} from '@/lib/i18n';
import {localeContent} from '@/lib/i18n-content';
import {appIconUrl} from '@/lib/asset-url';
import type {PublicExtensionBlock} from '@/lib/module-packages';
import css from './extension-blocks.module.css';

export default function ExtensionBlocks({blocks}:{blocks:PublicExtensionBlock[]}){
 const {t,locale,formatDate}=useI18n();const content=localeContent(locale);
 return <>{blocks.map(block=><section className={`home-panel ${css.block}`} data-module-block={`${block.moduleId}:${block.id}`} key={`${block.moduleId}:${block.id}`}>
  <header><h2>{block.title}</h2><p>{block.description}</p></header>
  {block.type==='curated-apps'&&<div className={css.apps}>{block.apps.map(app=><article className={css.app} key={app.id}><img src={appIconUrl(app.icon)} alt="" width={44} height={44} loading="lazy"/><div><h3><Link href={app.href}>{app.name}</Link></h3><p>{app.tagline}</p><small>{app.platforms.map(platform=>content.platformLabels[platform]).join(' · ')}</small></div></article>)}</div>}
  {block.type==='comparison'&&<><div className={css.tableScroll} tabIndex={0} role="region" aria-label={t('Recorded app facts')}><table><thead><tr><th scope="col">{t('App')}</th>{block.factKeys?.map(key=><th scope="col" key={key}>{content.factLabels[key]}</th>)}</tr></thead><tbody>{block.apps.map(app=><tr key={app.id}><th scope="row"><Link href={app.href}>{app.name}</Link></th>{block.factKeys?.map(key=>{const facts=app.facts.filter(fact=>fact.key===key);return <td key={key}>{facts.length?facts.map(fact=><div className={css.fact} key={`${fact.platform}:${fact.key}`}><strong>{content.platformLabels[fact.platform]} · {content.evidenceLabels[fact.state]}</strong><p>{fact.detail}</p><a href={fact.sourceUrl} rel="noopener noreferrer">{t('Source')}</a> · <time dateTime={fact.checkedAt}>{formatDate(fact.checkedAt)}</time></div>):<span className={css.unknown}>{t('Not recorded')}</span>}</td>;})}</tr>)}</tbody></table></div>{block.compareHref&&<Link className="button button-secondary" href={block.compareHref}>{t('Compare these apps')}</Link>}</>}
  {block.type==='latest-articles'&&<div className={css.articles}>{block.articles.map(article=><article key={article.id}><p className={css.date}>{t('Publication date')} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></p><h3><Link href={article.href}>{article.title}</Link></h3><p>{article.summary}</p></article>)}</div>}
 </section>)}</>;
}
