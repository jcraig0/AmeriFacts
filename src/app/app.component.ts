import { Component, HostListener } from '@angular/core';
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
  values: any[]
  names: string[]
  bounds: { min: number, max: number }
  mapWidth = window.innerWidth
  mapHeight = window.innerHeight - 108
  showDetails = false

  constructor(private apiService: ApiService) { }

  async ngOnInit() {
    document.body.style.overflow = 'hidden'

    var border = new Stroke({
      color: [128, 128, 128, 0.5],
      width: 2
    })

    var map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        new VectorLayer({
          source: new VectorSource({
            features: await this.getFeatures(this.resolution, this.attribute)
          }),
          style: feature => {
            return new Style({
              stroke: border,
              fill: new Fill({
                color: this.getColor(feature, this.attribute)
              })
            })
          }
        })
      ],
      view: new View({
        center: fromLonLat(([-95, 38])),
        zoom: 5
      })
    })

    var hovered
    map.on('pointermove', evt => {
      if (hovered != null) {
        hovered.setStyle(null)
        hovered = null
      }

      map.forEachFeatureAtPixel(evt.pixel, f => {
        hovered = <Feature<Geometry>>f
        hovered.setStyle(new Style({
          stroke: border,
          fill: new Fill({
            color: asArray(this.getColor(hovered, this.attribute))
              .slice(0, 3).map(value => value += 50).concat([0.5])
          })
        }))
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

  getColor(feature: FeatureLike, attribute: string) {
    var value = feature.get(attribute);
    if (isNaN(value))
      return 'rgba(0, 0, 0, 0)'
    else {
      let colors = colormap({
        colormap: 'cool', 'format': 'rgbaString', alpha: 0.5
      })
      return colors[~~((value - this.bounds.min) * (colors.length - 1) / (this.bounds.max - this.bounds.min))]
    }
  }

  selectAttribute(attribute: string) {
    this.attribute = attribute
  }

  search = (input: Observable<string>) =>
    input.pipe(
      map(input => input.length < 2 ? []
        : this.names.filter(name => name.toLowerCase().includes(input.toLowerCase())))
    )

  @HostListener('window:resize', ['$event'])
  resize() {
    this.mapWidth = window.innerWidth
    this.mapHeight = window.innerHeight - 108
  }

  toggleDetails() {
    this.showDetails = this.showDetails ? false : true
  }
}
