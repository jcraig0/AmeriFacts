import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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
  currAttributes: string[]
  @Input() attribute: string
  @Input() percentEnabled: boolean
  @Input() resolution: string
  values: any[]
  @Input()
  set _values(values: any[]) {
    if (values) {
      this.values = values
      this.sortValues()
    }
  }
  filters: string[]
  @Input()
  set _filters(filters: string[]) {
    if (this.attributes)
      this.filters = filters
  }
  orderNums = {}
  currentItem
  @Input()
  set _currentItem(item) {
    this.currentItem = item
    if (this.attributes) {
      this.currAttributes = this.attributes.filter(attr => item[attr])
      this.currAttributes.forEach(attr => {
        if (item[attr + ' Ord'] && item[attr + ' Ord'].N != '0')
          this.orderNums[attr] = item[attr + ' Ord'].N
      })
    }
  }
  sortOrder = { name: true, value: null }
  sortImgPath = this.getSortImgPath()

  @Output() clickNameEvt = new EventEmitter()
  @Output() clickBackEvt = new EventEmitter()
  @Output() clickOrderEvt = new EventEmitter()
  @Output() sortValuesEvt = new EventEmitter()

  constructor(private sanitizer: DomSanitizer, private apiService: ApiService) { }

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
    return this.apiService.formatValue(value, attribute, this.percentEnabled)
  }

  formatAttribute(attribute: string, indent: boolean) {
    return this.apiService.formatAttribute(attribute, indent)
  }

  attrIsEnabled(attribute: string) {
    return this.apiService.attrIsEnabled(attribute, this.attributes)
  }

  getExportText() {
    if (this.values) {
      var fmtdAttribute = this.formatAttribute(this.attribute, false)
      var fileText = `Name,${fmtdAttribute},${fmtdAttribute} MOE\n`
      this.values.forEach(item => fileText +=
        `${item.Name.S},"${this.formatValue(item[this.attribute]?.N, this.attribute)}"`
        + `,"${this.formatValue(item[this.attribute + ' MOE']?.N, this.attribute)}"\n`)
      return this.sanitizer.bypassSecurityTrustUrl('data:text/csv;charset=utf-8,' + fileText)
    }
  }

  getExportName() {
    var attribute = this.attribute.replace(/:/g, '\uA789')
    return 'American Community Survey, 2018, 1-Year, '
      + `${attribute}${this.percentEnabled ? ' (%)' : ''} by ${this.resolution}.csv`
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
