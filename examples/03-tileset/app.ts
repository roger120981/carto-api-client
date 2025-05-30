import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {VectorTileLayer} from '@deck.gl/carto';
import {
  TilejsonResult,
  WidgetTilesetSource,
  vectorTilesetSource,
} from '@carto/api-client';
import '../components/index.js';
import type {Widget} from '../components/index.js';

/**************************************************************************
 * REACTIVE STATE
 */

let data: TilejsonResult & {widgetSource: WidgetTilesetSource};
let viewState = {latitude: 40.7128, longitude: -74.006, zoom: 12};

/**************************************************************************
 * DECK.GL
 */

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: viewState,
  controller: true,
  layers: [],
});

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  interactive: false,
});

deck.setProps({
  onViewStateChange: (params) => {
    viewState = params.viewState;
    const {longitude, latitude, ...rest} = viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
    updateWidgets();
  },
});

const widgets: Widget[] = [
  bindWidget('#category'),
  bindWidget('#formula'),
  bindWidget('#histogram'),
  bindWidget('#pie'),
  bindWidget('#scatter'),
  bindWidget('#table'),
];

await updateSources();

/**************************************************************************
 * UPDATES
 */

async function updateSources() {
  if (data?.widgetSource) {
    data.widgetSource.destroy();
  }

  data = await vectorTilesetSource({
    tableName: 'cartodb-on-gcp-frontend-team.donmccurdy.retail_stores_tileset',
    accessToken:
      'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfNDd1dW5tZWciLCJqdGkiOiI1Njc2MDQ0NCJ9.p2_1ts1plciXMI3Pk0GJaHjhdZUd0lKITgdO9BaX2ho',
    connectionName: 'bqconn-front',
  });

  document.querySelector('#footer')!.innerHTML = data.attribution;

  updateLayers();
  updateWidgets();
}

function updateLayers() {
  const layer = new VectorTileLayer({
    id: 'retail_stores',
    data,
    pointRadiusMinPixels: 4,
    getFillColor: [200, 0, 80],
    onViewportLoad: (tiles) => {
      data.widgetSource.loadTiles(tiles);
      updateWidgets();
    },
  });

  deck.setProps({layers: [layer]});
}

function updateWidgets() {
  for (const widget of widgets) {
    widget.data = Promise.resolve(data);
    widget.viewState = viewState;
  }
}

/**************************************************************************
 * INITIALIZATION
 */

function bindWidget(selector: string): Widget {
  return document.querySelector<Widget>(selector)!;
}
