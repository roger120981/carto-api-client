import type {
  SpatialFilterPolyfillMode,
  TileResolution,
} from '../sources/types.js';
import type {
  Filters,
  GroupDateType,
  SortColumnType,
  SortDirection,
  SpatialFilter,
} from '../types.js';

/******************************************************************************
 * WIDGET API REQUESTS
 */

export interface ViewState {
  zoom: number;
  latitude: number;
  longitude: number;
}

/** Common options for {@link WidgetRemoteSource} requests. */
export interface BaseRequestOptions {
  signal?: AbortSignal;
  spatialFilter?: SpatialFilter;
  spatialFiltersMode?: SpatialFilterPolyfillMode;
  /** Overrides source filters, if any. */
  filters?: Filters;
  filterOwner?: string;
}

/** Options for {@link WidgetRemoteSource#getCategories}. */
export interface CategoryRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  operationColumn?: string;
  /** Local only. */
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/**
 * Options for {@link WidgetRemoteSource#getFeatures}.
 * @experimental
 * @internal
 */
export interface FeaturesRequestOptions extends BaseRequestOptions {
  /**
   * Feature IDs, as found in `_carto_feature_id`. Feature IDs are a hash
   * of geometry, and features with identical geometry will have the same
   * feature ID. Order is important; features in the result set will be
   * sorted according to the order of IDs in the request.
   */
  featureIds: string[];

  /**
   * Columns to be returned for each picked object. Note that for datasets
   * containing features with identical geometry, more than one result per
   * requested feature ID may be returned. To match results back to the
   * requested feature ID, include `_carto_feature_id` in the columns list.
   */
  columns: string[];

  /** Topology of objects to be picked. */
  dataType: 'points' | 'lines' | 'polygons';

  /** Zoom level, required if using 'points' data type. */
  z?: number;

  /**
   * Maximum number of objects to return in the result set. For datasets
   * containing features with identical geometry, those features will have
   * the same feature IDs, and so more results may be returned than feature IDs
   * given in the request.
   */
  limit?: number;

  /**
   * Must match `tileResolution` used when obtaining the `_carto_feature_id`
   * column, typically in a layer's tile requests.
   */
  tileResolution?: TileResolution;
}

/** Options for {@link WidgetRemoteSource#getFormula}. */
export interface FormulaRequestOptions extends BaseRequestOptions {
  column: string;
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum' | 'custom';
  operationExp?: string;
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetRemoteSource#getHistogram}. */
export interface HistogramRequestOptions extends BaseRequestOptions {
  column: string;
  ticks: number[];
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  /** Local only. */
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetRemoteSource#getRange}. */
export interface RangeRequestOptions extends BaseRequestOptions {
  column: string;
}

/** Options for {@link WidgetRemoteSource#getScatter}. */
export interface ScatterRequestOptions extends BaseRequestOptions {
  xAxisColumn: string;
  xAxisJoinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  yAxisColumn: string;
  yAxisJoinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
}

/** Options for {@link WidgetRemoteSource#getTable}. */
export interface TableRequestOptions extends BaseRequestOptions {
  columns: string[];
  sortBy?: string;
  sortDirection?: SortDirection;
  sortByColumnType?: SortColumnType;
  offset?: number;
  limit?: number;
  /** @deprecated Supported for tilesets only. Prefer `filters` (for all sources) instead. */
  searchFilterColumn?: string;
  /** @deprecated Supported for tilesets only. Prefer `filters` (for all sources) instead. */
  searchFilterText?: string;
}

/** Options for {@link WidgetRemoteSource#getTimeSeries}. */
export interface TimeSeriesRequestOptions extends BaseRequestOptions {
  column: string;
  stepSize: GroupDateType;
  stepMultiplier?: number;
  operation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  operationColumn?: string;
  joinOperation?: 'count' | 'avg' | 'min' | 'max' | 'sum';
  splitByCategory?: string;
  splitByCategoryLimit?: number;
  splitByCategoryValues?: string[];
}

/******************************************************************************
 * WIDGET API RESPONSES
 */

/**
 * Response from {@link WidgetRemoteSource#getFeatures}.
 * @experimental
 * @internal
 */
export type FeaturesResponse = {rows: Record<string, unknown>[]};

/** Response from {@link WidgetRemoteSource#getFormula}. */
export type FormulaResponse = {value: number | null};

/** Response from {@link WidgetRemoteSource#getCategories}. */
export type CategoryResponse = {name: string; value: number}[];

/** Response from {@link WidgetRemoteSource#getRange}. */
export type RangeResponse = {min: number; max: number} | null;

/** Response from {@link WidgetRemoteSource#getTable}. */
export type TableResponse = {
  totalCount: number;
  rows: Record<string, number | string>[];
};

/** Response from {@link WidgetRemoteSource#getScatter}. */
export type ScatterResponse = [number, number][];

/** Response from {@link WidgetRemoteSource#getTimeSeries}. */
export type TimeSeriesResponse = {
  rows: {name: string; value: number}[];
  categories?: string[];
};

/** Response from {@link WidgetRemoteSource#getHistogram}. */
export type HistogramResponse = number[];
