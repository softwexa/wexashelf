import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {validateData,validateManaged} from '../src/lib/server/validation';
const seed=JSON.parse(readFileSync(new URL('../php/resources/seed.json',import.meta.url),'utf8'));
const record=seed.records.find((r:{kind:string})=>r.kind==='article');
const image={assetId:'a'.repeat(64),format:'png',width:3,height:2,alt:'Image',caption:'',aiGenerated:false};
test('inline image schema rejects identity, pixel, text and provenance violations',()=>{validateData('article',{...record.data,images:[image]});for(const bad of [{...image,width:1.5},{...image,width:4096,height:4096},{...image,alt:'<script>x</script>'},{...image,alt:''},{...image,format:'svg'},{...image,remoteUrl:'https://example.org/image.png'},{...image,aiGenerated:'false'}])assert.throws(()=>validateData('article',{...record.data,images:[bad]}));assert.throws(()=>validateData('article',{...record.data,images:[image,image]}));assert.throws(()=>validateData('article',{...record.data,images:null}));});
test('app shortcodes become canonical dependencies without executing malformed text',()=>{const result=validateManaged({...record,data:{...record.data,appIds:[],sections:[{heading:'Example',paragraphs:['[app id="notion"] [app id="notion"] [app id="../unsafe"]']}],images:[image]}});assert.equal(result.kind,'article');assert.deepEqual((result.data as {appIds:string[]}).appIds,['notion']);});
