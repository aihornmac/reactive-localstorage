# Changelog

## [1.0.1] - 2020-07-17
### Fixed
- failed to dispatch storage event to localStorage and sessionStorage

## [1.0.0] - 2020-07-17
### Added
- export `localStorage` and `sessionStorage`
- inject handlers on demand

### Fixed
- fix wrong behavior of `clear()`
- calling `getItem` on native Storage sets null as string
