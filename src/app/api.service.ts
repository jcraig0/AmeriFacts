import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  rootUrl = 'https://6x5mx57f76.execute-api.us-east-2.amazonaws.com/'
  values: any

  constructor(private http: HttpClient) { }

  async getAttrValues(resolution: string, attribute: string) {
    return await this.http.post(this.rootUrl + 'attribute', {
      resolution: resolution,
      attribute: attribute
    }).toPromise()
  }

  async getFeatValues(resolution: string, featureId: string) {
    return await this.http.post(this.rootUrl + 'feature', {
      resolution: resolution,
      featureId: featureId
    }).toPromise()
  }

  async getShapes(resolution: string) {
    return await this.http.get('assets/shapefiles/' + resolution + 's.json').toPromise()
  }
}
