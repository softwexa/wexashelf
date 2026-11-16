import test from 'node:test';
import assert from 'node:assert/strict';
import seed from '../php/resources/seed.json';
import {validateData} from '../src/lib/server/validation';
const source=seed.records.find(record=>record.kind==='app')!.data;
test('application icons accept local publisher assets or exact uploaded raster identities',()=>{
 for(const icon of ['/icons/custom-publisher.png','/icons/antennapod.svg',`/media/${'a'.repeat(64)}.webp`])assert.doesNotThrow(()=>validateData('app',{...source,icon}));
 for(const icon of ['https://example.org/logo.png','//example.org/logo.png','/admin','/icons/../../config.php',`/media/${'a'.repeat(64)}.svg`,`/media/${'a'.repeat(64)}.webp?draft=1`,'/media/not-an-identity.png'])assert.throws(()=>validateData('app',{...source,icon}));
});
