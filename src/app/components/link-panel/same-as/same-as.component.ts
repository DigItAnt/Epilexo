/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnDestroy, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';
import { LilaService } from 'src/app/services/lila/lila.service';
import { NgSelectComponent } from '@ng-select/ng-select';

@Component({
  selector: 'app-same-as',
  templateUrl: './same-as.component.html',
  styleUrls: ['./same-as.component.scss']
})
export class SameAsComponent implements OnInit, OnDestroy {

  @Input() sameAsData: any[] | any;

  private subject: Subject<any> = new Subject();
  private subject_input: Subject<any> = new Subject();
  subscription: Subscription;
  object: any;
  searchResults = [];
  filterLoading = false;

  sameas_subscription: Subscription;

  destroy$ : Subject<any> = new Subject();

  @ViewChildren('sameAsSelect') sameAsList: QueryList<NgSelectComponent>;


  memorySameAs = [];
  isSense;
  isForm;
  isLexEntry;
  isLexicalConcept;

  disableAddSameAs = false;

  sameAsForm = new FormGroup({
    sameAsArray: new FormArray([this.createSameAsEntry()]),
    isEtymon: new FormControl(null),
    isCognate: new FormControl(null)
  })

  sameAsArray: FormArray;

  constructor(private formBuilder: FormBuilder,
    private lexicalService: LexicalEntriesService,
    private toastr: ToastrService,
    private lilaService: LilaService) {
  }

  ngOnInit() {
    this.sameAsForm = this.formBuilder.group({
      sameAsArray: this.formBuilder.array([]),
      isEtymon: false,
      isCognate: false,
    })

    this.subject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    )

    this.sameas_subscription = this.lexicalService.triggerSameAs$.subscribe(
      data => {
        console.log(data);
        if ((data != undefined || data != null) && this.object != undefined) {
          this.object.type = data;
          if (typeof (this.object.type) != "string") {
            let isCognate = this.object.type.find(element => element == 'Cognate');
            if (isCognate) {
              this.sameAsForm.get('isCognate').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isCognate').setValue(false, { emitEvent: false })
            }

            let isEtymon = this.object.type.find(element => element == 'Etymon');
            if (isEtymon) {
              this.sameAsForm.get('isEtymon').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isEtymon').setValue(false, { emitEvent: false })
            }
          } else {
            if (this.object.type == 'Cognate') {
              this.sameAsForm.get('isCognate').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isCognate').setValue(false, { emitEvent: false })
            }

            if (this.object.type == 'Etymon') {
              this.sameAsForm.get('isEtymon').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isEtymon').setValue(false, { emitEvent: false })
            }
          }
        }
      }, error => {
        console.log(error)
      }
    )

