/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { LexicalEntriesService } from '../../../../../services/lexical-entries/lexical-entries.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { ToastrService } from 'ngx-toastr';

import {
  animate,
  style,
  transition,
  trigger,
  state
} from "@angular/animations";
import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { ModalComponent } from 'ng-modal-lib';
import { BibliographyService } from 'src/app/services/bibliography-service/bibliography.service';
import { Subject, Subscription } from 'rxjs';
import { ConceptService } from 'src/app/services/concept/concept.service';

@Component({
  selector: 'app-core-tab',
  templateUrl: './core-tab.component.html',
  styleUrls: ['./core-tab.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        height: 'calc(100vh - 17rem)',

      })),
      state('out', style({
        height: 'calc(50vh - 10rem)',
      })),
      transition('in => out', animate('400ms ease-in-out')),
      transition('out => in', animate('400ms ease-in-out'))
    ])
  ]
})
export class CoreTabComponent implements OnInit, OnDestroy {

  lock = 0;
  object: any;
  exp_trig = '';

  isLexicalEntry = false;
  isForm = false;
  isSense = false;
  isLexicalConcept = false;
  isEtymology = false;
  isConceptSet = false;
  searchIconSpinner = false;
  goBack = false;

  bibliography = [];
  selectedItem;

  selectedLexicalElement;

  lexicalEntryData: any;
  formData: any;
  senseData: any;
  lexicalConceptData: any;
  conceptSetData : any;

  lastUpdateDate: any;
  creationDate: any;
  creator: any;
  revisor: any;

  start = 0;
  sortField = 'title';
  direction = 'asc';
  memorySort = { field: '', direction: '' }
  queryTitle = '';
  queryMode = 'titleCreatorYear';
  destroy$: Subject<boolean> = new Subject();
  core_data_subscription: Subscription;
  expand_edit_subscription: Subscription;
  expand_epi_subscription: Subscription;
  update_core_card_subscription: Subscription;
  spinner_subscription: Subscription;
  search_subject_subscription: Subscription;
  biblio_bootstrap_subscription: Subscription;

  private searchSubject: Subject<any> = new Subject();

  @ViewChild('expander') expander_body: ElementRef;
  @ViewChild('addBibliography', { static: false }) modal: ModalComponent;
  @ViewChild('table_body') tableBody: ElementRef;
  @ViewChild('searchBiblio') searchBiblio: ElementRef;

  constructor(private lexicalService: LexicalEntriesService, 
              private biblioService: BibliographyService, 
              private expand: ExpanderService, 
              private rend: Renderer2, 
              private toastr: ToastrService,
              private conceptService : ConceptService) 
  { }

