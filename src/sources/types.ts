// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Filters, SchemaField, QueryParameters} from '../types.js';
import type {RasterBandColorinterp} from './constants.js';

export type SourceRequiredOptions = {
  /** Carto platform access token. */
  accessToken: string;

  /** Data warehouse connection name in Carto platform. */
  connectionName: string;
};

export type SourceOptionalOptions = {
  /**
   * Base URL of the CARTO Maps API.
   *
   * Example for account located in EU-west region: `https://gcp-eu-west1.api.carto.com`
   *
   * @default https://gcp-us-east1.api.carto.com
   */
  apiBaseUrl: string;

  /**
   * Custom HTTP headers added to map instantiation and data requests.
   */
  headers: Record<string, string>;

  /**
   * Cache buster value returned by map instantiation.
   *
   * Carto source saves `cache` value of map instantiation response in `cache.value`, so it can be used to
   * check if underlying map data has changed between distinct source requests.
   */
  cache?: {value?: number};

  clientId: string;

  /**
   * Maximum URL character length. Above this limit, requests use POST.
   * Used to avoid browser and CDN limits.
   * @default {@link DEFAULT_MAX_LENGTH_URL}
   */
  maxLengthURL?: number;

  /**
   * The column name and the type of geospatial support.
   *
   * If not present, defaults to `'geom'` for generic queries, `'quadbin'` for Quadbin sources and `'h3'` for H3 sources.
   */
  spatialDataColumn?: string;

  /**
   * The type of geospatial support. Defaults to `'geo'`.
   */
  spatialDataType?: SpatialDataType;

  /**
   * Relative resolution of a tile. Higher values increase density and data size. At `tileResolution = 1`, tile geometry is
   * quantized to a 1024x1024 grid. Increasing or decreasing the resolution will increase or decrease the dimensions of
   * the quantization grid proportionately.
   *
   * Supported `tileResolution` values, with corresponding grid sizes:
   *
   * - 0.25: 256x256
   * - 0.5: 512x512
   * - 1: 1024x1024
   * - 2: 2048x2048
   * - 4: 4096x4096
   */
  tileResolution?: TileResolution;

  /**
   * By default, local in-memory caching is enabled.
   */
  localCache?: LocalCacheOptions;

  /** Additional tags appended to HTTP requests, available for analytics and audits. */
  tags?: Record<string, string>;
};

export type LocalCacheOptions = {
  /**
   * Map that stores requests and their responses.
   */
  cache?: Map<string, Promise<unknown>>;

  /**
   * Cache control
   *  * `no-cache`: If present, the source will always fetch from original source.
   *  * `no-store`: If present, source will not store result in cache (for later reuse).
   *
   * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#directives
   */
  cacheControl?: ('no-cache' | 'no-store')[];
};

export type SourceOptions = SourceRequiredOptions &
  Partial<SourceOptionalOptions>;

export type AggregationOptions = {
  /**
   * Defines the aggregation expressions that will be calculated from the resulting columns on each grid cell.
   *
   * Example:
   *
   *     sum(pop) as total_population, avg(rev) as average_revenue
   */
  aggregationExp: string;

  /**
   * Defines the tile aggregation resolution.
   *
   * @default 6 for quadbin and 4 for h3 sources
   */
  aggregationResLevel?: number;
};

export type FilterOptions = {
  /**
   * Filters to apply to the data source on the server
   */
  filters?: Filters;
};

