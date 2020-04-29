import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  rootUrl = 'https://6x5mx57f76.execute-api.us-east-2.amazonaws.com/'
  values: any

  constructor(private http: HttpClient) { }

  async getValues(resolution: string, attribute: string) {
    return await this.http.post(this.rootUrl + 'values', {
      resolution: resolution,
      attribute: attribute
    }).toPromise()
  }

  async getShapes(resolution: string) {
    return await this.http.get('assets/' + resolution + 's.json').toPromise()
  }
}
