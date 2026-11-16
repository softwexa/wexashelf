import assert from 'node:assert/strict';
import test from 'node:test';
import seed from '../php/resources/seed.json';
import { StoreError, validateData, validateManaged } from '../src/lib/server/validation';

const appRecord = seed.records.find(record => record.kind === 'app')!;
const app = appRecord.data;
const screenshot = {
  assetId: 'a'.repeat(64), format: 'webp', width: 1200, height: 800,
  alt: 'Çalışma alanı — 工作区 😀', caption: 'A synthetic screenshot', aiGenerated: false,
};
const validate = (screenshots: unknown) => validateData('app', { ...app, screenshots });

test('app screenshots are optional, ordered, and limited to five distinct raster identities', () => {
  assert.doesNotThrow(() => validateData('app', app));
  assert.doesNotThrow(() => validate([]));
  const five = Array.from({ length: 5 }, (_, index) => ({
    ...screenshot, assetId: String(index + 1).repeat(64),
    format: ['png', 'jpg', 'webp'][index % 3],
  }));
  const managed = validateManaged({ ...appRecord, data: { ...app, screenshots: five } });
  assert.deepEqual((managed.data as { screenshots: unknown }).screenshots, five);
  assert.throws(() => validate([...five, { ...screenshot, assetId: 'f'.repeat(64) }]), StoreError);
  assert.throws(() => validate([screenshot, screenshot]), StoreError);
  assert.throws(() => validate([screenshot, { ...screenshot, format: 'png' }]), StoreError);
  for (const value of [null, {}, 'image.png', [null], [42]]) {
    assert.throws(() => validate(value), StoreError);
  }
  for (const kind of ['article', 'list'] as const) {
    const record = seed.records.find(row => row.kind === kind)!;
    assert.throws(() => validateData(kind, { ...record.data, screenshots: [screenshot] }), StoreError);
  }
});

test('app screenshot records reject unsafe identities, geometry, metadata and remote references', () => {
  const invalid = [
    { assetId: '../private' }, { assetId: 'A'.repeat(64) }, { assetId: 'a'.repeat(63) },
    { format: 'svg' }, { format: 'gif' }, { format: 'jpeg' },
    { width: 0 }, { height: -1 }, { width: 1.5 }, { height: '800' },
    { width: 4097 }, { width: 4096, height: 4096 },
    { alt: '' }, { alt: '   ' }, { alt: '<img src=x>' }, { caption: 'line\nbreak' },
    { alt: null }, { caption: 12 }, { aiGenerated: 'false' },
    { url: 'https://example.test/image.webp' }, { path: '/private/image.webp' },
  ];
  for (const mutation of invalid) {
    assert.throws(() => validate([{ ...screenshot, ...mutation }]), StoreError, JSON.stringify(mutation));
  }
  assert.doesNotThrow(() => validate([{ ...screenshot, width: 4000, height: 3000 }]));
  assert.doesNotThrow(() => validate([{ ...screenshot, width: 4096, height: 1, aiGenerated: true }]));
});

test('screenshot descriptions use Unicode code-point limits without accepting markup or controls', () => {
  for (const character of ['a', '文', '😀']) {
    assert.doesNotThrow(() => validate([{ ...screenshot, alt: character.repeat(300), caption: character.repeat(500) }]));
    assert.throws(() => validate([{ ...screenshot, alt: character.repeat(301) }]), StoreError);
    assert.throws(() => validate([{ ...screenshot, caption: character.repeat(501) }]), StoreError);
  }
});

test('app descriptions and tags retain ASCII ceilings and accept the same number of Unicode code points', () => {
  for (const character of ['a', '文', '😀']) {
    assert.doesNotThrow(() => validateData('app', {
      ...app, description: character.repeat(10_000), tags: [character.repeat(100)], aliases: [character.repeat(100)],
    }));
    assert.throws(() => validateData('app', { ...app, description: character.repeat(10_001) }), StoreError);
    for (const field of ['tags', 'aliases']) {
      assert.throws(() => validateData('app', { ...app, [field]: [character.repeat(101)] }), StoreError);
    }
  }
});
