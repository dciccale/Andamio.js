# Changelog

## 1.0.0, 2026-10-08

The npm package name changes from `backbone.andamio` to `andamiojs`.
The project name remains Andamio.js. The browser namespace remains `Andamio`.
The browser bundles are `lib/andamio.js` and `lib/andamio.min.js`.

### Compatibility changes

- Require Backbone 1.6.1 or later in the 1.x series and Underscore 1.13.8 or later in the 1.x series.
- Support jQuery 3.7.1 and 4.0.0.
- Require Node `^22.22.2 || ^24.15.0 || >=26.0.0` for the development tools.
- Replace the Grunt tasks and incomplete app build template with npm scripts.
- Give child model defaults precedence over parent defaults.
- Evaluate computed properties in `get()` and `toJSON()`.
- Give the first matching route in the configured array priority.
- Make `remove()` close tracked child views.
- Report missing, ambiguous, and duplicate region targets as errors.

### Fixes and additions

- Fix CommonJS and AMD loading, data event rebinding, and shared view configuration cleanup.
- Fix collection insertion and sort order, failed-render cleanup, region reuse, and route aliases.
- Add application shutdown, history options, and empty redirect targets.
- Update dependencies and commit a dependency lockfile.
- Add 30 tests, CI, dependency update checks, API documentation, and a task sample app.

See the [project review](docs/review.md) for validation results and the full compatibility notes.
