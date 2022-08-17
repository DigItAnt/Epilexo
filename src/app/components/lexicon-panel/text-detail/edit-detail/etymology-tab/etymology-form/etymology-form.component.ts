/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { LilaService } from 'src/app/services/lila/lila.service';

@Component({
  selector: 'app-etymology-form',
  templateUrl: './etymology-form.component.html',
  styleUrls: ['./etymology-form.component.scss']
})
export class EtymologyFormComponent implements OnInit {

  @Input() etymData: any;
  @ViewChildren('etyLink') etyLinkList: QueryList<NgSelectComponent>;
  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;
  componentRef: any;


  etyForm = new FormGroup({
    label: new FormControl(''),
    author: new FormControl(''),
    confidence : new FormControl(null),
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
  private etylink_note_subject : Subject<any> = new Subject();
  private etylink_label_subject : Subject<any> = new Subject();
  searchResults = [];
  filterLoading = false;

  memoryLinks = [];

  constructor(private lexicalService: LexicalEntriesService, 
              private formBuilder: FormBuilder, 
              private toastr: ToastrService,
              private lilaService : LilaService) { }

  ngOnInit(): void {

    this.etyForm = this.formBuilder.group({
      label: '',
      author: '',
      confidence : false,
      etylink: this.formBuilder.array([]),
      cognates : this.formBuilder.array([]),
      isEtymon: false,
      isCognate: false
    })
    this.onChanges();
    this.triggerTooltip();

    this.subject_cognates.pipe(debounceTime(1000)).subscribe(
      data => {
        if(data != null){
          this.onSearchFilter(data)

        }
      }
    )

    this.subject_etylink.pipe(debounceTime(1000)).subscribe(
      data => {
        if(data != null){
          this.onSearchFilter(data)

        }
      }
    )

    this.subject_etylink_input.pipe(debounceTime(1000)).subscribe(
      data => {
        console.log(data)
        if(data != null){
          let value= data['value'];
          let index = data['i'];
          this.onChangeEtylink(value, index)
        }
        
      }
    )

    this.subject_cognates_input.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    )

    this.etylink_note_subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onChangeEtylinkNote(data)
      }
    )

