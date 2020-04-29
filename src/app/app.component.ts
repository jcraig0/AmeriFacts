import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Map, View } from 'ol';
import { FeatureLike } from 'ol/Feature';
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
  names: string[]
  bounds: { min: number, max: number }

  constructor(private apiService: ApiService) { }

  async ngOnInit() {
    new Map({
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
              stroke: new Stroke({
                color: [128, 128, 128, 0.5],
                width: 2
              }),
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
    });
  }

  async getFeatures(resolution: string, attribute: string) {
    var values = await this.apiService.getValues(resolution, attribute)
    this.names = values['Items'].map(item => item.Name.S)
    var valueNums = values['Items'].map(item => +item.Population.N)
    this.bounds = { min: Math.min(...valueNums), max: Math.max(...valueNums)}

    var shapes = await this.apiService.getShapes(resolution)
    return new GeoJSON().readFeatures(shapes, { featureProjection: 'EPSG:3857' })
      .map(feature => { 
        var val = +values['Items'].find(item => item.ID.S.slice(-2) == feature.get('GEOID'))?.Population.N
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
        : this.names.filter(state => state.toLowerCase().includes(input.toLowerCase())))
    )
}
