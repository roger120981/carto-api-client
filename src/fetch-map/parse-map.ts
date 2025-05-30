import type {ColorParameters} from '@luma.gl/core';
import {
  calculateClusterRadius,
  calculateClusterTextFontSize,
  getDefaultAggregationExpColumnAliasForLayerType,
  getLayerProps,
  getColorAccessor,
  getColorValueAccessor,
  getSizeAccessor,
  getTextAccessor,
  opacityToAlpha,
  getIconUrlAccessor,
  negateAccessor,
  getMaxMarkerSize,
  type LayerType,
  AGGREGATION,
  OPACITY_MAP,
  TEXT_NUMBER_FORMATTER,
  TEXT_LABEL_INDEX,
  TEXT_OUTLINE_OPACITY,
} from './layer-map.js';

import {assert, isEmptyObject} from '../utils.js';
import type {Filters} from '../types.js';
import type {
  KeplerMapConfig,
  MapLayerConfig,
  VisualChannels,
  VisConfig,
  MapConfigLayer,
  Dataset,
} from './types.js';
import {isRemoteCalculationSupported} from './utils.js';

export type LayerDescriptor = {
  type: LayerType;
  props: Record<string, any>;
  filters?: Filters;
};

export type ParseMapResult = {
  /** Map id. */
  id: string;

  /** Title of map. */
  title: string;

  /** Description of map. */
  description?: string;
  createdAt: string;
  updatedAt: string;
  initialViewState: any;

  /** @deprecated Use `basemap`. */
  mapStyle: any;
  popupSettings: any;
  token: string;

  layers: LayerDescriptor[];
};

export function parseMap(json: any) {
  const {keplerMapConfig, datasets, token} = json;
  assert(keplerMapConfig.version === 'v1', 'Only support Kepler v1');
  const config = keplerMapConfig.config as KeplerMapConfig;
  const {filters, mapState, mapStyle, popupSettings, legendSettings} = config;
  const {layers, layerBlending, interactionConfig} = config.visState;

  return {
    id: json.id,
    title: json.title,
    description: json.description,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    initialViewState: mapState,
    /** @deprecated Use `basemap`. */
    mapStyle,
    popupSettings,
    legendSettings,
    token,
    layers: layers
      .reverse()
      .map(({id, type, config, visualChannels}: MapConfigLayer) => {
        try {
          const {dataId} = config;
          const dataset: Dataset | null = datasets.find(
            (d: any) => d.id === dataId
          );
          assert(dataset, `No dataset matching dataId: ${dataId}`);
          const {data} = dataset;
          assert(data, `No data loaded for dataId: ${dataId}`);

          const {propMap, defaultProps} = getLayerProps(type, config, dataset);

          const styleProps = createStyleProps(config, propMap);

          const layer: LayerDescriptor = {
            type,
            filters:
              isEmptyObject(filters) || isRemoteCalculationSupported(dataset)
                ? undefined
                : filters[dataId],
            props: {
              id,
              data,
              ...defaultProps,
              ...createInteractionProps(interactionConfig),
              ...styleProps,
              ...createChannelProps(
                id,
                type,
                config,
                visualChannels,
                data,
                dataset
              ), // Must come after style
              ...createParametersProp(
                layerBlending,
                styleProps.parameters || {}
              ), // Must come after style
              ...createLoadOptions(token),
            },
          };
          return layer;
        } catch (e: any) {
          console.error(e.message);
          return undefined;
        }
      }),
  };
}

function createParametersProp(
  layerBlending: string,
  parameters: ColorParameters
) {
  if (layerBlending === 'additive') {
    parameters.blendColorSrcFactor = parameters.blendAlphaSrcFactor =
      'src-alpha';
    parameters.blendColorDstFactor = parameters.blendAlphaDstFactor =
      'dst-alpha';
    parameters.blendColorOperation = parameters.blendAlphaOperation = 'add';
  } else if (layerBlending === 'subtractive') {
    parameters.blendColorSrcFactor = 'one';
    parameters.blendColorDstFactor = 'one-minus-dst-color';
    parameters.blendAlphaSrcFactor = 'src-alpha';
    parameters.blendAlphaDstFactor = 'dst-alpha';
    parameters.blendColorOperation = 'subtract';
    parameters.blendAlphaOperation = 'add';
  }

  return Object.keys(parameters).length ? {parameters} : {};
}

function createInteractionProps(interactionConfig: any) {
  const pickable = interactionConfig && interactionConfig.tooltip.enabled;
  return {
    autoHighlight: pickable,
    pickable,
  };
}

