/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';
import { LilaService } from 'src/app/services/lila/lila.service';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-same-as',
  templateUrl: './same-as.component.html',
  styleUrls: ['./same-as.component.scss']
})
export class SameAsComponent implements OnInit {

  @Input() sameAsData: any[] | any;

  private subject: Subject<any> = new Subject();
  private subject_input: Subject<any> = new Subject();
  subscription: Subscription;
  object: any;
  searchResults=[];
  filterLoading = false;

  @ViewChildren('sameAsSelect') sameAsList: QueryList<NgSelectComponent>;


  memorySameAs = [];
  isSense;
  isForm;
  isLexEntry;

  sameAsForm = new FormGroup({
    sameAsArray: new FormArray([this.createSameAsEntry()]),
    isEtymon: new FormControl(null),
    isCognate: new FormControl(null)
  })

  sameAsArray: FormArray;

  constructor(private formBuilder: FormBuilder, 
              private lexicalService : LexicalEntriesService, 
              private toastr: ToastrService,
              private lilaService: LilaService) {
  }

  ngOnInit() {
    this.sameAsForm = this.formBuilder.group({
      sameAsArray: this.formBuilder.array([]),
      isEtymon: false,
      isCognate: false,
    })

    this.subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    )

    this.lexicalService.triggerSameAs$.subscribe(
      data=> {
        console.log(data);
        if((data != undefined || data != null) && this.object != undefined){
          this.object.type = data;
          if(typeof(this.object.type) != "string"){
            let isCognate = this.object.type.find(element => element == 'Cognate');
            if(isCognate){
                this.sameAsForm.get('isCognate').setValue(true, {emitEvent: false})
            }else{
                this.sameAsForm.get('isCognate').setValue(false, {emitEvent: false})
            }
    
            let isEtymon = this.object.type.find(element => element == 'Etymon');
            if(isEtymon){
                this.sameAsForm.get('isEtymon').setValue(true, {emitEvent: false})
            }else{
                this.sameAsForm.get('isEtymon').setValue(false, {emitEvent: false})
            }
          }else{
            if(this.object.type == 'Cognate'){
              this.sameAsForm.get('isCognate').setValue(true, {emitEvent: false})
            }else{
              this.sameAsForm.get('isCognate').setValue(false, {emitEvent: false})
            }

            if(this.object.type == 'Etymon'){
              this.sameAsForm.get('isEtymon').setValue(true, {emitEvent: false})
            }else{
              this.sameAsForm.get('isEtymon').setValue(false, {emitEvent: false})
            }
          }
        }
      },error=> {
        console.log(error)
      }
    )

    this.subject_input.pipe(debounceTime(1000)).subscribe(
      data => {        
        this.onChangeSameAsByInput(data['value'], data['i'])
      }
    )
  
