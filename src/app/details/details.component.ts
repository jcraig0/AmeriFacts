import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Feature } from 'ol';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.sass']
})
export class DetailsComponent {
  @Input() showInfo: boolean
  @Input() attributes: string[]
  @Input() attribute: string
  @Input() resolution: string
  @Input()
  set selectedFeature(feature: Feature) {
    if (feature)
      this.setOrderNums(false)
  }
  values: any[]
  @Input()
  set _values(values: any[]) {
    if (values) {
      this.values = values
      if (this.showInfo)
        this.setOrderNums(true)
      this.sortValues()
    }
  }
  filters: string[]
  @Input()
  set _filters(filters: string[]) {
    if (this.attributes) {
      this.filters = filters
      this.setOrderNums(true)
    }
  }
  currentItem
  @Input()
  set _currentItem(item) {
    this.currentItem = item
    if (Object.keys(this.orderNums).length) {
      for (let attribute in this.orderNums)
        this.currOrderNums[attribute] = this.orderNums[attribute][item.Name.S]
    }
  }
  sortOrder = { name: true, value: null }
  sortImgPath = this.getSortImgPath()
  orderNums = {}
  currOrderNums = {}

  @Output() clickNameEvt = new EventEmitter()
  @Output() clickBackEvt = new EventEmitter()
  @Output() clickOrderEvt = new EventEmitter()
  @Output() sortValuesEvt = new EventEmitter()

  constructor(private apiService: ApiService) { }

  async setOrderNums(newValues: boolean) {
    if (newValues)
      this.orderNums = {}
    for (let attribute of this.attributes) {
      if (!(attribute in this.orderNums)) {
        var sortedVals = (attribute in this.values[0] ? this.values :
          (await this.apiService.getAttrValues(this.resolution, attribute, this.filters)))
          .sort((item1, item2) => item2[attribute].N - item1[attribute].N)
        this.orderNums[attribute] = {}
        sortedVals.map((item, idx) => this.orderNums[attribute][item.Name.S] = idx + 1)
      }
      this.currOrderNums[attribute] = this.orderNums[attribute][this.currentItem.Name.S]
    }
  }

  getSortImgPath() {
    return {
      name: this.sortOrder.name == null ? '' :
        '../../assets/images/chevron-' + (this.sortOrder.name ? 'up' : 'down') + '.svg',
      value: this.sortOrder.value == null ? '' :
        '../../assets/images/chevron-' + (this.sortOrder.value ? 'up' : 'down') + '.svg'
    }
  }

  sortValues() {
    if (this.sortOrder.name != null) {
      this.values.sort((item1, item2) => this.sortOrder.name ?
        item1.Name.S.localeCompare(item2.Name.S) : item2.Name.S.localeCompare(item1.Name.S))
    }
    else {
      this.values.sort((item1, item2) => this.sortOrder.value ?
        item1[this.attribute].N - item2[this.attribute].N : item2[this.attribute].N - item1[this.attribute].N)
    }
    this.sortValuesEvt.emit()
  }

  changeSortOrder(column: string, orderClicked?: boolean) {
    if (column == 'name') {
      this.sortOrder.name = this.sortOrder.name ? false : true
      this.sortOrder.value = null
    }
    else {
      this.sortOrder.value = orderClicked ? false : (this.sortOrder.value ? false : true)
      this.sortOrder.name = null
    }

    if (!orderClicked)
      this.sortValues()
    this.sortImgPath = this.getSortImgPath()
  }

  formatValue(value: string, attribute: string) {
    return this.apiService.formatValue(value, attribute)
  }

  clickName(item) {
    this.clickNameEvt.emit(item)
  }

  clickBack() {
    this.sortValues()
    this.clickBackEvt.emit()
  }

  clickOrder(attribute: string) {
    this.clickOrderEvt.emit(attribute)
    this.changeSortOrder('value', true)
  }

  getOrderStr(num: number) {
    var suffix: string
    var otherSuff = ["st", "nd", "rd"]

    if (num > 0 && num < 4)
      suffix = otherSuff[num - 1]
    else if (num < 20)
      suffix = "th"
    else
      suffix = otherSuff[num % 10 - 1] || "th"

    return num + suffix
  }
}
