import { Component, DoCheck, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class FiltersComponent implements DoCheck {
  @Input() attributes: string[]
  filters: string[] = []
  newFilter: string
  addEnabled = false
  modalRef

  @Output() updateFiltersEvt = new EventEmitter()

  constructor(private modal: NgbModal) { }

  ngDoCheck() {
    if (this.newFilter) {
      let tokens = this.newFilter.split(' ')

      let opIdx = tokens.findIndex(token => ['=', '<', '>', '<=', '>='].includes(token))
      if (opIdx > 0 && this.attributes.includes(tokens.slice(0, opIdx).join(' '))) {
        let endTokens = tokens.slice(opIdx + 1)
        let firstNum = parseInt(endTokens[0]?.[0] == '$' ? endTokens[0].slice(1) : endTokens[0])
        let secondNum = parseInt(endTokens[2]?.[0] == '$' ? endTokens[2].slice(1) : endTokens[2])
        if (!isNaN(firstNum) && (endTokens.length == 1 ||
            tokens[opIdx] == '=' && endTokens.length == 3 &&
            endTokens[1] == 'to' && !isNaN(secondNum) && secondNum > firstNum)) {
          this.addEnabled = true
          return
        }
      }

      this.addEnabled = false
    }
  }

  open(content) {
    this.modalRef = this.modal.open(content, { windowClass: 'modal' })
    this.modalRef.result.then(() => {
      this.filters.push(this.newFilter)
      this.newFilter = ''
      this.addEnabled = false
      this.updateFiltersEvt.emit(this.filters)
    }, () => {
      this.newFilter = ''
      this.addEnabled = false
    })
  }

  deleteFilter(index: number) {
    this.filters.splice(index, 1)
    this.updateFiltersEvt.emit(this.filters)
  }

  submit() {
    if (this.addEnabled)
      this.modalRef.close()
  }
}