export type QuerySourceOptions = {
  /** Full SQL query with query paremeter placeholders (if any). */
  sqlQuery: string;

  /**
   * Values for named or positional paramteres in the query.
   *
   * The way query parameters are determined by data warehouse.
   *
   *  * BigQuery has named query parameters, specified with a dictionary, and referenced by key (`@key`)
   *
   *     ```
   *     sqlQuery: "SELECT * FROM carto-demo-data.demo_tables.retail_stores WHERE storetype = ⁣@type AND revenue > ⁣@minRevenue"
   *     queryParameters: { type: 'Supermarket', minRevenue: 1000000 }
   *     ```
   * * Snowflake supports positional parameters, in the form `:1`, `:2`, etc.
   *
   *     ```
   *     sqlQuery: "SELECT * FROM demo_db.public.import_retail_stores WHERE storetype = :2 AND revenue > :1
   *     queryParameters: [100000, "Supermarket"]
   *     ```
   * * Postgres and Redhisft supports positional parameters, but in the form `$1`, `$2`, etc.
   *
   *     ```
   *     sqlQuery: "SELECT * FROM carto_demo_data.demo_tables.retail_stores WHERE storetype = $2 AND revenue > $1
   *     queryParameters: [100000, "Supermarket"]
   *     ```
   */
  queryParameters?: QueryParameters;

  /**
   * Comma-separated aggregation expressions. If assigned on a vector source, source is grouped by geometry and then aggregated.
   *
   * Example:
   *
   *     1 as value, avg(rev) as average_revenue
   */
  aggregationExp?: string;
};

export type TableSourceOptions = {
  /**
   * Fully qualified name of table.
   */
  tableName: string;

  /**
   * Comma-separated aggregation expressions. If assigned on a vector source, source is grouped by geometry and then aggregated.
   *
   * Example:
   *
   *     1 as value, avg(rev) as average_revenue
   */
  aggregationExp?: string;
};

export type TilesetSourceOptions = {
  /**
   * Fully qualified name of tileset.
   */
  tableName: string;

  /**
   * Whether to use Web Workers for local widget calculations. Workers
   * are used by default if the runtime environment supports ES Module Workers.
   */
  widgetWorker?: boolean;

  /**
   * Script URL used to create Web Workers for local widget calculations. In
   * most cases a custom URL is not needed; bundlers will resolve the worker
   * URL from a `@carto/api-client/worker` import internally. Advanced uses
   * may require deploying the script manually and providing a custom URL.
   */
  widgetWorkerUrl?: string;
};

export type ColumnsOption = {
  /**
   * Columns to retrieve from the table.
   *
   * If not present, all columns are returned.
   */
  columns?: string[];
};

export type SpatialDataType = 'geo' | 'h3' | 'quadbin';

/**
 * Strategy used for covering spatial filter geometry with spatial indexes.
 * See https://docs.carto.com/data-and-analysis/analytics-toolbox-for-bigquery/sql-reference/quadbin#quadbin_polyfill_mode
 * or https://docs.carto.com/data-and-analysis/analytics-toolbox-for-bigquery/sql-reference/h3#h3_polyfill_mode for more information.
 * @privateRemarks Source: cloud-native maps-api
 * */
export type SpatialFilterPolyfillMode = 'center' | 'intersects' | 'contains';

export type TilejsonMapInstantiation = {
  nrows: number;
  size?: number;
  schema: SchemaField[];
  tilejson: {url: string[]};
};

export type TileResolution = 0.25 | 0.5 | 1 | 2 | 4;

export interface Tilejson {
  tilejson: string;
  name: string;
  description: string;
  version: string;
  attribution: string;
  scheme: string;
  tiles: string[];
  minzoom: number;
  maxzoom: number;
  bounds: [left: number, bottom: number, right: number, top: number];
  center: [longitude: number, latitude: number, zoom: number];
  vector_layers: VectorLayer[];

  //
  // Carto additions over standard Tilejson properties
  //

  minresolution: number;
  maxresolution: number;
  properties_tiles: string[];
  tilestats: Tilestats;
  tileResolution?: TileResolution;

  /**
   * Resolution of data in spatial-index dataset (e.g. H3, Quadbin).
   *
   * @internal
   */
  dataresolution?: number;

  /**
   * Array of ratios of dropped features per zoom level.
   *
   * Example: `[0,0,0.5]` - means that 50% of features are dropped at zoom 2 and bigger.
   *
   * @internal
   */
  fraction_dropped_per_zoom?: number[];

