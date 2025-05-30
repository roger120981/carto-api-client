# CHANGELOG

## 0.5

### 0.5.2

- feat(filters): Export getApplicableFilters (#162)
- fix(fetchmap): Bug fixes (#161, #163)
- fix(widgets): Fix error computing min/max for large datasets (#164)
- chore(build): Improve package compatibility (#158, #160)

### 0.5.1

- chore(types): Cleanup for tilesets, rasters, and backward-compatibility (#150)
- feat(fetchMap): Export legendSettings (#153)

### 0.5.0

- BREAKING CHANGE: Replace 'abortController' with 'signal' parameter (#110)
- feat: Add widget calculations for tileset sources (#50)
- feat: Add widget calculations for raster sources (#119)
- feat: Enable Web Workers for local tileset and raster widget calculations (#119)

## 0.4

### 0.4.10

- feat: Add fetchMap() (#126, #132, #133, #135, #136, #137, #138, #139)
- chore(widgets,deps): Clean up dataResolution references, examples, deps (#134)

### 0.4.9

- feat: Remove spatialIndexReferenceViewState param (#128)

### 0.4.8

- fix: Fix clientId defaults in query and source calls (#122)

### 0.4.7

- fix: Fix clientId customization in table and query widget calls (#120)
- feat: Add getDataFilterExtensionProps (#105, #113)
- feat: Add option to override HTTP headers in widget calls (#100, #111)
- feat: Add filters parameter in widget calls (#103)
- chore: Update to turf.js v7.2 (#98)
- chore: Enable compatibility with moduleResolution=nodenext (#106)

### 0.4.6

- chore: Add repository and homepage in npm package metadata

### 0.4.5

- types: Export TileResolution and SpatialFilterPolyfillMode types (#63)
- fix: Propagate spatialDataColumn and tileResolution defaults to widget source (#64)

### 0.4.4

- feat: Add support for spatial index types (H3, quadbin) in Widget APIs

### 0.4.3

- feat: Add support for`aggregationExp` parameter to `vectorQuerySource` and `vectorTableSource`

### 0.4.2

- fix: Fix incorrect column name lowercasing in Picking Model API

### 0.4.1

- feat: Add cache control mechanism for sources and query APIs

### 0.4.0

- feat: Add Picking Model API
- refactor: Migrate sources from `@deck.gl/carto` to `@carto/api-client`
- deps: Remove `@deck.gl/carto` bundled dependency

## 0.3

### 0.3.0

- deps: Add `@deck.gl/carto` as dependency

## 0.2

### 0.2.0

- feat: Initial release
