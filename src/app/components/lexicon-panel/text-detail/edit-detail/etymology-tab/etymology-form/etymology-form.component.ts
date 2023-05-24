/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnDestroy, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, pairwise, startWith, takeUntil } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { LilaService } from 'src/app/services/lila/lila.service';

@Component({
  selector: 'app-etymology-form',
  templateUrl: './etymology-form.component.html',
  styleUrls: ['./etymology-form.component.scss']
})
export class EtymologyFormComponent implements OnInit, OnDestroy {

  @Input() etymData: any;
  @ViewChildren('etyLink') etyLinkList: QueryList<NgSelectComponent>;
  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;
  componentRef: any;

  subject_cognates_subscription: Subscription;
  subject_etylink_subscription: Subscription;
  subject_etylink_input_subscription: Subscription;
  subject_cognates_input_subscription: Subscription;
  subject_etylink_note_subscription: Subscription;
  subject_etylink_label_subscription: Subscription;



  etyForm = new FormGroup({
    label: new FormControl(''),
    author: new FormControl(''),
    confidence: new FormControl(null),
    etylink: new FormArray([this.createEtyLink()]),
    cognates: new FormArray([this.createCognate()]),
    isEtymon: new FormControl(false),
    isCognate: new FormControl(false)
  })

  etyLinkArray: FormArray;
  cognatesArray: FormArray;

  private subject_cognates: Subject<any> = new Subject();
  private subject_cognates_input: Subject<any> = new Subject();
  private subject_etylink: Subject<any> = new Subject();
  private subject_etylink_input: Subject<any> = new Subject();
  private etylink_note_subject: Subject<any> = new Subject();
  private etylink_label_subject: Subject<any> = new Subject();
  searchResults = [];
  filterLoading = false;

  memoryLinks = [];
  memoryConfidence = null;

  destroy$ : Subject<boolean> = new Subject();

  constructor(private lexicalService: LexicalEntriesService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private lilaService: LilaService) { }

