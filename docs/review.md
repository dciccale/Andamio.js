# Project review, 8 October 2026

This review covers every source module, the generated library, both original package manifests, the Grunt tasks, and the README.
The starting commit was `97546c0`. The working tree was clean.
The project had no tests, no dependency lockfile, no package entry point, and no completed API documentation.

## Confirmed defects and fixes

| Area | Original behavior | Change |
| --- | --- | --- |
| Module loading | The outer factory used `_` and `Backbone` before CommonJS or AMD resolved them. Requiring the package also had no `main` entry. | Resolve dependencies before initialization. Add the package entry. Test browser, CommonJS, AMD, and minified loading. |
| DOM library | Source modules referenced a global `$` even when Backbone had its own DOM library. `Andamio.$` was a stale copy. | Use `Andamio.$`, which reads and writes `Backbone.$`. |
| Model defaults | Construction mutated prototype defaults. Parent defaults overwrote child values. Function-valued defaults were not merged correctly. | Merge defaults into a fresh instance object. Child values take precedence. |
| Computed properties | Functions became raw attributes and remained functions in serialized data. | Evaluate computed values in `get()` and `toJSON()`. Use current attributes as the callback context. |
| Data event bindings | Repeated `delegateEvents()` calls added duplicate listeners. Function-valued event maps were unsupported. | Store the actual callbacks and replace previous bindings. Validate handlers before binding. |
| Event removal | A missing handler could call `stopListening` with an undefined callback and remove unrelated listeners. | Skip unresolved handlers during unbinding. |
| Shared view configuration | Cleanup deleted keys from shared UI and subview maps. Later instances lost their configuration. | Keep instance maps and restore selectors without mutating shared configuration. |
| Subviews and regions | Late subviews could disappear on rerender. Replacing a subview did not close it. Region views survived replacement of their HTML. | Track additions, close replaced subviews, and close previous region views before rerender. |
| View removal | Backbone's `remove()` bypassed Andamio child cleanup. Closed views lost declarative handlers on reuse. | Make `remove()` perform lifecycle cleanup. Restore declarative handlers when render reopens a view. |
| Collection order | Insertion at index zero appended the view at the end. Sort events did not update the DOM. | Keep children and DOM in collection order. Render after sort. |
| Collection render failure | A child template exception left buffering active and retained child views. | Close partial children and reset the buffer before propagating the error. |
| Region lifecycle | `onShow` omitted the view argument. Showing an already closed current view could leave its element detached. `close()` retained an externally closed view. | Pass the view, reattach it when required, and clear stale references. |
| Region lookup | Missing or multiple targets failed silently. Region names became CSS selector text. Duplicate names overwrote regions. | Require one target, compare names literally, and reject duplicate names in a view. |
| Route matching | Later generic routes could override earlier specific routes. Aliases reported the first alias instead of the matched pattern. Empty redirect targets were ignored. | Preserve declaration priority, use a callback per alias, and accept empty redirects. |
| Application lifecycle | `start()` without arguments failed. Default alias arrays passed directly to navigation. There was no shutdown method. | Accept omitted options, choose the first default alias, support history options, and add `stop()`. |
| Build template | The separate CoffeeScript build referenced missing app files and an undefined `tplmin` task. | Replace it with a runnable task sample and a small HTTP server. |

Three defects were reproduced directly against the original generated build with current Backbone and jQuery.
A child default of `child` became `parent`.
One change event called its handler three times after two explicit delegations.
Inserting `A` before `B` produced DOM text `BA`.

## Dependency and security results

The initial audits used `npm install --package-lock-only --ignore-scripts`, followed by `npm audit --json`, in each original package directory.
The audit counts include vulnerable packages reached through other dependencies. The two original graphs overlap, so their counts must not be added.

| Dependency graph | Low | Moderate | High | Critical | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original library build | 1 | 2 | 13 | 6 | 22 |
| Original app build template | 2 | 3 | 23 | 7 | 35 |
| Updated locked project | 0 | 0 | 0 | 0 | 0 |

The original vulnerable paths included Grunt, JSHint, UglifyJS, Lodash, Underscore, and old filesystem and HTTP utilities.
The update removes the obsolete Grunt dependency graphs instead of overriding their transitive packages.
The new build uses Node filesystem APIs and Terser.
The project has a committed lockfile, ESLint, CI, and Dependabot configuration for npm and GitHub Actions.
The CI actions use verified release commit hashes.

The development dependencies were checked against the npm registry's stable `latest` tags on the review date.

