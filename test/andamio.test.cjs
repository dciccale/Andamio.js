const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<main></main>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
Backbone.$ = $;
const Andamio = require('..');
let views;
beforeEach(() => {
  views = [];
  Backbone.history.stop();
  Backbone.history.handlers = [];
  window.history.replaceState({}, '', '/');
  document.body.innerHTML = '<main></main>';
});
afterEach(() => {
  views.forEach(view => view.close());
  Backbone.history.stop();
  Backbone.history.handlers = [];
});
function keep(view) { views.push(view); return view; }
function item(options = {}) {
  return keep(new (Andamio.ItemView.extend({ template: _.template('<button><%- title %></button>') }))({ model: new Andamio.Model({ title: 'Hello' }), ...options }));
}

test('CommonJS entry works without browser globals', () => {
  const output = execFileSync(process.execPath, ['-e', "const a = require('./'); console.log(new a.Model({value: 3}).get('value'));"], { cwd: require('node:path').resolve(__dirname, '..') });
  assert.equal(output.toString().trim(), '3');
});
for (const file of ['andamio.js', 'andamio.min.js']) {
  test(`${file} supports browser globals and late DOM library assignment`, () => {
    const context = { _, Backbone, document };
    vm.runInNewContext(readFileSync(`lib/${file}`, 'utf8'), context);
    const a = context.Andamio;
    a.$ = $;
    assert.equal(a.$, Backbone.$);
    const view = keep(new (a.ItemView.extend({ template: () => '<p>Loaded</p>' }))());
    new a.Region({ $el: $('main') }).show(view);
    assert.equal($('main').text(), 'Loaded');
  });
  test(`${file} defers AMD initialization until dependencies arrive`, () => {
    let factory;
    const define = (deps, callback) => { assert.deepEqual(Array.from(deps), ['underscore', 'backbone']); factory = callback; };
    define.amd = {};
    const context = { define };
    vm.runInNewContext(readFileSync(`lib/${file}`, 'utf8'), context);
    assert.equal(context.Andamio, undefined);
    assert.equal(factory(_, Backbone).Model.prototype.isReady(), true);
  });
}
test('browser loader reports missing dependencies', () => {
  assert.throws(() => vm.runInNewContext(readFileSync('lib/andamio.js', 'utf8'), {}), /requires Underscore and Backbone/);
});
test('models merge inherited defaults without mutating prototypes', () => {
  const Parent = Andamio.Model.extend({ defaults: { title: 'parent', parent: true } });
  const Child = Parent.extend({ defaults() { return { title: 'child', child: true }; } });
  const child = new Child();
  assert.deepEqual(child.toJSON(), { ready: false, title: 'child', parent: true, child: true });
  child.defaults.title = 'changed';
  assert.equal(new Child().get('title'), 'child');
  assert.deepEqual(Parent.prototype.defaults, { title: 'parent', parent: true });
  assert.equal(new Parent().get('title'), 'parent');
});
test('computed values use current attributes and serialize as values', () => {
  const Model = Andamio.Model.extend({ computedProperties: { fullName() { return this.first + ' ' + this.last; } } });
  const model = new Model({ first: 'Ada', last: 'Lovelace' });
  assert.equal(model.get('fullName'), 'Ada Lovelace');
  model.set('first', 'Grace');
  assert.equal(model.toJSON().fullName, 'Grace Lovelace');
  assert.equal(model.attributes.fullName, undefined);
  model.setReady();
  assert.equal(model.get('ready'), true);
  assert.equal(new Andamio.Collection([{ first: 'Ada' }]).at(0) instanceof Andamio.Model, true);
});
test('templates reject non-functions and escape untrusted text', () => {
  assert.throws(() => Andamio.Utils.render('html', {}), /template must be a function/);
  const view = item({ model: new Andamio.Model({ title: '<img src=x onerror=alert(1)>' }) }).render();
  assert.equal(view.$('img').length, 0);
  assert.equal(view.$('button').text(), '<img src=x onerror=alert(1)>');
});
test('views serialize models, collections, and empty data', () => {
  const View = Andamio.ItemView.extend({ template: () => '' });
  assert.deepEqual(keep(new View()).serializeData(), {});
  const collection = new Andamio.Collection([{ title: 'one' }]);
  assert.deepEqual(keep(new View({ collection })).serializeData(), { items: collection.toJSON() });
  const model = new Andamio.Model({ title: 'model' });
  assert.deepEqual(keep(new View({ collection, model })).serializeData(), model.toJSON());
});
test('declarative events do not duplicate handlers and reopen after close', () => {
  let calls = 0;
  const model = new Andamio.Model();
  const collection = new Andamio.Collection();
  const View = Andamio.ItemView.extend({
    template: () => '<button>Run</button>',
    events: { 'click button': 'count' },
    modelEvents() { return { change: 'count' }; },
    collectionEvents: { add: 'count' },
    count() { calls++; }
  });
  const view = keep(new View({ model, collection })).render();
  view.delegateEvents(); view.delegateEvents();
  model.set('a', 1); collection.add({}); view.$('button').trigger('click');
  assert.equal(calls, 3);
  view.undelegateEvents(); model.set('a', 2); collection.add({});
  assert.equal(calls, 3);
  view.delegateEvents(); view.close(); view.close(); model.set('a', 3);
  assert.equal(calls, 3);
  view.render(); model.set('a', 4); view.$('button').trigger('click');
  assert.equal(calls, 5);
});
test('event bindings support functions and multiple method names', () => {
  const target = Object.assign({ one() { this.calls++; }, two() { this.calls++; }, calls: 0 }, Backbone.Events);
  const source = Object.assign({}, Backbone.Events);
  Andamio.bindEvents(target, source, { update: ' one  two ' });
  source.trigger('update'); assert.equal(target.calls, 2);
  Andamio.unbindEvents(target, source, { update: ' one  two ' });
  Andamio.bindEvents(target, source, { update: target.one });
  source.trigger('update'); assert.equal(target.calls, 3);
  Andamio.unbindEvents(target, source, { update: target.one });
  assert.throws(() => Andamio.bindEvents(target, source, { update: 'missing' }), /does not exist/);
  target.invalid = 'not a function';
  assert.throws(() => Andamio.bindEvents(target, source, { update: 'invalid' }), /does not exist/);
  Andamio.bindEvents(target, null, null);
});
test('regions render, replace, reopen, notify, and release closed views', () => {
  let shown;
  let closed = 0;
  $('main').html('<section data-region="page"></section>');
  const region = new Andamio.Region({ el: 'page', onShow(view) { shown = view; }, onClose() { closed++; } });
  const first = item(); const second = item();
  assert.equal(region.show(first), region); assert.equal(shown, first);
  region.show(second); assert.equal(first.isClosed, true); assert.equal(closed, 1);
  second.close(); region.show(second); assert.equal(second.el.parentNode, region.$el[0]);
  second.close(); region.close(); assert.equal(region.currentView, undefined);
  region.show(first); region.reset(); assert.equal(region.$el, undefined);
});
test('regions accept DOM elements and fail on missing or ambiguous targets', () => {
  const view = item();
  new Andamio.Region({ el: document.querySelector('main') }).show(view);
  assert.throws(() => new Andamio.Region(), /must be specified/);
  assert.throws(() => new Andamio.Region({ el: 'missing' }).show(view), /exactly one/);
  $('main').html('<div data-region="same"></div><div data-region="same"></div>');
  assert.throws(() => new Andamio.Region({ el: 'same' }).show(view), /exactly one/);
  assert.throws(() => new Andamio.Region({ el: 'same' }).show(null), /requires a view/);
});
test('item rerender closes old regions and restores UI selectors on close', () => {
  const config = { button: 'button' };
  const View = Andamio.ItemView.extend({ template: () => '<button>Run</button><div data-region="child"></div>', ui: config });
  const first = keep(new View()).render(); const other = keep(new View()).render();
  const child = item(); first.regions.child.show(child);
  const oldRegion = first.regions.child;
  first.render(); assert.equal(child.isClosed, true); assert.equal(oldRegion.currentView, undefined);
  assert.equal(first.ui.button.length, 1);
  first.close(); assert.equal(first.ui, config); assert.deepEqual(config, { button: 'button' });
  assert.equal(other.ui.button.length, 1);
  first.render(); assert.equal(first.ui.button.length, 1);
});
test('subview factories are instance-local and late additions survive rerender', () => {
  let created = 0;
  const Child = Andamio.ItemView.extend({ initialize() { created++; }, template: () => '' });
  const config = { child: Child };
  const Parent = Andamio.ItemView.extend({ template: () => '', subviews: config });
  const first = keep(new Parent()).render(); const second = keep(new Parent()).render();
  assert.equal(created, 2); assert.notEqual(first.subviews.child, second.subviews.child);
  const late = item(); first.addSubview('late', late); first.render(); assert.equal(first.subviews.late, late);
  const replacement = item(); first.addSubview('late', replacement); assert.equal(late.isClosed, true);
  first.close(); assert.equal(replacement.isClosed, true); assert.equal(config.child, Child);
  first.render(); assert.equal(created, 3);
  const plain = new Backbone.View(); first.addSubview('plain', plain); first.close(); assert.equal(plain.el.parentNode, null);
});
test('collection children follow insertion order, sorting, reset, and removal', () => {
  const Child = Andamio.ItemView.extend({ tagName: 'li', template: _.template('<%- title %>') });
  const List = Andamio.CollectionView.extend({ tagName: 'ul', itemView: Child });
  const collection = new Andamio.Collection([{ title: 'B' }, { title: 'D' }]);
  const list = keep(new List({ collection })).render();
  const text = () => list.$('li').toArray().map(el => el.textContent);
  collection.add({ title: 'A' }, { at: 0 }); collection.add({ title: 'C' }, { at: 2 });
  assert.deepEqual(text(), ['A', 'B', 'C', 'D']);
  assert.deepEqual(list.children.map(view => view.model), collection.models);
  const removed = list.children[1]; collection.remove(collection.at(1)); assert.equal(removed.isClosed, true);
  collection.comparator = 'title'; collection.sort(); assert.deepEqual(text(), ['A', 'C', 'D']);
  const old = list.children.slice(); collection.reset([{ title: 'Z' }]);
  assert.ok(old.every(view => view.isClosed)); assert.deepEqual(text(), ['Z']);
  list.close(); collection.add({ title: 'Y' }); assert.equal(list.children.length, 0);
  list.render(); collection.add({ title: 'X' }, { at: 0 }); assert.deepEqual(text(), ['X', 'Y', 'Z']);
  collection.reset([]); assert.equal(list.isEmpty(), true); assert.equal(list.$('li').length, 0);
});
test('collection view validates itemView and initializes constructors', () => {
  const Collection = Andamio.Collection.extend({});
  const Model = Andamio.Model.extend({});
  const View = Andamio.ItemView.extend({ model: Model, collection: Collection, template: () => '', collectionView: Andamio.CollectionView });
  const view = keep(new View());
  assert.ok(view.model instanceof Model); assert.ok(view.collection instanceof Collection);
  assert.equal(view.subviews.collectionView.collection, view.collection);
  const List = Andamio.CollectionView.extend({ collection: Collection });
  const list = keep(new List()); assert.ok(list.collection instanceof Collection);
  list.collection.add({}, { silent: true }); assert.throws(() => list.render(), /itemView/);
});
test('routers preserve declaration priority and report the matching alias', () => {
  const View = Andamio.ItemView.extend({ template: () => '', model: Andamio.Model.extend({ load(...params) { this.loaded = params; } }) });
  const Router = Andamio.Router.extend({ routes: [
    { url: ['posts/new', 'latest/:id'], name: 'specific', view: View },
    { url: 'posts/:id', name: 'generic', view: View }
  ] });
  const router = new Router(); let result;
  router.on('navigate', (view, url, params) => { keep(view); result = { view, url, params }; });
  Backbone.history.start({ silent: true });
  router.navigate('posts/new', { trigger: true }); assert.equal(result.url, 'posts/new');
  router.navigate('latest/hello%20world?x=1', { trigger: true });
  assert.equal(result.url, 'latest/:id'); assert.deepEqual(result.params, ['hello world', 'x=1']);
  assert.deepEqual(result.view.model.loaded, result.params);
  router.close(); assert.equal(Backbone.history.handlers.length, 0);
});
test('routers redirect to the empty fragment', () => {
  const View = Andamio.ItemView.extend({ template: () => '' });
  const router = new (Andamio.Router.extend({ routes: [{ url: 'old', redirectTo: '' }, { url: '', view: View }] }))();
  let calls = 0; router.on('navigate', view => { keep(view); calls++; });
  Backbone.history.start({ silent: true }); router.navigate('old', { trigger: true });
  assert.equal(window.location.hash, ''); assert.equal(calls, 1); router.close();
});
test('application start accepts no options and calls initialize', () => {
  let calls = 0;
  const app = new (Andamio.Application.extend({ initialize() { calls++; } }))();
  assert.equal(app.start(), app); assert.equal(calls, 1); assert.equal(app.stop(), app);
});
test('application navigation and stop release views, history, and route handlers', () => {
  const Layout = Andamio.ItemView.extend({ template: () => '<section data-region="page"></section>' });
  const Page = Andamio.ItemView.extend({ template: () => '<p>Page</p>' });
  const Router = Andamio.Router.extend({ routes: [{ url: ['home', 'alias'], view: Page, default: true }] });
  const app = new Andamio.Application({ historyOptions: { silent: true } });
  let shown; app.vent.on('navigate', view => { shown = view; });
  app.start({ appView: Layout, router: Router });
  assert.equal(window.location.hash, '#home'); assert.equal($('[data-region="page"]').text(), 'Page');
  assert.equal(shown, app.appRegion.currentView);
  const layout = app.appView; const page = shown; const region = app.appRegion;
  app.stop(); app.stop(); assert.ok(layout.isClosed && page.isClosed);
  assert.equal(region._listeningTo && Object.keys(region._listeningTo).length || 0, 0);
  assert.equal(Backbone.History.started, false); assert.equal(Backbone.history.handlers.length, 0);
  app.start({ appView: Layout, router: Router }); app.stop();
});