  /**
   * Names of bands - rasters only.
   *
   * @internal
   */
  raster_bands?: string[];

  /**
   * Raster metadata - rasters only.
   *
   * @internal
   */
  raster_metadata?: RasterMetadata;
}

export interface Tilestats {
  layerCount: number;
  layers: Layer[];
}

export interface Layer {
  layer: string;
  count: number;
  attributeCount: number;
  attributes: Attribute[];
}

export interface Attribute {
  attribute: string;
  type: string;
}

export interface VectorLayer {
  // tilejson standard
  id: string;
  minzoom: number;
  maxzoom: number;
  fields: Record<string, string>;

  // Carto additions over standard Tilejson properties
  geometry_type?: string;
}

export type RasterMetadataBandStats = {
  approximated_stats?: boolean;
  min: number;
  max: number;
  mean: number;
  stddev: number;
  sum: number;
  sum_squares: number;
  count: number;

  /**
   * Quantiles by number of buckets.
   *
   * Example:
   * ```ts
   *   {
   *     // for 3 buckets, first 1/3 of items lies in range [min, 20], second 1/3 is in [20, 40], and last 1/3 is in [40, max]
   *     3: [20, 40],
   *     4: [20, 30, 50], for 4 buckets ...
   *   }
   * ```
   */
  quantiles?: Record<number, number[]>;

  /**
   * Top values by number of values.
   *
   * Key of dictionary is value, value is count.
   * Key order is random.
   *
   * Example:
   * ```
   *  {
   *    3: 5, // means there are 5 pixels with value 3
   *    11: 222,
   *    12: 333, // means that 12 is most common value with count 333
   *    ...      // (assuming 333 was largest value in dict)
   *   }
   * ```
   */
  top_values?: Record<number, number>;

  /**
   * Raster loader version.
   */
  version?: string;
};

export type RasterBandType =
  | 'uint8'
  | 'int8'
  | 'uint16'
  | 'int16'
  | 'uint32'
  | 'int32'
  | 'uint64'
  | 'int64'
  | 'float32'
  | 'float64';

export type RasterMetadataBand = {
  type: RasterBandType;
  name: string;
  stats: RasterMetadataBandStats;

  /**
   * Optional table of mappings from (integer) band values to (string) human
   * readable labels. Values found in tiles are NOT guaranteed to have labels.
   */
  valuelabels?: Record<string, string>;

  /**
   * Known values:
   *  * `palette`: use unique value and `colortable` ad default mapping
   *  * `red`, `green`, `blue`: use the band as color channel
   *  * `gray`: use the band as grayscale
   */
  colorinterp?: string | RasterBandColorinterp; // use RasterBandColorinterp, but it's external value, so let's use string

  /**
   * Default color mapping for unique values (or if coloprinterp is `palette`)
   */
  colortable?: Record<string, [number, number, number, number]>;

  /**
   * No value representation.
   * Observed values:
   *   * `'nan'` for `NaN`
   *   * `number`: both as string as number, so parsing is needed
   */
  nodata: string | number; // 255, '0', 'nan'
};

export type RasterMetadata = {
  block_resolution: number;
  minresolution: number;
  maxresolution: number;
  /** @deprecated Use {@link RasterMetadataBand.nodata} from {@link RasterMetadata.bands}. */
  nodata: number | string;
  bands: RasterMetadataBand[];
  bounds: [left: number, bottom: number, right: number, top: number];
  center: [longitude: number, latitude: number, zoom: number];
  width: number;
  height: number;
  block_width: number;
  block_height: number;
  num_blocks: number;
  num_pixels: number;
  pixel_resolution: number;
};

export type TilejsonResult = Tilejson & {
  accessToken: string;
  schema: SchemaField[];
};

export type QueryResult = {
  meta: {cacheHit: boolean; location: string; totalBytesProcessed: string};
  rows: Record<string, any>[];
  schema: {name: string; type: string}[];
};
