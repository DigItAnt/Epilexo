/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { data } from 'jquery';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AnnotatorService } from 'src/app/services/annotator/annotator.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss']
})
export class SearchFormComponent implements OnInit {
  private search_subject: Subject<any> = new Subject();
  private search_lex_entries_subject: Subject<any> = new Subject();
  searchResults: any[];
  lex_searchResuts: any[];
  languages = [];
  morphologyData = [];
  lexEntryTypesData: any;
  typesData: any;
  addTagFormText: any;
  creator : any;


  constructor(private formBuilder: FormBuilder, private modalService: NgbModal, private toastr: ToastrService, private annotatorService: AnnotatorService, private lexicalService: LexicalEntriesService, private expander: ExpanderService, private renderer: Renderer2, private auth : AuthService) { }

  @Input() bind;
  @ViewChild('addFormModal') addFormModal: any;
  @ViewChild('select_form') select_form: NgSelectComponent;
  @ViewChild('search_lexicalEntry') search_lexicalEntry: NgSelectComponent;
  loader = false;
  modalStep = 0;

  stepOneForm = new FormGroup({
    existOrNot: new FormControl('', Validators.required),
  })

  stepTwoForm = new FormGroup({
    lexicalEntry: new FormControl('', Validators.required)
  })

  stepThreeForm = new FormGroup({
    label: new FormControl('', Validators.required),
    type: new FormControl('', Validators.required),
    language: new FormControl('', Validators.required),
    pos: new FormControl('', Validators.required),
  });

  stepFourForm = new FormGroup({
    writtenForm: new FormControl('', Validators.required),
    type: new FormControl('', Validators.required),
  });

  statusForm = new FormGroup({
    lexicalEntryCreation: new FormControl(''),
    attachingLanguage: new FormControl(''),
    attachingType: new FormControl(''),
    attachingLabel: new FormControl(''),
    attachingPos: new FormControl(''),
    creatingForm: new FormControl(''),
    attachingWrittenForm: new FormControl(''),
    attachingFormType: new FormControl(''),
    finish: new FormControl(''),
    error: new FormControl(null)
  })

