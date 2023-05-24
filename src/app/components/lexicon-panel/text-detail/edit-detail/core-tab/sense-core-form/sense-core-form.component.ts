/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, pairwise, startWith, take, takeUntil } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ConceptService } from 'src/app/services/concept/concept.service';


@Component({
  selector: 'app-sense-core-form',
  templateUrl: './sense-core-form.component.html',
  styleUrls: ['./sense-core-form.component.scss']
})
export class SenseCoreFormComponent implements OnInit, OnDestroy {

  @Input() senseData: any;

  private subject_def: Subject<any> = new Subject();
  private subject_ex_def: Subject<any> = new Subject();

  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;

  disableAddDef = false;

  definitionData = [];
  definitionMemory = [];

  memoryConfidence = null;

  staticDef = [];

  senseCore = new FormGroup({
    definition: new FormArray([this.createDefinition()]),
    confidence: new FormControl(null),
    usage: new FormControl('', [Validators.required, Validators.minLength(5)]),
    topic: new FormControl('', [Validators.required, Validators.minLength(5)]),
    reference: new FormArray([this.createReference()]),
    lexical_concept: new FormArray([]),
    sense_of: new FormControl('', [Validators.required, Validators.minLength(5)])
  })

  definitionArray: FormArray;
  lexicalConceptArray: FormArray;

  subject_def_subscription: Subscription;
  subject_ex_def_subscription: Subscription;
  destroy$: Subject<boolean> = new Subject();
  searchResults: any[] = [];
  filterLoading: boolean = false;
  lexical_concept_subject: Subject<any> = new Subject();
  memoryLexicalConcept: any[] = [];
  disableAddLexicalConcept: boolean;

  constructor(private lexicalService: LexicalEntriesService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private conceptService: ConceptService) { }

