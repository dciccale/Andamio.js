# Andamio API reference

All view, model, collection, router, and application classes support Backbone's `extend` method.
`Andamio.$` reads and writes `Backbone.$`.

## Model and Collection

`Andamio.Model` extends `Backbone.Model`.
Its `defaults` include `ready: false`. Defaults merge across the prototype chain, with child values taking precedence.
The merge is shallow. A function-valued `defaults` runs with the model as `this`.
Model options are available as `model.options`.

`setReady()` sets the `ready` attribute to `true`.
`isReady()` returns `true` by default. A subclass can override it to use `this.get('ready')` or another readiness condition.
`load()` does nothing by default. A router calls it with the matched route parameters.

`computedProperties` maps names to functions or constant values.
A computed function runs with the attributes object as `this`.
`get(name)` evaluates the computed value. `toJSON()` includes the evaluated value.
Computed functions do not become attributes. They do not emit separate change events.
A computed name takes precedence over a stored attribute with the same name.

```js
var Person = Andamio.Model.extend({
	computedProperties: {
		fullName: function () { return this.first + ' ' + this.last; }
	}
});
```

`Andamio.Collection` extends `Backbone.Collection`. Its model is `Andamio.Model`.
Its `load()` does nothing by default.

## View and ItemView

`Andamio.View` extends `Backbone.View`.
`close()` closes tracked subviews and region views, removes the element, and stops event listeners.
`remove()` performs the same cleanup. Repeated calls have no further effect.
`render()` restores declarative event handlers when a closed view reopens.
Custom render methods can call `Andamio.View.prototype.render.call(this)` to restore these handlers.
Custom listeners created in `initialize()` require their own setup when a view reopens.

`modelEvents` and `collectionEvents` map event names to handler method names or callback functions.
A string can contain several method names separated by spaces.
Either map can be a function that returns the map.
`delegateEvents()` replaces previous declarative bindings.
`undelegateEvents()` removes declarative DOM and data bindings.

`addSubview(key, view)` tracks a view instance or creates a view from a constructor.
Replacing a subview closes the previous view.
The `subviews` configuration can contain constructors or instances.
Each parent has its own configuration map. Instances supplied on a prototype still refer to the same view, so use constructors for independent subviews.
Subview factories create new instances when a closed parent renders again.
Existing instances can render again if their lifecycle supports reuse.

`Andamio.ItemView` adds template rendering.
`template` is a function that receives serialized data and returns HTML.
The model supplies data when present. Otherwise, a collection supplies `{items: collection.toJSON()}`.
A view with neither supplies `{}`.
`serializeData()` can override this behavior.

`render()` renders the template, creates configured subviews, binds regions, resolves UI selectors, and calls `afterRender()`.
Rendering again closes views in the previous regions before it replaces the HTML.
`ui` maps names to selectors. After render, each value is a jQuery object scoped to the view.
Closing the view restores the selectors.
Each descendant with a `data-region` attribute creates an entry in `view.regions` with that attribute's name.
Region names must be unique within a view.

A prototype `model` or `collection` constructor creates an instance during view construction.
A `collectionView` constructor creates a tracked subview named `collectionView` when the item view has a collection.
The item view passes that collection to the subview. The parent places the subview through a region or its own rendering code.

## CollectionView

`Andamio.CollectionView` extends `Andamio.View`.
`itemView` is the constructor for each model's child view.
`itemViewOptions` is an options object or a function of the model and its index.
The child receives the model plus these options.
`children` contains child views in collection order.

The view responds to collection `add`, `remove`, `reset`, and `sort` events.
A full render closes existing children and builds new children in a document fragment.
Rendering calls `afterRender()` when defined.
`isEmpty()` returns `true` when the collection is absent or empty.
`closeChildren()` closes and removes all child views.

`buildItemView`, `renderItemView`, `appendHtml`, and `appendBuffer` provide rendering extension points.
Custom `appendHtml` methods receive the collection view, child view, and index.
Custom methods must support the buffering state during full renders.

## Region

A region accepts an `el` name, a DOM element, or a `$el` jQuery object.
An `el` string matches a `data-region` value. It is not a CSS selector.
A region must resolve to exactly one element.

`show(view)` renders and inserts the view. It closes the previous view when the view changes.
It emits `show` with the view, then calls `onShow(view)` when defined.
`currentView` contains the shown view before these notifications.
`close()` closes or removes the current view and clears `currentView`.
It calls `onClose()` when defined.
`reset()` closes the view and clears the cached DOM lookup.
Regions mix in `Backbone.Events`. `stopListening()` releases listeners that the region created.

## Router

`Andamio.Router` extends `Backbone.Router` with an array of route objects.
Each route has `url` and either `view` or `redirectTo`.
`url` is a Backbone route pattern or an array of patterns.
`name` is optional. The first declared matching route has priority.

```js
var Router = Andamio.Router.extend({
	routes: [
		{url: 'tasks/:id', name: 'task', view: TaskView},
		{url: '', name: 'home', view: HomeView},
		{url: '*path', redirectTo: ''}
	]
});
```

A match creates a new view, then calls its model's `load()` or its collection's `load()`.
The model takes precedence when both are present.
The data object also receives `urlParams`.
Backbone supplies decoded path parameters and a final query-string argument.
Loading is synchronous from the router's perspective. A returned promise does not delay navigation.
Apps handle loading indicators, errors, and cancellation in their own models and views.

The router emits `navigate(view, url, urlParams)` with the matched pattern.
A redirect uses `trigger: true` and `replace: true`. An empty redirect target is valid.
`close()` removes this router's history handlers and stops its listeners.
Closing a router does not stop Backbone's shared history.

## Application

`new Andamio.Application(options)` copies configuration and creates `vent`, a Backbone event emitter.
The default `container` is the `main` selector. The default page region `el` is `page`.

`start({appView, router})` accepts constructors or instances.
It renders the app view in the container, connects router navigation to the page region, and starts Backbone history.
`historyOptions` supplies Backbone history options.
If the fragment is empty, a route with `default: true` supplies the initial URL.
For URL aliases, the first alias is the default URL.
`initialize()` runs after this startup sequence.
`start()` without options calls only `initialize()`.

`vent` emits `navigate` with the shown page view.
`stop()` closes the page region and app view, closes an Andamio router, stops history, and releases application listeners.
A plain Backbone router supplies no `close()` method, so its history handlers remain its owner's responsibility.
Only one Backbone history can run at a time.
Starting an app router while history is active throws before it replaces the app view.
