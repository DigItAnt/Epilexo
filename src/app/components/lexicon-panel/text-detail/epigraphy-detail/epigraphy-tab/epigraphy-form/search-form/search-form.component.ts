/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { data } from 'jquery';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AnnotatorService } from 'src/app/services/annotator/annotator.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DocumentSystemService } from 'src/app/services/document-system/document-system.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss']
})
export class SearchFormComponent implements OnInit, OnDestroy {
  private search_subject: Subject<any> = new Subject();
  private search_lex_entries_subject: Subject<any> = new Subject();
  searchResults: any[];
  lex_searchResuts: any[];
  languages = [];
  morphologyData = [];
  lexEntryTypesData: any;
  typesData: any;
  addTagFormText: any;
  creator: any;


  search_subscription: Subscription;
  get_languages_subscription: Subscription;
  get_morphology_subscription: Subscription;
  get_lex_entry_type_subscription: Subscription;
  get_form_type_subscription: Subscription;

  constructor(private formBuilder: FormBuilder, 
              private modalService: NgbModal, 
              private toastr: ToastrService, 
              private annotatorService: AnnotatorService, 
              private lexicalService: LexicalEntriesService, 
              private expander: ExpanderService, 
              private renderer: Renderer2, 
              private auth: AuthService,
              private documentService : DocumentSystemService) { }

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

  destroy$: Subject<boolean> = new Subject();

