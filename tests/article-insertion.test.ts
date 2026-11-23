import {test} from 'node:test';
import assert from 'node:assert/strict';
import {insertArticleReference} from '../src/lib/article-insertion';

test('article reference replaces a selection without trimming draft whitespace', () => {
  const text = '  Önce 😀 seçili\n\n  sonra  ';
  const start = text.indexOf('seçili');
  const code = '[app id="example"]';
  const result = insertArticleReference(text, start, start + 'seçili'.length, code);
  assert.equal(result.text, '  Önce 😀 [app id="example"]\n\n  sonra  ');
  assert.equal(result.caret, start + code.length);
});

test('repeated insertions use the returned UTF-16 caret after emoji', () => {
  const text = '😀 Türkçe';
  const first = insertArticleReference(text, 2, 2, '[app id="one"]');
  const next = insertArticleReference(first.text, first.caret, first.caret, '[app id="two"]');
  assert.equal(next.text, '😀[app id="one"][app id="two"] Türkçe');
  assert.equal(next.text.slice(next.caret), ' Türkçe');
});

test('article textarea paragraph round trip preserves spaces and blank lines', () => {
  const text = ' \n\nÖnce\n\n\n\n😀  \n';
  const result = insertArticleReference(text, 1, 1, '[app id="one"]');
  assert.equal(result.text.split('\n\n').join('\n\n'), result.text);
  assert.equal(result.text, ' [app id="one"]\n\nÖnce\n\n\n\n😀  \n');
});
