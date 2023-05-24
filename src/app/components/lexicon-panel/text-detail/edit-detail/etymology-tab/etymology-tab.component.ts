/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, ElementRef, Input, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { LexicalEntriesService } from '../../../../../services/lexical-entries/lexical-entries.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';

import {
  animate,
  style,
  transition,
  trigger,
  state
} from "@angular/animations";

import { ToastrService } from 'ngx-toastr';
import { BibliographyService } from 'src/app/services/bibliography-service/bibliography.service';
import { ModalComponent } from 'ng-modal-lib';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-etymology-tab',
  templateUrl: './etymology-tab.component.html',
  styleUrls: ['./etymology-tab.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        height: 'calc(100vh - 17rem)',

      })),
      state('out', style({
        height: 'calc(50vh - 12.5rem)',
      })),
      transition('in => out', animate('400ms ease-in-out')),
      transition('out => in', animate('400ms ease-in-out'))
    ])
  ]
})
export class EtymologyTabComponent implements OnInit, OnDestroy {

  lock = 0;
  object: any;
  exp_trig = '';

  isLexicalEntry = false;
  isForm = false;
  isSense = false;
  isLexicalConcept = false;
  searchIconSpinner = false;
  goBack = false;
  isEtymology = false;



  lastUpdateDate: any;
  creationDate: any;
  creator: any;
  revisor: any;

  lexicalEntryData: any;
  formData: any;
  senseData: any;
  lexicalConceptData: any;
  bibliography = [];

  start = 0;
  sortField = 'title';
  direction = 'asc';
  memorySort = { field: '', direction: '' }
  queryTitle = '';
  queryMode = 'titleCreatorYear';

  private searchSubject: Subject<any> = new Subject();
  selectedItem;

  @ViewChild('expander') expander_body: ElementRef;
  @Input() etymologyData: any;
  @ViewChild('addBibliography', { static: false }) modal: ModalComponent;
  @ViewChild('table_body') tableBody: ElementRef;

  etymology_data_subscription: Subscription;
  expand_edit_subscription: Subscription;
  expand_epigraphy_subscription: Subscription;
  spinner_subscription: Subscription;
  search_subject_subscription: Subscription;
  bootstrap_bibliography_subscription: Subscription;

  destroy$ : Subject<boolean> = new Subject();
  constructor(private lexicalService: LexicalEntriesService, private biblioService: BibliographyService, private expand: ExpanderService, private rend: Renderer2, private toastr: ToastrService) { }

