import { SlideDeck } from './slidedeck.js';

const SmoothRenderer = L.SVG.extend({
  // Override the default _onZoom function, which simply scales the lower
  // resolution shapes. Instead, we want to reproject the shapes at each new
  // zoom level, as is done by default when zooming ends.
  _onZoom: function () {
    this._onZoomEnd();
    this._update();
  }
});

const map = L.map('map', { renderer: new SmoothRenderer() }).setView([39.8283, -98.5795], 4);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// ## Interface Elements
const slides = document.querySelectorAll('.slide');
const slidePrevButton = document.querySelector('#prev-slide');
const slideNextButton = document.querySelector('#next-slide');
const slideSection = document.querySelector('.slide-section');

const slideOptions = {
  '01_philadelphia_boundary': {
    style: (feature) => ({
      color: 'teal',
      weight: 1,
      fillColor: '#0683834e',
    
    }),
  },
    '02_2010_census_tract_map': {
    style: (feature) => ({
      color: 'teal',
      weight: 2,
      fillColor: '#f9f4ebf8',
      fillOpacity: .6,
    }),
  },
  '03_Black_complainants': {
    pointToLayer: (feature, latLng) => {
      return L.circleMarker(latLng, {
        radius: 5.5, 
        color: 'white',
        weight: .5,
        fillColor: '#91087e',
        fillOpacity: 100,
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(feature.properties.label);
    },
  },
  '04_white_complainants': {
    pointToLayer: (feature, latLng) => {
      return L.circleMarker(latLng, {
        radius: 5.5,
        color: 'white',
        weight: .5,
        fillColor: '#5b03f3',
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(feature.properties.label);
    },
  },
  '05_Latino_complainants': {
    pointToLayer: (feature, latLng) => {
      return L.circleMarker(latLng, {
        radius: 5.5,
        color: 'white',
        weight: 1,
        fillColor: '#ffa200',
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(feature.properties.label);
    }
  },

  '06_Asian_complainants': {
    pointToLayer: (feature, latLng) => {
      return L.circleMarker(latLng, {
        radius: 5.5,
        color: 'white',
        weight: .5,
        fillColor: '#ff4500',
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(feature.properties.label);
    },
  },
};


// ## The SlideDeck object
const deck = new SlideDeck(slides, map, slideOptions);

slidePrevButton.addEventListener('click', () => deck.goPrevSlide());
slideNextButton.addEventListener('click', () => deck.goNextSlide());

deck.preloadFeatureCollections();
deck.showCurrentSlide();