    this.subject_input.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onChangeSameAsByInput(data['value'], data['i'])
      }
    )

    this.triggerTooltip();
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (changes.sameAsData.currentValue != undefined) {
        this.object = changes.sameAsData.currentValue;
        this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
        this.sameAsArray.clear();

        this.memorySameAs = [];
        console.log(this.object)
        this.disableAddSameAs = false;

        this.object.array.forEach(element => {
          this.addSameAsEntry(element.entity, element.linkType == 'external')
          this.memorySameAs.push(element.entity);
        });

        //console.log(this.memorySameAs)
        if (this.object.type != undefined) {
          if (typeof (this.object.type) != "string") {
            let isCognate = this.object.type.find(element => element == 'Cognate');
            if (isCognate) {
              this.sameAsForm.get('isCognate').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isCognate').setValue(false, { emitEvent: false })
            }

            let isEtymon = this.object.type.find(element => element == 'Etymon');
            if (isEtymon) {
              this.sameAsForm.get('isEtymon').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isEtymon').setValue(false, { emitEvent: false })
            }
          } else {
            if (this.object.type == 'Cognate') {
              this.sameAsForm.get('isCognate').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isCognate').setValue(false, { emitEvent: false })
            }

            if (this.object.type == 'Etymon') {
              this.sameAsForm.get('isEtymon').setValue(true, { emitEvent: false })
            } else {
              this.sameAsForm.get('isEtymon').setValue(false, { emitEvent: false })
            }
          }

        }


        if (this.object.lexicalEntry != undefined) {
          this.isLexEntry = true;
          this.isForm = false;
          this.isSense = false;
          this.isLexicalConcept = false;
        } else if (this.object.form != undefined) {
          this.isLexEntry = false;
          this.isForm = true;
          this.isSense = false;
          this.isLexicalConcept = false;
        } else if (this.object.sense != undefined) {
          this.isLexEntry = false;
          this.isForm = false;
          this.isSense = true;
          this.isLexicalConcept = false;
        } else if (this.object.lexicalConcept != undefined) {
          this.isLexEntry = false;
          this.isForm = false;
          this.isSense = false;
          this.isLexicalConcept = true;
        }

      } else {
        this.object = null;
      }
    }, 10);
  }

  async onChangeSameAsByInput(value, index) {
    if (value.trim() != '') {
      var selectedValues = value;
      var lexicalElementId = '';
      let parameters = {};
      if (this.object.lexicalEntry != undefined) {
        lexicalElementId = this.object.lexicalEntry;
      } else if (this.object.form != undefined) {
        lexicalElementId = this.object.form;
      } else if (this.object.sense != undefined) {
        lexicalElementId = this.object.sense;
      } else if (this.object.etymology != undefined) {
        lexicalElementId = this.object.etymology;
      } else if (this.object.lexicalConcept != undefined) {
        lexicalElementId = this.object.lexicalConcept;
      }

      //console.log(this.memorySameAs[index])
      if (this.memorySameAs[index] == undefined || this.memorySameAs[index] == "") {
        parameters = {
          type: "reference",
          relation: "http://www.w3.org/2002/07/owl#sameAs",
          value: selectedValues
        }


        
      } else {
        let oldValue = this.memorySameAs[index];
        parameters = {
          type: "reference",
          relation: "http://www.w3.org/2002/07/owl#sameAs",
          value: selectedValues,
          currentValue: oldValue
        }

      }

      try {
        let data = await this.lexicalService.updateGenericRelation(lexicalElementId, parameters).toPromise();
      } catch (e) {
        console.log(e)
        this.disableAddSameAs = false;
        if (e.status == 200) {
          this.memorySameAs[index] = selectedValues;
          this.memorySameAs.push(selectedValues);
          this.toastr.success('sameAs updated', '', {
            timeOut: 5000,
          });

          this.sameAsArray.at(index).get('entity').setValue(selectedValues, {emitEvent: false});
          this.sameAsArray.at(index).get('inferred').setValue(true, {emitEvent: false})
          this.sameAsArray.at(index).get('lila').setValue(false, {emitEvent: false})
        } else {
          this.toastr.error(e.error, 'Error', {
            timeOut: 5000,
          });
        }
      }
    }

  }

  async onChangeSameAs(sameAs, index) {
    console.log(sameAs.selectedItems);
    let lexicalElementId = '';

    if (this.object.lexicalEntry != undefined) {
      lexicalElementId = this.object.lexicalEntry;
    } else if (this.object.form != undefined) {
      lexicalElementId = this.object.form;
    } else if (this.object.sense != undefined) {
      lexicalElementId = this.object.sense;
    } else if (this.object.etymology != undefined) {
      lexicalElementId = this.object.etymology;
    }
    if (sameAs.selectedItems.length != 0) {
      let parameters = {};
      var selectedValues = sameAs.selectedItems[0].value.lexicalEntry;

      if (selectedValues == undefined) {
        sameAs.selectedItems[0].value.lexicalEntry;
      }


      if (this.memorySameAs[index] == undefined || this.memorySameAs[index] == "") {
        parameters = {
          type: "reference",
          relation: "http://www.w3.org/2002/07/owl#sameAs",
          value: selectedValues
        }


       
      } else {
        let oldValue = this.memorySameAs[index];
        parameters = {
          type: "reference",
          relation: "http://www.w3.org/2002/07/owl#sameAs",
          value: selectedValues,
          currentValue: oldValue
        }

      }
      console.log(parameters)
      try {
        let data = await this.lexicalService.updateGenericRelation(lexicalElementId, parameters).toPromise();
      } catch (e) {
        console.log(e)
        if (e.status == 200) {
          this.memorySameAs[index] = selectedValues;
          this.memorySameAs.push(selectedValues);
          this.sameAsArray.at(index).get('entity').setValue(selectedValues, {emitEvent: false});
          this.sameAsArray.at(index).get('inferred').setValue(true, {emitEvent: false})
          this.toastr.success('SeeAlso updated', '', {
            timeOut: 5000,
          });
        } else {
          this.toastr.error(e.error, 'Error', {
            timeOut: 5000,
          });
        }
      }

    }


  }

  async onSearchFilter(data) {
    this.filterLoading = true;
    this.searchResults = [];

    let value = data.value;
    let index = data.index;
    console.log(data)
    this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
    let isLila = this.sameAsArray.at(index).get('lila').value;

    if (!isLila) {
      if (this.object.lexicalEntry != undefined) {
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
        try {
          let lex_entry_list = await this.lexicalService.getLexicalEntriesList(parameters).toPromise();
          this.searchResults = lex_entry_list['list']
          console.log(this.searchResults)
          this.filterLoading = false;
        } catch (e) {
          console.log(e);
          if (e.status != 200) {
            this.toastr.error('Something went wrong', 'Error', { timeOut: 5000 });
          }
          this.filterLoading = false;
        }



      } else if (this.object.form != undefined) {
        let parameters = {
          text: data,
          searchMode: "startsWith",
          representationType: "writtenRep",
          author: "",
          offset: 0,
          limit: 500
        }
        console.log(parameters);
        try {
          let forms_list = await this.lexicalService.getFormList(parameters).toPromise();
          this.searchResults = forms_list['list']
          console.log(this.searchResults)
          this.filterLoading = false;
        } catch (e) {
          console.log(e);
          if (e.status != 200) {
            this.toastr.error('Something went wrong', 'Error', { timeOut: 5000 });
          }
          this.filterLoading = false;
        }


      } else if (this.object.sense != undefined) {
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

        try {
          let senses_list = await this.lexicalService.getSensesList(parameters).toPromise();
          this.searchResults = senses_list['list']
          console.log(this.searchResults)
          this.filterLoading = false;
        } catch (e) {
          console.log(e);
          if (e.status != 200) {
            this.toastr.error('Something went wrong', 'Error', { timeOut: 5000 });
          }
          this.filterLoading = false;
        }
      }
    } else if (isLila) {
      this.searchResults = [];
      if (this.sameAsForm.get('isEtymon').value) {

        try {
          let etymon_list = await this.lilaService.queryEtymon(value).toPromise();
          if (etymon_list.list.length > 0) {
            const map = etymon_list.list.map(etym => (
              {
                label: etym[2]?.value,
                language: etym[1]?.value,
                lexicalEntry: etym[0]?.value
              })
            )
            this.searchResults = map;
            console.log(this.searchResults)
          }
        } catch (e) {
          console.log(e);
          if (e.status != 200) {
            this.toastr.error('Something went wrong', 'Error', { timeOut: 5000 });
          }
          this.filterLoading = false;
        }
      }


      if (this.sameAsForm.get('isCognate').value) {
        try{
          let cognates_list = await this.lilaService.queryCognate(value).toPromise();
          if (cognates_list.list.length > 0) {


            const map = cognates_list.list.map(element => (
              {
                label: this.object.label,
                labelValue: element[0].value,
                pos: element[1].value
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
        }catch(e){
          console.log(e);
          if (e.status != 200) {
            this.toastr.error('Something went wrong', 'Error', { timeOut: 5000 });
          }
          this.filterLoading = false;
        }
        
      }
    }


    console.log(data)

  }

  /* triggerLilaSearch(index){
    
    
    setTimeout(() => {
      this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
      if(this.sameAsArray.at(index).get('lila').value){
        const element = Array.from(this.sameAsList)[index];

       
      }
      

    })
  }
 */

  deleteData() {
    this.searchResults = [];
  }

  triggerSameAsInput(evt, i) {
    if (evt.target != undefined) {
      let value = evt.target.value;
      this.subject_input.next({ value, i })
    }
  }

  triggerSameAs(evt, i) {
    console.log(evt.target.value)
    if (evt.target != undefined) {
      this.subject.next({ value: evt.target.value, index: i })
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
    if (e == undefined) {
      return this.formBuilder.group({
        entity: null,
        inferred: false,
        lila: false
      })
    } else {
      return this.formBuilder.group({
        entity: e,
        inferred: i,
        lila: false
      })
    }

  }

  addSameAsEntry(e?, i?) {


    this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
    if (e == undefined) {
      this.disableAddSameAs = true;
      this.sameAsArray.push(this.createSameAsEntry());
    } else {
      this.sameAsArray.push(this.createSameAsEntry(e, i));
    }



    this.triggerTooltip();


  }

  async removeElement(index) {
    this.sameAsArray = this.sameAsForm.get('sameAsArray') as FormArray;
    const lexical_entity = this.sameAsArray.at(index).get('entity').value;
    this.disableAddSameAs = false;
    let lexicalElementId = '';

    if (this.object.lexicalEntry != undefined) {
      lexicalElementId = this.object.lexicalEntry;
    } else if (this.object.form != undefined) {
      lexicalElementId = this.object.form;
    } else if (this.object.sense != undefined) {
      lexicalElementId = this.object.sense;
    } else if (this.object.etymology != undefined) {
      lexicalElementId = this.object.etymology;
    } else if (this.object.lexicalConcept != undefined) {
      lexicalElementId = this.object.lexicalConcept;
    }
    let parameters = {
      relation: 'http://www.w3.org/2002/07/owl#sameAs',
      value: lexical_entity
    }

    try{
      let delete_request = await this.lexicalService.deleteLinguisticRelation(lexicalElementId, parameters).toPromise();

      this.toastr.success("SameAs Removed", '', {
        timeOut: 5000,
      });
    }catch(e){
      if (e.status == 200) {
        this.toastr.success("SameAs Removed", '', {
          timeOut: 5000,
        });
      } else {
        this.toastr.error(e.error.text, 'Error', {
          timeOut: 5000,
        });
      }
    }

    
    this.memorySameAs.splice(index, 1)
    this.sameAsArray.removeAt(index);
  }

  ngOnDestroy(): void {
    this.sameas_subscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
