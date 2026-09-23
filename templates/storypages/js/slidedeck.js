/**
 * A slide deck object
 */
class SlideDeck {
  /**
   * Constructor for the SlideDeck object.
   * @param {NodeList} slides A list of HTML elements containing the slide text.
   * @param {L.map} map The Leaflet map where data will be shown.
   * @param {object} slideOptions The options to create each slide's L.geoJSON
   *                              layer, keyed by slide ID.
   */
constructor(slides, map, slideOptions = {}) {
  this.slides = slides;
  this.map = map;
  this.slideOptions = slideOptions;

  this.dataLayer = L.layerGroup().addTo(map);
  this.currentSlideIndex = 0;
  this.layers = {};
}  

  /**
   * ### updateDataLayer
   *
   * The updateDataLayer function will clear any markers or shapes previously
   * added to the GeoJSON layer on the map, and replace them with the data
   * provided in the `data` argument. The `data` should contain a GeoJSON
   * FeatureCollection object.
   *
   * @param {object} data A GeoJSON FeatureCollection object
   * @param {object} options Options to pass to L.geoJSON
   * @return {L.GeoJSONLayer} The new GeoJSON layer that has been added to the
   *                          data layer group.
   */
  syncMapToSlide(slide) {

}

  updateDataLayer(data, options = {}, slideId) {
    if (this.layers[slideId]) {
      this.dataLayer.removeLayer(this.layers[slideId]);
    }

    const defaultPointToLayer = (_, latlng) => L.marker(latlng);
    const defaultStyle = (feature) => feature.properties && feature.properties.style;
    const defaultOnEachFeature = (feature, layer) => {
      if (feature.properties && feature.properties.label) {
        layer.bindTooltip(feature.properties.label);
      }
    };

    const finalOptions = {
      pointToLayer: options.pointToLayer || defaultPointToLayer,
      style: options.style || defaultStyle,
      onEachFeature: (feature, layer) => {
        defaultOnEachFeature(feature, layer);
        if (options.onEachFeature) {
          options.onEachFeature(feature, layer);
        }
      }
    };

    const geoJsonLayer = L.geoJSON(data, finalOptions).addTo(this.dataLayer);

    this.layers[slideId] = geoJsonLayer;
    return geoJsonLayer;
  }
    /**
   * ### getSlideFeatureCollection
   *
   * Load the slide's features from a GeoJSON file.
   *
   * @param {HTMLElement} slide The slide's HTML element. The element id should match the key for the slide's GeoJSON file
   * @return {object} The FeatureCollection as loaded from the data file
   */
  async getSlideFeatureCollection(slide) {
    const resp = await fetch(`data/${slide.id}.json`);
    const data = await resp.json();
    return data;
  }

  /**
   * ### hideAllSlides
   *   *
   * @param {NodeList} slides The set of all slide elements, in order.
   */
  hideAllSlides() {
    for (const slide of this.slides) {
      slide.classList.add('hidden');
    }
  }

  /**
   * ### showSlide
   *
   * Go to the slide that mathces the specified ID.
   *
   * @param {HTMLElement} slide The slide's HTML element
   */
async showSlide(slide) {
    this.hideAllSlides(this.slides);
    slide.classList.remove('hidden');

    const slideArray = Array.from(this.slides);
    const targetIndex = slideArray.indexOf(slide);

    for (let i = targetIndex + 1; i < slideArray.length; i++) {
      const laterSlideId = slideArray[i].id;
      if (laterSlideId === 'title-slide') continue;
      if (this.layers[laterSlideId]) {
        this.dataLayer.removeLayer(this.layers[laterSlideId]);
        delete this.layers[laterSlideId];
      }
    }

   let layer;
    let currentCollection;
    for (let i = 0; i <= targetIndex; i++) {
      const s = slideArray[i];
      const collection = await this.getSlideFeatureCollection(s);
      const options = this.slideOptions[s.id];
      layer = this.updateDataLayer(collection, options, s.id);
      if (i === targetIndex) {
        currentCollection = collection;
      }
    }
for (let i = 0; i < targetIndex; i++) {
      const olderSlideId = slideArray[i].id;
      if (olderSlideId === 'intro-slide') continue;
      if (this.layers[olderSlideId]) {
        this.layers[olderSlideId].setStyle({ opacity: 0.1, fillOpacity: 0.1 });
      }
    }
    if (slide.id !== 'intro-slide' && this.layers[slide.id]) {
      this.layers[slide.id].setStyle({ opacity: 1, fillOpacity: 0.9 });
    }
    /**
     * Create a bounds object from a GeoJSON bbox array.
     * @param {Array} bbox The bounding box of the collection
     * @return {L.latLngBounds} The bounds object
     */
    const boundsFromBbox = (bbox) => {
      const [west, south, east, north] = bbox;
      const bounds = L.latLngBounds(
          L.latLng(south, west),
          L.latLng(north, east),
      );
      return bounds;
    };

    /**
     * Create a temporary event handler that will show tooltips on the map
     * features, after the map is done "flying" to contain the data layer.
     */
    const handleFlyEnd = () => {
      if (slide.showpopups) {
        layer.eachLayer((l) => {
          l.bindTooltip(l.feature.properties.label, { permanent: true });
          l.openTooltip();
        });
      }
      this.map.removeEventListener('moveend', handleFlyEnd);
    };

    this.map.addEventListener('moveend', handleFlyEnd);
    if (currentCollection.bbox) {
      this.map.flyToBounds(boundsFromBbox(currentCollection.bbox));
    } else {
      this.map.flyToBounds(layer.getBounds(), { paddingBottomRight: [300, 0] });
    }  }
  /**
   * Show the slide with ID matched by currentSlideIndex. If currentSlideIndex is
   * null, then show the first slide.
   */
  showCurrentSlide() {
    const slide = this.slides[this.currentSlideIndex];
    this.showSlide(slide);
  }

  /**
   * Increment the currentSlideIndex and show the corresponding slide. If the
   * current slide is the final slide, then the next is the first.
   */
  goNextSlide() {
    this.currentSlideIndex++;

    if (this.currentSlideIndex === this.slides.length) {
      this.currentSlideIndex = 0;
    }

    this.showCurrentSlide();
  }

  goPrevSlide() {
    this.currentSlideIndex--;

    if (this.currentSlideIndex < 0) {
      this.currentSlideIndex = this.slides.length - 1;
    }

    this.showCurrentSlide();
  }

  /**
   * ### preloadFeatureCollections   */
  preloadFeatureCollections() {
    for (const slide of this.slides) {
      this.getSlideFeatureCollection(slide);
    }
  }
}

export { SlideDeck };
