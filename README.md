# Andamio.js

<img src="andamiojs-logo.png" width="400" height="67" alt="Andamio.js logo">

Andamio adds view lifecycle management, regions, collection views, and application routing to [Backbone.js](https://backbonejs.org/).

## Run the sample app

Use Node 22.22.2 or later in the 22.x series, Node 24.15.0 or later in the 24.x series, or Node 26 or later.

From a checkout of this repository, run:

```sh
npm ci
npm run example
```

Open [the local sample](http://127.0.0.1:3000). Add a task, mark it complete, and move between the Tasks and About pages.
Tasks stay in memory until you reload the page. The sample uses local dependencies and requires no external service.
To use another port, run `PORT=3001 npm run example`.

## Use the library

The package name is `andamiojs`. The browser namespace is `Andamio`.

```sh
npm install andamiojs
```

The supported peers are Backbone 1.6.1, Underscore 1.13.8, and jQuery 3.7.1 or 4.0.0.

For a browser app, load jQuery, Underscore, Backbone, and `lib/andamio.js` in that order.
The browser build exposes `Andamio` and `Backbone.Andamio`.
The minified build is `lib/andamio.min.js`.

For CommonJS, import the package and configure Backbone's DOM library before you create a view.

```js
const Backbone = require('backbone');
const Andamio = require('andamiojs');
Backbone.$ = require('jquery');
```

Models and collections work without a DOM. Views require a browser or a DOM environment.
AMD loaders resolve `underscore` and `backbone` before they run the Andamio factory.
See the [API reference](docs/api.md) for configuration and the [sample source](examples/todos/app.js) for a complete app.

## Check and build changes

```sh
npm run check
npm audit
npm run build
npm pack --dry-run
```

`npm run check` runs ESLint and the Node tests with coverage.
The tests use real Backbone, jQuery, and jsdom. They also load the sample over HTTP and exercise its task and route behavior.
`npm run build` generates the browser and CommonJS bundle, the minified bundle, and its source map in `lib/`.
Edit `src/` and rebuild the bundles. The old Grunt tasks and incomplete `build/` app template have been removed.

See the [project review](docs/review.md) for confirmed defects, security audit results, compatibility changes, and remaining work.

## Author and license

Denis Ciccale. Logo by Javier López.

[MIT license](LICENSE.txt).
