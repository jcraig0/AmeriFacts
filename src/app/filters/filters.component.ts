import { Component, DoCheck, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class FiltersComponent implements DoCheck {
  filters = [
    'Population <= 120,000',
    'Median Household Income is $40,000 - $60,000',
    'State is New York'
  ]
  newFilter: string
  addEnabled = false

  constructor(private modal: NgbModal) { }

  ngDoCheck() {
    if (this.newFilter) {
      let tokens = this.newFilter.split(' ')
      let opIdx = tokens.findIndex(token => ['is', '<', '>', '<=', '>='].includes(token))
      if (opIdx > 0) {
        let postTokens = tokens.splice(opIdx + 1).filter(token => token)
        if (postTokens.length == 1 || postTokens.length == 3 && postTokens[1] == '-') {
          this.addEnabled = true
          return
        }
      }
      this.addEnabled = false
    }
  }

  open(content) {
    this.modal.open(content, { windowClass: 'modal' }).result.then(() => {
      this.filters.push(this.newFilter)
      this.newFilter = ''
    }, () => this.newFilter = '')
  }

  deleteFilter(filter: string) {
    this.filters = this.filters.filter(elem => elem != filter)
  }
}
