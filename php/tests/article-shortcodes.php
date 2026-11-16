<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{ArticleContent,PublicSite,SEOSettings};
function contentCheck(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
foreach(json_decode(file_get_contents(__DIR__.'/fixtures/article-shortcodes.json'),true)as$case)contentCheck(ArticleContent::parse($case['text'])===$case['tokens'],'Shared parser fixture '.$case['text']);
$hash=str_repeat('a',64);$article=['id'=>'inline-content','title'=>'Inline content','summary'=>'A sourced article.','author'=>'Editor','publishedAt'=>'2026-01-01','updatedAt'=>'2026-01-02','sources'=>[],'appIds'=>[],'sections'=>[['heading'=>'Sources','paragraphs'=>['Before [app id="notion"] after [image id="'.$hash.'"] <b>literal</b>']]],'images'=>[['assetId'=>$hash,'format'=>'png','width'=>120,'height'=>80,'alt'=>'A visible diagram','caption'=>'A diagram caption','aiGenerated'=>false]]];
$app=['id'=>'notion','name'=>'Notion','description'=>'Published app.','tagline'=>'Recorded app description','platforms'=>['android'],'icon'=>'/icons/notion.jpg'];
$catalog=['apps'=>[$app],'articles'=>[$article],'lists'=>[],'records'=>[['id'=>'notion','kind'=>'app','sourceLocale'=>'en','seoApproved'=>true],['id'=>'inline-content','kind'=>'article','sourceLocale'=>'en','seoApproved'=>true]],'translations'=>[]];
$config=['site'=>['url'=>'https://catalog.example.org/sub','indexing'=>true],'seo'=>SEOSettings::defaults(),'localization'=>['defaultLocale'=>'en','locales'=>[['code'=>'en','enabled'=>true],['code'=>'tr','enabled'=>true]]]];
ob_start();PublicSite::render($catalog,$config,'/en/blog/inline-content',[]);$html=ob_get_clean();
contentCheck(str_contains($html,'data-article-app="notion"')&&str_contains($html,'/sub/en/apps/notion'),'Actual localized referenced app and subdirectory link');
contentCheck(str_contains($html,'/sub/assets/icons/notion.webp')&&str_contains($html,'alt="A visible diagram"')&&str_contains($html,'width="120" height="80" loading="lazy"'),'Genuine icon and bounded lazy image metadata');
contentCheck(str_contains($html,'&lt;b&gt;literal&lt;/b&gt;')&&!str_contains($html,'<b>literal</b>'),'Authored HTML remains text');
contentCheck(str_contains($html,'"description":"A visible diagram"')&&str_contains($html,'"caption":"A diagram caption"'),'ImageObject reflects visible image content');
contentCheck(PublicSite::publicMedia($catalog,$hash)&&!PublicSite::publicMedia($catalog,$hash,'jpg'),'Only exact published image format is public');
$catalog['apps']=[];ob_start();PublicSite::render($catalog,$config,'/en/blog/inline-content',[]);$html=ob_get_clean();contentCheck(!str_contains($html,'data-article-app=')&&str_contains($html,'This app has no published record in this language.'),'Missing localized app cannot leak a card');
$catalog['articles'][0]['sections']=[];contentCheck(!PublicSite::publicMedia($catalog,$hash),'Unused metadata does not grant public access');
$catalog['translations']=[['kind'=>'article','id'=>$article['id'],'locale'=>'tr','status'=>'published','publishAt'=>null,'data'=>$article]];contentCheck(PublicSite::publicMedia($catalog,$hash),'Still-published frozen translation retains its image');$catalog['translations'][0]['status']='draft';contentCheck(!PublicSite::publicMedia($catalog,$hash),'Unpublished translation revokes last public reference');
echo "PASS shared parser parity, localized SSR app/icon/image metadata, HTML escaping, factual ImageObject and frozen translation media eligibility.\n";