  ngOnInit(): void {
    setTimeout(() => {
      //console.log(this.select_form);
    }, 1000);

    if(this.auth.getLoggedUser()['preferred_username'] != undefined){
      this.creator = this.auth.getLoggedUser()['preferred_username'];
    }

    this.search_lex_entries_subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onSearchLexicalEntriesFilter(data)
      }
    )

    this.search_subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    )

    this.lexicalService.getLexiconLanguages().subscribe(
      data => {
        this.languages = [];
        for (var i = 0; i < data.length; i++) {
          this.languages[i] = data[i]
        }
      }
    );

    this.lexicalService.getMorphologyData().subscribe(
      data => {
        /* this.morphologyData = data; */

        let morphoData = data;

        this.morphologyData = morphoData.filter(x => {
          if (x.propertyId == 'partOfSpeech') {
            return true;
          } else {
            return false;
          }
        })

        this.morphologyData = this.morphologyData[0]['propertyValues'];
      }
    )

    this.lexicalService.getLexEntryTypes().subscribe(
      data => {
        //console.log(data)
        this.lexEntryTypesData = data;

      }
    )

    this.lexicalService.getFormTypes().subscribe(
      data => {
        this.typesData = data;
        //console.log(this.typesData)
      },
      error => {
        //console.log(error)
      }
    )

    this.annotatorService.triggerSearch$.subscribe(
      request => {
        console.log(request);
        if (request != null) {
          this.bindSelection(request);
        }
      }, error => {

      }
    ).unsubscribe();


    this.stepOneForm = this.formBuilder.group({
      existOrNot: ['', Validators.required]
    })

    this.stepTwoForm = this.formBuilder.group({
      lexicalEntry: ['', Validators.required]
    })

    this.stepThreeForm = this.formBuilder.group({
      label: ['', Validators.required],
      type: ['', Validators.required],
      language: ['', Validators.required],
      pos: ['', Validators.required],
    });

    this.stepFourForm = this.formBuilder.group({
      writtenForm: ['', Validators.required],
      type: ['', Validators.required]
    });

    this.statusForm = this.formBuilder.group({
      lexicalEntryCreation: ['pause'],
      attachingLanguage: ['pause'],
      attachingType: ['pause'],
      attachingLabel: ['pause'],
      attachingPos: ['pause'],
      creatingForm: ['pause'],
      attachingWrittenForm: ['pause'],
      attachingFormType: ['pause'],
      finish: ['pause'],
      error: [null]
    })
  }


  triggerSearch(evt) {
    //console.log(evt)
    if (evt.target != undefined && evt.key != 'Control') {

      this.search_subject.next(evt.target.value)
    }
  }

  triggerSearchLexicalEntries(evt) {
    if (evt.target != undefined && evt.key != 'Control') {

      this.search_lex_entries_subject.next(evt.target.value)
    }
  }

  onSearchFilter(data) {
    this.searchResults = [];
    /* console.log(data) */
    let parameters = {
      text: data,
      searchMode: "startsWith",
      representationType: "writtenRep",
      author: "",
      offset: 0,
      limit: 500
    }
    console.log(parameters)
    if (data != undefined) { /* && data.length >= 3 */

      this.lexicalService.getFormList(parameters).subscribe(
        data => {
          console.log(data)
          this.searchResults = data['list'];
          this.loader = false;
        }, error => {
          console.log(error)
          this.loader = false;
        }
      )
    }

  }

  onSearchLexicalEntriesFilter(data) {
    this.searchResults = [];
    /* console.log(data) */
    let parameters = {
      text: data,
      searchMode: "startsWith",
      type: "",
      pos: "",
      formType: "entry",
      author: "",
      lang: "",
      status: "",
      offset: 0,
      limit: 500
    }

    console.log(parameters)
    if (data != "") { /* && data.length >= 3 */

      this.lexicalService.getLexicalEntriesList(parameters).subscribe(
        data => {
          console.log(data)
          this.lex_searchResuts = data['list'];
          this.loader = false;
        }, error => {
          //console.log(error)
        }
      )
    }

  }

  clearAll() {
    this.select_form.handleClearClick();
  }

  clearAllLexicalEntries() {
    this.search_lexicalEntry.handleClearClick();
  }

  bindSelection(req) {
    this.loader = true;
    setTimeout(() => {
      this.select_form.filter(req);
      this.onSearchFilter(req)
    }, 100);

  }

  /* ngOnDestroy(){
    this.lexicalService.
  } */

  handleForm(evt) {

    if (evt instanceof NgSelectComponent) {
      if (evt.selectedItems.length > 0) {
        /* console.log(evt.selectedItems[0]) */
        let label;
        if (evt.selectedItems[0]['value']['formInstanceName'] != undefined) {
          label = evt.selectedItems[0]['value']['formInstanceName'];
        } else {
          label = evt.selectedItems[0].label;
        }
        this.onChangeForm(evt.selectedItems[0]['value'])
      }
    } /* else {
        let label = evt.target.value;
        this.form_subject.next({ name: label})
    } */
  }


  onChangeForm(data) {



    let parameters = {}
    let idPopover = this.bind.selectedPopover.tokenId;
    let tokenData = this.bind.object[idPopover];
    let element_id = this.bind.epiData.element_id;
    let textSelection = this.bind.message;
    let selectionSpan = this.bind.spanSelection;
    let formValue = data.form;

    if(this.creator == undefined){
      this.creator = '';
    }

    console.log(selectionSpan)
    console.log(textSelection)
    if (textSelection != '' && textSelection != undefined) {
      //console.log(111)
      parameters["value"] = formValue;
      parameters["layer"] = "attestation";
      parameters["attributes"] = {
        author: this.creator,
        creator: this.creator,
        note: "",
        confidence: 1,
        timestamp: new Date().getTime().toString(),
        bibliography: [],
        validity: "",
        externalRef: "",
        node_id: tokenData.id,
        label: data.label,
        form_id: data.formInstanceName
      };
      parameters["spans"] = [
        {
          start: selectionSpan.start.toString(),
          end: selectionSpan.end.toString()
        }
      ];
      parameters["id"] = tokenData.node;
    } else if (textSelection == '' && !Array.isArray(selectionSpan) && !this.bind.isEmptyFile) {
      //console.log(222)
      parameters["value"] = formValue;
      parameters["layer"] = "attestation";
      parameters["attributes"] = {
        author: this.creator,
        creator: this.creator,
        note: "",
        confidence: 1,
        timestamp: new Date().getTime().toString(),
        bibliography: [],
        validity: "",
        externalRef: "",
        node_id: tokenData.id,
        label: data.label,
        form_id: data.formInstanceName
      };
      parameters["spans"] = [
        {
          start: tokenData.begin.toString(),
          end: tokenData.end.toString()
        }
      ];
      parameters["id"] = tokenData.node;
    } else if (Array.isArray(selectionSpan)) { //MULTIWORD
      //console.log(333)
      parameters["value"] = formValue;
      parameters["layer"] = "attestation";
      parameters["attributes"] = {
        author: this.creator,
        creator: this.creator,
        note: "",
        confidence: 1,
        timestamp: new Date().getTime().toString(),
        bibliography: [],
        validity: "",
        externalRef: "",
        node_id: tokenData.id,
        label: data.label,
        form_id: data.formInstanceName
      };
      parameters["spans"] = selectionSpan
      parameters["id"] = tokenData.node;
    } else if (this.bind.isEmptyFile) {
      parameters["value"] = formValue;
      parameters["layer"] = "attestation";
      parameters["attributes"] = {
        author: this.creator,
        creator: this.creator,
        note: "",
        confidence: 1,
        timestamp: new Date().getTime().toString(),
        bibliography: [],
        validity: "",
        externalRef: "",
        node_id: undefined,
        label: data.label,
        form_id: data.formInstanceName
      };
      parameters["spans"] = [
        {
          start: 0,
          end: 0
        }
      ];
      parameters["id"] = element_id;
    }
    //console.log(idPopover, tokenData, data);

    console.log(parameters)

    let identifier;

    if (!this.bind.isEmptyFile) {
      identifier = tokenData.node;
    } else {
      identifier = element_id
    }

    this.annotatorService.addAnnotation(parameters, identifier).subscribe(
      data => {
        console.log(data);
        this.bind.annotationArray.push(data.annotation);

        if (!this.bind.isEmptyFile) {
          this.bind.populateLocalAnnotation(tokenData);
        } else {
          this.bind.populateLocalAnnotation(data.annotation)
        }


        if (!this.bind.isEmptyFile) {
          this.bind.object.forEach(element => {
            if (data.annotation.attributes.node_id == element.id) {
              let positionElement = element.position;
              let elementHTML = document.getElementsByClassName('token-' + (positionElement - 1))[0]
              this.renderer.addClass(elementHTML, 'annotation');
            }
          });
        }


        this.toastr.success('New attestation created', 'Info', {
          timeOut: 5000
        })

      },
      error => {
        console.log(error);
        this.toastr.error('Error on create new attestation', 'Error', {
          timeOut: 5000
        })
      }
    )


  }

  addNewForm = (form: string) => {
    this.addTagFormText = form;


    let index = this.bind.selectedPopover.tokenId;
    let popover = this.bind.spanPopovers.toArray()[index];

    if (popover != undefined) {
      if (popover.isOpen()) {
        popover.close();
      }
    }

    this.modalService.open(this.addFormModal, {
      size: 'lg',
      windowClass: 'dark-modal',
      beforeDismiss: () => {
        if (this.stepOneForm.touched || this.stepTwoForm.touched || this.stepThreeForm.touched || this.stepFourForm.touched) {
          if (!confirm('There are unsaved changes. Do you really want to quit without saving?')) {
            return false;
          } else {
            this.stepOneForm.reset();
            this.stepOneForm.markAsUntouched();
            this.stepOneForm.markAsPristine();

            this.stepTwoForm.reset();
            this.stepTwoForm.markAsUntouched();
            this.stepTwoForm.markAsPristine();

            this.stepThreeForm.reset();
            this.stepThreeForm.markAsUntouched();
            this.stepThreeForm.markAsPristine();

            this.stepFourForm.reset();
            this.stepFourForm.markAsUntouched();
            this.stepFourForm.markAsPristine();

            this.statusForm.reset();
            this.statusForm.markAsPristine();
            this.statusForm.markAsUntouched();
            return true;
          }

        } else {
          this.stepOneForm.reset();
          this.stepOneForm.markAsUntouched();
          this.stepOneForm.markAsPristine();

          this.stepTwoForm.reset();
          this.stepTwoForm.markAsUntouched();
          this.stepTwoForm.markAsPristine();

          this.stepThreeForm.reset();
          this.stepThreeForm.markAsUntouched();
          this.stepThreeForm.markAsPristine();

          this.stepFourForm.reset();
          this.stepFourForm.markAsUntouched();
          this.stepFourForm.markAsPristine();
          return true;
        }
      }
    });
    this.modalStep = 1;

  }

  nextStep() {
    if (this.modalStep == 1) {
      if (this.stepOneForm.get('existOrNot').value == 'new') {
        this.modalStep = 3;
      } else {
        this.modalStep = 2;
      }

      if (this.stepTwoForm.touched) {
        this.stepTwoForm.reset();
        this.stepTwoForm.markAsUntouched();
        this.stepTwoForm.markAsPristine();
        this.clearAll();
      }

      if (this.stepThreeForm.touched) {
        this.stepThreeForm.reset();
        this.stepThreeForm.markAsUntouched();
        this.stepThreeForm.markAsPristine();
      }

      if (this.stepFourForm.touched) {
        this.stepFourForm.reset();
        this.stepFourForm.markAsUntouched();
        this.stepFourForm.markAsPristine();
      }

    } else if (this.modalStep == 3) {
      this.modalStep += 1;
      if (this.stepTwoForm.touched) {
        this.stepTwoForm.reset();
        this.stepTwoForm.markAsUntouched();
        this.stepTwoForm.markAsPristine();

        this.clearAll();
      }

      if (this.stepFourForm.touched) {
        this.stepFourForm.reset();
        this.stepFourForm.markAsUntouched();
        this.stepFourForm.markAsPristine();
      }

      this.stepFourForm.get('writtenForm').patchValue(this.addTagFormText, { emitEvent: false });

    } else if (this.modalStep == 2) {
      this.modalStep = 4;
      if (this.stepThreeForm.touched) {
        this.stepThreeForm.reset();
        this.stepThreeForm.markAsUntouched();
        this.stepThreeForm.markAsPristine();
      }

      if (this.stepFourForm.touched) {
        this.stepFourForm.reset();
        this.stepFourForm.markAsUntouched();
        this.stepFourForm.markAsPristine();
      }

      this.stepFourForm.get('writtenForm').patchValue(this.addTagFormText, { emitEvent: false });
    } else {
      this.modalStep += 1;

      if (this.modalStep == 6) {
        this.wizardFactory();
      }

      if (this.modalStep > 6) {
        this.modalStep = 6;
      }
    }

  }

  previousStep() {
    if (this.modalStep == 2) {
      this.modalStep -= 1;
    } else if (this.modalStep == 3) {
      this.modalStep = 1;
    } else if (this.modalStep == 4) {

      if (this.stepThreeForm.touched) {
        this.modalStep = 3;
      } else if (this.stepTwoForm.touched) {
        this.modalStep = 2;
      }
    } else if (this.modalStep == 5) {
      this.modalStep -= 1;
    }
  }

  wizardFactory() {

    //nuova lexical entry
    if (this.stepThreeForm.touched) {

      //lexical entry creazion
      this.statusForm.get('lexicalEntryCreation').patchValue('pending', { emitEvent: false });
      this.lexicalService.newLexicalEntry().subscribe(
        data => {
          console.log(data);

          this.statusForm.get('lexicalEntryCreation').patchValue('ok', { emitEvent: false })

          this.statusForm.get('attachingLanguage').patchValue('pending', { emitEvent: false })
          //attaching language
          let lexId = data.lexicalEntryInstanceName;
          let lang = this.stepThreeForm.get('language').value;
          let parameters = {
            relation: 'language',
            value: lang
          }

          this.lexicalService.updateLexicalEntry(lexId, parameters).subscribe(
            data => {
              console.log(data)
            }, error => {
              console.log(error);

              if (error.status == 200) {
                this.statusForm.get('attachingLanguage').patchValue('ok', { emitEvent: false });


                //attaching type
                this.statusForm.get('attachingType').patchValue('pending', { emitEvent: false });
                let type = this.stepThreeForm.get('type').value;
                let parameters = {
                  relation: 'type',
                  value: type
                }

                this.lexicalService.updateLexicalEntry(lexId, parameters).subscribe(
                  data => {
                    console.log(data)
                  }, error => {
                    console.log(error);
                    if (error.status == 200) {

                      this.statusForm.get('attachingType').patchValue('ok', { emitEvent: false });

                      this.statusForm.get('attachingLabel').patchValue('pending', { emitEvent: false });
                      //attaching label
                      let label = this.stepThreeForm.get('label').value;
                      let parameters = {
                        relation: 'label',
                        value: label
                      };

                      this.lexicalService.updateLexicalEntry(lexId, parameters).subscribe(
                        data => {
                          console.log(data)
                        }, error => {
                          console.log(error);

                          if (error.status == 200) {
                            this.statusForm.get('attachingLabel').patchValue('ok', { emitEvent: false });


                            //attaching pos
                            this.statusForm.get('attachingPos').patchValue('pending', { emitEvent: false });

                            let pos = this.stepThreeForm.get('pos').value;
                            let parameters = {
                              type: 'morphology',
                              relation: 'partOfSpeech',
                              value: pos
                            }

                            this.lexicalService.updateLinguisticRelation(lexId, parameters).subscribe(
                              data => {
                                console.log(data)
                              }, error => {
                                console.log(error);

                                this.statusForm.get('attachingPos').patchValue('ok', { emitEvent: false });

                                //creating form
                                this.statusForm.get('creatingForm').patchValue('pending', { emitEvent: false });


                                this.lexicalService.createNewForm(lexId).subscribe(
                                  data=>{
                                    console.log(data);

                                    let formId = data.formInstanceName;

                                    this.statusForm.get('creatingForm').patchValue('ok', { emitEvent: false });


                                    //attaching writtenRep to form
                                    this.statusForm.get('attachingWrittenForm').patchValue('pending', { emitEvent: false });
                                    let writtenRep = this.stepFourForm.get('writtenForm').value;
                                    let parameters = {
                                      relation: 'writtenRep',
                                      value: writtenRep
                                    }

                                    this.lexicalService.updateForm(formId, parameters).subscribe(
                                      data=>{
                                        console.log(data)
                                        this.statusForm.get('attachingWrittenForm').patchValue('ok', { emitEvent: false });
                                      },error=>{
                                        console.log(error)
                                        this.statusForm.get('attachingWrittenForm').patchValue('ok', { emitEvent: false });

                                        //attach type to form
                                        this.statusForm.get('attachingFormType').patchValue('pending', { emitEvent: false });
                                        let typeForm = this.stepFourForm.get('type').value;

                                        let parameters = {
                                          relation: 'type',
                                          value : typeForm
                                        }

                                        this.lexicalService.updateForm(formId, parameters).subscribe(
                                          data=>{
                                            console.log(data);
                                            this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });
                                            this.statusForm.get('finish').patchValue('ok', { emitEvent: false });
                                          },error=>{
                                            console.log(error);
                                            this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });

                                            this.statusForm.get('finish').patchValue('ok', { emitEvent: false });

                                          }
                                        )
                                      }
                                    )

                                  },error=>{
                                    console.log(error);

                                  }
                                )
                              }
                            )
                          }
                        }
                      )

                    }
                  }
                )

              }
            }
          )

        }, error => {
          console.log(error)
        }
      )
    } else if (this.stepTwoForm.touched) { //lexical entry esistente

      let lexId = this.stepTwoForm.get('lexicalEntry').value;
      //creating form
      this.statusForm.get('creatingForm').patchValue('pending', { emitEvent: false });


      this.lexicalService.createNewForm(lexId).subscribe(
        data=>{
          console.log(data);

          let formId = data.formInstanceName;

          this.statusForm.get('creatingForm').patchValue('ok', { emitEvent: false });


          //attaching writtenRep to form
          this.statusForm.get('attachingWrittenForm').patchValue('pending', { emitEvent: false });
          let writtenRep = this.stepFourForm.get('writtenForm').value;
          let parameters = {
            relation: 'writtenRep',
            value: writtenRep
          }

          this.lexicalService.updateForm(formId, parameters).subscribe(
            data=>{
              console.log(data)
              this.statusForm.get('attachingWrittenForm').patchValue('ok', { emitEvent: false });
            },error=>{
              console.log(error)
              this.statusForm.get('attachingWrittenForm').patchValue('ok', { emitEvent: false });

              //attach type to form
              this.statusForm.get('attachingFormType').patchValue('pending', { emitEvent: false });
              let typeForm = this.stepFourForm.get('type').value;

              let parameters = {
                relation: 'type',
                value : typeForm
              }

              this.lexicalService.updateForm(formId, parameters).subscribe(
                data=>{
                  console.log(data);
                  this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });
                  this.statusForm.get('finish').patchValue('ok', { emitEvent: false });
                },error=>{
                  console.log(error);
                  this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });

                  this.statusForm.get('finish').patchValue('ok', { emitEvent: false });

                }
              )
            }
          )

        },error=>{
          console.log(error);

        }
      )
      
    }
  }

}
