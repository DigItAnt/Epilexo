/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { debounceTime, pairwise, startWith, takeUntil } from 'rxjs/operators';
import { ConceptService } from 'src/app/services/concept/concept.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectComponent } from '@ng-select/ng-select';
@Component({
  selector: 'app-lexical-concept-form',
  templateUrl: './lexical-concept-form.component.html',
  styleUrls: ['./lexical-concept-form.component.scss']
})
export class LexicalConceptFormComponent implements OnInit, OnDestroy {

  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;
  componentRef: any;

  @Input() lexicalConceptData: any;

  lexicalConceptForm = new FormGroup({
    label: new FormControl(''),
    definition: new FormControl(''),
    isEvokedBy: new FormArray([this.createIsEvokedBy()]),
    lexicalizedSenses: new FormArray([this.createLexicalizedSense()])
  })

  isEvokedByArray: FormArray;
  lexicalizedSensesArray: FormArray;
  /* scheme: FormArray;
  conceptReference: FormArray; */

  destroy$: Subject<boolean> = new Subject();
  disableAddIsEvokedBy: boolean = false;
  disableAddLexicalizedSense: boolean = false;
  memoryIsEvokedBy = [];
  memoryLexicalizedSenses = [];
  evokedBySubject: Subject<any> = new Subject();
  lexicalizedSenseSubject: Subject<any> = new Subject();

  searchResults: any[] = [];
  searchResultsSenses: any[] = [];



  constructor(private lexicalService: LexicalEntriesService,
    private formBuilder: FormBuilder,
    private conceptService: ConceptService,
    private toastr: ToastrService) {
  }

  ngOnInit() {

    this.lexicalConceptForm = this.formBuilder.group({
      defaultLabel: '',
      definition: '',
      isEvokedBy: this.formBuilder.array([]),
      lexicalizedSenses: this.formBuilder.array([]),

    })
    this.onChanges();
    this.triggerTooltip();

    this.evokedBySubject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    );

