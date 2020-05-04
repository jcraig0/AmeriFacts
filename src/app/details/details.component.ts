import { Component, Input } from '@angular/core';
import { Feature } from 'ol';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.sass']
})
export class DetailsComponent {

  showInfo: boolean
  @Input()
  set selectedFeature(feature: Feature) {
    if (feature)
      this.selectFeature(feature)
  }
  @Input()
  values: any[]
  currentItem: any

  constructor() { }

  selectFeature(feature: Feature) {
    this.showInfo = true
    this.currentItem = this.values.find(item => item.ID.S.slice(-2) == feature.get('GEOID'))
    var orderNum = [...this.values].sort((item1, item2) => item2.Population.N - item1.Population.N)
      .findIndex(item => item.ID.S == this.currentItem.ID.S) + 1
    this.currentItem.order = orderNum + this.getOrderSuffix(orderNum)
  }

  getOrderSuffix(num: number) {
    var otherSuff = ["st", "nd", "rd"]
    if (num > 0 && num < 4)
      return otherSuff[num - 1]
    else if (num < 20)
      return "th"
    else
      return otherSuff[num % 10 - 1] || "th"
  }

  goBack() {
    this.showInfo = false
  }
}
