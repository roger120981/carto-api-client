import {FilterType} from './constants.js';
import type {Filter} from './types.js';
import {isEmptyObject} from './utils.js';

const FILTER_TYPES = new Set(Object.values(FilterType));
const isFilterType = (type: string): type is FilterType =>
  FILTER_TYPES.has(type as FilterType);

type FilterTypeOptions<T extends FilterType> = {
  type: T;
  column: string;
} & Filter[T];

export type AddFilterOptions =
  | FilterTypeOptions<FilterType.IN>
  | FilterTypeOptions<FilterType.BETWEEN>
  | FilterTypeOptions<FilterType.CLOSED_OPEN>
  | FilterTypeOptions<FilterType.TIME>
  | FilterTypeOptions<FilterType.STRING_SEARCH>;

/**
 * Adds a {@link Filter} to the filter set. Any previous filters with the same
 * `column` and `type` will be replaced.
 */
export function addFilter(
  filters: Record<string, Filter>,
  {column, type, values, owner}: AddFilterOptions
): Record<string, Filter> {
  if (!filters[column]) {
    filters[column] = {};
  }

  const filter = {values, owner} as FilterTypeOptions<typeof type>;
  (filters[column][type] as FilterTypeOptions<typeof type>) = filter;

  return filters;
}

export type RemoveFilterOptions = {
  column: string;
  owner?: string;
};

/**
 * Removes one or more {@link Filter filters} from the filter set. If only
 * `column` is specified, then all filters on that column are removed. If both
 * `column` and `owner` are specified, then only filters for that column
 * associated with the owner are removed.
 */
export function removeFilter(
  filters: Record<string, Filter>,
  {column, owner}: RemoveFilterOptions
): Record<string, Filter> {
  const filter = filters[column];
  if (!filter) {
    return filters;
  }

  if (owner) {
    for (const type of FILTER_TYPES) {
      if (owner === filter[type as FilterType]?.owner) {
        delete filter[type as FilterType];
      }
    }
  }

  if (!owner || isEmptyObject(filter)) {
    delete filters[column];
  }

  return filters;
}

/**
 * Clears all {@link Filter filters} from the filter set.
 */
export function clearFilters(
  filters: Record<string, Filter>
): Record<string, Filter> {
  for (const column of Object.keys(filters)) {
    delete filters[column];
  }
  return filters;
}

export type HasFilterOptions = {
  column: string;
  owner?: string;
};

export function hasFilter(
  filters: Record<string, Filter>,
  {column, owner}: HasFilterOptions
): boolean {
  const filter = filters[column];
  if (!filter) {
    return false;
  }

  if (!owner) {
    return true;
  }

  for (const type of FILTER_TYPES) {
    if (owner === filter[type as FilterType]?.owner) {
      return true;
    }
  }

  return false;
}

export type GetFilterOptions<T extends FilterType> = {
  column: string;
  type: T;
  owner?: string;
};

export function getFilter<T extends FilterType>(
  filters: Record<string, Filter>,
  {column, type, owner}: GetFilterOptions<T>
): Filter[T] | null {
  const filter = filters[column];
  if (!filter) {
    return null;
  }

  if (!owner || owner === filter[type]?.owner) {
    return filter[type] || null;
  }

  return null;
}

/**
 * Given all filters for a dataset, returns the subset of filters that are not
 * attributable to the given owner. Typically used to allow filterable widgets
 * to affect other widgets *without* filtering themselves.
 *
 * @privateRemarks Source: @carto/react-widgets
 */
export function getApplicableFilters(
  owner?: string,
  filters?: Record<string, Filter>
): Record<string, Filter> {
  if (!filters) return {};

  const applicableFilters: Record<string, Filter> = {};

  for (const column in filters) {
    for (const type in filters[column]) {
      if (!isFilterType(type)) continue;

      const filter = filters[column][type];
      const isApplicable = !owner || !filter?.owner || filter?.owner !== owner;
      if (filter && isApplicable) {
        applicableFilters[column] ||= {};
        (applicableFilters[column][type] as typeof filter) = filter;
      }
    }
  }

  return applicableFilters;
}