  ngOnInit(): void {
    setTimeout(() => {
      //console.log(this.select_form);
    }, 1000);

    if (this.auth.getLoggedUser()['preferred_username'] != undefined) {
      this.creator = this.auth.getLoggedUser()['preferred_username'];
    }

    this.search_lex_entries_subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onSearchLexicalEntriesFilter(data)
      }
    )

    this.search_subject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    )

    this.get_languages_subscription = this.lexicalService.getLexiconLanguages().subscribe(
      data => {
        this.languages = [];
        for (var i = 0; i < data.length; i++) {
          this.languages[i] = data[i]
        }
      }
    );

    this.get_morphology_subscription = this.lexicalService.getMorphologyData().subscribe(
      data => {
        /* this.morphologyData = data; */

        let morphoData = data;

        this.morphologyData = morphoData.filter((x : any) => {
          if (x.propertyId == 'http://www.lexinfo.net/ontology/3.0/lexinfo#partOfSpeech') {
            return true;
          } else {
            return false;
          }
        })

        this.morphologyData = this.morphologyData[0]['propertyValues'];
      }
    )

    this.get_lex_entry_type_subscription = this.lexicalService.getLexEntryTypes().subscribe(
      data => {
        //console.log(data)
        this.lexEntryTypesData = data;

      }
    )

    this.get_form_type_subscription = this.lexicalService.getFormTypes().subscribe(
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

  async onSearchFilter(data) {
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

      try {
        let form_list = await this.lexicalService.getFormList(parameters).toPromise();
        this.searchResults = form_list['list'];
        this.loader = false;

      } catch (error) {
        console.log(error)
        this.loader = false;
      }
    }

  }

  async onSearchLexicalEntriesFilter(data) {
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

      try {
        let lex_list = await this.lexicalService.getLexicalEntriesList(parameters).toPromise();
        this.lex_searchResuts = lex_list['list'];
        this.loader = false;
      } catch (error) {
        console.log(error)
      }

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




  handleForm(ngSelect, $event) {

    if (ngSelect instanceof NgSelectComponent) {
      if (ngSelect.selectedItems.length > 0) {
        /* console.log(ngSelect.selectedItems[0]) */
        let label;
        if (ngSelect.selectedItems[0]['value']['form'] != undefined) {
          label = ngSelect.selectedItems[0]['value']['form'];
        } else {
          label = ngSelect.selectedItems[0].label;
        }
        this.onChangeForm(ngSelect.selectedItems[0]['value'])
      }
    } /* else {
        let label = evt.target.value;
        this.form_subject.next({ name: label})
    } */
  }


  async onChangeForm(data) {

    //TODO: aggiungere leiden

    let parameters = {}
    let idPopover = this.bind.selectedPopover.tokenId;
    let tokenData = this.bind.object[idPopover];
    let element_id = this.bind.epiData.element_id;
    let textSelection = this.bind.message;
    let selectionSpan = this.bind.spanSelection;
    let formValue = data.form;

    let leidenToken = '';
    if(tokenData != undefined){
      let xmlNode = this.bind.epiData.xmlDoc.querySelectorAll('[*|id=\'' + tokenData.xmlid + '\']')[0].outerHTML;
      let object = {
        xmlString: xmlNode
      }
      
      try {
        let convert_to_leiden = await this.documentService.testConvertItAnt(object).toPromise();
        console.log(convert_to_leiden);
        let raw = convert_to_leiden['xml'];
        let bodyResponse = new DOMParser().parseFromString(raw, "text/html").body;
        
        bodyResponse.childNodes.forEach(
          x => {
            if (x.nodeName != undefined) {
              if (x.nodeName == '#text') {
                leidenToken += x.nodeValue.replace('\n', '');
              }
            }
          }
        )
        } catch (error) {
  
      }
    }
    



    if (this.creator == undefined) {
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
        leiden : leidenToken != '' ? leidenToken : null,
        node_id: tokenData.id,
        label: data.label,
        lexicalEntry: data.lexicalEntry
      };
      parameters["spans"] = [
        {
          start: selectionSpan.start.toString(),
          end: selectionSpan.end.toString()
        }
      ];
      parameters["id"] = tokenData.node;
    } else if (textSelection == '' && !Array.isArray(selectionSpan) && !this.bind.isEmptyFile) {
      parameters["value"] = formValue;
      parameters["layer"] = "attestation";
      parameters["attributes"] = {
        author: this.creator,
        creator: this.creator,
        note: "",
        confidence: 1,
        timestamp: new Date().getTime().toString(),
        bibliography: [],
        leiden : leidenToken,
        validity: "",
        externalRef: "",
        node_id: tokenData.id,
        label: data.label,
        lexicalEntry: data.lexicalEntry
      };
      parameters["spans"] = [
        {
          start: tokenData.begin.toString(),
          end: tokenData.end.toString()
        }
      ];
      parameters["id"] = tokenData.node;
    } else if (Array.isArray(selectionSpan)) { //MULTIWORD
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
        leiden : leidenToken,
        node_id: tokenData.id,
        label: data.label,
        lexicalEntry: data.lexicalEntry
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
        leiden : leidenToken,
        externalRef: "",
        node_id: undefined,
        label: data.label,
        lexicalEntry: data.lexicalEntry
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

    try {
      let add_annotation_request = await this.annotatorService.addAnnotation(parameters, identifier).toPromise()
      console.log(data);
      this.bind.annotationArray.push(add_annotation_request.annotation);

      if (!this.bind.isEmptyFile) {
        this.bind.populateLocalAnnotation(tokenData);
      } else {
        this.bind.populateLocalAnnotation(add_annotation_request.annotation)
      }


      if (!this.bind.isEmptyFile) {
        this.bind.object.forEach(element => {
          if (add_annotation_request.annotation.attributes.node_id == element.id) {
            let positionElement = element.position;
            let elementHTML = document.getElementsByClassName('token-' + (positionElement - 1))[0]
            this.renderer.addClass(elementHTML, 'annotation');
          }
        });
      }


      this.toastr.success('New attestation created', 'Info', {
        timeOut: 5000
      })
    } catch (error) {
      if (error.status != 200) {
        this.toastr.error('Error on create new attestation', 'Error', {
          timeOut: 5000
        })
      }
    }
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

  async wizardFactory() {

    //TODO: attaccargli token alla fine

    //nuova lexical entry
    if (this.stepThreeForm.touched) {

      //lexical entry creazion
      this.statusForm.get('lexicalEntryCreation').patchValue('pending', { emitEvent: false });

      try {
        let new_lex_entry_request = await this.lexicalService.newLexicalEntry().toPromise();

        this.statusForm.get('lexicalEntryCreation').patchValue('ok', { emitEvent: false })
        this.statusForm.get('attachingLanguage').patchValue('pending', { emitEvent: false })

        //attaching language
        let lexId = new_lex_entry_request['lexicalEntry'];
        let lang = this.stepThreeForm.get('language').value;
        let parameters = {
          relation: 'http://www.w3.org/ns/lemon/lime#entry',
          value: lang
        }

        try {
          let update_lang_new_lex_request = await this.lexicalService.updateLexicalEntry(lexId, parameters).toPromise();
        } catch (error) {

          if (error.status == 200) {
            this.statusForm.get('attachingLanguage').patchValue('ok', { emitEvent: false });
            //attaching type
            this.statusForm.get('attachingType').patchValue('pending', { emitEvent: false });
            let type = this.stepThreeForm.get('type').value;
            let parameters = {
              relation: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              value: type
            }

            try {
              let attach_type_req = await this.lexicalService.updateLexicalEntry(lexId, parameters).toPromise()
            } catch (error) {
              if (error.status == 200) {
                this.statusForm.get('attachingType').patchValue('ok', { emitEvent: false });

                this.statusForm.get('attachingLabel').patchValue('pending', { emitEvent: false });
                //attaching label
                let label = this.stepThreeForm.get('label').value;
                let parameters = {
                  relation: 'http://www.w3.org/2000/01/rdf-schema#label',
                  value: label
                };

                try {
                  let attach_label = await this.lexicalService.updateLexicalEntry(lexId, parameters).toPromise();

                } catch (error) {
                  if (error.status == 200) {
                    this.statusForm.get('attachingLabel').patchValue('ok', { emitEvent: false });
                    //attaching pos
                    this.statusForm.get('attachingPos').patchValue('pending', { emitEvent: false });

                    let pos = this.stepThreeForm.get('pos').value;
                    let parameters = {
                      type: 'morphology',
                      relation: 'http://www.lexinfo.net/ontology/3.0/lexinfo#partOfSpeech',
                      value: pos
                    }

                    try {
                      let attach_pos = await this.lexicalService.updateLinguisticRelation(lexId, parameters).toPromise();
                    } catch (error) {
                      if (error.status == 200) {
                        this.statusForm.get('attachingPos').patchValue('ok', { emitEvent: false });

                        //creating form
                        this.statusForm.get('creatingForm').patchValue('pending', { emitEvent: false });

                        try {
                          let create_form = await this.lexicalService.createNewForm(lexId).toPromise();
                          console.log(create_form);
                          let formId = create_form.form;
                          let formData = create_form;
                          this.statusForm.get('creatingForm').patchValue('ok', { emitEvent: false });


                          //attaching writtenRep to form
                          this.statusForm.get('attachingWrittenForm').patchValue('pending', { emitEvent: false });
                          let writtenRep = this.stepFourForm.get('writtenForm').value;
                          let parameters = {
                            relation: 'http://www.w3.org/ns/lemon/ontolex#writtenRep',
                            value: writtenRep
                          }

                          try {
                            let attach_written_rep = await this.lexicalService.updateForm(formId, parameters).toPromise();
                          } catch (error) {
                            if (error.status == 200) {
                              this.statusForm.get('attachingWrittenForm').patchValue('ok', { emitEvent: false });
                              //attach type to form
                              this.statusForm.get('attachingFormType').patchValue('pending', { emitEvent: false });
                              let typeForm = this.stepFourForm.get('type').value;

                              let parameters = {
                                relation: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                                value: typeForm
                              }

                              try {
                                let attach_type_form = await this.lexicalService.updateForm(formId, parameters).toPromise();
                                this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });
                                this.statusForm.get('finish').patchValue('ok', { emitEvent: false });
                              } catch (error) {
                                if (error.status == 200) {
                                  this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });
                                  this.statusForm.get('finish').patchValue('ok', { emitEvent: false });


                                  let parameters = {}
                                  let idPopover = this.bind.selectedPopover.tokenId;
                                  let tokenData = this.bind.object[idPopover];
                                  let element_id = this.bind.epiData.element_id;
                                  let textSelection = this.bind.message;
                                  let selectionSpan = this.bind.spanSelection;
                                  let formValue = formId;

                                  let xmlNode = this.bind.epiData.xmlDoc.querySelectorAll('[*|id=\'' + tokenData.xmlid + '\']')[0].outerHTML;
                                  let object = {
                                    xmlString: xmlNode
                                  }
                                  let leidenToken = '';
                                  try {
                                    let convert_to_leiden = await this.documentService.testConvertItAnt(object).toPromise();
                                    console.log(convert_to_leiden);
                                    let raw = convert_to_leiden['xml'];
                                    let bodyResponse = new DOMParser().parseFromString(raw, "text/html").body;
                                    
                                    bodyResponse.childNodes.forEach(
                                      x => {
                                        if (x.nodeName != undefined) {
                                          if (x.nodeName == '#text') {
                                            leidenToken += x.nodeValue.replace('\n', '');
                                          }
                                        }
                                      }
                                    )
                                  } catch (error) {

                                  }



                                  if (this.creator == undefined) {
                                    this.creator = '';
                                  }


                                  parameters["value"] = formValue;
                                  parameters["layer"] = "attestation";
                                  parameters["attributes"] = {
                                    author: this.creator,
                                    creator: this.creator,
                                    note: "",
                                    confidence: 1,
                                    timestamp: new Date().getTime().toString(),
                                    bibliography: [],
                                    leiden : leidenToken,
                                    validity: "",
                                    externalRef: "",
                                    node_id: tokenData.id,
                                    label: writtenRep,
                                    lexicalEntry: formData.lexicalEntry
                                  };
                                  parameters["spans"] = [
                                    {
                                      start: tokenData.begin.toString(),
                                      end: tokenData.end.toString()
                                    }
                                  ];
                                  parameters["id"] = tokenData.node;


                                  let identifier;

                                  if (!this.bind.isEmptyFile) {
                                    identifier = tokenData.node;
                                  } else {
                                    identifier = element_id
                                  }

                                  try {
                                    let add_annotation_request = await this.annotatorService.addAnnotation(parameters, identifier).toPromise()
                                    console.log(data);
                                    this.bind.annotationArray.push(add_annotation_request.annotation);
                              
                                    if (!this.bind.isEmptyFile) {
                                      this.bind.populateLocalAnnotation(tokenData);
                                    } else {
                                      this.bind.populateLocalAnnotation(add_annotation_request.annotation)
                                    }
                              
                              
                                    if (!this.bind.isEmptyFile) {
                                      this.bind.object.forEach(element => {
                                        if (add_annotation_request.annotation.attributes.node_id == element.id) {
                                          let positionElement = element.position;
                                          let elementHTML = document.getElementsByClassName('token-' + (positionElement - 1))[0]
                                          this.renderer.addClass(elementHTML, 'annotation');
                                        }
                                      });
                                    }
                              
                              
                                    this.toastr.success('New attestation created', 'Info', {
                                      timeOut: 5000
                                    })
                                  } catch (error) {
                                    if (error.status != 200) {
                                      this.toastr.error('Error on create new attestation', 'Error', {
                                        timeOut: 5000
                                      })
                                    }
                                  }
                                } else {
                                  this.toastr.error("Error on attaching form type", "Error", { timeOut: 5000 })
                                }
                              }

                            } else {
                              this.toastr.error("Error on attaching writtenRep", "Error", { timeOut: 5000 })
                            }
                          }
                        } catch (error) {
                          this.toastr.error("Error on creating new form", "Error", { timeOut: 5000 })
                        }
                      } else {
                        this.toastr.error("Error on attaching POS", "Error", { timeOut: 5000 })
                      }
                    }
                  } else {
                    this.toastr.error("Error on attaching label", "Error", { timeOut: 5000 })
                  }
                }
              } else {
                this.toastr.error("Error on attaching type", "Error", { timeOut: 5000 })
              }

            }
          } else {
            this.toastr.error(error.error.message, "Error")
          }

        }
      } catch (error) {
        this.toastr.error("Error on creating lexical entry", "Error")
      }
    } else if (this.stepTwoForm.touched) { //lexical entry esistente

      let lexId = this.stepTwoForm.get('lexicalEntry').value;
      //creating form
      this.statusForm.get('creatingForm').patchValue('pending', { emitEvent: false });

      try {
        let create_new_form = await this.lexicalService.createNewForm(lexId).toPromise();
        console.log(create_new_form);

        let formId = create_new_form.form;

        this.statusForm.get('creatingForm').patchValue('ok', { emitEvent: false });


        //attaching writtenRep to form
        this.statusForm.get('attachingWrittenForm').patchValue('pending', { emitEvent: false });
        let writtenRep = this.stepFourForm.get('writtenForm').value;
        let parameters = {
          relation: 'http://www.w3.org/ns/lemon/ontolex#writtenRep',
          value: writtenRep
        }

        try {
          let attach_written_rep = await this.lexicalService.updateForm(formId, parameters).toPromise();
        } catch (error) {
          if (error.status == 200) {
            this.statusForm.get('attachingWrittenForm').patchValue('ok', { emitEvent: false });
            //attach type to form
            this.statusForm.get('attachingFormType').patchValue('pending', { emitEvent: false });
            let typeForm = this.stepFourForm.get('type').value;

            let parameters = {
              relation: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
              value: typeForm
            }

            try {
              let attach_type = await this.lexicalService.updateForm(formId, parameters).toPromise();
              this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });
              this.statusForm.get('finish').patchValue('ok', { emitEvent: false });
            } catch (error) {
              if (error.status == 200) {
                this.statusForm.get('attachingFormType').patchValue('ok', { emitEvent: false });
                this.statusForm.get('finish').patchValue('ok', { emitEvent: false });


                let parameters = {}
                let idPopover = this.bind.selectedPopover.tokenId;
                let tokenData = this.bind.object[idPopover];
                let element_id = this.bind.epiData.element_id;
                let textSelection = this.bind.message;
                let selectionSpan = this.bind.spanSelection;
                let formValue = formId;

                let xmlNode = this.bind.epiData.xmlDoc.querySelectorAll('[*|id=\'' + tokenData.xmlid + '\']')[0].outerHTML;
                let object = {
                  xmlString: xmlNode
                }
                let leidenToken = '';
                try {
                  let convert_to_leiden = await this.documentService.testConvertItAnt(object).toPromise();
                  console.log(convert_to_leiden);
                  let raw = convert_to_leiden['xml'];
                  let bodyResponse = new DOMParser().parseFromString(raw, "text/html").body;
                  
                  bodyResponse.childNodes.forEach(
                    x => {
                      if (x.nodeName != undefined) {
                        if (x.nodeName == '#text') {
                          leidenToken += x.nodeValue.replace('\n', '');
                        }
                      }
                    }
                  )
                } catch (error) {

                }



                if (this.creator == undefined) {
                  this.creator = '';
                }


                parameters["value"] = formValue;
                parameters["layer"] = "attestation";
                parameters["attributes"] = {
                  author: this.creator,
                  creator: this.creator,
                  note: "",
                  confidence: 1,
                  timestamp: new Date().getTime().toString(),
                  bibliography: [],
                  leiden : leidenToken,
                  validity: "",
                  externalRef: "",
                  node_id: tokenData.id,
                  label: writtenRep,
                  lexicalEntry: lexId
                };
                parameters["spans"] = [
                  {
                    start: tokenData.begin.toString(),
                    end: tokenData.end.toString()
                  }
                ];
                parameters["id"] = tokenData.node;


                let identifier;

                if (!this.bind.isEmptyFile) {
                  identifier = tokenData.node;
                } else {
                  identifier = element_id
                }

                try {
                  let add_annotation_request = await this.annotatorService.addAnnotation(parameters, identifier).toPromise()
                  console.log(data);
                  this.bind.annotationArray.push(add_annotation_request.annotation);
            
                  if (!this.bind.isEmptyFile) {
                    this.bind.populateLocalAnnotation(tokenData);
                  } else {
                    this.bind.populateLocalAnnotation(add_annotation_request.annotation)
                  }
            
            
                  if (!this.bind.isEmptyFile) {
                    this.bind.object.forEach(element => {
                      if (add_annotation_request.annotation.attributes.node_id == element.id) {
                        let positionElement = element.position;
                        let elementHTML = document.getElementsByClassName('token-' + (positionElement - 1))[0]
                        this.renderer.addClass(elementHTML, 'annotation');
                      }
                    });
                  }
            
            
                  this.toastr.success('New attestation created', 'Info', {
                    timeOut: 5000
                  })
                } catch (error) {
                  if (error.status != 200) {
                    this.toastr.error('Error on create new attestation', 'Error', {
                      timeOut: 5000
                    })
                  }
                }
              } else {
                this.toastr.error("Error on attaching type", "Error", { timeOut: 5000 })
              }
            }
          } else {
            this.toastr.error("Error on attaching writtenRep", "Error", { timeOut: 5000 })
          }
        }
      } catch (error) {
        if (error.status != 200) {
          this.toastr.error("Error on creating new form", "Error", { timeOut: 5000 });
        }
      }
    }
  }

  ngOnDestroy(): void {
    //this.search_subscription.unsubscribe();
    this.get_languages_subscription.unsubscribe();
    this.get_morphology_subscription.unsubscribe();
    this.get_lex_entry_type_subscription.unsubscribe();
    this.get_form_type_subscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