function mapProps(source: any, target: any, mapping: any) {
  for (const sourceKey in mapping) {
    const sourceValue = source[sourceKey];
    const targetKey = mapping[sourceKey];
    if (sourceValue === undefined) {
      continue;
    }
    if (typeof targetKey === 'string') {
      target[targetKey] = sourceValue;
    } else if (typeof targetKey === 'function') {
      const [key, value] = Object.entries(targetKey(sourceValue))[0];
      target[key] = value;
    } else if (typeof targetKey === 'object') {
      // Nested definition, recurse down one level (also handles arrays)
      mapProps(sourceValue, target, targetKey);
    }
  }
}

function createStyleProps(config: MapLayerConfig, mapping: any) {
  const result: Record<string, any> = {};
  mapProps(config, result, mapping);

  // Kepler format sometimes omits strokeColor. TODO: remove once we can rely on
  // `strokeColor` always being set when `stroke: true`.
  if (result.stroked && !result.getLineColor) {
    result.getLineColor = result.getFillColor;
  }

  for (const colorAccessor in OPACITY_MAP) {
    if (Array.isArray(result[colorAccessor])) {
      const color = [...result[colorAccessor]];
      const opacityKey = OPACITY_MAP[colorAccessor];
      const opacity = config.visConfig[opacityKey as keyof VisConfig];
      color[3] = opacityToAlpha(opacity);
      result[colorAccessor] = color;
    }
  }

  result.highlightColor = config.visConfig.enable3d
    ? [255, 255, 255, 60]
    : [252, 242, 26, 255];
  return result;
}