    this.triggerTooltip();
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if(changes.sameAsData.currentValue != undefined){
        this.object = changes.sameAsData.currentValue;
        this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
        this.sameAsArray.clear();
        
        this.memorySameAs = [];
        console.log(this.object)
  
        this.object.array.forEach(element => {
          this.addSameAsEntry(element.lexicalEntity, element.linkType == 'external')
          this.memorySameAs.push(element.lexicalEntity);
        });

        //console.log(this.memorySameAs)
        if(this.object.type != undefined){
          if(typeof(this.object.type) != "string"){
            let isCognate = this.object.type.find(element => element == 'Cognate');
            if(isCognate){
                this.sameAsForm.get('isCognate').setValue(true, {emitEvent: false})
            }else{
                this.sameAsForm.get('isCognate').setValue(false, {emitEvent: false})
            }
    
            let isEtymon = this.object.type.find(element => element == 'Etymon');
            if(isEtymon){
                this.sameAsForm.get('isEtymon').setValue(true, {emitEvent: false})
            }else{
                this.sameAsForm.get('isEtymon').setValue(false, {emitEvent: false})
            }
          }else{
            if(this.object.type == 'Cognate'){
              this.sameAsForm.get('isCognate').setValue(true, {emitEvent: false})
            }else{
              this.sameAsForm.get('isCognate').setValue(false, {emitEvent: false})
            }

            if(this.object.type == 'Etymon'){
              this.sameAsForm.get('isEtymon').setValue(true, {emitEvent: false})
            }else{
              this.sameAsForm.get('isEtymon').setValue(false, {emitEvent: false})
            }
          }
          
        }
        

        if(this.object.lexicalEntryInstanceName != undefined){
          this.isLexEntry = true;
          this.isForm = false;
          this.isSense = false;
        }else if(this.object.formInstanceName != undefined){
          this.isLexEntry = false;
          this.isForm = true;
          this.isSense = false;
        }else if(this.object.senseInstanceName != undefined){
          this.isLexEntry = false;
          this.isForm = false;
          this.isSense = true;
        }
        
      }else {
        this.object = null;
      }
    }, 10);
  }

  onChangeSameAsByInput(value, index){
    if(value.trim() != ''){
      var selectedValues = value;
      var lexicalElementId = '';
      let parameters =  {};
      if (this.object.lexicalEntryInstanceName != undefined) {
        lexicalElementId = this.object.lexicalEntryInstanceName;
      } else if (this.object.formInstanceName != undefined) {
        lexicalElementId = this.object.formInstanceName;
      } else if (this.object.senseInstanceName != undefined) {
        lexicalElementId = this.object.senseInstanceName;
      } else if (this.object.etymologyInstanceName != undefined) {
        lexicalElementId = this.object.etymologyInstanceName;
      }
  
      //console.log(this.memorySameAs[index])
      if (this.memorySameAs[index] == undefined ||  this.memorySameAs[index]  == "") {
        parameters = {
          type: "reference",
          relation: "sameAs",
          value: selectedValues
        }
       
  
        this.memorySameAs[index] = selectedValues;
      } else {
        let oldValue = this.memorySameAs[index];
        parameters = {
          type: "reference",
          relation: "sameAs",
          value: selectedValues,
          currentValue: oldValue
        }
       
      }

      this.lexicalService.updateGenericRelation(lexicalElementId, parameters).subscribe(
        data => {
          console.log(data)
        }, error => {
          console.log(error)
          if(error.status == '200'){
            this.toastr.success("SameAs Changed", '', {
              timeOut: 5000,
            });

            this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
            this.sameAsArray.at(index).get('inferred').setValue(true,{emitEvent: false} )
          }else{
            this.toastr.error(error.error.text, 'Error', {
              timeOut: 5000,
            });
          }
          
        }
      )
    }
    
  }

  onChangeSameAs(sameAs, index){
    console.log(sameAs.selectedItems)
    if(sameAs.selectedItems.length != 0){
      let parameters = {};
      var selectedValues = sameAs.selectedItems[0].value.lexicalEntry;

      if(selectedValues == undefined){
        sameAs.selectedItems[0].value.lexicalEntry;
      }

      let lexId = this.object.lexicalEntryInstanceName;
    
      if (this.memorySameAs[index] == undefined ||  this.memorySameAs[index]  == "") {
        parameters = {
          type: "reference",
          relation: "sameAs",
          value: selectedValues
        }
       
  
        this.memorySameAs[index] = selectedValues;
      } else {
        let oldValue = this.memorySameAs[index];
        parameters = {
          type: "reference",
          relation: "sameAs",
          value: selectedValues,
          currentValue: oldValue
        }
       
      }
      console.log(parameters)
      this.lexicalService.updateGenericRelation(lexId, parameters).subscribe(
        data=>{
          console.log(data)
          this.sameAsArray.at(index).get('inferred').setValue(true,{emitEvent: false} )
        }, error=>{
          console.log(error)
          if(error.status == 200){
            this.toastr.success('SameAs Changed', '', {timeOut : 5000})
            this.sameAsArray.at(index).get('inferred').setValue(true,{emitEvent: false} )
          }else{
            if(error.status == 200){
              this.toastr.error(error.error.text, '', {timeOut : 5000})
            }
          }
        }
      )
    }
    
    
  }

  onSearchFilter(data){
    this.filterLoading = true;
    this.searchResults = [];

    let value = data.value;
    let index = data.index;
    console.log(data)
    this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
    let isLila = this.sameAsArray.at(index).get('lila').value;

    if(!isLila){
      if(this.object.lexicalEntryInstanceName != undefined){
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
        console.log(data.length)
          this.lexicalService.getLexicalEntriesList(parameters).subscribe(
            data=>{
              console.log(data)
              this.searchResults = data['list']
              console.log(this.searchResults)
              this.filterLoading = false;
            },error=>{
              console.log(error)
              this.filterLoading = false;
            }
          )
        
      }else if(this.object.formInstanceName != undefined){
          let lexId = this.object.parentInstanceName;
          let parameters = {
            text: data,
            searchMode: "startsWith",
            representationType: "writtenRep",
            author: "",
            offset: 0,
            limit: 500
          }
          console.log(parameters);
          this.lexicalService.getFormList(parameters).subscribe(
            data=>{
              console.log(data)
              this.searchResults = data['list']
              this.filterLoading = false;
            },error=>{
              console.log(error)
              this.filterLoading = false;
            }
          )
        
        
      }else if(this.object.senseInstanceName != undefined){
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
    
          this.lexicalService.getLexicalSensesList(parameters).subscribe(
            data=>{
              this.searchResults = data
              this.filterLoading = false;
            },error=>{
              console.log(error)
              this.filterLoading = false;
            }
          )
      }
    }else if(isLila){
      this.searchResults = [];
      if(this.sameAsForm.get('isEtymon').value){
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


      if(this.sameAsForm.get('isCognate').value){
          this.lilaService.queryCognate(value).subscribe(
              data=>{
                  console.log(data);
                  if(data.list.length > 0){

                    
                    const map = data.list.map(element => (
                      {
                        label: this.object.label, 
                        labelValue: element[0].value, 
                        pos : element[1].value
                      })
                    )

                    map.forEach(element => {
                      let tmpLblVal = element.labelValue.split('/');
                      let labelValue = tmpLblVal[tmpLblVal.length - 1];

                      let tmpLblPos = element.pos.split('/');
                      let pos = tmpLblPos[tmpLblPos.length - 1];


                      element.labelElement = labelValue;
                      element.labelPos = pos;

                    });

                    

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
    

    console.log(data)
  
  }

  triggerLilaSearch(index){
    
    
    setTimeout(() => {
      this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
      if(this.sameAsArray.at(index).get('lila').value){
        const element = Array.from(this.sameAsList)[index];

        /* if(element!=undefined){
          
          this.onSearchFilter({value: this.object.label, index: index})
        } */

        /* setTimeout(() => {
          element.filter(this.object.label)
        }, 100); */
      }
      
      

    }, 250);
  }

  deleteData(){
    this.searchResults = [];
  }

  triggerSameAsInput(evt, i){
    if(evt.target != undefined){
      let value = evt.target.value;
      this.subject_input.next({value, i})
    }
  }

  triggerSameAs(evt,i){
    console.log(evt.target.value)
    if(evt.target != undefined){
      this.subject.next({value: evt.target.value, index: i})
    }
  }

  triggerTooltip() {
    setTimeout(() => {
      //@ts-ignore
      $('.same-as-tooltip').tooltip({
        trigger: 'hover'
      });
    }, 500);
  }

  createSameAsEntry(e?, i?) {
    if(e == undefined){
      return this.formBuilder.group({
        entity: null,
        inferred : false,
        lila: false
      })
    }else{
      return this.formBuilder.group({
        entity: e,
        inferred : i,
        lila: false
      })
    }
    
  }

  addSameAsEntry(e?, i?) {


    this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
    if(e == undefined){
      this.sameAsArray.push(this.createSameAsEntry());
    }else{
      this.sameAsArray.push(this.createSameAsEntry(e, i));
    }

    
    
    this.triggerTooltip();

    
  }

  removeElement(index) {
    this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
    const lexical_entity = this.sameAsArray.at(index).get('entity').value;

    if (this.object.lexicalEntryInstanceName != undefined) {

      let lexId = this.object.lexicalEntryInstanceName;

      let parameters = {
        relation: 'sameAs',
        value: lexical_entity
      }

      

      this.lexicalService.deleteLinguisticRelation(lexId, parameters).subscribe(
        data => {
          console.log(data)
          this.lexicalService.updateCoreCard(this.object)
          this.lexicalService.refreshLinkCounter('-1')
          this.toastr.success("SameAs Removed", 'Error', {
            timeOut: 5000,
          });
        }, error => {
          console.log(error)
          if(error.status == 200){
            this.toastr.success("SameAs Removed", 'Error', {
              timeOut: 5000,
            });
          }else{
            this.toastr.error(error.error.text, 'Error', {
              timeOut: 5000,
            });
          }
          
        }
      )
    } else if (this.object.formInstanceName != undefined) {
      let formId = this.object.formInstanceName;

      let parameters = {
        relation: 'sameAs',
        value: lexical_entity
      }

      

      this.lexicalService.deleteLinguisticRelation(formId, parameters).subscribe(
        data => {
          //console.log(data)
          this.lexicalService.updateCoreCard(this.object)
          this.lexicalService.refreshLinkCounter('-1')
        }, error => {
          //console.log(error)
        }
      )

    } else if (this.object.senseInstanceName != undefined) {
      let senseId = this.object.senseInstanceName;

      let parameters = {
        type: 'morphology',
        relation: 'sameAs',
        value: lexical_entity
      }

      //console.log(parameters)

      this.lexicalService.deleteLinguisticRelation(senseId, parameters).subscribe(
        data => {
          //console.log(data)
          this.lexicalService.updateCoreCard(this.object)
          this.lexicalService.refreshLinkCounter('-1')
        }, error => {
          //console.log(error)
        }
      )
    }
    this.memorySameAs.splice(index, 1)
    this.sameAsArray.removeAt(index);
  }

}
