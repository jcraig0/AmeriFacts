import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'amerifacts'
  attributes = ['Population', 'Area']
  attribute = this.attributes[0]
  resolution = 'State'
  features: Feature[]
  map: Map
  selectedFeat: Feature
  values: any[]
  names: string[]
  bounds: { min: number, max: number }
  windowWidth = window.innerWidth
  windowHeight = window.innerHeight
  showDetails = false
  showInfo = false

  @ViewChild('detailsBtn') detailsBtn: ElementRef<HTMLElement>;

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
          source: new VectorSource({
            features: this.features
          }),
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
      }

      this.map.forEachFeatureAtPixel(evt.pixel, featLike => {
        hovered = <Feature<Geometry>>featLike
        hovered.setStyle(this.getStyle(hovered, true))
        return true
      })
    })

    this.map.on('click', evt => {
      this.map.forEachFeatureAtPixel(evt.pixel, featureLike => {
        this.selectFeature(<Feature<Geometry>>featureLike)
        return true
      })
    })
  }

  async getFeatures(resolution: string, attribute: string) {
    this.values = (await this.apiService.getValues(resolution, attribute))["Items"]
    this.values.sort((item1, item2) => item1.Name.S.localeCompare(item2.Name.S))
    this.names = this.values.map(item => item.Name.S)
    var valueNums = this.values.map(item => +item.Population.N)
    this.bounds = { min: Math.min(...valueNums), max: Math.max(...valueNums)}

    var shapes = await this.apiService.getShapes(resolution)
    return new GeoJSON().readFeatures(shapes, { featureProjection: 'EPSG:3857' })
      .map(feature => {
        var val = +this.values.find(item => item.ID.S.slice(-2) == feature.get('GEOID'))?.Population.N
        feature.set(attribute, val)
        return feature })
  }

  getStyle(feature: FeatureLike, hovered: boolean) {
    var selected = feature == this.selectedFeat
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
      })
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

  selectFeature(feature: Feature) {
    this.selectedFeat = feature
    feature.setStyle(this.getStyle(feature, true))
    this.map.getView().setCenter(fromLonLat((
      [+feature.get('INTPTLON'), +feature.get('INTPTLAT')])))
    this.map.getView().setZoom(7)

    if (!this.showDetails)
      this.detailsBtn.nativeElement.click()
    this.showInfo = true
  }

  selectAttribute(attribute: string) {
    this.attribute = attribute
  }

  search = (input: Observable<string>) =>
    input.pipe(
      map(input => input.length < 2 ? []
        : this.names.filter(name => name.toLowerCase().includes(input.toLowerCase())))
    )

  submit(query: string) {
    var geoId = this.values.find(item => item.Name.S == query)
    if (geoId) {
      var feature = this.features.find(feature => feature.get('GEOID') == geoId.ID.S.slice(-2))
      this.selectFeature(feature)
    }
  }

  @HostListener('window:resize', ['$event'])
  resize() {
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
  }

  toggleDetails() {
    this.showDetails = this.showDetails ? false : true
    this.map.setSize([window.innerWidth - (this.showDetails ? 500 : 0), window.innerHeight - 108])
  }
}
