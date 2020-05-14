import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Map, View } from 'ol';
import Feature, { FeatureLike } from 'ol/Feature';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import GeoJSON from 'ol/format/GeoJSON';
import colormap from 'colormap';
import { ApiService } from './api.service';
import Geometry from 'ol/geom/Geometry';
import { asArray } from 'ol/color';
import { getWidth, getHeight } from 'ol/extent'
import Text from 'ol/style/Text';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'amerifacts'
  attributes: string[]
  attribute = 'Population'
  resolutions = ['State', 'Congressional District', 'County']
  resolution = this.resolutions[0]
  features: Feature[]
  map: Map
  mapElement: HTMLElement
  showTooltip = false
  tooltipText: { name: string, value: string }
  mouse: { x: number, y: number }
  tooltipWidth: number
  selectedFeature: Feature
  values: any[]
  tableValues: any[]
  filters: string[]
  currentItem
  names: any[]
  colors = { min: '#ff0000', max: '#0000ff' }
  bounds: { min: number, max: number }
  window = { width: window.innerWidth, height: window.innerHeight }
  showDetails = false
  showInfo: boolean

  @ViewChild('detailsBtn') detailsBtn: ElementRef<HTMLElement>

  constructor(private apiService: ApiService) { }

  async ngOnInit() {
    document.body.style.overflow = 'hidden'

    this.features = await this.getFeatures(this.resolution, this.attribute)
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          preload: Infinity,
          source: new OSM()
        }),
        new VectorLayer({
          source: new VectorSource({ features: this.features }),
          style: feature => this.getStyle(feature, false)
        })
      ],
      view: new View({
        center: fromLonLat(([-95, 38])),
        zoom: 5
      })
    })
    this.map.setSize([window.innerWidth, window.innerHeight - 108])

    var hovered
    this.map.on('pointermove', evt => {
      if (hovered != null) {
        hovered.setStyle(null)
        hovered = null
        this.showTooltip = false
      }

      if (this.selectedFeature)
        this.selectedFeature.setStyle(this.getStyle(this.selectedFeature, false))

      this.map.forEachFeatureAtPixel(evt.pixel, featLike => {
        hovered = <Feature<Geometry>>featLike
        hovered.setStyle(this.getStyle(hovered, true))
        var item = this.values.find(item => this.getShortenedId(item) == hovered.get('GEOID'))
        if (item) {
          let tooltipValue = this.apiService.formatValue(item[this.attribute]?.N,
            this.attribute.includes('Income'))
          this.tooltipText = { name: item.Name.S, value: tooltipValue }
          this.showTooltip = true
        }
        return true
      })
    })

    this.map.on('click', evt => {
      this.map.forEachFeatureAtPixel(evt.pixel, featureLike => {
        this.selectFeature(<Feature<Geometry>>featureLike)
        return true
      })
    })

    this.map.getViewport().addEventListener('mouseout', () => {
      this.showTooltip = false
    })
  }

  getShortenedId(item) {
    var idLen
    switch (this.resolution) {
      case 'State':
        idLen = 2
        break
      case 'County':
        idLen = 5
        break
      case 'Congressional District':
        idLen = 4
    }
    return item.ID.S.slice(-idLen)
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouse = { x: event.clientX, y: event.clientY }
    this.tooltipWidth = +document.getElementById('tooltip').offsetWidth
  }

  async updateTableValues(filters?: string[]) {
    if (filters)
      this.filters = filters
    this.tableValues = (await this.apiService.getAttrValues(this.resolution, this.attribute, this.filters))
  }

  async getFeatures(resolution: string, attribute: string, isNewRes?: boolean) {
    this.values = (await this.apiService.getAttrValues(resolution, attribute))
      .sort((item1, item2) => item1.Name.S.localeCompare(item2.Name.S))
    this.updateTableValues()
    if (!this.names) {
      this.attributes = Object.keys(
        (await this.apiService.getFeatValues(this.resolution, this.values[0].ID.S))[0])
        .filter(attr => !['ID', 'Name'].includes(attr))
      this.names = await this.apiService.getNames()
    }
    var valueNums = this.values.map(item => +item[this.attribute].N)
    this.bounds = { min: Math.min(...valueNums), max: Math.max(...valueNums)}

    var features
    if (this.features && !isNewRes)
      features = this.features
    else {
      features = new GeoJSON().readFeatures(await this.apiService.getShapes(resolution),
        { featureProjection: 'EPSG:3857' })
    }
    return features.map(feature => {
      var item = this.values.find(item => this.getShortenedId(item) == feature.get('GEOID'))
      if (!item)
        return null
      feature.set(attribute, +item[this.attribute].N)
      feature.setStyle(this.getStyle(feature, false))
      return feature
    }).filter(feature => feature)
  }

  hexToArray(hex: string) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5), 16)]
  }

  getColor(feature: FeatureLike, attribute: string) {
    var allColors = colormap({
      colormap: [
        {index: 0, rgb: this.hexToArray(this.colors.min)},
        {index: 1, rgb: this.hexToArray(this.colors.max)}
      ],
      format: 'rgbaString',
      alpha: .5
    })
    return allColors[~~((feature.get(attribute) - this.bounds.min)
      * (allColors.length - 1) / (this.bounds.max - this.bounds.min))]
  }

  getStyle(feature: FeatureLike, hovered: boolean) {
    var selected = feature == this.selectedFeature
    var fillColor = this.getColor(feature, this.attribute)
    if (hovered)
      fillColor = asArray(fillColor).slice(0, 3).map(value => value += 50).concat([.5])
    var order = this.tableValues.findIndex(item => this.getShortenedId(item) == feature.get('GEOID')) + 1

    return new Style({
      stroke: new Stroke({
        color: selected ? '#fff' : '#8888',
        width: selected ? 4 : 2
      }),
      fill: new Fill({ color: fillColor }),
      text: new Text({
        font: '20px Arial',
        fill: new Fill({ color: '#fff' }),
        stroke: new Stroke({
          color: '#000',
          width: 4
        }),
        text: (this.showDetails && !this.showInfo && order != 0) ? order.toString() : ''
      }),
      zIndex: selected ? 0 : -1
    })
  }

  async selectFeature(feature: Feature) {
    var geoId = this.values.find(item => this.getShortenedId(item) == feature.get('GEOID')).ID.S
    this.currentItem = (await this.apiService.getFeatValues(this.resolution, geoId))[0]

    this.selectedFeature = feature
    this.map.getView().setCenter(fromLonLat((
      [+feature.get('INTPTLON'), +feature.get('INTPTLAT')])))
    var extent = feature.getGeometry().getExtent()
    this.map.getView().setZoom(1 / (.15 * (Math.max(getWidth(extent), getHeight(extent)) / 100000) ** .24) + 3)

    this.showInfo = true
    if (!this.showDetails)
      this.detailsBtn.nativeElement.click()
    this.updateFeatStyles(true)
    this.showTooltip = false
  }

  selectAttribute(attribute: string, deselect?: boolean) {
    if (this.attribute != attribute) {
      this.attribute = attribute
      this.getFeatures(this.resolution, this.attribute).then(features => {
        this.features = features
        if (deselect) {
          this.values.sort((item1, item2) => item2[this.attribute].N - item1[this.attribute].N)
          this.deselectFeature()
        }
      })
    }
    else if (deselect)
      this.deselectFeature()
  }

  async selectResolution(resolution: string) {
    this.resolution = resolution
    this.features = await this.getFeatures(this.resolution, this.attribute, true)
    this.map.getLayers().item(1).set('source', new VectorSource({ features: this.features }))
  }

  search = (input: Observable<string>) =>
    input.pipe(
      map(input => input.length < 2 ? []
        : this.names.map(name => name.str).filter(name =>
            name.toLowerCase().includes(input.toLowerCase()))
              .sort((name1, name2) =>
                name1.length - name2.length || name1.localeCompare(name2)).slice(0, 10))
    )

  selectFeatFromQuery(query: string) {
    var item = typeof query == 'string' ? this.values.find(item => item.Name.S == query) : query
    if (item) {
      var feature = this.features.find(feature => feature.get('GEOID') == this.getShortenedId(item))
      this.selectFeature(feature)
    }
  }

  submitQuery(query: string) {
    var newResolution = this.names.find(name => name.str == query).resolution
    if (newResolution != this.resolution)
      this.selectResolution(newResolution).then(() => this.selectFeatFromQuery(query))
    else
      this.selectFeatFromQuery(query)
  }

  @HostListener('window:resize', ['$event'])
  resize() {
    this.window = { width: window.innerWidth, height: window.innerHeight }
  }

  toggleDetails() {
    this.showDetails = this.showDetails ? false : true
    if (!this.showInfo)
      this.updateFeatStyles(true)
    this.map.setSize([window.innerWidth - (this.showDetails ? 550 : 0), window.innerHeight - 108])
  }

  deselectFeature() {
    this.selectedFeature = null
    this.showInfo = false
    this.updateFeatStyles()
  }

  updateFeatStyles(selected?: boolean) {
    if (this.features) {
      this.features.forEach(feature => feature.setStyle(this.getStyle(feature,
        selected ? feature == this.selectedFeature : false)))
    }
  }
}
