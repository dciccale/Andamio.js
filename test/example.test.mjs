import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';
import { createExampleServer } from '../scripts/serve-example.mjs';

test('sample serves assets and supports task changes and navigation without leaked views', async () => {
  const server = createExampleServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  let dom;
  try {
    assert.equal((await fetch(`${url}/package.json`)).status, 404);
    assert.equal((await fetch(`${url}/app.js`, { method: 'POST' })).status, 404);
    const errors = [];
    const console = new VirtualConsole();
    console.on('jsdomError', error => errors.push(error));
    dom = await JSDOM.fromURL(url, { resources: 'usable', runScripts: 'dangerously', virtualConsole: console });
    await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
    const { document, Backbone, $ } = dom.window;
    const rows = () => document.querySelectorAll('.tasks li');
    assert.deepEqual(errors, []); assert.equal(rows().length, 2);
    document.querySelector('#task-title').value = '<img src=x onerror=alert(1)>';
    $('form').trigger('submit'); assert.equal(rows().length, 3);
    assert.equal(document.querySelector('.tasks img'), null);
    $('input[type=checkbox]').first().prop('checked', true).trigger('change');
    assert.equal(document.querySelector('.status').textContent, '2 remaining / 3 total');
    Backbone.history.navigate('about', { trigger: true });
    assert.equal(document.querySelector('h1').textContent, 'About this sample');
    Backbone.history.navigate('', { trigger: true }); assert.equal(rows().length, 3);
    $('.remove').last().trigger('click'); assert.equal(rows().length, 2);
    assert.equal(document.querySelector('.status').textContent, '1 remaining / 2 total');
    Backbone.history.navigate('unknown', { trigger: true }); assert.equal(rows().length, 2);
    assert.deepEqual(errors, []);
    Backbone.history.stop();
  } finally {
    dom?.window.close();
    await new Promise(resolve => server.close(resolve));
  }
});
