import { SlideDeck } from './slidedeck.js';

var map = L.map('map').setView([39.8283, -98.5795], 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// ## Interface Elements
const slides = document.querySelectorAll('.slide');
const slidePrevButton = document.querySelector('#prev-slide');
const slideNextButton = document.querySelector('#next-slide');
const slideSection = document.querySelector('.slide-section');

const slideOptions = {
  'title-slide': {
    style: (feature) => ({
      color: 'teal',
      weight: 1,
      fillColor: '#0683834e',
    
    }),
  },
    'intro-slide': {
    style: (feature) => ({
      color: 'teal',
      weight: 2,
      fillColor: '#f9f4ebf8',
      fillOpacity: .6,
    }),
  },
  'second-slide': {
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
  'third-slide': {
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
  'fourth-slide': {
    pointToLayer: (feature, latLng) => {
      return L.circleMarker(latLng, {
        radius: 5.5,
        color: 'white',
        weight: .5,
        fillColor: '#ffa200',
      });
    },
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(feature.properties.label);
    }
  },

  'fifth-slide': {
    pointToLayer: (feature, latLng) => {
      return L.circleMarker(latLng, {
        radius: 5.5,
        color: 'white',
        weight: .5,
        fillColor: '#ff4500',
        fillOpacity: 100,
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