  ngOnInit(): void {

    this.etyForm = this.formBuilder.group({
      label: '',
      author: '',
      confidence: false,
      etylink: this.formBuilder.array([]),
      cognates: this.formBuilder.array([]),
      isEtymon: false,
      isCognate: false
    })
    this.onChanges();
    this.triggerTooltip();

    

    this.subject_cognates_subscription = this.subject_cognates.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        if (data != null) {
          this.onSearchFilter(data)

        }
      }
    )

    this.subject_etylink_subscription = this.subject_etylink.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        if (data != null) {
          this.onSearchFilter(data)

        }
      }
    )

    this.subject_etylink_input_subscription = this.subject_etylink_input.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)
        if (data != null) {
          let value = data['value'];
          let index = data['i'];
          this.onChangeEtylink(value, index)
        }

      }
    )

    this.subject_cognates_input_subscription = this.subject_cognates_input.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    )

    this.subject_etylink_note_subscription = this.etylink_note_subject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onChangeEtylinkNote(data)
      }
    )

    this.subject_etylink_label_subscription = this.etylink_label_subject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onChangeEtylinkLabel(data)
      }
    )
  }


  triggerTooltip() {
    setTimeout(() => {
      //@ts-ignore
      $('.vartrans-tooltip').tooltip({
        trigger: 'hover'
      });
    }, 500);
  }

  ngOnChanges(changes: SimpleChanges) {

    if (this.object != changes.etymData.currentValue) {
      if (this.etyLinkArray != undefined || this.cognatesArray != undefined) {
        this.etyLinkArray.clear();
        //this.cognatesArray.clear();

        this.memoryLinks = [];
        this.memoryConfidence = null;
      }
    }
    this.object = changes.etymData.currentValue;
    console.log(this.object)
    if (this.object != null) {
      this.etyForm.get('label').setValue(this.object.etymology.label, { emitEvent: false });
      this.etyForm.get('author').setValue(this.object.etymology.hypothesisOf, { emitEvent: false });
      if (this.object.etymology.confidence == 0) {
        this.etyForm.get('confidence').setValue(true, { emitEvent: false });
      } else {
        this.etyForm.get('confidence').setValue(false, { emitEvent: false });
      }

      if(typeof(this.object.type) == 'string'){
        if(this.object.type == 'Cognate'){
          this.etyForm.get('isCognate').setValue(true, { emitEvent: false })

        }else{
          this.etyForm.get('isCognate').setValue(false, { emitEvent: false })

        }
      }else{
        let isCognate = this.object.type.find(element => element == 'Cognate');
        if (isCognate) {
          this.etyForm.get('isCognate').setValue(true, { emitEvent: false })
        } else {
          this.etyForm.get('isCognate').setValue(false, { emitEvent: false })
        }
      }
      
      
      let isEtymon = this.object.type.find(element => element == 'Etymon');
      if (isEtymon) {
        this.etyForm.get('isEtymon').setValue(true, { emitEvent: false })
      } else {
        this.etyForm.get('isEtymon').setValue(false, { emitEvent: false })
      }

      if (this.object.etyLinks != undefined) {
        if (this.object.etyLinks.length != 0) {
          this.object.etyLinks.forEach(element => {
            let lex_entity = element.etySourceLabel == '' ? element.etySource : element.etySourceLabel;
            let label = element.label == '' ? element.etySourceLabel : element.label;
            let ety_type = element.etyLinkType;
            let ety_source = element.etySource;
            let ety_target = element.etyTarget;
            let note = element.note;
            let external_iri = element.externalIRI;
            this.addEtyLink(lex_entity, label, ety_type, ety_source, ety_target, note, external_iri);
            this.memoryLinks.push(element);
            /* console.log(element) */
          });
        }
      }
    }
    this.triggerTooltip();

  }


  onChanges(): void {
   
    this.etyForm.get('confidence').valueChanges.pipe(debounceTime(100), startWith(this.etyForm.get('confidence').value), pairwise(), takeUntil(this.destroy$)).subscribe(([prev, next]: [any, any]) => {
      this.lexicalService.spinnerAction('on');
      let etyId = this.object.etymology.etymology;

      this.etyForm.get('confidence').setValue(next, { emitEvent: false });

      let oldValue = prev ? 0 : 1;
      let newValue = next ? 0 : 1;
      let parameters = {
       /*  type: "confidence", */
        relation: 'http://www.lexinfo.net/ontology/3.0/lexinfo#confidence',
        value: newValue
      };


      if (this.memoryConfidence != null) parameters['currentValue'] = oldValue;
      this.memoryConfidence = oldValue;

      this.lexicalService.updateEtymology(etyId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => { },
        error => {
          if (error.status == 200) this.toastr.success('Confidence updated', '', { timeOut: 5000 })
          if (error.status != 200) this.toastr.error(error.error, '', { timeOut: 5000 })
        }
      )

    });


    this.etyForm.get("label").valueChanges.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      updatedLabel => {
        if (updatedLabel.length > 2 && updatedLabel.trim() != '') {
          this.updateLabel(updatedLabel);
        }
      }
    )

    this.etyForm.get("author").valueChanges.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      updateAuthor => {

        this.updateAuthor(updateAuthor)
      }
    )
  }


  async updateLabel(updatedLabel : string){
    this.lexicalService.spinnerAction('on');
    let etyId = this.object.etymology.etymology;
    let parameters = {
      relation: 'http://www.w3.org/2000/01/rdf-schema#label',
      value: updatedLabel
    }

    try {
      let update_label_req = await this.lexicalService.updateEtymology(etyId, parameters).toPromise();
      update_label_req['request'] = 0;
      update_label_req['new_label'] = updatedLabel
      this.lexicalService.refreshAfterEdit(update_label_req);
      this.lexicalService.spinnerAction('off');
      this.toastr.success('Label updated', '', { timeOut: 5000 })
    } catch (error) {
      let data = this.object.etymology;
      data['request'] = 0;
      data['new_label'] = updatedLabel;
      this.lexicalService.refreshAfterEdit(data);
      this.lexicalService.spinnerAction('off');
      //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
      if (error.status == 200) {
        this.toastr.success('Label updated', '', { timeOut: 5000 })

      } else {
        this.toastr.error(error.error, 'Error', { timeOut: 5000 })

      }
    }
    
  }

  async updateAuthor(updateAuthor){
    this.lexicalService.spinnerAction('on');
    let etyId = this.object.etymology.etymology;
    let parameters = {
      relation: 'http://www.w3.org/2000/01/rdf-schema#comment',
      value: updateAuthor
    }
    try {
      let update_author_req = await this.lexicalService.updateEtymology(etyId, parameters).toPromise();
      this.lexicalService.spinnerAction('off');
      this.toastr.success('Author updated', '', { timeOut: 5000 })
    } catch (error) {
      this.lexicalService.spinnerAction('off');
      this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
      if (error.status == 200) {
        this.toastr.success('Label updated', '', { timeOut: 5000 })

      } else {
        this.toastr.error(error.error, 'Error', { timeOut: 5000 })

      }
    }
    
  }

  async onChangeEtylinkNote(data) {
    console.log(data)
    if (data != undefined) {

      let newValue = data.evt.target.value;
      let currentValue;
      let index = data?.index;

      let oldValue = this.memoryLinks[index].note;

      let instanceName = this.object.etyLinks[index].etymologicalLink;


      let parameters = {
        relation: 'http://www.w3.org/2004/02/skos/core#note',
        value: newValue,
        currentValue: oldValue
      };

      console.log(parameters)

      try {
        let change_etylink_note_req = await this.lexicalService.updateEtylink(instanceName, parameters).toPromise();
        console.log(change_etylink_note_req);
        this.lexicalService.spinnerAction('off');
        this.memoryLinks[index].note = newValue
        this.toastr.success('EtyLink note updated', '', { timeOut: 5000 })
      } catch (error) {
        this.lexicalService.spinnerAction('off');
        this.memoryLinks[index].note = newValue
        if (error.status == 200) {
          this.toastr.success('Label updated', '', { timeOut: 5000 })

        } else {
          this.toastr.error(error.error, 'Error', { timeOut: 5000 })

        }
      }
    }
  }

  async onChangeEtylinkLabel(data) {
    console.log(data)
    if (data != undefined) {

      let newValue = data.evt.target.value;
      let currentValue;
      let index = data?.index;

      let oldValue = this.memoryLinks[index].note;

      let instanceName = this.object.etyLinks[index].etymologicalLink;


      let parameters = {
        relation: 'http://www.w3.org/2000/01/rdf-schema#label',
        value: newValue,
        currentValue: oldValue
      };

      console.log(parameters)
      try {
        let change_etylink_label_req = await this.lexicalService.updateEtylink(instanceName, parameters).toPromise();
        console.log(change_etylink_label_req)
        this.lexicalService.spinnerAction('off');
        //this.lexicalService.updateLexCard(this.object)
        this.memoryLinks[index].note = newValue
        this.toastr.success('EtyLink label updated', '', { timeOut: 5000 })

      } catch (error) {
        this.lexicalService.spinnerAction('off');
        this.memoryLinks[index].note = newValue;
        if(error.status != 200){
          this.toastr.error(error.error, 'Error', { timeOut: 5000 })

        }else{
          this.toastr.success('Ok', '', {timeOut: 4000})
        }
      }
    }
  }

  async onChangeEtylinkType(index, evt) {
    console.log(index, evt.target.value)
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let selectedValues, etymId;
    selectedValues = evt.target.value;

    if (this.object.etymology.etymology != undefined) {
      etymId = this.object.etyLinks[index].etymologicalLink;
    }

    if (selectedValues != null) {

      //let oldValue = this.memoryLinks[index].etySource;
      let parameters = {
        relation: "http://lari-datasets.ilc.cnr.it/lemonEty#etyLinkType",
        value: selectedValues,
      }
      console.log(parameters);

      try {
        let change_etylink_type_req = await this.lexicalService.updateEtylink(etymId, parameters).toPromise();
      } catch (error) {
        if (error.status == 200) {
          this.toastr.success('Etylink type updated', '', { timeOut: 5000 })
          //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
        } else {
          this.toastr.error(error.error, 'Error', { timeOut: 5000 })
        }
      }
    }
  }

  async onChangeEtylink(etyLink, index) {
    console.log(etyLink.selectedItems)
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let selectedValues, etymId, etySourceLabel, instanceName;

    if (!this.etyLinkArray.at(index).get('lila').value) {
      if (etyLink.selectedItems != undefined) {
        if (etyLink.selectedItems.length != 0) {
          selectedValues = etyLink.selectedItems[0].value.lexicalEntry;
          etySourceLabel = etyLink.selectedItems[0].value.label;
          instanceName = etyLink.selectedItems[0].value.lexicalEntry;
        }
      } else if (etyLink != "") {
        selectedValues = etyLink;
        etySourceLabel = '';
        instanceName = etyLink;
      }
    } else {
      selectedValues = etyLink.selectedItems[0].value.lexicalEntry;
      etySourceLabel = etyLink.selectedItems[0].value.label;
      instanceName = etyLink.selectedItems[0].value.lexicalEntry;
    }


    //console.log(index);
    //console.log(this.object.etyLinks[index])
    if (this.object.etymology.etymology != undefined) {
      etymId = this.object.etyLinks[index].etymologicalLink;
    }

    let existOrNot = this.memoryLinks.some(element => element.etySource == instanceName);

    if (typeof (etyLink) != 'string' && !existOrNot) {
      if (selectedValues != null && etyLink?.selectedItems[0]?.value.new_etymon == undefined) {

        let oldValue = this.memoryLinks[index].etySource;
        let parameters = {
          type: "etyLink",
          relation: "http://lari-datasets.ilc.cnr.it/lemonEty#etySource",
          value: selectedValues,
          currentValue: oldValue
        }

        console.log(parameters)

        try {
          let change_etylink_req = await this.lexicalService.updateLinguisticRelation(etymId, parameters).toPromise();
        } catch (error) {
          if (error.status == 200) {
            this.memoryLinks[index]['etySourceLabel'] = etySourceLabel;
            this.etyLinkArray.at(index).patchValue({ label: etySourceLabel });
            this.etyLinkArray.at(index).patchValue({ etySource: instanceName });
            //this.lexicalService.updateLexCard({ lastUpdate: error.error.text }) TODO: inserire updater per decomposition e etymology
            this.toastr.success('Etylink source updated', '', { timeOut: 5000 })
          } else {
            this.toastr.error(error.error, 'Error', { timeOut: 5000 })
          }
        }
      } else if (etyLink.selectedItems[0].value.new_etymon) {

        let label_new_lexical_entry = etyLink.selectedItems[0].value.name;
        try {
          let new_lexical_entry_req = this.lexicalService.newLexicalEntry().toPromise();
          console.log(new_lexical_entry_req);

          let lexical_entry = new_lexical_entry_req['lexicalEntry'];
          let lexical_entry_in = new_lexical_entry_req['lexicalEntry'];
          this.memoryLinks[index]['etySourceLabel'] = etySourceLabel;
          this.etyLinkArray.at(index).patchValue({ lex_entity: label_new_lexical_entry });
          this.etyLinkArray.at(index).patchValue({ etySource: lexical_entry });

          let parameters = {
            relation: 'http://www.w3.org/2000/01/rdf-schema#label',
            value: label_new_lexical_entry
          }
          console.log(parameters);

          try {
            let change_lex_entry_label_req = await this.lexicalService.updateLexicalEntry(lexical_entry_in, parameters).toPromise();

          } catch (error) {
            this.lexicalService.spinnerAction('off');
            this.lexicalService.spinnerAction('off');

            parameters = {
              relation: 'http://lari-datasets.ilc.cnr.it/lemonEty#etyLinkType',
              value: 'Etymon'
            }
            
            try {
              let apply_etymon_type_req = await this.lexicalService.updateLexicalEntry(lexical_entry_in, parameters).toPromise();
            } catch (error) {
              let oldValue = this.memoryLinks[index].etySource;
              let parameters = {
                type: "etyLink",
                relation: "http://lari-datasets.ilc.cnr.it/lemonEty#etySource",
                value: lexical_entry_in,
                currentValue: oldValue
              }
              this.lexicalService.refreshFilter({ request: true });

              try {
                let change_etysource_req = await this.lexicalService.updateLinguisticRelation(etymId, parameters).toPromise(); 
              } catch (error) {
                if (error.status == 200) {
                  this.toastr.success('New etymon created', '', { timeOut: 5000 })
                  ////this.lexicalService.updateLexCard({ lastUpdate: error.error.text }) TODO: inserire updater per decomposition e etymology
                }else{
                  console.log(error)
                  this.toastr.error("Something went wrong, check the log", "Error", {timeOut : 5000})
                }
              }
            }
          }

        } catch (error) {
          if(error.status != 200){
            console.log(error)
            this.toastr.error("Something went wrong, check the log", "Error", {timeOut : 5000})
          }
        }
      
        //      cambiare tipo lexical entry in etymon
        //      cambiare label lexical entry
      }
    } else if (typeof (etyLink) == 'string' && !existOrNot) {
      let oldValue = this.memoryLinks[index].etySource;
      let parameters = {
        type: "etyLink",
        relation: "http://lari-datasets.ilc.cnr.it/lemonEty#etySource",
        value: selectedValues,
        currentValue: oldValue
      }

      console.log(parameters)

      try {
        let change_etylink_source = await this.lexicalService.updateLinguisticRelation(etymId, parameters).toPromise();
      } catch (error) {
        if (error.status == 200) {
          this.memoryLinks[index]['etySourceLabel'] = etySourceLabel;
          this.etyLinkArray.at(index).patchValue({ label: etySourceLabel });
          this.etyLinkArray.at(index).patchValue({ etySource: instanceName });
          //this.lexicalService.updateLexCard({ lastUpdate: error.error.text }) TODO: inserire updater per decomposition e etymology
          this.toastr.success('Etylink source updated', '', { timeOut: 5000 })
        } else {
          this.toastr.error(error.error, 'Error', { timeOut: 5000 })
        }
      }
      
    } else if (existOrNot) {
      this.toastr.error('This etymon already exist, please choose an another etymon', 'Error', {
        timeOut: 5000
      })
    }


  }

  createNewEtymon(name) {
    return new Promise((resolve) => {
      // Simulate backend call.
      setTimeout(() => {
        resolve({ id: 5, name: name, new_etymon: true });
      }, 1000);
    })
  }

  addCognate() {
    this.cognatesArray = this.etyForm.get('cognates') as FormArray;
    this.cognatesArray.push(this.createCognate());

  }

  debounceEtylinkLabel(evt, index) {
    this.lexicalService.spinnerAction('on');
    this.etylink_label_subject.next({ evt, index })
  }

  debounceEtylinkNote(evt, index) {
    this.lexicalService.spinnerAction('on');
    this.etylink_note_subject.next({ evt, index })
  }

  addEtyLink(le?, l?, elt?, es?, et?, n?, el?) {
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    this.etyLinkArray.push(this.createEtyLink(le, l, elt, es, et, n, el));
  }

  addNewEtyLink() {
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    this.etyLinkArray.push(this.createEtyLink());
    let index = this.etyLinkArray.length - 1;

    let etyId = this.object.etymology.etymology;
    let lexId = this.object.parentNodeInstanceName;

    console.log(etyId, lexId)

    this.lexicalService.createNewEtylink(lexId, etyId).subscribe(
      data => {
        console.log(data);
        if (data != null) {
          let etyTarget = data['etyTarget']
          let etyType = data['etyLinkType']
          this.etyLinkArray.at(index).patchValue({ etyTarget: etyTarget });
          this.etyLinkArray.at(index).patchValue({ etyLinkType: etyType });
          this.object.etyLinks[index] = data;
          this.memoryLinks[index] = data;
          this.toastr.success('New etylink added', '', { timeOut: 5000 })
        }
      }, error => {
        console.log(error)
        this.toastr.error(error.error, 'Error', { timeOut: 5000 })
      }
    )
  }

  removeEtyLink(index) {
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let etyLinkId = this.memoryLinks[index]['etymologicalLink']
    
    this.lexicalService.deleteEtylink(etyLinkId).pipe(takeUntil(this.destroy$)).subscribe(
      data=>{
        console.log(data)
      },error=>{
        if(error.status == 200){
          this.toastr.success('Etylink removed', '', { timeOut: 5000 });
          this.etyLinkArray.removeAt(index);
          this.memoryLinks.splice(index, 1)
        }else{
          this.toastr.error(error.error, 'Error', { timeOut: 5000 })
        }
      }
    );
    
  
    
      
    
    
  }

  removeCognate(index) {
    this.etyLinkArray = this.etyForm.get('cognates') as FormArray;
    this.etyLinkArray.removeAt(index);

  }

  createRelation() {
    return this.formBuilder.group({
      trait: '',
      value: ''
    })
  }

  createEtyLink(le?, l?, elt?, es?, et?, n?, el?) {
    if (le != undefined) {
      return this.formBuilder.group({
        lex_entity: new FormControl(le),
        label: new FormControl(l),
        etyLinkType: new FormControl(elt),
        etySource: new FormControl(es),
        etyTarget: new FormControl(et),
        note: new FormControl(n),
        external_iri: new FormControl(el),
        lila: false
      })
    } else {
      return this.formBuilder.group({
        lex_entity: new FormControl(null),
        label: new FormControl(null),
        etyLinkType: new FormControl(null),
        etySource: new FormControl(null),
        etyTarget: new FormControl(null),
        note: new FormControl(null),
        external_iri: new FormControl(null),
        lila: false
      })
    }

  }


  createCognate() {
    return this.formBuilder.group({
      cognate: new FormControl(null),
      label: new FormControl(null)
    })
  }

  triggerCognates(evt) {
    if (evt.target != undefined) {
      this.subject_cognates.next(evt.target.value)
    }
  }

  triggerCognatesInput(evt, i) {
    if (evt.target != undefined) {
      let value = evt.target.value;
      this.subject_cognates_input.next({ value, i })
    }
  }

  triggerEtylink(evt, index) {
    if (evt.target != undefined) {
      this.subject_etylink.next({ value: evt.target.value, index: index })
    }
  }

  triggerEtylinkInput(evt, i) {
    if (evt.target != undefined) {
      let value = evt.target.value;
      this.subject_etylink_input.next({ value, i })
    }
  }

  deleteData() {
    this.searchResults = [];
  }

  async onSearchFilter(data) {
    console.log(data)
    this.filterLoading = true;
    this.searchResults = [];

    let value = data.value;
    let index = data.index;

    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let isLilaActived = this.etyLinkArray.at(index).get('lila').value;

    if (!isLilaActived) {
      let parameters = {
        text: value,
        searchMode: "startsWith",
        type: "etymon",
        pos: "",
        formType: "entry",
        author: "",
        lang: "",
        status: "",
        offset: 0,
        limit: 500
      }
      console.log(parameters)

      try {
        let search_req = await this.lexicalService.getLexicalEntriesList(parameters).toPromise();
        this.searchResults = search_req['list']
        this.filterLoading = false;
      } catch (error) {
        if(error.status != 200){
          this.toastr.error("Something went wrong, check the log", "Error", {timeOut : 5000})
          this.filterLoading = false;
        }
      }

      

    } else {

      try {
        let query_etymon_req = await this.lilaService.queryEtymon(value).toPromise();
        if (query_etymon_req.list.length > 0) {
          const map = query_etymon_req.list.map(element => (
            {
              label: element[2]?.value,
              language: element[1]?.value,
              lexicalEntry: element[0]?.value
            })
          )

          this.searchResults = map;
          console.log(this.searchResults)
        }
      } catch (error) {
        console.log(error)
      }
      
    }




  }

  ngOnDestroy(): void {
    this.subject_cognates_subscription.unsubscribe();
    this.subject_etylink_subscription.unsubscribe();
    this.subject_etylink_input_subscription.unsubscribe();
    this.subject_cognates_input_subscription.unsubscribe();
    this.subject_etylink_note_subscription.unsubscribe();
    this.subject_etylink_label_subscription.unsubscribe();

    this.destroy$.next(true);
    this.destroy$.complete();
  }


}