  ngOnInit(): void {

    this.etymology_data_subscription = this.lexicalService.etymologyData$.subscribe(
      object => {
        if (this.object != object) {
          this.etymologyData = null;
          this.isForm = false;
          this.isLexicalConcept = false;
          this.isLexicalEntry = false;
        }
        this.object = object
        //console.log(this.object)
        if (this.object != null) {
          this.creationDate = this.object.etymology.creationDate;
          this.lastUpdateDate = this.object.etymology.lastUpdate;
          this.creator = this.object['etymology'].creator;
          this.revisor = this.object.revisor;
          this.etymologyData = object;
          this.isEtymology = true;
          setTimeout(() => {
            //@ts-ignore
            $('#etymologyTabModal').modal('hide');
            $('.modal-backdrop').remove();
            var timer = setInterval((val) => {
              try {
                //@ts-ignore
                $('#etymologyTabModal').modal('hide');
                if (!$('#etymologyTabModal').is(':visible')) {
                  clearInterval(timer)
                }

              } catch (e) {
                console.log(e)
              }
            }, 10)
          }, 500);
        }
      }
    );

    this.expand_edit_subscription = this.expand.expEdit$.subscribe(
      trigger => {
        setTimeout(() => {
          if (trigger) {
            let isEditExpanded = this.expand.isEditTabExpanded();
            let isEpigraphyExpanded = this.expand.isEpigraphyTabExpanded();

            if (!isEpigraphyExpanded) {
              this.exp_trig = 'in';
              this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(100vh - 17rem)')
              this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(100vh - 17rem)')
            } else {
              this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)');
              this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
              this.exp_trig = 'in';
            }

          } else if (trigger == null) {
            return;
          } else {
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)');
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
            this.exp_trig = 'out';
          }
        }, 100);

      }
    );

    this.expand_epigraphy_subscription = this.expand.expEpigraphy$.subscribe(
      trigger => {
        setTimeout(() => {
          if (trigger) {
            this.exp_trig = 'in';
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)')
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)')
          } else if (trigger == null) {
            return;
          } else {
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
            this.exp_trig = 'out';
          }
        }, 100);

      }
    );

    this.lexicalService.updateCoreCardReq$.subscribe(
      data => {
        console.log(data)
        if (data != null) {
          this.lastUpdateDate = data['lastUpdate']
          if (data['creationDate'] != undefined) {
            this.creationDate = data['creationDate']
          }
        }
      }
    )

    this.spinner_subscription = this.lexicalService.spinnerAction$.subscribe(
      data => {
        if (data == 'on') {
          this.searchIconSpinner = true;
        } else {
          this.searchIconSpinner = false;
        }
      },
      error => {

      }
    )

    this.search_subject_subscription = this.searchSubject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.queryTitle = data.query;
        data.queryMode ? this.queryMode = 'everything' : this.queryMode = 'titleCreatorYear';
        this.searchBibliography(this.queryTitle, this.queryMode);
      }
    )

    //@ts-ignore
    $("#biblioModalEtym").modal("show");
    $('.modal-backdrop').appendTo('.ui-modal');
    //@ts-ignore
    $('#biblioModalEtym').modal({ backdrop: 'static', keyboard: false })

    $('.modal-backdrop').css('height', 'inherit');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    this.bootstrap_bibliography_subscription = this.biblioService.bootstrapData(this.start, this.sortField, this.direction).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        this.memorySort = { field: this.sortField, direction: this.direction }
        this.bibliography = data;
        this.bibliography.forEach(element => {
          element['selected'] = false;
        })


        //@ts-ignore
        $('#biblioModalEtym').modal('hide');
        $('.modal-backdrop').remove();
      }, error => {
        console.log(error)
      }
    )
  }

  async deleteEtymology() {
    this.searchIconSpinner = true;
    let etymId = this.object.etymology.etymology;

    try {
      let delete_etym_req = await this.lexicalService.deleteEtymology(etymId).toPromise();
      this.searchIconSpinner = false;
      this.lexicalService.deleteRequest(this.object);
      this.lexicalEntryData = null;
      this.isLexicalEntry = false;
      this.object = null;
      this.lexicalService.refreshLangTable();
      this.lexicalService.refreshFilter({ request: true })
      this.lexicalService.sendToCoreTab(null);
      this.lexicalService.sendToRightTab(null);
      this.biblioService.sendDataToBibliographyPanel(null);
      this.toastr.success(etymId + ' deleted correctly', '', {
        timeOut: 5000,
      });
    } catch (error) {
      console.log(error);
      if(error.status == 200){
        this.searchIconSpinner = false;
        this.lexicalService.deleteRequest(this.object);
        this.lexicalEntryData = null;
        this.isLexicalEntry = false;
        this.object = null;
        this.lexicalService.refreshLangTable();
        this.lexicalService.refreshFilter({ request: true })
        this.lexicalService.sendToCoreTab(null);
        this.lexicalService.sendToRightTab(null);
        this.biblioService.sendDataToBibliographyPanel(null);
        this.toastr.success(etymId + ' deleted correctly', '', {
          timeOut: 5000,
        });
      }else{
        this.toastr.success(error.error, '', {
          timeOut: 5000,
        });
      }
    }
  }

  async addNewEtymology() {
    this.searchIconSpinner = true;
    this.object['request'] = 'etymology'

    let parentNodeInstanceName = this.object.parentNodeInstanceName;
    this.object['lexicalEntry'] = parentNodeInstanceName
    this.object['request'] = 'etymology'

    console.log(this.object, parentNodeInstanceName);

    try {
      let create_etymon_req = await this.lexicalService.createNewEtymology(parentNodeInstanceName).toPromise();
      create_etymon_req['label'] = 'Etymology of: ' + this.object['parentNodeLabel'];
      if (create_etymon_req['creator'] == this.object.creator) {
        create_etymon_req['flagAuthor'] = false;
      } else {
        create_etymon_req['flagAuthor'] = true;
      }
      this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': create_etymon_req });
      this.searchIconSpinner = false;
      this.toastr.success(create_etymon_req['etymology'] + ' added correctly', '', {
        timeOut: 5000,
      });
    } catch (error) {
      console.log(error)
      this.searchIconSpinner = false;
    }

  }

  showBiblioModal() {
    this.modal.show();
  }

  checkIfCreatorExist(item?) {
    return item.some(element => element.creatorType === 'author')
  }

  async searchBibliography(query?: string, queryMode?: any) {
    this.start = 0;
    this.selectedItem = null;
    //@ts-ignore
    $("#biblioModalEtym").modal("show");
    $('.modal-backdrop').appendTo('.table-body');
    //@ts-ignore
    $('#biblioModalEtym').modal({ backdrop: 'static', keyboard: false })
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");
    console.log(query, queryMode)
    this.tableBody.nativeElement.scrollTop = 0;
    if (this.queryTitle != '') {

      try {
        let filter_bibliography_req = await this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).toPromise();
        console.log(filter_bibliography_req);
        this.bibliography = [];
        filter_bibliography_req.forEach(element => {
          this.bibliography.push(element)
        });
        setTimeout(() => {
          //@ts-ignore
          $('#biblioModalEtym').modal('hide');
          $('.modal-backdrop').remove();
        }, 100);
      } catch (error) {
        console.log(error)
      }

    } else {

      try {
        let filter_bibliography_req = await this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).toPromise();
        console.log(filter_bibliography_req);
        this.bibliography = [];
        filter_bibliography_req.forEach(element => {
          this.bibliography.push(element)
        });
        //@ts-ignore
        $('#biblioModalEtym').modal('hide');
        $('.modal-backdrop').remove();
      } catch (error) {
        console.log(error)
      }
    }
  }

  triggerSearch(evt, query, queryMode) {
    if (evt.key != 'Control' && evt.key != 'Shift' && evt.key != 'Alt') {
      this.searchSubject.next({ query, queryMode })
    }
  }

  async onScrollDown() {
    //@ts-ignore
    $("#biblioModalEtym").modal("show");
    $('.modal-backdrop').appendTo('.table-body');
    //@ts-ignore
    $('#biblioModalEtym').modal({ backdrop: 'static', keyboard: false })
    $('.modal-backdrop').appendTo('.table-body');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    this.start += 25;

    if (this.queryTitle != '') {
      try {
        let filter_bibliography_req = await this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).toPromise();
        console.log(filter_bibliography_req)
        //@ts-ignore
        $('#biblioModalEtym').modal('hide');
        $('.modal-backdrop').remove();
        filter_bibliography_req.forEach(element => {
          this.bibliography.push(element)
        });
      } catch (error) {
        console.log(error)
      }

    } else {
      try {
        let filter_bibliography_req = await this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).toPromise();
        filter_bibliography_req.forEach(element => {
          this.bibliography.push(element)
        });

        //@ts-ignore
        $('#biblioModalEtym').modal('hide');
        $('.modal-backdrop').remove();
      } catch (error) {
        console.log(error)
      }
    }


  }

  selectItem(evt, i) {
    /* console.log(evt, i); */
    if (evt.shiftKey) {

    }
    this.bibliography.forEach(element => {
      if (element.key == i.key) {
        element.selected = !element.selected;
        element.selected ? this.selectedItem = element : this.selectedItem = null;
        return true;
      } else {
        element.selected = false;
        return false;
      }
    })

  }

  async sortBibliography(evt?, val?) {


    if (this.memorySort.field == val) {
      if (this.direction == 'asc') {
        this.direction = 'desc'
        this.memorySort.direction = 'desc';
      } else {
        this.direction = 'asc';
        this.memorySort.direction = 'asc';
      }
    } else {
      this.sortField = val;
      this.direction = 'asc';
      this.memorySort = { field: this.sortField, direction: this.direction };
    }

    //@ts-ignore
    $("#biblioModalEtym").modal("show");
    $('.modal-backdrop').appendTo('.table-body');
    //@ts-ignore
    $('#biblioModalEtym').modal({ backdrop: 'static', keyboard: false })
    $('.modal-backdrop').appendTo('.table-body');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");
    this.start = 0;
    this.tableBody.nativeElement.scrollTop = 0;

    try {
      let filter_bibliography_req = await this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).toPromise();
      filter_bibliography_req.forEach(element => {
        this.bibliography.push(element)
      });

      //@ts-ignore
      $('#biblioModalEtym').modal('hide');
      $('.modal-backdrop').remove();
    } catch (error) {
      console.log(error)
    }

  }

  async addNewForm() {
    this.searchIconSpinner = true;
    /* console.log(this.object) */
    this.object['request'] = 'form'

    let parentNodeInstanceName = this.object.parentNodeInstanceName;
    this.object['request'] = 'form';
    this.object['lexicalEntry'] = parentNodeInstanceName
    //console.log(this.object);

    try {
      let create_new_form_req = await this.lexicalService.createNewForm(parentNodeInstanceName).toPromise();
      if (create_new_form_req['creator'] == this.object.creator) {
        create_new_form_req['flagAuthor'] = false;
      } else {
        create_new_form_req['flagAuthor'] = true;
      }
      this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': create_new_form_req });
      this.searchIconSpinner = false;
      this.toastr.success(create_new_form_req['form'] + ' added correctly', '', {
        timeOut: 5000,
      });
    } catch (error) {
      console.log(error);
      if (error.status != 200) {
        this.searchIconSpinner = false;
        this.toastr.error('Something goes wrong', 'Error', {
          timeOut: 5000,
        });
      }
    }
  }

  async addNewSense() {
    this.searchIconSpinner = true;
    this.object['request'] = 'sense'

    let parentNodeInstanceName = this.object.parentNodeInstanceName;
    this.object['lexicalEntry'] = parentNodeInstanceName
    this.object['request'] = 'sense'
    console.log(this.object);

    try {
      let create_new_sense = await this.lexicalService.createNewSense(parentNodeInstanceName).toPromise();
      if (create_new_sense['creator'] == this.object.creator) {
        create_new_sense['flagAuthor'] = false;
      } else {
        create_new_sense['flagAuthor'] = true;
      }
      this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': create_new_sense });
      this.searchIconSpinner = false;
      this.toastr.success(create_new_sense['sense'] + ' added correctly', '', {
        timeOut: 5000,
      });
    } catch (error) {
      console.log(error);
      if (error.status != 200) {
        this.searchIconSpinner = false;
        //this.lexicalService.refreshLexEntryTree();
        this.toastr.error(error.error, 'Error', {
          timeOut: 5000,
        });
      }
    }

  }

  async addBibliographyItem(item?) {
    //@ts-ignore
    $("#biblioModalEtym").modal("show");
    $('.modal-backdrop').appendTo('.ui-modal');
    //@ts-ignore
    $('#biblioModalEtym').modal({ backdrop: 'static', keyboard: false })

    $('.modal-backdrop').css('height', 'inherit');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    let instance = this.object.etymology.etymology;
    console.log(this.object)

    if (item != undefined) {

      let id = item.data.key != undefined ? item.data.key : '';
      let title = item.data.title != undefined ? item.data.title : '';
      let author;

      item.data.creators.forEach(element => {
        if (element.creatorType == 'author') {
          author = element.lastName + ' ' + element.firstName;
          return true;
        } else {
          return false;
        }
      });
      author = author != undefined ? author : ''
      let date = item.data.date != undefined ? item.data.date : '';
      let url = item.data.url != undefined ? item.data.url : ''
      let seeAlsoLink = '';

      let parameters = {
        id: id,
        title: title,
        author: author,
        date: date,
        url: url,
        seeAlsoLink: seeAlsoLink
      }
      console.log(instance, parameters);

      try {
        let add_biblio_data = await this.lexicalService.addBibliographyData(instance, parameters).toPromise();
        setTimeout(() => {
          //@ts-ignore
          $('#biblioModalEtym').modal('hide');
          $('.modal-backdrop').remove();
          this.toastr.success('Item added, check bibliography panel', '', {
            timeOut: 5000,
          });
          this.biblioService.triggerPanel(add_biblio_data)
          setTimeout(() => {
            this.modal.hide();
          }, 10);
        }, 300);
        this.biblioService.sendDataToBibliographyPanel(add_biblio_data);
      } catch (error) {
        if (error.status != 200) {
          console.log(error)
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
          setTimeout(() => {
            //@ts-ignore
            $('#biblioModalEtym').modal('hide');
            $('.modal-backdrop').remove();
          }, 300);
        }
      }

    }

  }

  onCloseModal() {
    this.selectedItem = null;
    this.start = 0;
    this.sortField = 'title';
    this.direction = 'asc';
    this.tableBody.nativeElement.scrollTop = 0;
    this.memorySort = { field: this.sortField, direction: this.direction }
    this.biblioService.bootstrapData(this.start, this.sortField, this.direction).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        this.bibliography = data;
        this.bibliography.forEach(element => {
          element['selected'] = false;
        })


      }, error => {
        console.log(error)
      }
    );
  }

  ngOnDestroy(): void {
    this.etymology_data_subscription.unsubscribe();
    this.expand_edit_subscription.unsubscribe();
    this.expand_epigraphy_subscription.unsubscribe();
    this.spinner_subscription.unsubscribe();
    this.search_subject_subscription.unsubscribe();
    this.bootstrap_bibliography_subscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
