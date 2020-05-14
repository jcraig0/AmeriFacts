import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  rootUrl = 'https://6x5mx57f76.execute-api.us-east-2.amazonaws.com/'
  values: any

  constructor(private http: HttpClient) { }

  async getAttrValues(resolution: string, attribute: string, filters?: string[]) {
    return (await this.http.post(this.rootUrl + 'attribute', {
      resolution: resolution.replace(' ', '_'),
      attribute: attribute,
      filters: filters ? filters : []
    }).toPromise())['Items']
  }

  async getFeatValues(resolution: string, featureId: string) {
    return (await this.http.post(this.rootUrl + 'feature', {
      resolution: resolution.replace(' ', '_'),
      featureId: featureId
    }).toPromise())['Items']
  }

  async getNames() {
    return (await this.http.get(this.rootUrl + 'names').toPromise())['names']
  }

  async getShapes(resolution: string) {
    return await this.http.get('assets/shapefiles/' + resolution + '.json').toPromise()
  }

  formatValue(value: string, attribute: string) {
    var currencyTerms = ['Household Income']
    var isCurrency = currencyTerms.some(term => attribute.includes(term))
    return (isCurrency ? '$' : '') + (+value).toLocaleString()
  }
}
