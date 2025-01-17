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
      resolution: resolution,
      attribute: attribute,
      filters: filters ? filters : []
    }).toPromise())['Items'].filter(item => item[attribute])
  }

  async getFeatValues(resolution: string, featureId: string) {
    return (await this.http.get(this.rootUrl + 'feature', {params: {
      resolution: resolution,
      featureId: featureId
    }}).toPromise())['Items']
  }

  async getNames() {
    return (await this.http.get(this.rootUrl + 'names').toPromise())['names']
  }

  async getShapes(resolution: string) {
    return await this.http.get('assets/shapefiles/' + resolution + '.json').toPromise()
  }

  formatValue(value: string, attribute: string, percentEnabled: boolean) {
    var currencyTerms = ['Household Income']
    var isCurrency = currencyTerms.some(term => attribute.includes(term))
    var isPercentage = percentEnabled && attribute.includes(':')
    return (isCurrency ? '$' : '') + (+value).toLocaleString() + (isPercentage ? '%' : '')
  }

  formatAttribute(attribute: string, indent: boolean) {
    if (attribute.includes(':')) {
      var tokens = attribute.split(':')
      return indent ? tokens.slice(0, -1).map(_ => '\xa0\xa0\xa0').concat(tokens.slice(-1)).join('')
        : tokens[tokens.length - 1].trim()
    }
    else
      return attribute
  }

  attrIsEnabled(attribute: string, attributes: string[]) {
    return attribute.includes(':') || !attributes[attributes.indexOf(attribute) + 1].includes(':')
  }
}