    this.etylink_label_subject.pipe(debounceTime(1000)).subscribe(
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
        }
      }
      this.object = changes.etymData.currentValue;
      console.log(this.object)
      if (this.object != null) {
        this.etyForm.get('label').setValue(this.object.etymology.label, { emitEvent: false });
        this.etyForm.get('author').setValue(this.object.etymology.hypothesisOf, { emitEvent: false });
        if(this.object.etymology.confidence == 0){
          this.etyForm.get('confidence').setValue(true, { emitEvent: false });
        }else{
          this.etyForm.get('confidence').setValue(false, { emitEvent: false });
        }

        let isCognate = this.object.type.find(element => element == 'Cognate');
        if(isCognate){
            this.etyForm.get('isCognate').setValue(true, {emitEvent: false})
        }else{
            this.etyForm.get('isCognate').setValue(false, {emitEvent: false})
        }

        let isEtymon = this.object.type.find(element => element == 'Etymon');
        if(isEtymon){
            this.etyForm.get('isEtymon').setValue(true, {emitEvent: false})
        }else{
            this.etyForm.get('isEtymon').setValue(false, {emitEvent: false})
        }
        
        if(this.object.etyLinks != undefined){
          if(this.object.etyLinks.length != 0){
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
    /* this.etyForm.valueChanges.pipe(debounceTime(200)).subscribe(searchParams => {
      console.log(searchParams)
    }) */
    this.etyForm.get('confidence').valueChanges.pipe(debounceTime(100)).subscribe(newConfidence => {
      let confidence_value = null;
      console.log(newConfidence)
      if(newConfidence == false){
        confidence_value = 1
        this.etyForm.get('confidence').setValue(false, { emitEvent: false });
      }else{
        confidence_value = 0
        this.etyForm.get('confidence').setValue(true, { emitEvent: false });
      }

      this.lexicalService.spinnerAction('on');
      let etyId = this.object.etymology.etymologyInstanceName;
      let parameters = {
          type: "confidence",
          relation: 'confidence',
          value: confidence_value
      }
      console.log(parameters)
      this.lexicalService.updateGenericRelation(etyId, parameters).subscribe(
          data => {
              console.log(data);
              /* data['request'] = 0;
              data['new_label'] = confidence_value
              this.lexicalService.refreshAfterEdit(data); */
              //this.lexicalService.updateLexCard(data)
              this.lexicalService.spinnerAction('off');
          },
          error => {
              console.log(error);
              /*  const data = this.object.etymology;
              data['request'] = 0;
              data['new_label'] = confidence_value;
              this.lexicalService.refreshAfterEdit(data); */
              this.lexicalService.spinnerAction('off');
              //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
              if(error.status == 200){
                this.toastr.success('Label updated', '', {timeOut: 5000})

              }else{
                this.toastr.error(error.error, 'Error', {timeOut: 5000})

              }
          }
      )

    });


    this.etyForm.get("label").valueChanges.pipe(debounceTime(1000)).subscribe(
      updatedLabel => {
        if (updatedLabel.length > 2 && updatedLabel.trim() != '') {
          this.lexicalService.spinnerAction('on');
          let etyId = this.object.etymology.etymologyInstanceName;
          let parameters = {
              relation: 'label',
              value: updatedLabel
          }
          this.lexicalService.updateEtymology(etyId, parameters).subscribe(
            data => {
                //console.log(data);
                data['request'] = 0;
                data['new_label'] = updatedLabel
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.spinnerAction('off');
                //this.lexicalService.updateLexCard(data)
                this.toastr.success('Label updated', '', {timeOut: 5000})
            },
            error => {
                //console.log(error);
                const data = this.object.etymology;
                data['request'] = 0;
                data['new_label'] = updatedLabel;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.spinnerAction('off');
                //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
                if(error.status == 200){
                  this.toastr.success('Label updated', '', {timeOut: 5000})

                }else{
                  this.toastr.error(error.error, 'Error', {timeOut: 5000})

                }
            }
          )
        }
      }
    )

    this.etyForm.get("author").valueChanges.pipe(debounceTime(1000)).subscribe(
      updateAuthor => {
        
        this.lexicalService.spinnerAction('on');
        let etyId = this.object.etymology.etymologyInstanceName;
        let parameters = {
            relation: 'hypothesisOf',
            value: updateAuthor
        }
        this.lexicalService.updateEtymology(etyId, parameters).subscribe(
          data => {
              //console.log(data);
              /* data['request'] = 0;
              data['new_label'] = updateAuthor
              this.lexicalService.refreshAfterEdit(data); */
              this.lexicalService.spinnerAction('off');
              //this.lexicalService.updateLexCard(data)
              this.toastr.success('Author updated', '', {timeOut: 5000})
          },
          error => {
              //console.log(error);
              /* const data = this.object;
              data['request'] = 0;
              data['new_label'] = updateAuthor;
              this.lexicalService.refreshAfterEdit(data); */
              this.lexicalService.spinnerAction('off');
              //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
              if(error.status == 200){
                this.toastr.success('Label updated', '', {timeOut: 5000})

              }else{
                this.toastr.error(error.error, 'Error', {timeOut: 5000})

              }
          }
        )
        
      }
    )
  }

  onChangeEtylinkNote(data){
    console.log(data)
    if(data != undefined){
      
      let newValue = data.evt.target.value;
      let currentValue;
      let index = data?.index;
      
      let oldValue = this.memoryLinks[index].note;

      let instanceName = this.object.etyLinks[index].etymologicalLinkInstanceName;
      

      let parameters = {
        relation: 'note',
        value : newValue,
        currentValue : oldValue
      };

      console.log(parameters)

      this.lexicalService.updateEtylink(instanceName, parameters).subscribe(
        data=> {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          //this.lexicalService.updateLexCard(this.object)
          this.memoryLinks[index].note = newValue
          this.toastr.success('EtyLink note updated', '', {timeOut: 5000})
        },error=> {
          console.log(error);
          //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          this.memoryLinks[index].note = newValue
          if(error.status == 200){
            this.toastr.success('Label updated', '', {timeOut: 5000})

          }else{
            this.toastr.error(error.error, 'Error', {timeOut: 5000})

          }
        }
      )
    
    }
  }

  onChangeEtylinkLabel(data){
    console.log(data)
    if(data != undefined){
      
      let newValue = data.evt.target.value;
      let currentValue;
      let index = data?.index;
      
      let oldValue = this.memoryLinks[index].note;

      let instanceName = this.object.etyLinks[index].etymologicalLinkInstanceName;
      

      let parameters = {
        relation: 'label',
        value : newValue,
        currentValue : oldValue
      };

      console.log(parameters)

      this.lexicalService.updateEtylink(instanceName, parameters).subscribe(
        data=> {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          //this.lexicalService.updateLexCard(this.object)
          this.memoryLinks[index].note = newValue
          this.toastr.success('EtyLink label updated', '', {timeOut: 5000})

        },error=> {
          console.log(error);
          //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          this.memoryLinks[index].note = newValue
          this.toastr.error(error.error, 'Error', {timeOut: 5000})
        }
      )
    
    }
  }

  onChangeEtylinkType(index, evt){
    console.log(index, evt.target.value)
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let selectedValues, etymId;
    selectedValues = evt.target.value;
    
    if (this.object.etymology.etymologyInstanceName != undefined) {
      etymId = this.object.etyLinks[index].etymologicalLinkInstanceName;
    }

    if(selectedValues != null){
      
      //let oldValue = this.memoryLinks[index].etySource;
      let parameters = {
        relation: "etyLinkType",
        value: selectedValues,
      }
      console.log(parameters)
      this.lexicalService.updateEtylink(etymId, parameters).subscribe(
        data => {
          console.log(data)
        }, error => {
          console.log(error)
          if(error.status == 200){
            this.toastr.success('Etylink type updated', '', {timeOut: 5000})
            //this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
          }else{
            this.toastr.error(error.error, 'Error', {timeOut: 5000})
          }
        }
        )
      
    }
  }

  onChangeEtylink(etyLink, index) {
    console.log(etyLink.selectedItems)
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let selectedValues, etymId, etySourceLabel, instanceName;

    if(!this.etyLinkArray.at(index).get('lila').value){
      if(etyLink.selectedItems != undefined){
        if (etyLink.selectedItems.length != 0) {
          selectedValues = etyLink.selectedItems[0].value.lexicalEntryInstanceName;
          etySourceLabel = etyLink.selectedItems[0].value.label;
          instanceName = etyLink.selectedItems[0].value.lexicalEntry;
        }
      }else if(etyLink != ""){
        selectedValues = etyLink;
        etySourceLabel = '';
        instanceName = etyLink;
      }
    }else{
      selectedValues = etyLink.selectedItems[0].value.lexicalEntry;
      etySourceLabel = etyLink.selectedItems[0].value.label;
      instanceName = etyLink.selectedItems[0].value.lexicalEntry;
    }
    
    
    //console.log(index);
    //console.log(this.object.etyLinks[index])
    if (this.object.etymology.etymologyInstanceName != undefined) {
      etymId = this.object.etyLinks[index].etymologicalLinkInstanceName;
    }

    let existOrNot = this.memoryLinks.some(element => element.etySource == instanceName);

    if(typeof(etyLink) != 'string' && !existOrNot){
      if(selectedValues != null && etyLink?.selectedItems[0]?.value.new_etymon == undefined){
      
        let oldValue = this.memoryLinks[index].etySource;
        let parameters = {
          type: "etyLink",
          relation: "etySource",
          value: selectedValues,
          currentValue: oldValue
        }
  
        console.log(parameters)
        this.lexicalService.updateLinguisticRelation(etymId, parameters).subscribe(
          data => {
            console.log(data)
          }, error => {
            console.log(error)
            if(error.status == 200){
              this.memoryLinks[index]['etySourceLabel'] = etySourceLabel;
              this.etyLinkArray.at(index).patchValue({ label: etySourceLabel});
              this.etyLinkArray.at(index).patchValue({ etySource: instanceName});
              //this.lexicalService.updateLexCard({ lastUpdate: error.error.text }) TODO: inserire updater per decomposition e etymology
              this.toastr.success('Etylink source updated', '', {timeOut: 5000})
            }else{
              this.toastr.error(error.error, 'Error', {timeOut: 5000})
            }
          }
        )
        
      }else if(etyLink.selectedItems[0].value.new_etymon){
        
        let label_new_lexical_entry = etyLink.selectedItems[0].value.name;
        this.lexicalService.newLexicalEntry().subscribe(
          data=> {
            console.log(data);
            let lexical_entry = data.lexicalEntry;
            let lexical_entry_in = data.lexicalEntryInstanceName;
            this.memoryLinks[index]['etySourceLabel'] = etySourceLabel;
            this.etyLinkArray.at(index).patchValue({ lex_entity: label_new_lexical_entry});
            this.etyLinkArray.at(index).patchValue({ etySource: lexical_entry});
  
            
            let parameters = {
              relation: 'label',
              value: label_new_lexical_entry
            }
            console.log(parameters)
            this.lexicalService.updateLexicalEntry(lexical_entry_in, parameters).subscribe(
              data => {
                  console.log(data);
                  
              },
              error => {
                  //console.log(error);
                  this.lexicalService.spinnerAction('off');
                  this.lexicalService.spinnerAction('off');
  
                  parameters = {
                    relation: 'type',
                    value: 'Etymon'
                  }
  
                  this.lexicalService.updateLexicalEntry(lexical_entry_in, parameters).subscribe(
                    data => {
                        console.log(data);
                        this.lexicalService.spinnerAction('off');
                        this.lexicalService.refreshLangTable();
                        this.lexicalService.refreshFilter({ request: true })
                        
                    },
                    error => {
                        console.log(error);
                        let oldValue = this.memoryLinks[index].etySource;
                        let parameters = {
                          type: "etyLink",
                          relation: "etySource",
                          value: lexical_entry_in,
                          currentValue: oldValue
                        }
                        this.lexicalService.refreshFilter({ request: true })
                        console.log(parameters)
                        console.log
                        this.lexicalService.updateLinguisticRelation(etymId, parameters).subscribe(
                          data => {
                            console.log(data)
                          }, error => {
                            console.log(error)
                            if(error.statusText == 'OK'){
                              this.toastr.success('New etymon created', '', {timeOut: 5000})
                              ////this.lexicalService.updateLexCard({ lastUpdate: error.error.text }) TODO: inserire updater per decomposition e etymology
                            }
                          }
                        )
                        this.lexicalService.spinnerAction('off');
  
                    }
                )
              }
            )
  
  
            
          },error => {
            console.log(error)
          }
        )
        //      cambiare tipo lexical entry in etymon
        //      cambiare label lexical entry
      }
    }else if(typeof(etyLink) == 'string' && !existOrNot){
      let oldValue = this.memoryLinks[index].etySource;
        let parameters = {
          type: "etyLink",
          relation: "etySource",
          value: selectedValues,
          currentValue: oldValue
        }
  
        console.log(parameters)
        this.lexicalService.updateLinguisticRelation(etymId, parameters).subscribe(
          data => {
            console.log(data)
          }, error => {
            console.log(error)
            if(error.status == 200){
              this.memoryLinks[index]['etySourceLabel'] = etySourceLabel;
              this.etyLinkArray.at(index).patchValue({ label: etySourceLabel});
              this.etyLinkArray.at(index).patchValue({ etySource: instanceName});
              //this.lexicalService.updateLexCard({ lastUpdate: error.error.text }) TODO: inserire updater per decomposition e etymology
              this.toastr.success('Etylink source updated', '', {timeOut: 5000})
            }else{
              this.toastr.error(error.error, 'Error', {timeOut: 5000})
            }
          }
        )
    }else if(existOrNot){
      this.toastr.error('This etymon already exist, please choose an another etymon', 'Error', {
        timeOut: 5000
      })
    }

    
  }

  createNewEtymon(name){
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

  debounceEtylinkLabel(evt, index){
    this.lexicalService.spinnerAction('on');
    this.etylink_label_subject.next({ evt, index})
  }

  debounceEtylinkNote(evt, index) {
    this.lexicalService.spinnerAction('on');
    this.etylink_note_subject.next({ evt, index})
  }

  addEtyLink(le?, l?, elt?, es?, et?, n?, el?){
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    this.etyLinkArray.push(this.createEtyLink(le, l, elt, es, et, n, el));
  }

  addNewEtyLink() { 
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    this.etyLinkArray.push(this.createEtyLink());
    let index = this.etyLinkArray.length -1;

    let etyId = this.object.etymology.etymologyInstanceName;
    let lexId = this.object.parentNodeInstanceName;

    console.log(etyId, lexId)

    this.lexicalService.createNewEtylink(lexId, etyId).subscribe(
      data=>{
        console.log(data);
        if(data!=null){
          let etyTarget = data['etyTarget']
          let etyType = data['etyLinkType']
          this.etyLinkArray.at(index).patchValue({ etyTarget: etyTarget});
          this.etyLinkArray.at(index).patchValue({ etyLinkType: etyType});
          this.object.etyLinks[index] = data;
          this.memoryLinks[index] = data;
          this.toastr.success('New etylink added', '', {timeOut: 5000})
        }
      },error=>{
        console.log(error)
        this.toastr.error(error.error, 'Error', {timeOut: 5000})
      }
    )
  }

  removeEtyLink(index){
    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let etyLinkId = this.memoryLinks[index]['etymologicalLinkInstanceName']
    this.lexicalService.deleteEtylink(etyLinkId).subscribe(
      data =>{
        console.log(data)
        ////this.lexicalService.updateLexCard(this.object)
        this.toastr.success('Etylink removed', '', {timeOut: 5000})

      },
      error =>{
        console.log(error)
        this.toastr.error(error.error, 'Error', {timeOut: 5000})
        ////this.lexicalService.updateLexCard({ lastUpdate: error.error.text })
      }
    )
    this.etyLinkArray.removeAt(index);
    this.memoryLinks.splice(index, 1)
  }

  removeCognate(index){
    this.etyLinkArray = this.etyForm.get('cognates') as FormArray;
    this.etyLinkArray.removeAt(index);
    
  }

  createRelation(){
    return this.formBuilder.group({
      trait: '',
      value: ''
    })
  }

  createEtyLink(le?, l?, elt?, es?, et?, n?, el?) {
    if(le!= undefined){
      return this.formBuilder.group({
        lex_entity: new FormControl(le),
        label: new FormControl(l),
        etyLinkType: new FormControl(elt),
        etySource : new FormControl(es),
        etyTarget : new FormControl(et),
        note: new FormControl(n),
        external_iri : new FormControl(el),
        lila: false
      })
    }else{
      return this.formBuilder.group({
        lex_entity: new FormControl(null),
        label: new FormControl(null),
        etyLinkType: new FormControl(null),
        etySource : new FormControl(null),
        etyTarget : new FormControl(null),
        note : new FormControl(null),
        external_iri : new FormControl(null),
        lila: false
      })
    }
    
  }


  createCognate() {
    return this.formBuilder.group({
      cognate : new FormControl(null),
      label : new FormControl(null)
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
      this.subject_etylink.next({value : evt.target.value, index : index})
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

  onSearchFilter(data) {
    console.log(data)
    this.filterLoading = true;
    this.searchResults = [];

    let value = data.value;
    let index = data.index;

    this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
    let isLilaActived = this.etyLinkArray.at(index).get('lila').value;

    if(!isLilaActived){
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
      
      this.lexicalService.getLexicalEntriesList(parameters).subscribe(
        data => {
          console.log(data)
          this.searchResults = data['list']
          this.filterLoading = false;
        }, error => {
          console.log(error)
          this.filterLoading = false;
        }
      )
      
    }else{
      this.lilaService.queryEtymon(value).subscribe(
        data=>{
            console.log(data)
            if(data.list.length > 0){
              const map = data.list.map(element => (
                {
                  label: element[2]?.value, 
                  language : element[1]?.value,
                  lexicalEntry : element[0]?.value
                })
              )

              
              

              this.searchResults = map;
              console.log(this.searchResults)
            }
        },
        error=>{
            console.log(error)
        }
    )
    }

    
    

  }

  triggerLilaSearch(index){

    

    setTimeout(() => {
      this.etyLinkArray = this.etyForm.get('etylink') as FormArray;
      let value = this.etyLinkArray.at(index).get('lila').value;
      if(value){
        const element = Array.from(this.etyLinkList)[index];

        /* if(element!=undefined){
          
          //this.onSearchFilter({value: this.object.label, index: index})
        } */

        /* setTimeout(() => {
          element.filter(this.object.parentNodeLabel)
        }, 100); */
      }
      
      

    }, 250);
  }

}
