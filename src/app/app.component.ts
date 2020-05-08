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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'amerifacts'
  attributes: string[]
  attribute = 'Population'
  resolution = 'State'
  features: Feature[]
  map: Map
  mapElement: HTMLElement
  showTooltip = false
  tooltipText: { name: string, value: string }
  mouse: { x: number, y: number }
  tooltipWidth: number
  selectedFeature: Feature
  values: any[]
  currentItem
  names: string[]
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

      this.map.forEachFeatureAtPixel(evt.pixel, featLike => {
        hovered = <Feature<Geometry>>featLike
        hovered.setStyle(this.getStyle(hovered, true))
        var item = this.values.find(item => item.ID.S.slice(-2) == hovered.get('GEOID'))
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

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouse = { x: event.clientX, y: event.clientY }
    this.tooltipWidth = +document.getElementById('tooltip').offsetWidth
  }

  async getFeatures(resolution: string, attribute: string) {
    this.values = (await this.apiService.getAttrValues(resolution, attribute))['Items']
      .sort((item1, item2) => item1.Name.S.localeCompare(item2.Name.S))
    this.attributes = Object.keys(
      (await this.apiService.getFeatValues(resolution, this.values[0].ID.S))['Items'][0])
      .filter(attr => !['ID', 'Name'].includes(attr))
    this.names = this.values.map(item => item.Name.S)
    var valueNums = this.values.map(item => +item[this.attribute].N)
    this.bounds = { min: Math.min(...valueNums), max: Math.max(...valueNums)}

    var features
    if (this.features)
      features = this.features
    else {
      features = new GeoJSON().readFeatures(await this.apiService.getShapes(resolution),
        { featureProjection: 'EPSG:3857' })
    }
    return features.map(feature => {
      var item = this.values.find(item => item.ID.S.slice(-2) == feature.get('GEOID'))
      if (!item)
        return null
      feature.set(attribute, +item[this.attribute].N)
      feature.setStyle(this.getStyle(feature, false))
      return feature
    }).filter(feature => feature)
  }

  getStyle(feature: FeatureLike, hovered: boolean) {
    var selected = feature == this.selectedFeature
    var fillColor = this.getColor(feature, this.attribute)
    if (hovered)
      fillColor = asArray(fillColor).slice(0, 3).map(value => value += 50).concat([0.5])

    return new Style({
      stroke: new Stroke({
        color: selected ? [255, 255, 255, 1] : [128, 128, 128, 0.5],
        width: selected ? 4 : 2
      }),
      fill: new Fill({
        color: fillColor
      }),
      zIndex: selected ? 0 : -1
    })
  }

  getColor(feature: FeatureLike, attribute: string) {
    var value = feature.get(attribute);
    if (isNaN(value))
      return [0, 0, 0, 0]
    else {
      let colors = colormap({
        colormap: 'cool', 'format': 'rgbaString', alpha: 0.5
      })
      return colors[~~((value - this.bounds.min) * (colors.length - 1) / (this.bounds.max - this.bounds.min))]
    }
  }

  async selectFeature(feature: Feature) {
    var geoId = this.values.find(item => item.ID.S.slice(-2) == feature.get('GEOID')).ID.S
    this.currentItem = (await this.apiService.getFeatValues(this.resolution, geoId))['Items'][0]

    this.selectedFeature = feature
    feature.setStyle(this.getStyle(feature, true))
    this.map.getView().setCenter(fromLonLat((
      [+feature.get('INTPTLON'), +feature.get('INTPTLAT')])))
    var extent = feature.getGeometry().getExtent()
    this.map.getView().setZoom(5 * 0.92 ** (Math.max(getWidth(extent), getHeight(extent)) / 100000) + 4.5)

    this.showInfo = true
    if (!this.showDetails)
      this.detailsBtn.nativeElement.click()
    this.showTooltip = false
  }

  selectAttribute(attribute: string, deselect?: boolean) {
    if (this.attribute != attribute) {
      this.attribute = attribute
      from(this.getFeatures(this.resolution, this.attribute)).subscribe(features => {
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

  search = (input: Observable<string>) =>
    input.pipe(
      map(input => input.length < 2 ? []
        : this.names.filter(name => name.toLowerCase().includes(input.toLowerCase())))
    )

  submit(query) {
    var item = typeof query == 'string' ? this.values.find(item => item.Name.S == query) : query
    if (item) {
      var feature = this.features.find(feature => feature.get('GEOID') == item.ID.S.slice(-2))
      this.selectFeature(feature)
    }
  }

  @HostListener('window:resize', ['$event'])
  resize() {
    this.window = { width: window.innerWidth, height: window.innerHeight }
  }

  toggleDetails() {
    this.showDetails = this.showDetails ? false : true
    this.map.setSize([window.innerWidth - (this.showDetails ? 550 : 0), window.innerHeight - 108])
  }

  deselectFeature() {
    var feature = this.selectedFeature
    this.selectedFeature = null
    feature.setStyle(this.getStyle(feature, false))
    this.showInfo = false
  }
}