| Dependency | Version |
| --- | --- |
| Backbone | 1.6.1 |
| Underscore | 1.13.8 |
| jQuery | 4.0.0 |
| jsdom | 30.1.2 |
| Terser | 5.51.2 |
| ESLint | 10.12.0 |
| @eslint/js | 10.0.1 |
| globals | 17.13.0 |

Peer dependency ranges require current Backbone and Underscore. jQuery 3.7.1 remains supported alongside jQuery 4.
The [jQuery 4 release notes](https://blog.jquery.com/2026/01/17/jquery-4-0-0/) describe its compatibility changes.
The [Backbone reference](https://backbonejs.org/) defines the upstream model, router, history, and view contracts.
A zero audit result means that npm reported no known advisories for this locked graph at the review time.
It does not establish that application templates, remote data, or host app code are safe.

## Validation

`npm run check` runs ESLint and 30 tests with Node coverage.
The library bundle has approximately 96% line coverage and 91% branch coverage.
The combined report includes the development server and has approximately 95% line coverage.
VM-based browser and AMD checks execute both readable and minified bundles.
The coverage tool does not attribute those VM executions to the readable bundle, so some loader lines appear uncovered.

All 30 tests passed in each local compatibility combination.

| Node version | jQuery 3.7.1 | jQuery 4.0.0 |
| --- | --- | --- |
| 22.23.3 | Passed | Passed |
| 24.21.0 | Passed | Passed |
| 26.11.1 | Passed | Passed |

These runtimes were installed in temporary directories. The user's global Node installation was not changed.
The initial review used local validation. The release also requires the GitHub CI matrix to pass.

The tests cover module loading, default inheritance, computed data, template escaping, data and DOM events, view reuse, subview cleanup, regions, collection order, render failures, route parameters, redirects, and application shutdown.
The sample integration test serves actual dependencies over HTTP.
It adds a task containing HTML, checks that the HTML remains text, completes a task, navigates away and back, removes a task, and follows an unknown route.

The sample also passed a manual check in the Codex browser.
Task creation and completion updated the visible count.
Navigation preserved task state. The browser reported no warning or error messages.
`npm pack --dry-run` checks the package file list.
The build has no date-dependent banner and produces deterministic outputs.
CI checks that a rebuild leaves the committed bundles unchanged.

## Compatibility changes before a release

This release uses the package name `andamiojs` and version `1.0.0`.
Version `1.0.0` starts the release history for the new npm package name.
The repository retains its historical `1.2.8` Git tag.
The compatibility notes below describe changes from that historical code.
The package name replaces `backbone.andamio`. Browser bundles now use `lib/andamio.js`, `lib/andamio.min.js`, and `lib/andamio.map`.

- The development tools require Node `^22.22.2 || ^24.15.0 || >=26.0.0`. `.nvmrc` selects the current Node 24 release.
- Older Backbone and Underscore versions are outside the declared peer ranges.
- The Grunt entry points and the incomplete `build/` template are removed. The npm scripts replace them.
- Child defaults now override parent defaults.
- Computed properties return values and do not appear as raw functions in `attributes`.
- The first matching route in the array wins. Place specific routes before catch-all routes.
- Missing, ambiguous, or duplicate regions now throw descriptive errors.
- `remove()` closes child views. Code that intentionally detached a live view with `remove()` needs a different operation.
- Custom listeners created in `initialize()` are not recreated automatically when a closed view reopens.

## Remaining opportunities

These items need an API or product decision. They are not hidden test failures.

1. Add a network sample for asynchronous `load()`. The router currently navigates immediately and does not await a promise. Cover failed fetches, late responses after navigation, and cancellation before defining a framework policy.
2. Add browser CI for navigation focus, keyboard interaction, and narrow viewports. The current DOM integration test does not verify layout or every browser's event behavior.
3. Add a persistent sample if the project needs to teach storage or server integration. The task sample deliberately stores data in memory.
4. Consider an ESM entry and TypeScript declarations when there is a consuming app. The current package uses a CommonJS entry plus browser and AMD builds.
5. Define whether computed values need their own change events and whether `isReady()` should use the `ready` attribute. Existing readiness behavior remains available for subclasses to override.
6. Expand collection rendering tests before adding empty views, filtered lists, or nested collection containers. The current implementation rebuilds children on sort and reset.
7. Decide whether routers should support instance reuse after `close()` and cleanup of manually registered routes. Current cleanup tracks routes from the configured array.

Before publication, review these compatibility changes and run the consuming app against the new build.