  ngOnInit() {
    setTimeout(() => {
      //@ts-ignore
      $('.denotes-tooltip').tooltip({
        trigger: 'hover'
      });
    }, 1000);
    this.loadPeople();

    this.subject_def_subscription = this.subject_def.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onChangeDefinition(data)
      }
    )

    this.subject_ex_def_subscription = this.subject_ex_def.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onChangeExistingDefinition(data['evt'], data['i'])
      }
    )

    this.lexical_concept_subject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      data => {
        this.onSearchFilter(data)
      }
    )

    this.senseCore = this.formBuilder.group({
      definition: this.formBuilder.array([]),
      confidence: false,
      usage: '',
      topic: '',
      reference: this.formBuilder.array([this.createReference()]),
      lexical_concept: this.formBuilder.array([]),
      sense_of: ''
    })

    this.onChanges();

  }

  private loadPeople() {
    /* this.peopleLoading = true;
    this.dataService.getPeople().subscribe(x => {
      this.people = x;
      this.peopleLoading = false;
    }); */
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (this.object != changes.senseData.currentValue) {
        this.lexicalConceptArray = this.senseCore.get('lexical_concept') as FormArray;
        this.lexicalConceptArray.clear();

        this.definitionArray = this.senseCore.get('definition') as FormArray;
        this.definitionArray.clear();

        this.staticDef = [];
        this.memoryLexicalConcept = [];
        this.memoryConfidence = [];
      }
      this.object = changes.senseData.currentValue;
      if (this.object != null) {

        this.definitionData = [];
        this.definitionMemory = [];

        for (var i = 0; i < this.object.definition.length; i++) {
          const pId = this.object.definition[i]['propertyID'];
          const pVal = this.object.definition[i]['propertyValue'];
          this.definitionData.push(pId);

          if (pId == 'definition' && pVal == '') {
            this.definitionMemory.push(pId);
            this.addDefinition(pId, pVal)

            this.staticDef.push({ trait: pId, value: pVal })
          }

          if (pVal != '') {
            this.definitionMemory.push(pId);
            this.addDefinition(pId, pVal)

            this.staticDef.push({ trait: pId, value: pVal })
          }
        }
        //console.log(this.object)
        if (this.object.confidence == 0) {
          this.senseCore.get('confidence').setValue(true, { emitEvent: false });
        } else {
          this.senseCore.get('confidence').setValue(false, { emitEvent: false });
        }
        this.senseCore.get('topic').setValue(this.object.topic, { emitEvent: false })
        this.senseCore.get('usage').setValue(this.object.usage, { emitEvent: false });
        /* this.addLexicalConcept(this.object.concept); */
        this.senseCore.get('sense_of').setValue(this.object.sense, { emitEvent: false });
        const senseId = this.object.sense;
        this.lexicalService.getLexEntryLinguisticRelation(senseId, 'isLexicalizedSenseOf').pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            console.log(data)
            for (var i = 0; i < data.length; i++) {
              let entity = data[i]['entity'];
              let type = data[i]['linkType'];
              let label = data[i]['label'];
              let inferred = data[i]['inferred'];
              this.addLexicalConcept(entity, type, inferred, label);
              this.memoryLexicalConcept.push(data[i])
            }
          }, error => {
            console.log(error)
          }
        )
      }
    }, 10)
  }


  onChanges(): void {
    this.senseCore.get('usage').valueChanges.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(newDef => {
      this.lexicalService.spinnerAction('on');
      let senseId = this.object.sense;
      let parameters = {
        relation: "http://www.w3.org/ns/lemon/ontolex#usage",
        value: newDef
      }
      this.lexicalService.updateSense(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.spinnerAction('off');
          //this.lexicalService.refreshLexEntryTree();
          this.lexicalService.updateCoreCard(this.object)
        }, error => {
          console.log(error)
          //this.lexicalService.refreshLexEntryTree();
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status != 200) {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          } else {
            this.toastr.success('Sense usage changed', '', {
              timeOut: 5000,
            });
          }
        }
      )
    })

    this.senseCore.get('confidence').valueChanges.pipe(debounceTime(100), startWith(this.senseCore.get('confidence').value), pairwise(), takeUntil(this.destroy$)).subscribe(([prev, next]: [any, any]) => {
      let confidence_value = null;
      console.log(confidence_value);
      let senseId = this.object.sense;

      this.senseCore.get('confidence').setValue(next, { emitEvent: false });

      let oldValue = prev ? 0 : 1;
      let newValue = next ? 0 : 1;
      let parameters = {
        relation: 'http://www.lexinfo.net/ontology/3.0/lexinfo#confidence',
        value: newValue
      };


      //if (this.memoryConfidence != null) parameters['currentValue'] = oldValue;
      this.memoryConfidence = oldValue;

      this.lexicalService.updateSense(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
        },
        error => {
          if (error.status == 200) this.toastr.success('Confidence updated', '', { timeOut: 5000 })
          if (error.status != 200) this.toastr.error(error.error, '', { timeOut: 5000 })
        }
      )

    });

    this.senseCore.get('topic').valueChanges.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(newTopic => {
      if (newTopic.trim() != '') {
        this.lexicalService.spinnerAction('on');
        let senseId = this.object.sense;
        let parameters = {
          relation: "http://purl.org/dc/terms/subject",
          value: newTopic
        }
        this.lexicalService.updateSense(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            console.log(data)
            this.lexicalService.spinnerAction('off');
            //this.lexicalService.refreshLexEntryTree();
            this.lexicalService.updateCoreCard(this.object)
            this.toastr.success('Sense topic changed', '', {
              timeOut: 5000,
            });

          }, error => {
            console.log(error)
            //this.lexicalService.refreshLexEntryTree();
            this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
            this.lexicalService.spinnerAction('off');
            if (typeof (error.error) != 'object') {
              this.toastr.error(error.error, 'Error', {
                timeOut: 5000,
              });
            }

          }
        )
      }

    })

    this.senseCore.get('reference').valueChanges.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(newDef => {
      this.lexicalService.spinnerAction('on');
      let senseId = this.object.sense;
      let parameters = {
        relation: "http://www.w3.org/ns/lemon/ontolex#reference",
        value: newDef[0]['entity']
      }
      //console.log(senseId)
      console.log(parameters);
      this.lexicalService.updateSense(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.spinnerAction('off');
          //this.lexicalService.refreshLexEntryTree();
          this.lexicalService.updateCoreCard(this.object)
        }, error => {
          console.log(error)
          //this.lexicalService.refreshLexEntryTree();
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status != 200) {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          } else {
            this.toastr.success('Sense reference changed', '', {
              timeOut: 5000,
            });
          }
        }
      )
    })
  }

  onChangeDefinitionTrait(evt, i) {

    setTimeout(() => {
      this.definitionArray = this.senseCore.get('definition') as FormArray;
      this.definitionArray.at(i).patchValue({ propertyID: evt.target.value, propertyValue: "" });
      if (evt.target.value != '') {

        this.definitionMemory[i] = evt.target.value;
      } else {

        this.definitionMemory.splice(i, 1)
      }



    }, 250);
  }

  createReference() {
    return this.formBuilder.group({
      entity: new FormControl(null, [Validators.required, Validators.minLength(5)])
    })
  }

  addDefinition(pId?, pVal?) {
    this.definitionArray = this.senseCore.get('definition') as FormArray;
    if (pId != undefined) {
      this.definitionArray.push(this.createDefinition(pId, pVal));
    } else {
      this.disableAddDef = true;
      this.definitionArray.push(this.createDefinition());
    }
  }

  removeDefinition(index) {
    const definitionArray = this.senseCore.get('definition') as FormArray;

    const trait = this.definitionArray.at(index).get('propertyID').value;
    const value = this.definitionArray.at(index).get('propertyValue').value;

    //console.log(trait + value)

    if (trait != null) {

      let senseId = this.object.sense;

      let parameters = {
        relation: 'http://www.lexinfo.net/ontology/3.0/lexinfo#' + trait,
        value: value
      }

      this.lexicalService.deleteLinguisticRelation(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.updateCoreCard(this.object)

          this.toastr.success('Sense definition deleted', '', {
            timeOut: 5000,
          });

        }, error => {
          console.log(error);
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          if (typeof (error.error) != 'object') {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }
        }
      )
    } else {
      this.disableAddDef = false;
    }
    this.definitionMemory.splice(index, 1);
    this.staticDef.splice(index, 1);
    definitionArray.removeAt(index)
  }

  debounceExistingKeyup(evt, i) {
    this.lexicalService.spinnerAction('on');
    this.subject_ex_def.next({ evt, i })
  }

  debounceKeyup(evt, i) {
    this.lexicalService.spinnerAction('on');
    this.subject_def.next({ evt, i })
  }

  createDefinition(pId?, pVal?) {
    if (pId != undefined) {
      return this.formBuilder.group({
        propertyID: new FormControl(pId, [Validators.required, Validators.minLength(0)]),
        propertyValue: new FormControl(pVal, [Validators.required, Validators.minLength(0)])
      })
    } else {
      return this.formBuilder.group({
        propertyID: new FormControl(null, [Validators.required, Validators.minLength(0)]),
        propertyValue: new FormControl(null, [Validators.required, Validators.minLength(0)])
      })
    }

  }

  onSearchFilter(data) {
    this.filterLoading = true;
    this.searchResults = [];

    let value = data.value;
    let index = data.index;

    this.lexicalConceptArray = this.senseCore.get('lexical_concept') as FormArray;

    if (this.object.sense != undefined) {
      let parameters = {
        text: value,
        searchMode: "startsWith",
        labelType: "prefLabel",
        author: "",
        offset: 0,
        limit: 500
      }

      /* && data.length >= 3 */

      this.conceptService.conceptFilter(parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)

          if (data.list.length > 0) {
            let filter_lang = [];
            filter_lang = data.list.filter(
              element => element.language != 'null'
            )

            console.log(filter_lang)
            this.searchResults = filter_lang;
            this.filterLoading = false;
          } else {
            this.filterLoading = false;
          }

        }, error => {
          //console.log(error)
          this.filterLoading = false;
        }
      )

    } else {
      this.filterLoading = false;


    }

  }

  triggerLexicalConcept(evt, i) {
    console.log(evt)
    if (evt.target != undefined) {

      this.lexical_concept_subject.next({ value: evt.target.value, index: i })
    }
  }

  handleLexicalConcept(evt, i) {

    if (evt instanceof NgSelectComponent) {
      if (evt.selectedItems.length > 0) {
        console.log(evt.selectedItems[0])

        let label = evt.selectedItems[0].value['lexicalConcept'];
        let prefLabel = evt.selectedItems[0].value['defaultLabel'];
        
        this.onChangeLexicalConcept({ name: label, i: i, defaultLabel: prefLabel })
      }
    } else {
      let label = evt.target.value;
      this.lexical_concept_subject.next({ name: label, i: i })
    }
  }

  onChangeLexicalConcept(data) {
    var index = data['i'];
    this.lexicalConceptArray = this.senseCore.get("lexical_concept") as FormArray;
    let existOrNot = this.memoryLexicalConcept.some(element => element?.entity == data.name || element?.name == data.name)

    if (this.memoryLexicalConcept[index] == undefined && !existOrNot) {
      let newValue = data.name;


      const parameters = {
        type: "conceptRel",
        relation: "http://www.w3.org/ns/lemon/ontolex#isLexicalizedSenseOf",
        value: newValue
      }
      console.log(parameters)
      let senseId = this.object.sense;
      this.lexicalService.updateLinguisticRelation(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          data['request'] = 0;
          this.lexicalService.refreshAfterEdit(data);
          this.lexicalService.updateCoreCard(data)
          this.disableAddLexicalConcept = false;
        }, error => {
          console.log(error)

          /* this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
          }); */
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status == 200) {
            this.disableAddLexicalConcept = false;
            this.toastr.success('Lexical concept added correctly for ' + senseId, '', {
              timeOut: 5000,
            });
            this.lexicalConceptArray.at(index).get('label').setValue(data.defaultLabel, { emitEvent: false });
            this.lexicalConceptArray.at(index).get('entity').setValue(data.name, { emitEvent: false });
            this.lexicalConceptArray.at(index).get('type').setValue('internal', { emitEvent: false });
            this.lexicalConceptArray.at(index).get('inferred').setValue(false, { emitEvent: false });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });

          }


          



        }
      )
      this.memoryLexicalConcept[index] = data;


    } else if (this.memoryLexicalConcept[index] != undefined) {
      const oldValue = this.memoryLexicalConcept[index]['entity'] == undefined ? this.memoryLexicalConcept[index]['name'] : this.memoryLexicalConcept[index]['entity']
      const newValue = data['name']
      const parameters = {
        type: "conceptRel",
        relation: "http://www.w3.org/ns/lemon/ontolex#isLexicalizedSenseOf",
        value: newValue,
        currentValue: oldValue
      }

      let senseId = this.object.sense;
      console.log(parameters);

      let raw_data = data;
      this.lexicalService.updateLinguisticRelation(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
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
            this.toastr.success('Lexical Concept changed correctly for ' + senseId, '', {
              timeOut: 5000,
            });

            this.lexicalConceptArray.at(index).get('label').setValue(raw_data.defaultLabel, { emitEvent: false });
            this.lexicalConceptArray.at(index).get('entity').setValue(raw_data.name, { emitEvent: false });
            this.lexicalConceptArray.at(index).get('type').setValue('internal', { emitEvent: false });
            this.lexicalConceptArray.at(index).get('inferred').setValue(false, { emitEvent: false });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }
        }
      )
      this.memoryLexicalConcept[index] = data;
    } else if (existOrNot) {
      this.toastr.error('This lexical concept already exist in this lexical entry', 'Error', {
        timeOut: 5000
      })
    }


  }

  onChangeExistingDefinition(evt, i) {

    this.definitionArray = this.senseCore.get('definition') as FormArray;
    const trait = this.definitionArray.at(i).get('propertyID').value;
    const newValue = evt.target.value;
    const senseId = this.object.sense;
    let namespace = trait == 'definition' ? 'http://www.w3.org/2004/02/skos/core#' : 'http://www.lexinfo.net/ontology/3.0/lexinfo#';
    const parameters = {
      relation: namespace + trait,
      value: newValue
    }

    if (trait != undefined && newValue != '') {

      this.staticDef[i] = { trait: trait, value: newValue };
      this.lexicalService.updateSense(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.spinnerAction('off');
          //this.lexicalService.refreshLexEntryTree();
          if (trait == 'definition') {

          }
          this.lexicalService.updateCoreCard(data)
        }, error => {
          console.log(error);
          //this.lexicalService.refreshLexEntryTree();
          if (trait == 'definition') {
            const data = this.object;
            data['whatToSearch'] = 'sense';
            data['new_definition'] = newValue;
            data['request'] = 6;
            this.lexicalService.refreshAfterEdit(data);
          }
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status != 200) {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          } else {
            this.toastr.success('Sense definition changed', '', {
              timeOut: 5000,
            });
          }
        }
      )
    } else {
      this.lexicalService.spinnerAction('off');
      this.staticDef[i] = { trait: trait, value: "" };
    }
  }

  onChangeDefinition(object) {

    this.definitionArray = this.senseCore.get('definition') as FormArray;
    const trait = this.definitionArray.at(object.i).get('propertyID').value;
    const newValue = object.evt.target.value;
    const senseId = this.object.sense;
    let namespace = trait == 'definition' ? 'http://www.w3.org/2004/02/skos/core#' : 'http://www.lexinfo.net/ontology/3.0/lexinfo#';
    const parameters = { relation: namespace + trait, value: newValue }

    if (trait != undefined) {

      this.staticDef.push({ trait: trait, value: newValue });
      this.lexicalService.updateSense(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.spinnerAction('off');
          //this.lexicalService.refreshLexEntryTree();
          this.lexicalService.updateCoreCard(data)
          this.disableAddDef = false;
        }, error => {
          console.log(error);
          //this.lexicalService.refreshLexEntryTree();

          this.disableAddDef = false;
          if (error.status != 200) {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
            this.lexicalService.spinnerAction('off');
          } else {

            if (trait == 'definition') {
              const data = this.object;
              data['whatToSearch'] = 'sense';
              data['new_definition'] = newValue;
              data['request'] = 6;

              this.lexicalService.refreshAfterEdit(data);

            }
            this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
            this.lexicalService.spinnerAction('off');
            this.toastr.success('Sense ' + trait + ' changed', '', {
              timeOut: 5000,
            });
          }

        }
      )
    } else {
      this.lexicalService.spinnerAction('off');
    }
  }


  removeReference(index) {
    const referenceArray = this.senseCore.get('reference') as FormArray;
    referenceArray.removeAt(index)
  }

  createLexicalConcept(e?, t?, i?, l?) {
    if (e != undefined) {
      return this.formBuilder.group({
        entity: e,
        inferred: i,
        label: l,
        type: t
      })
    } else {
      return this.formBuilder.group({
        entity: '',
        inferred: false,
        label: '',
        type: null
      })
    }

  }

  addLexicalConcept(entity?, type?, inferred?, label?) {
    this.lexicalConceptArray = this.senseCore.get('lexical_concept') as FormArray;
    if (entity != undefined) {
      this.lexicalConceptArray.push(this.createLexicalConcept(entity, type, inferred, label));
    } else {
      this.disableAddLexicalConcept = true;
      this.lexicalConceptArray.push(this.createLexicalConcept());
    }
  }

  removeLexicalConcept(index) {
    this.lexicalConceptArray = this.senseCore.get('lexical_concept') as FormArray;

    this.disableAddLexicalConcept = false;
    const entity = this.lexicalConceptArray.at(index).get('entity').value;

    let senseId = this.object.sense;

    let parameters = {
      relation: 'http://www.w3.org/ns/lemon/ontolex#isLexicalizedSenseOf',
      value: entity
    }


    if (entity != '') {
      this.lexicalService.deleteLinguisticRelation(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.updateCoreCard(this.object);
          this.toastr.success("Lexical Concept removed", '', {
            timeOut: 5000,
          });

        }, error => {
          console.log(error)
          //this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          if (error.status == 200) {
            this.toastr.success('Lexical Concept deleted correctly', 'Error', {
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


    this.lexicalConceptArray.removeAt(index);

    this.memoryLexicalConcept.splice(index, 1)
  }

  ngOnDestroy(): void {
    this.subject_def_subscription.unsubscribe();
    this.subject_ex_def_subscription.unsubscribe();

    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
