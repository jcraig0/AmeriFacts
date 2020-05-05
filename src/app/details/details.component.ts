import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  sortOrder = { name: true, value: null }
  sortImgPath = this.getSortImgPath()

  @Output() clickNameEvt = new EventEmitter()
  @Output() clickOrderEvt = new EventEmitter()

  constructor() { }

  getSortImgPath() {
    return {
      name: this.sortOrder.name == null ? '' :
        '../../assets/images/chevron-' + (this.sortOrder.name ? 'up' : 'down') + '.svg',
      value: this.sortOrder.value == null ? '' :
        '../../assets/images/chevron-' + (this.sortOrder.value ? 'up' : 'down') + '.svg'
    }
  }

  changeSortOrder(column, order?: boolean) {
    if (column == 'name') {
      this.sortOrder.name = this.sortOrder.name ? false : true
      this.sortOrder.value = null
      this.values.sort((item1, item2) => this.sortOrder.name ?
        item1.Name.S.localeCompare(item2.Name.S) : item2.Name.S.localeCompare(item1.Name.S))
    }
    else {
      this.sortOrder.value = order != null ? order : (this.sortOrder.value ? false : true)
      this.sortOrder.name = null
      this.values.sort((item1, item2) => this.sortOrder.value ?
        item1.Population.N - item2.Population.N : item2.Population.N - item1.Population.N)
    }
    this.sortImgPath = this.getSortImgPath()
  }

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

  clickName(item) {
    this.clickNameEvt.emit(item)
  }

  clickOrder(attribute?: string) {
    this.changeSortOrder('value', false)
    this.showInfo = false
    this.clickOrderEvt.emit(attribute)
  }
}