test('function-valued event maps release the previous callbacks when rebinding', () => {
  let calls = 0;
  const model = new Andamio.Model();
  const View = Andamio.View.extend({ modelEvents() { return { change: () => { calls++; } }; } });
  const view = keep(new View({ model }));
  view.delegateEvents(); view.delegateEvents(); model.set('value', 1); assert.equal(calls, 1);
  view.undelegateEvents(); model.set('value', 2); assert.equal(calls, 1);
});
test('invalid declarative handlers do not leave partial listeners or erase unrelated handlers', () => {
  const source = Object.assign({}, Backbone.Events);
  const target = Object.assign({ calls: 0, count() { this.calls++; } }, Backbone.Events);
  target.listenTo(source, 'change', target.count);
  assert.throws(() => Andamio.bindEvents(target, source, { change: 'count missing' }), /does not exist/);
  Andamio.unbindEvents(target, source, { change: 'missing' });
  source.trigger('change'); assert.equal(target.calls, 1); target.stopListening();
});
test('regions created with $el can resolve their element after reset', () => {
  const region = new Andamio.Region({ $el: $('main') });
  region.show(item()); region.reset(); region.show(item()); assert.equal($('main button').length, 1);
  region.close();
});
test('failed collection render cleans children and allows a later render', () => {
  const collection = new Andamio.Collection([{ title: 'A' }, { title: 'B' }]);
  const Broken = Andamio.ItemView.extend({ template: () => { throw new Error('template failed'); } });
  const list = keep(new Andamio.CollectionView({ collection })); list.itemView = Broken;
  assert.throws(() => list.render(), /template failed/);
  assert.equal(list.children.length, 0); assert.equal(list.isBuffering, false);
  list.itemView = Andamio.ItemView.extend({ template: _.template('<%- title %>') });
  list.itemViewOptions = (model, index) => ({ attributes: { 'data-index': index, title: model.get('title') } });
  list.render(); assert.equal(list.$el.text(), 'AB'); assert.equal(list.children[1].$el.attr('data-index'), '1');
});
test('starting while another history is active fails before replacing the app view', () => {
  Backbone.history.start({ silent: true });
  const app = new Andamio.Application();
  assert.throws(() => app.start({ router: Andamio.Router, appView: Andamio.View }), /Stop Backbone history/);
  app.stop(); assert.equal(Backbone.History.started, true); assert.equal(app.appView, undefined);
});

test('Backbone remove also disposes region views and collection children', () => {
  const parent = keep(new (Andamio.ItemView.extend({ template: () => '<div data-region="child"></div>' }))()).render();
  const child = item(); parent.regions.child.show(child);
  assert.equal(parent.remove(), parent); assert.equal(child.isClosed, true);
  const list = keep(new (Andamio.CollectionView.extend({ itemView: Andamio.ItemView.extend({ template: () => '' }) }))({ collection: new Andamio.Collection([{}]) })).render();
  const row = list.children[0]; assert.equal(list.remove(), list); assert.equal(row.isClosed, true);
  assert.equal(list.children.length, 0); assert.equal(list.close(), list);
});

test('duplicate region names fail and names containing selector syntax match literally', () => {
  const bad = keep(new (Andamio.ItemView.extend({ template: () => '<div data-region="child"></div><div data-region="child"></div>' }))());
  assert.throws(() => bad.render(), /Region names must be unique/);
  const element = document.createElement('div'); element.setAttribute('data-region', 'a"[]'); document.querySelector('main').appendChild(element);
  const region = new Andamio.Region({ el: 'a"[]' }); region.show(item()); assert.equal(region.$el[0], element); region.close();
});