  ngOnInit(): void {

    this.core_data_subscription = this.lexicalService.coreData$.subscribe(
      object => {
        if (this.object != object) {
          this.lexicalEntryData = null;
          this.conceptSetData = null;
          this.lexicalConceptData = null;
          this.formData = null;
          this.senseData = null;

        }
        this.object = object
        /* console.log(this.object) */
        if (this.object != null) {
          setTimeout(() => {
            //@ts-ignore
            $('#coreTabModal').modal('hide');
            $('.modal-backdrop').remove();
            var timer = setInterval((val) => {
              try {
                //@ts-ignore
                $('#coreTabModal').modal('hide');
                if (!$('#coreTabModal').is(':visible')) {
                  clearInterval(timer)
                }

              } catch (e) {
                console.log(e)
              }
            }, 10)
          }, 500);
          this.creator = this.object.creator;
          this.revisor = this.object.revisor;

          if (this.object.lexicalEntry != undefined && this.object.sense == undefined && this.object.form == undefined) {
            this.isLexicalEntry = true;
            this.isForm = false;
            this.isSense = false;
            this.lexicalEntryData = object;
            this.formData = null;
            this.lexicalConceptData = null;
            this.isLexicalConcept = false;
            this.isConceptSet = false;
          } else if (this.object.form != undefined && this.object.sense == undefined) {
            this.isLexicalEntry = false;
            this.isForm = true;
            this.isSense = false;
            this.formData = object;
            this.lexicalEntryData = null;
            this.lexicalConceptData = null;
            this.isLexicalConcept = false;
            this.isConceptSet = false;
          } else if (this.object.sense != undefined) {
            this.isLexicalEntry = false;
            this.isForm = false;
            this.isSense = true;
            this.senseData = object;
            this.formData = null;
            this.lexicalEntryData = null;
            this.lexicalConceptData = null;
            this.isLexicalConcept = false;
            this.isConceptSet = false;
          } else if (this.object.lexicalConcept != undefined && this.object.sense == undefined) {
            this.isLexicalEntry = false;
            this.isForm = false;
            this.isSense = false;
            this.isLexicalConcept = true;
            this.senseData = null;
            this.formData = null;
            this.lexicalEntryData = null;
            this.lexicalConceptData = object;
            this.isConceptSet = false;
          } else if(this.object.conceptSet != undefined){
            this.isConceptSet = true;
            this.isLexicalEntry = false;
            this.isForm = false;
            this.isSense = false;
            this.isLexicalConcept = false;
            this.conceptSetData = object;
            this.senseData = null;
            this.formData = null;
            this.lexicalEntryData = null;
            this.lexicalConceptData = null;
          }else if(this.object.lexicalConcept == undefined && this.object.etymology != undefined){
            this.isEtymology = true;
            this.isConceptSet = false;
            this.isLexicalConcept = false;
          }

          this.creationDate = this.object.creationDate;
          this.lastUpdateDate = this.object.lastUpdate;

          switch (this.object.status) {
            case 'working': {
              this.lock = 0;
              this.goBack = false;
              setTimeout(() => {
                //@ts-ignore
                $('.locked-tooltip').tooltip('disable');
              }, 10);
              break;
            }
            case 'completed': {
              this.lock = 1;
              this.goBack = false;
              setTimeout(() => {
                //@ts-ignore
                $('.locked-tooltip').tooltip('disable');
              }, 10);
              break;
            }
            case 'reviewed': {
              this.lock = 2;
              this.goBack = true;
              setTimeout(() => {
                //@ts-ignore
                $('.locked-tooltip').tooltip('enable');
                //@ts-ignore
                $('.locked-tooltip').tooltip({
                  trigger: 'hover'
                });
              }, 50);
              break;
            }
          }

        }
      }
    );

    this.expand_edit_subscription = this.expand.expEdit$.subscribe(
      trigger => {
        /* console.log("trigger core-tab: ", trigger) */
        setTimeout(() => {
          if (trigger) {
            let isEditExpanded = this.expand.isEditTabExpanded();
            let isEpigraphyExpanded = this.expand.isEpigraphyTabExpanded();

            /* console.log(isEditExpanded);
            console.log(isEpigraphyExpanded) */


            if (!isEpigraphyExpanded) {
              this.exp_trig = 'in';
              this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(100vh - 17rem)')
              this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(100vh - 17rem)')
            } else {
              this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 10rem)');
              this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 10rem)');
              this.exp_trig = 'in';
            }



          } else if (trigger == null) {
            return;
          } else {
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 10rem)');
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 10rem)');
            this.exp_trig = 'out';
          }
        }, 100);

      }
    );

    this.expand_epi_subscription = this.expand.expEpigraphy$.subscribe(
      trigger => {
        setTimeout(() => {
          if (trigger) {
            this.exp_trig = 'in';
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 10rem)')
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 10rem)')
          } else if (trigger == null) {
            return;
          } else {
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 10rem)');
            this.exp_trig = 'out';
          }
        }, 100);

      }
    );

    this.update_core_card_subscription = this.lexicalService.updateCoreCardReq$.subscribe(
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
    $("#biblioModal").modal("show");
    $('.modal-backdrop').appendTo('.ui-modal');
    //@ts-ignore
    $('#biblioModal').modal({ backdrop: 'static', keyboard: false })

    $('.modal-backdrop').css('height', 'inherit');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    this.biblio_bootstrap_subscription = this.biblioService.bootstrapData(this.start, this.sortField, this.direction).subscribe(
      data => {
        this.memorySort = { field: this.sortField, direction: this.direction }
        this.bibliography = data;
        this.bibliography.forEach(element => {
          element['selected'] = false;
        })


        //@ts-ignore
        $('#biblioModal').modal('hide');
        $('.modal-backdrop').remove();
      }, error => {
        console.log(error)
      }
    )
  }

  changeStatus() {

    //console.log(this.goBack)

    if (!this.goBack) {
      this.lock++;
      if (this.lock == 2) {
        this.goBack = true;
      }
    } else if (this.goBack) {
      this.lock--;
      if (this.lock == 0) {
        this.goBack = false;
      }
    }

    this.searchIconSpinner = true;
    let lexicalId = this.object.lexicalEntry;
    //console.log(this.lock)
    switch (this.lock) {
      case 0: {
        let parameters = {
          relation: "http://www.w3.org/2003/06/sw-vocab-status/ns#term_status",
          value: "working"
        }
        this.lexicalService.updateLexicalEntry(lexicalId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            this.searchIconSpinner = false;
            data['request'] = 0;
            this.lexicalService.updateCoreCard(data)
            this.lexicalService.refreshAfterEdit(data);
            setTimeout(() => {
              //@ts-ignore
              $('.locked-tooltip').tooltip('disable');
            }, 10);
          },
          error => {
            this.searchIconSpinner = false;
            const data = this.object;
            data['request'] = 0;
            data['new_status'] = 'working'
            this.lexicalService.refreshAfterEdit(data);
            this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
            setTimeout(() => {
              //@ts-ignore
              $('.locked-tooltip').tooltip('disable');
            }, 10);
          }
        )
      }; break;
      case 1: {
        let parameters = {
          relation: "http://www.w3.org/2003/06/sw-vocab-status/ns#term_status",
          value: "completed"
        }
        this.lexicalService.updateLexicalEntry(lexicalId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data => {

            this.searchIconSpinner = false;
            data['request'] = 0;
            this.lexicalService.updateCoreCard(data)
            this.lexicalService.refreshAfterEdit(data);
            setTimeout(() => {
              //@ts-ignore
              $('.locked-tooltip').tooltip('disable');
            }, 10);
          },
          error => {
            this.searchIconSpinner = false;
            if(error.status == 200){
              const data = this.object;
              data['request'] = 0;
              data['new_status'] = 'completed'
              this.lexicalService.refreshAfterEdit(data);
              this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
              setTimeout(() => {
                //@ts-ignore
                $('.locked-tooltip').tooltip('disable');
              }, 10);

              this.toastr.success('Status changed correctly', '', {timeOut: 5000})
            }else{
              this.toastr.error(error.error, 'Error', {timeOut: 5000})
            }
            
          }
        )
      }; break;
      case 2: {
        let parameters = {
          relation: "http://www.w3.org/2003/06/sw-vocab-status/ns#term_status",
          value: "reviewed"
        }
        this.lexicalService.updateLexicalEntry(lexicalId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            this.searchIconSpinner = false;
            data['request'] = 0;
            data['new_status'] = 'reviewed'
            this.lexicalService.updateCoreCard(data)
            this.lexicalService.refreshAfterEdit(data);
            setTimeout(() => {
              //@ts-ignore
              $('.locked-tooltip').tooltip('enable');
              //@ts-ignore
              $('.locked-tooltip').tooltip({
                trigger: 'hover'
              });
            }, 50);
          },
          error => {

            this.searchIconSpinner = false;
            const data = this.object;
            data['request'] = 0;
            data['new_status'] = 'reviewed'
            this.lexicalService.refreshAfterEdit(data);
            this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
            setTimeout(() => {
              //@ts-ignore
              $('.locked-tooltip').tooltip('enable');
              //@ts-ignore
              $('.locked-tooltip').tooltip({
                trigger: 'hover'
              });
            }, 50);
          }
        )
      }; break;
    }

  }

  deleteConceptSet(){
    this.searchIconSpinner = true;
    let conceptSetId = this.object.conceptSet
    this.conceptService.deleteConceptSet(conceptSetId).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        //console.log(data)
        this.searchIconSpinner = false;
        this.conceptService.deleteRequest(this.object);
        this.conceptSetData = null;
        this.isConceptSet = false;
        this.object = null;
        this.lexicalService.sendToCoreTab(null);
        this.lexicalService.sendToRightTab(null);
        this.biblioService.sendDataToBibliographyPanel(null);

        this.expand.expandCollapseEdit(false);
        this.expand.openCollapseEdit(false)
        if (this.expand.isEpigraphyOpen) {
          this.expand.expandCollapseEpigraphy();
        }
        
      }, error => {
        //console.log(error)
        this.searchIconSpinner = false;
        
        

        if(error.status != 200){
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        }else{
          this.toastr.success(conceptSetId + 'deleted correctly', '', {
            timeOut: 5000,
          });
          this.searchIconSpinner = false;
          this.conceptService.deleteRequest(this.object);
          this.conceptSetData = null;
          this.isConceptSet = false;
          this.object = null;
          this.lexicalService.sendToCoreTab(null);
          this.lexicalService.sendToRightTab(null);
          this.biblioService.sendDataToBibliographyPanel(null);

          this.expand.expandCollapseEdit(false);
          this.expand.openCollapseEdit(false)
          if (this.expand.isEpigraphyOpen) {
            this.expand.expandCollapseEpigraphy();
          }
        }

        
      }
    )
  }

  deleteLexicalConcept(){
    this.searchIconSpinner = true;
    let lexicalConceptID = this.object.lexicalConcept;

    this.conceptService.deleteLexicalConcept(lexicalConceptID).pipe(takeUntil(this.destroy$)).subscribe(
      data=> {
        console.log(data)
      },error=>{
        console.log(error);
        if(error.status != 200){
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        }else{
          this.toastr.success(lexicalConceptID + 'deleted correctly', '', {
            timeOut: 5000,
          });
          this.searchIconSpinner = false;
          this.conceptService.deleteRequest(this.object);
          this.conceptSetData = null;
          this.isConceptSet = false;
          this.object = null;
          this.lexicalService.sendToCoreTab(null);
          this.lexicalService.sendToRightTab(null);
          this.biblioService.sendDataToBibliographyPanel(null);

          this.expand.expandCollapseEdit(false);
          this.expand.openCollapseEdit(false)
          if (this.expand.isEpigraphyOpen) {
            this.expand.expandCollapseEpigraphy();
          }
        }
      }
    )
  }

  deleteLexicalEntry() {
    this.searchIconSpinner = true;
    let lexicalId = this.object.lexicalEntry
    this.lexicalService.deleteLexicalEntry(lexicalId).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        //console.log(data)
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

        this.expand.expandCollapseEdit(false);
        this.expand.openCollapseEdit(false)
        if (this.expand.isEpigraphyOpen) {
          this.expand.expandCollapseEpigraphy();
        }
        this.toastr.success(lexicalId + 'deleted correctly', '', {
          timeOut: 5000,
        });
      }, error => {
        //console.log(error)
        this.searchIconSpinner = false;
        
        

        if(error.status != 200){
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        }else{
          this.toastr.success(lexicalId + 'deleted correctly', '', {
            timeOut: 5000,
          });
        }

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

        this.expand.expandCollapseEdit(false);
        this.expand.openCollapseEdit(false)
        if (this.expand.isEpigraphyOpen) {
          this.expand.expandCollapseEpigraphy();
        }
      }
    )
  }

  deleteForm() {
    this.searchIconSpinner = true;
    let lexicalId = this.object.form;
    this.lexicalService.deleteForm(lexicalId).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        this.searchIconSpinner = false;
        this.lexicalService.sendToCoreTab(null)
        this.lexicalService.deleteRequest(this.object);
        this.isForm = false;
        this.object = null;
        this.toastr.success(lexicalId + 'deleted correctly', '', {
          timeOut: 5000,
        });
      }, error => {
        console.log(error)
        this.searchIconSpinner = false;
        this.lexicalService.deleteRequest(this.object);
        if (error.status != 200) {
          this.toastr.error(error.message, 'Error', { timeOut: 5000 })
        }else {
          this.toastr.success(lexicalId + 'deleted correctly', '', {
            timeOut: 5000,
          });
        }
        this.lexicalService.sendToCoreTab(null)

      }
    )
  }

  deleteSense() {
    this.searchIconSpinner = true;
    let lexicalId = this.object.sense;

    this.lexicalService.deleteSense(lexicalId).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)
        /* this.searchIconSpinner = false;
        this.lexicalService.deleteRequest(this.object);
        this.isSense = false;
        this.object = null;
        this.lexicalService.sendToCoreTab(null)

        this.toastr.success(lexicalId + 'deleted correctly', '', {
          timeOut: 5000,
        }); */
      }, error => {
        console.log(error)
        if(error.status == 200){
          this.searchIconSpinner = false;
          this.toastr.success(lexicalId + 'deleted correctly', '', {
            timeOut: 5000,
          });
          this.lexicalService.deleteRequest(this.object);
          this.lexicalService.sendToCoreTab(null)

        }else{
          this.toastr.error('Error on deleting' + lexicalId, '', {
            timeOut: 5000,
          });
        }
        
      }
    )
  }

  addNewForm() {
    this.searchIconSpinner = true;
    /* console.log(this.object) */
    this.object['request'] = 'form'
    if (this.isLexicalEntry) {
      let lexicalId = this.object.lexicalEntry;
      this.lexicalService.createNewForm(lexicalId).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          this.toastr.success('Form added correctly', '', {
            timeOut: 5000,
          });
          console.log(data);
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
        }, error => {
          console.log(error)
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
          this.searchIconSpinner = false;
        }
      )
    } else if (this.isForm) {
      let parentNodeInstanceName = this.object.parentNodeInstanceName;
      //console.log(this.object);
      this.object['request'] = 'form';
      this.object['lexicalEntry'] = parentNodeInstanceName
      this.lexicalService.createNewForm(parentNodeInstanceName).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
          this.toastr.success('Form added correctly', '', {
            timeOut: 5000,
          });
        }, error => {
          //console.log(error)
          this.searchIconSpinner = false;
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        }
      )
    } else if (this.isSense) {
      let parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['request'] = 'form';
      this.object['lexicalEntry'] = parentNodeInstanceName
      //console.log(this.object);
      this.lexicalService.createNewForm(parentNodeInstanceName).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
          this.toastr.success('Form added correctly', '', {
            timeOut: 5000,
          });
        }, error => {
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
          this.searchIconSpinner = false;
        }
      )
    }

  }

  addLexicalConcept(){
    this.searchIconSpinner = true;
    this.object['request'] = 'lexicalConcept';

    this.conceptService.createNewLexicalConcept().pipe(takeUntil(this.destroy$)).subscribe(
      data=>{
        if (data['creator'] == this.object.creator) {
          data['flagAuthor'] = false;
        } else {
          data['flagAuthor'] = true;
        }

        let parameters = {
          relation : "http://www.w3.org/2004/02/skos/core#narrower",
          source : data['lexicalConcept'],
          target : this.object['lexicalConcept']
        }
        this.conceptService.updateSemanticRelation(parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data=> {
            console.log(data);
          },error=>{
            console.log(error);
            if(error.status == 200){
              data['children'] = undefined;
              data['hasChildren'] = true;
              this.conceptService.addSubElementRequest({ 'lex': this.object, 'data': data });
              this.searchIconSpinner = false;
              this.toastr.success('Lexical Concept added correctly', '', {
                timeOut: 5000,
              });
            }else{
              this.toastr.error(error.error, 'Error', {
                timeOut: 5000,
              });
            }
          }
        );

      },error=> {
        this.searchIconSpinner = false;
        this.toastr.error(error.error, 'Error', {
          timeOut: 5000,
        });
      }
    )
  }

  addNewSense() {
    this.searchIconSpinner = true;
    this.object['request'] = 'sense'
    if (this.isLexicalEntry) {
      let lexicalId = this.object.lexicalEntry;
      this.lexicalService.createNewSense(lexicalId).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
          this.toastr.success('Sense added correctly', '', {
            timeOut: 5000,
          });
        }, error => {
          this.searchIconSpinner = false;
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });

        }
      )
    } else if (this.isSense) {
      let parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      this.object['request'] = 'sense'
      //console.log(this.object);
      this.lexicalService.createNewSense(parentNodeInstanceName).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
          this.toastr.success('Sense added correctly', '', {
            timeOut: 5000,
          });
        }, error => {
          this.searchIconSpinner = false;
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        }
      )
    } else if (this.isForm) {
      let parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      this.object['request'] = 'sense'
      //console.log(this.object);
      this.lexicalService.createNewSense(parentNodeInstanceName).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
          this.toastr.success('Sense added correctly', '', {
            timeOut: 5000,
          });
          //this.lexicalService.refreshLexEntryTree();
        }, error => {
          this.searchIconSpinner = false;
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
          //this.lexicalService.refreshLexEntryTree();
        }
      )
    }

  }

  addNewEtymology() {
    this.searchIconSpinner = true;
    this.object['request'] = 'etymology'
    let parentNodeInstanceName = '';
    if (this.object.lexicalEntry != undefined
      && this.object.sense == undefined && this.object.form == undefined) {
      console.log(1)
      parentNodeInstanceName = this.object.lexicalEntry;
    } else if (this.object.form != undefined) {
      parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      console.log(2)
    } else if (this.object.sense != undefined) {
      parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      console.log(3)
    }

    console.log(parentNodeInstanceName)
    this.lexicalService.createNewEtymology(parentNodeInstanceName).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)
        if (data['creator'] == this.object.creator) {
          data['flagAuthor'] = false;
        } else {
          data['flagAuthor'] = true;
        }
        this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
        this.searchIconSpinner = false;
        this.toastr.success('Etymology added correctly', '', {
          timeOut: 5000,
        });
      }, error => {
        this.searchIconSpinner = false;
      }
    )

  }

  showBiblioModal() {
    this.modal.show();
  }

  addBibliographyItem(item?) {
    //@ts-ignore
    $("#biblioModal").modal("show");
    $('.modal-backdrop').appendTo('.ui-modal');
    //@ts-ignore
    $('#biblioModal').modal({ backdrop: 'static', keyboard: false })

    $('.modal-backdrop').css('height', 'inherit');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    let instance = '';
    if (this.object.lexicalEntry != undefined
      && this.object.sense == undefined
      && this.object.form == undefined) {
      instance = this.object.lexicalEntry;
    } else if (this.object.form != undefined) {
      instance = this.object.form;
    } else if (this.object.sense != undefined) {
      instance = this.object.sense;
    }

    if (item != undefined) {

      let id = item.data.key != undefined ? item.data.key : '';
      let title = item.data.title.replace("\"", '') != undefined ? item.data.title : '';
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
      console.log(instance, parameters)
      this.lexicalService.addBibliographyData(instance, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          setTimeout(() => {
            //@ts-ignore
            $('#biblioModal').modal('hide');
            $('.modal-backdrop').remove();
            this.toastr.success('Item added, check bibliography panel', '', {
              timeOut: 5000,
            });
            this.biblioService.triggerPanel(data)
            setTimeout(() => {
              this.modal.hide();
            }, 10);
          }, 300);
          this.biblioService.sendDataToBibliographyPanel(data);
        }, error => {
          console.log(error)
          if (typeof (error.error) == 'string' && error.error.length < 1000) {
            this.toastr.error(error.error, '', {
              timeOut: 5000,
            });
          } else {
            this.toastr.error(error.statusText, '', {
              timeOut: 5000,
            });
          }

          setTimeout(() => {
            //@ts-ignore
            $('#biblioModal').modal('hide');
            $('.modal-backdrop').remove();

            setTimeout(() => {
              this.modal.hide();
            }, 10);
          }, 300);

        }
      )
    }

  }

  checkIfCreatorExist(item?) {
    return item.some(element => element.creatorType === 'author')
  }

  triggerSearch(evt, query, queryMode) {
    if (evt.key != 'Control' && evt.key != 'Shift' && evt.key != 'Alt') {
      this.searchSubject.next({ query, queryMode })
    }
  }

  searchBibliography(query?: string, queryMode?: any) {
    this.start = 0;
    this.selectedItem = null;
    //@ts-ignore
    $("#biblioModal").modal("show");
    $('.modal-backdrop').appendTo('.table-body');
    //@ts-ignore
    $('#biblioModal').modal({ backdrop: 'static', keyboard: false })
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");
    this.tableBody.nativeElement.scrollTop = 0;
    if (this.queryTitle != '') {
      this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          this.bibliography = [];
          data.forEach(element => {
            this.bibliography.push(element)
          });
          //@ts-ignore
          $('#biblioModal').modal('hide');
          $('.modal-backdrop').remove();
        },
        error => {
          console.log(error)
        }
      )
    } else {
      this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          this.bibliography = [];
          data.forEach(element => {
            this.bibliography.push(element)
          });
          //@ts-ignore
          $('#biblioModal').modal('hide');
          $('.modal-backdrop').remove();
        },
        error => {
          console.log(error)
        }
      )
    }
  }

  onScrollDown() {
    //@ts-ignore
    $("#biblioModal").modal("show");
    $('.modal-backdrop').appendTo('.table-body');
    //@ts-ignore
    $('#biblioModal').modal({ backdrop: 'static', keyboard: false })
    $('.modal-backdrop').appendTo('.table-body');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    this.start += 25;

    if (this.queryTitle != '') {
      this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          //@ts-ignore
          $('#biblioModal').modal('hide');
          $('.modal-backdrop').remove();
          data.forEach(element => {
            this.bibliography.push(element)
          });
        }, error => {
          console.log(error)
        }
      )
    } else {
      this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).pipe(takeUntil(this.destroy$)).subscribe(
        data => {

          data.forEach(element => {
            this.bibliography.push(element)
          });

          //@ts-ignore
          $('#biblioModal').modal('hide');
          $('.modal-backdrop').remove();
        }, error => {
          console.log(error)
        }
      );
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

  sortBibliography(evt?, val?) {


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
    $("#biblioModal").modal("show");
    $('.modal-backdrop').appendTo('.table-body');
    //@ts-ignore
    $('#biblioModal').modal({ backdrop: 'static', keyboard: false })
    $('.modal-backdrop').appendTo('.table-body');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");
    this.start = 0;
    this.tableBody.nativeElement.scrollTop = 0;

    this.biblioService.filterBibliography(this.start, this.sortField, this.direction, this.queryTitle, this.queryMode).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)
        this.bibliography = [];
        //@ts-ignore
        $('#biblioModal').modal('hide');
        $('.modal-backdrop').remove();
        data.forEach(element => {
          this.bibliography.push(element)
        });
      }, error => {
        console.log(error)
      }
    )

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
    this.core_data_subscription.unsubscribe();
    this.expand_edit_subscription.unsubscribe();
    this.expand_epi_subscription.unsubscribe();
    this.update_core_card_subscription.unsubscribe();
    this.spinner_subscription.unsubscribe();
    this.search_subject_subscription.unsubscribe();
    this.biblio_bootstrap_subscription.unsubscribe();

    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
