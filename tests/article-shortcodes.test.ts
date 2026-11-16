import test from 'node:test';
import assert from 'node:assert/strict';
import cases from '../php/tests/fixtures/article-shortcodes.json';
import {parseArticleParagraph,articleAppIds,articleImageIds} from '../src/lib/article-content';
test('shared shortcode fixtures preserve literal malformed input and Unicode order',()=>{for(const fixture of cases)assert.deepEqual(parseArticleParagraph(fixture.text),fixture.tokens,fixture.text);});
test('dependencies union explicit and embedded apps while deduplicating image references',()=>{const image='a'.repeat(64);const article={appIds:['firefox','notion'],sections:[{heading:'H',paragraphs:[`[app id="notion"] [app id="obsidian"] [image id="${image}"] [image id="${image}"]`]}]};assert.deepEqual(articleAppIds(article),['firefox','notion','obsidian']);assert.deepEqual(articleImageIds(article),[image]);});