    this.lexicalizedSenseSubject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onSearchFilterLexicalizedSense(data)
      }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (this.object != changes.lexicalConceptData.currentValue) {
        this.isEvokedByArray = this.lexicalConceptForm.get('isEvokedBy') as FormArray;
        this.isEvokedByArray.clear();

        this.lexicalizedSensesArray = this.lexicalConceptForm.get('lexicalizedSenses') as FormArray;
        this.lexicalizedSensesArray.clear();

        this.lexicalConceptForm.reset();

        this.disableAddIsEvokedBy = false;
        this.disableAddLexicalizedSense = false;
        this.memoryIsEvokedBy = [];
        this.memoryLexicalizedSenses = [];
      }
      //this.loadPeople();
      this.object = changes.lexicalConceptData.currentValue;
      if (this.object != null) {
        this.lexicalConceptForm.get('defaultLabel').setValue(this.object.defaultLabel, { emitEvent: false });
        this.lexicalConceptForm.get('definition').setValue(this.object.definition, { emitEvent: false });

        const conceptId = this.object.lexicalConcept;
        this.lexicalService.getLexEntryLinguisticRelation(conceptId, 'isEvokedBy').pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            console.log(data)
            for (var i = 0; i < data.length; i++) {
              let entity = data[i]['entity'];
              let type = data[i]['linkType'];
              let label = data[i]['label'];
              let inferred = data[i]['inferred'];
              this.addIsEvokedBy(entity, type, inferred, label);
              this.memoryIsEvokedBy.push(data[i])
            }
          }, error => {
            console.log(error)
          }
        );

        this.lexicalService.getLexEntryLinguisticRelation(conceptId, 'lexicalizedSense').pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            console.log(data)
            for (var i = 0; i < data.length; i++) {
              let entity = data[i]['entity'];
              let type = data[i]['linkType'];
              let label = data[i]['label'];
              let inferred = data[i]['inferred'];
              this.addLexicalizedSense(entity, type, inferred, label);
              this.memoryLexicalizedSenses.push(data[i])
            }
          }, error => {
            console.log(error)
          }
        )
      }
      this.triggerTooltip();
    }, 10)
  }

  triggerTooltip() {
    setTimeout(() => {
      //@ts-ignore
      $('.vartrans-tooltip').tooltip({
        trigger: 'hover'
      });
    }, 500);
  }



  onChanges(): void {
    this.lexicalConceptForm.get('defaultLabel').valueChanges.pipe(debounceTime(1000), startWith(this.lexicalConceptForm.get('defaultLabel').value), pairwise(), takeUntil(this.destroy$)).subscribe(([prev, next]: [any, any]) => {
      if (next != null) {
        let parameters = {
          relation: "http://www.w3.org/2004/02/skos/core#prefLabel",
          source: this.object.lexicalConcept,
          target: next,
          oldTarget: prev == null ? this.object.defaultLabel : prev,
          targetLanguage: this.object.language,
          oldTargetLanguage: this.object.language
        }


        this.conceptService.updateSkosLabel(parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            console.log(data)
          }, error => {
            console.log(error);

            //this.lexicalService.changeDecompLabel(next)
            if (error.status != 200) {
              this.toastr.error(error.error, 'Error', {
                timeOut: 5000,
              });
            } else {
              const data = this.object;
              data['request'] = 0;
              data['new_label'] = next;
              this.lexicalService.refreshAfterEdit(data);
              this.lexicalService.spinnerAction('off');
              this.lexicalService.updateCoreCard({ lastUpdate: error.error.text });
              this.toastr.success('Label changed correctly for ' + this.object.lexicalConcept, '', {
                timeOut: 5000,
              });
            }
          }
        )
      }
    })

    this.lexicalConceptForm.get('definition').valueChanges.pipe(debounceTime(1000), startWith(this.lexicalConceptForm.get('definition').value), pairwise(), takeUntil(this.destroy$)).subscribe(([prev, next]: [any, any]) => {
      if (next != null) {
        let parameters = {
          relation: "http://www.w3.org/2004/02/skos/core#definition",
          source: this.object.lexicalConcept,
          target: next,
          oldTarget: prev == null ? this.object.definition : prev,
          targetLanguage: this.object.language,
          oldTargetLanguage: this.object.language
        }


        this.conceptService.updateNoteProperty(parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            console.log(data)
          }, error => {
            console.log(error);

            //this.lexicalService.changeDecompLabel(next)
            if (error.status != 200) {
              this.toastr.error(error.error, 'Error', {
                timeOut: 5000,
              });
            } else {

              this.lexicalService.spinnerAction('off');
              this.lexicalService.updateCoreCard({ lastUpdate: error.error.text });
              this.toastr.success('Definition changed correctly for ' + this.object.lexicalConcept, '', {
                timeOut: 5000,
              });
              this.lexicalConceptForm.get('definition').setValue(next, { emitEvent: false });
            }
          }
        )
      }
    })
  }

  onSearchFilter(data) {
    this.searchResults = [];

    let value = data.value;
    let index = data.index;

    this.isEvokedByArray = this.lexicalConceptForm.get('isEvokedBy') as FormArray;

    let parameters = {
      text: value,
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

    /* && data.length >= 3 */
    this.lexicalService.getLexicalEntriesList(parameters).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)

        if (data.list.length > 0) {
          let filter_lang = data.list.filter(
            element => element.language != 'null'
          )

          console.log(filter_lang)
          this.searchResults = filter_lang;
        } else {
          let filter_lang = [];
          this.searchResults = filter_lang;
        }

      }, error => {
        //console.log(error)
      }
    )
  }

  onSearchFilterLexicalizedSense(data) {
    this.searchResultsSenses = [];

    let value = data.value;
    let index = data.index;

    this.isEvokedByArray = this.lexicalConceptForm.get('isEvokedBy') as FormArray;

    let parameters = {
      text: value,
      searchMode: "startsWith",
      type: "",
      field: "",
      pos: "",
      formType: "entry",
      author: "",
      lang: "",
      status: "",
      offset: 0,
      limit: 500
    }

    /* && data.length >= 3 */
    this.lexicalService.getLexicalSensesList(parameters).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)

        if (data.list.length > 0) {
          let filter_lang = data.list.filter(
            element => element.language != 'null'
          )

          console.log(filter_lang)
          this.searchResultsSenses = filter_lang;
        } else {
        }

      }, error => {
        //console.log(error)
      }
    )
  }


  triggerIsEvokedBy(evt, i) {
    console.log(evt)
    if (evt.target != undefined) {

      this.evokedBySubject.next({ value: evt.target.value, index: i })
    }
  }

  triggerLexicalizedSense(evt, i) {
    console.log(evt)
    if (evt.target != undefined) {

      this.lexicalizedSenseSubject.next({ value: evt.target.value, index: i })
    }
  }

  handleIsEvokedBy(evt, i) {

    if (evt instanceof NgSelectComponent) {
      if (evt.selectedItems.length > 0) {
        console.log(evt.selectedItems[0])

        let entity = evt.selectedItems[0].value['lexicalEntry'];
        let label = evt.selectedItems[0].value['label'];
        this.onChangeIsEvokedBy({ name: entity, i: i, label: label })
      }
    }
  }

  handleLexicalizedSense(evt, i) {

    if (evt instanceof NgSelectComponent) {
      if (evt.selectedItems.length > 0) {
        console.log(evt.selectedItems[0])

        let entity = evt.selectedItems[0].value['sense'];
        let label = evt.selectedItems[0].value['lemma'];
        this.onChangeLexicalizedSense({ name: entity, i: i, label: label })
      }
    }
  }

  onChangeIsEvokedBy(data) {
    var index = data['i'];
    this.isEvokedByArray = this.lexicalConceptForm.get("isEvokedBy") as FormArray;

    let existOrNot = this.memoryIsEvokedBy.some(element => element?.entity == data.name || element?.name == data.name)

    if (this.memoryIsEvokedBy[index] == undefined && !existOrNot) {
      let newValue = data.name;


      const parameters = {
        type: "conceptRel",
        relation: "http://www.w3.org/ns/lemon/ontolex#isEvokedBy",
        value: newValue
      }
      console.log(parameters)
      let conceptId = this.object.lexicalConcept;
      this.lexicalService.updateLinguisticRelation(conceptId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          data['request'] = 0;
          this.lexicalService.refreshAfterEdit(data);
          this.lexicalService.updateCoreCard(data)
          this.disableAddIsEvokedBy = false;
        }, error => {
          console.log(error)

          /* this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
          }); */
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status == 200) {
            this.disableAddIsEvokedBy = false;
            this.toastr.success('Lexical concept added correctly for ' + conceptId, '', {
              timeOut: 5000,
            });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });

          }


          this.isEvokedByArray.at(index).get('label').setValue(data.label, { emitEvent: false });
          this.isEvokedByArray.at(index).get('entity').setValue(data.name, { emitEvent: false });
          this.isEvokedByArray.at(index).get('type').setValue('internal', { emitEvent: false });
          this.isEvokedByArray.at(index).get('inferred').setValue(false, { emitEvent: false });



        }
      )
      this.memoryIsEvokedBy[index] = data;


    } else if (this.memoryIsEvokedBy[index] != undefined) {
      const oldValue = this.memoryIsEvokedBy[index]['entity'] == undefined ? this.memoryIsEvokedBy[index]['instance_name'] : this.memoryIsEvokedBy[index]['entity']
      const newValue = data['name']
      const parameters = {
        type: "conceptRel",
        relation: "http://www.w3.org/ns/lemon/ontolex#isEvokedBy",
        value: newValue,
        currentValue: oldValue
      }

      let conceptId = this.object.lexicalConcept;
      console.log(parameters)
      this.lexicalService.updateLinguisticRelation(conceptId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          this.lexicalService.updateCoreCard(data)
          data['request'] = 0;
          this.lexicalService.refreshAfterEdit(data);
        }, error => {
          console.log(error)
          const data = this.object;
          data['request'] = 0;

          //this.lexicalService.refreshAfterEdit(data);
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status == 200) {
            this.toastr.success('Lexical Concept changed correctly for ' + conceptId, '', {
              timeOut: 5000,
            });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }
        }
      )
      this.memoryIsEvokedBy[index] = data;
    } else if (existOrNot) {
      this.toastr.error('This lexical concept already exist in this lexical entry', 'Error', {
        timeOut: 5000
      })
    }


  }

  onChangeLexicalizedSense(data) {
    var index = data['i'];
    this.lexicalizedSensesArray = this.lexicalConceptForm.get("lexicalizedSenses") as FormArray;

    let existOrNot = this.memoryLexicalizedSenses.some(element => element?.entity == data.name || element?.name == data.name)

    if (this.memoryLexicalizedSenses[index] == undefined && !existOrNot) {
      let newValue = data.name;


      const parameters = {
        type: "conceptRel",
        relation: "http://www.w3.org/ns/lemon/ontolex#lexicalizedSense",
        value: newValue
      }
      console.log(parameters)
      let conceptId = this.object.lexicalConcept;
      this.lexicalService.updateLinguisticRelation(conceptId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          data['request'] = 0;
          this.lexicalService.refreshAfterEdit(data);
          this.lexicalService.updateCoreCard(data)
          this.disableAddLexicalizedSense = false;
        }, error => {
          console.log(error)

          /* this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
          }); */
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status == 200) {
            this.disableAddLexicalizedSense = false;
            this.toastr.success('Lexicalized sense added correctly for ' + conceptId, '', {
              timeOut: 5000,
            });
            this.lexicalizedSensesArray.at(index).get('label').setValue(data.label, { emitEvent: false });
            this.lexicalizedSensesArray.at(index).get('entity').setValue(data.name, { emitEvent: false });
            this.lexicalizedSensesArray.at(index).get('type').setValue('internal', { emitEvent: false });
            this.lexicalizedSensesArray.at(index).get('inferred').setValue(false, { emitEvent: false });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });

          }


          



        }
      )
      this.memoryLexicalizedSenses[index] = data;


    } else if (this.memoryLexicalizedSenses[index] != undefined) {
      const oldValue = this.memoryLexicalizedSenses[index]['entity'] == undefined ? this.memoryLexicalizedSenses[index]['name'] : this.memoryLexicalizedSenses[index]['entity']
      const newValue = data['name']
      const parameters = {
        type: "conceptRel",
        relation: "http://www.w3.org/ns/lemon/ontolex#lexicalizedSense",
        value: newValue,
        currentValue: oldValue
      }
      let raw_data = data;
      let conceptId = this.object.lexicalConcept;
      console.log(parameters)
      this.lexicalService.updateLinguisticRelation(conceptId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          this.lexicalService.updateCoreCard(data)
          data['request'] = 0;
          this.lexicalService.refreshAfterEdit(data);
        }, error => {
          console.log(error)
          const data = raw_data;
          data['request'] = 0;

          //this.lexicalService.refreshAfterEdit(data);
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status == 200) {
            this.toastr.success('Lexicalized sense changed correctly for ' + conceptId, '', {
              timeOut: 5000,
            });
            this.lexicalizedSensesArray.at(index).get('label').setValue(data.label, { emitEvent: false });
            this.lexicalizedSensesArray.at(index).get('entity').setValue(data.name, { emitEvent: false });
            this.lexicalizedSensesArray.at(index).get('type').setValue('internal', { emitEvent: false });
            this.lexicalizedSensesArray.at(index).get('inferred').setValue(false, { emitEvent: false });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }
        }
      )
      this.memoryLexicalizedSenses[index] = data;
    } else if (existOrNot) {
      this.toastr.error('This lexicalized sense already exist in this lexical entry', 'Error', {
        timeOut: 5000
      })
    }


  }

  addIsEvokedBy(entity?, type?, inferred?, label?) {
    this.isEvokedByArray = this.lexicalConceptForm.get('isEvokedBy') as FormArray;
    if (entity != undefined) {
      this.isEvokedByArray.push(this.createIsEvokedBy(entity, type, inferred, label));
    } else {
      this.disableAddIsEvokedBy = true;
      this.isEvokedByArray.push(this.createIsEvokedBy());
    }
  }

  addLexicalizedSense(entity?, type?, inferred?, label?) {
    this.lexicalizedSensesArray = this.lexicalConceptForm.get('lexicalizedSenses') as FormArray;
    if (entity != undefined) {
      this.lexicalizedSensesArray.push(this.createLexicalizedSense(entity, type, inferred, label));
    } else {
      this.disableAddIsEvokedBy = true;
      this.lexicalizedSensesArray.push(this.createLexicalizedSense());
    }
  }

  createIsEvokedBy(e?, t?, i?, l?): FormGroup {

    if (e != undefined) {
      return this.formBuilder.group({
        entity: e,
        inferred: i,
        label: l,
        type: t,
      })
    } else {
      return this.formBuilder.group({
        entity: new FormControl(''),
        inferred: new FormControl(false),
        label: new FormControl(''),
        type: new FormControl(''),
      })
    }
  }

  createLexicalizedSense(e?, t?, i?, l?): FormGroup {

    if (e != undefined) {
      return this.formBuilder.group({
        entity: e,
        inferred: i,
        label: l,
        type: t,
      })
    } else {
      return this.formBuilder.group({
        entity: new FormControl(''),
        inferred: new FormControl(false),
        label: new FormControl(''),
        type: new FormControl(''),
      })
    }
  }

  removeLexicalizedSense(index) {
    this.lexicalizedSensesArray = this.lexicalConceptForm.get('lexicalizedSenses') as FormArray;

    this.disableAddLexicalizedSense = false;
    const entity = this.lexicalizedSensesArray.at(index).get('entity').value;

    let conceptId = this.object.lexicalConcept;

    let parameters = {
      relation: 'http://www.w3.org/ns/lemon/ontolex#lexicalizedSense',
      value: entity
    }


    if (entity != '') {
      this.lexicalService.deleteLinguisticRelation(conceptId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.updateCoreCard(this.object);
          this.toastr.success("Relation removed", '', {
            timeOut: 5000,
          });

        }, error => {
          console.log(error)
          //this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          if (error.status == 200) {
            this.toastr.success('Relation removed', '', {
              timeOut: 5000,
            });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }

        }
      )
    }


    this.lexicalizedSensesArray.removeAt(index);

    this.memoryLexicalizedSenses.splice(index, 1)
  }

  removeIsEvokedBy(index) {
    this.isEvokedByArray = this.lexicalConceptForm.get('isEvokedBy') as FormArray;

    this.disableAddIsEvokedBy = false;
    const entity = this.isEvokedByArray.at(index).get('entity').value;

    let conceptId = this.object.lexicalConcept;

    let parameters = {
      relation: 'http://www.w3.org/ns/lemon/ontolex#isEvokedBy',
      value: entity
    }


    if (entity != '') {
      this.lexicalService.deleteLinguisticRelation(conceptId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.updateCoreCard(this.object);
          this.toastr.success("Relation removed", '', {
            timeOut: 5000,
          });

        }, error => {
          console.log(error)
          //this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          if (error.status == 200) {
            this.toastr.success('Relation removed', '', {
              timeOut: 5000,
            });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }

        }
      )
    }


    this.isEvokedByArray.removeAt(index);

    this.memoryIsEvokedBy.splice(index, 1)
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}