function createChannelProps(
  id: string,
  type: string,
  config: MapLayerConfig,
  visualChannels: VisualChannels,
  data: any,
  dataset: Dataset
) {
  const {
    colorField,
    colorScale,
    radiusField,
    radiusScale,
    sizeField,
    sizeScale,
    strokeColorField,
    strokeColorScale,
    weightField,
  } = visualChannels;
  let {heightField, heightScale} = visualChannels;
  if (type === 'hexagonId') {
    heightField = sizeField;
    heightScale = sizeScale;
  }
  const {textLabel, visConfig} = config;
  const result: Record<string, any> = {};

  if (type === 'grid' || type === 'hexagon') {
    result.colorScaleType = colorScale;
    if (colorField) {
      const {colorAggregation} = config.visConfig;
      if (!AGGREGATION[colorAggregation]) {
        result.getColorValue = getColorValueAccessor(
          colorField,
          colorAggregation,
          data
        );
      } else {
        result.getColorWeight = (d: any) => d[colorField.name];
      }
    }
  } else if (colorField) {
    const {colorAggregation: aggregation, colorRange: range} = visConfig;
    result.getFillColor = getColorAccessor(
      colorField,
      // @ts-ignore
      colorScale,
      {aggregation, range},
      visConfig.opacity,
      data
    );
  }

  if (type === 'point') {
    const altitude = config.columns?.altitude;
    if (altitude) {
      result.dataTransform = (data: any) => {
        data.features.forEach(
          ({geometry, properties}: {geometry: any; properties: any}) => {
            const {type, coordinates} = geometry;
            if (type === 'Point') {
              coordinates[2] = properties[altitude];
            }
          }
        );
        return data;
      };
    }
  }

  if (type === 'clusterTile') {
    const aggregationExpAlias = getDefaultAggregationExpColumnAliasForLayerType(
      type,
      dataset.providerId,
      data.schema
    );

    result.pointType = visConfig.isTextVisible ? 'circle+text' : 'circle';
    result.clusterLevel = visConfig.clusterLevel;

    result.getWeight = (d: any) => {
      return d.properties[aggregationExpAlias];
    };

    result.getPointRadius = (d: any, info: any) => {
      return calculateClusterRadius(
        d.properties,
        info.data.attributes.stats,
        visConfig.radiusRange as [number, number],
        aggregationExpAlias
      );
    };

    result.textCharacterSet = 'auto';
    result.textFontFamily = 'Inter, sans';
    result.textFontSettings = {sdf: true};
    result.textFontWeight = 600;

    result.getText = (d: any) =>
      TEXT_NUMBER_FORMATTER.format(d.properties[aggregationExpAlias]);

    result.getTextColor = config.textLabel[TEXT_LABEL_INDEX].color;
    result.textOutlineColor = [
      ...(config.textLabel[TEXT_LABEL_INDEX].outlineColor as number[]),
      TEXT_OUTLINE_OPACITY,
    ];
    result.textOutlineWidth = 5;
    result.textSizeUnits = 'pixels';

    result.getTextSize = (d: any, info: any) => {
      const radius = calculateClusterRadius(
        d.properties,
        info.data.attributes.stats,
        visConfig.radiusRange as [number, number],
        aggregationExpAlias
      );
      return calculateClusterTextFontSize(radius);
    };
  }

  if (radiusField || sizeField) {
    result.getPointRadius = getSizeAccessor(
      // @ts-ignore
      radiusField || sizeField,
      // @ts-ignore
      radiusScale || sizeScale,
      visConfig.sizeAggregation,
      visConfig.radiusRange || visConfig.sizeRange,
      data
    );
  }

  if (strokeColorField) {
    const fallbackOpacity = type === 'point' ? visConfig.opacity : 1;
    const opacity =
      visConfig.strokeOpacity !== undefined
        ? visConfig.strokeOpacity
        : fallbackOpacity;
    const {strokeColorAggregation: aggregation, strokeColorRange: range} =
      visConfig;
    result.getLineColor = getColorAccessor(
      strokeColorField,
      // @ts-ignore
      strokeColorScale,
      // @ts-ignore
      {aggregation, range},
      opacity,
      data
    );
  }
  if (heightField && visConfig.enable3d) {
    result.getElevation = getSizeAccessor(
      heightField,
      // @ts-ignore
      heightScale,
      visConfig.heightAggregation,
      visConfig.heightRange || visConfig.sizeRange,
      data
    );
  }

  if (weightField) {
    result.getWeight = getSizeAccessor(
      weightField,
      undefined,
      visConfig.weightAggregation,
      undefined,
      data
    );
  }

  if (visConfig.customMarkers) {
    const maxIconSize = getMaxMarkerSize(visConfig, visualChannels);
    const {getPointRadius, getFillColor} = result;
    const {
      customMarkersUrl,
      customMarkersRange,
      filled: useMaskedIcons,
    } = visConfig;

    result.pointType = 'icon';
    result.getIcon = getIconUrlAccessor(
      visualChannels.customMarkersField,
      customMarkersRange,
      {fallbackUrl: customMarkersUrl, maxIconSize, useMaskedIcons},
      data
    );
    result._subLayerProps = {
      'points-icon': {
        loadOptions: {
          image: {
            type: 'imagebitmap',
          },
          imagebitmap: {
            resizeWidth: maxIconSize,
            resizeHeight: maxIconSize,
            resizeQuality: 'high',
          },
        },
      },
    };

    if (getFillColor && useMaskedIcons) {
      result.getIconColor = getFillColor;
    }

    if (getPointRadius) {
      result.getIconSize = getPointRadius;
    }

    if (visualChannels.rotationField) {
      result.getIconAngle = negateAccessor(
        getSizeAccessor(
          visualChannels.rotationField,
          undefined,
          null,
          undefined,
          data
        )
      );
    }
  } else if (type === 'point' || type === 'tileset') {
    result.pointType = 'circle';
  }

  if (textLabel && textLabel.length && textLabel[0].field) {
    const [mainLabel, secondaryLabel] = textLabel;
    const collisionGroup = id;

    ({
      alignment: result.getTextAlignmentBaseline,
      anchor: result.getTextAnchor,
      color: result.getTextColor,
      outlineColor: result.textOutlineColor,
      size: result.textSizeScale,
    } = mainLabel);
    const {
      color: getSecondaryColor,
      field: secondaryField,
      outlineColor: secondaryOutlineColor,
      size: secondarySizeScale,
    } = secondaryLabel || {};

    result.getText = mainLabel.field && getTextAccessor(mainLabel.field, data);
    const getSecondaryText =
      secondaryField && getTextAccessor(secondaryField, data);

    result.pointType = `${result.pointType}+text`;
    result.textCharacterSet = 'auto';
    result.textFontFamily = 'Inter, sans';
    result.textFontSettings = {sdf: true};
    result.textFontWeight = 600;
    result.textOutlineWidth = 3;

    result._subLayerProps = {
      ...result._subLayerProps,
      'points-text': {
        collisionEnabled: true,
        collisionGroup,

        // getPointRadius already has radiusScale baked in, so only pass one or the other
        ...(result.getPointRadius
          ? {getRadius: result.getPointRadius}
          : {radiusScale: visConfig.radius}),

        ...(secondaryField && {
          getSecondaryText,
          getSecondaryColor,
          secondarySizeScale,
          secondaryOutlineColor,
        }),
      },
    };
  }

  return result;
}

function createLoadOptions(accessToken: string) {
  return {
    loadOptions: {fetch: {headers: {Authorization: `Bearer ${accessToken}`}}},
  };
}
