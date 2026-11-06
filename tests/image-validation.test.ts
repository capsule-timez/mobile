/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_IMAGE_SIZE_BYTES, toPickedImage, validateImage } from '../src/utils/imageValidation';

test('picker assets are normalized with name and type fallbacks', () => {
  assert.deepEqual(
    toPickedImage({ uri: 'file:///cache/abc.jpg', fileName: 'praia.jpg', mimeType: 'image/jpeg', fileSize: 1200 }),
    { uri: 'file:///cache/abc.jpg', name: 'praia.jpg', type: 'image/jpeg', size: 1200 },
  );
  assert.deepEqual(
    toPickedImage({ uri: 'file:///cache/Foto%20nova.PNG', fileName: null, mimeType: null, fileSize: null }),
    { uri: 'file:///cache/Foto%20nova.PNG', name: 'Foto nova.PNG', type: 'image/png' },
  );
  assert.equal(toPickedImage({ uri: 'file:///cache/video.mov' }).type, 'application/octet-stream');
});

test('images are validated against the API limits', () => {
  const image = { uri: 'file:///a.png', name: 'a.png', type: 'image/png', size: 100 };
  assert.equal(validateImage(image), null);
  assert.equal(validateImage({ ...image, size: undefined }), null);
  assert.match(validateImage({ ...image, type: 'image/gif' }) ?? '', /não é um tipo aceito/);
  assert.match(validateImage({ ...image, size: MAX_IMAGE_SIZE_BYTES + 1 }) ?? '', /excede o limite de 10 MB/);
  assert.equal(validateImage({ ...image, size: MAX_IMAGE_SIZE_BYTES }), null);
  assert.match(validateImage({ ...image, size: 0 }) ?? '', /está vazio/);
});
