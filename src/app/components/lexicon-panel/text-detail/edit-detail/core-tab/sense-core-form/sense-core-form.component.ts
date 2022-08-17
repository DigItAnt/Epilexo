/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, pairwise, startWith } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-sense-core-form',
  templateUrl: './sense-core-form.component.html',
  styleUrls: ['./sense-core-form.component.scss']
})
export class SenseCoreFormComponent implements OnInit {

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

  staticDef = [];

  senseCore = new FormGroup({
    definition: new FormArray([this.createDefinition()]),
    confidence: new FormControl(null),
    usage: new FormControl('', [Validators.required, Validators.minLength(5)]),
    topic: new FormControl('', [Validators.required, Validators.minLength(5)]),
    reference: new FormArray([this.createReference()]),
    lexical_concept: new FormArray([this.createLexicalConcept()]),
    sense_of: new FormControl('', [Validators.required, Validators.minLength(5)])
  })

  definitionArray: FormArray;
  lexicalConceptArray: FormArray;

  constructor(private lexicalService: LexicalEntriesService, private formBuilder: FormBuilder, private toastr: ToastrService) { }

  ngOnInit() {
    setTimeout(() => {
      //@ts-ignore
      $('.denotes-tooltip').tooltip({
        trigger: 'hover'
      });
    }, 1000);
    this.loadPeople();

    this.subject_def.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onChangeDefinition(data)
      }
    )

    this.subject_ex_def.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onChangeExistingDefinition(data['evt'], data['i'])
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
        this.senseCore.get('confidence').setValue(this.object.confidence, { emitEvent: false })
        this.senseCore.get('topic').setValue(this.object.topic, { emitEvent: false })
        this.senseCore.get('usage').setValue(this.object.usage, { emitEvent: false });
        this.addLexicalConcept(this.object.concept);
        this.senseCore.get('sense_of').setValue(this.object.sense, { emitEvent: false });
      }
    }, 10)
  }


  onChanges(): void {
    this.senseCore.get('usage').valueChanges.pipe(debounceTime(1000)).subscribe(newDef => {
      this.lexicalService.spinnerAction('on');
      let senseId = this.object.senseInstanceName;
      let parameters = {
        relation: "usage",
        value: newDef
      }
      this.lexicalService.updateSense(senseId, parameters).subscribe(
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

    this.senseCore.controls['confidence'].valueChanges.pipe(startWith(undefined), debounceTime(1000), pairwise()).subscribe(newConfidence => {
      console.log('Old value: ', newConfidence[0]);
      console.log('New value: ', newConfidence[1]);
      this.lexicalService.spinnerAction('on');
      let parameters = {};
      let senseId = this.object.senseInstanceName;
      let oldValue = newConfidence[0];
      let newValue = newConfidence[1];

      if (oldValue == undefined) {
        parameters = {
          type: "confidence",
          relation: 'confidence',
          value: newValue
        }
      } else if (oldValue != undefined && this.object.confidence == -1) {
        parameters = {
          type: "confidence",
          relation: 'confidence',
          value: newValue,
          currentValue: -1
        }
      } else {
        parameters = {
          type: "confidence",
          relation: 'confidence',
          value: newValue,
          currentValue: oldValue
        }
      }

      console.log(parameters)
      this.lexicalService.updateGenericRelation(senseId, parameters).subscribe(
        data => {
          console.log(data);

          this.lexicalService.updateCoreCard(data)
          this.lexicalService.spinnerAction('off');
        },
        error => {
          console.log(error);

          this.lexicalService.spinnerAction('off');

          if (error.status == 200) {
            this.toastr.success('Confidence updated', '', { timeOut: 5000 })
            this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
            this.senseCore.get('confidence').setValue(newValue, { emitEvent: false });
            this.object.confidence = newValue;
          } else {
            this.toastr.error(error.error, 'Error', { timeOut: 5000 })

          }
        }
      )
    })

    this.senseCore.get('topic').valueChanges.pipe(debounceTime(1000)).subscribe(newTopic => {
      if (newTopic.trim() != '') {
        this.lexicalService.spinnerAction('on');
        let senseId = this.object.senseInstanceName;
        let parameters = {
          relation: "subject",
          value: newTopic
        }
        this.lexicalService.updateSense(senseId, parameters).subscribe(
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

    this.senseCore.get('reference').valueChanges.pipe(debounceTime(1000)).subscribe(newDef => {
      this.lexicalService.spinnerAction('on');
      let senseId = this.object.senseInstanceName;
      let parameters = {
        relation: "reference",
        value: newDef[0]['entity']
      }
      //console.log(senseId)
      console.log(parameters);
      this.lexicalService.updateSense(senseId, parameters).subscribe(
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

  applyUncertain() {
    this.lexicalService.spinnerAction('on');
    let oldValue = this.senseCore.get('confidence').value;
    let senseId = this.object.senseInstanceName;
    let parameters = {
      relation: 'confidence',
      value: 0
    }
    console.log(parameters)
    this.lexicalService.deleteLinguisticRelation(senseId, parameters).subscribe(
      data => {
        console.log(data);
        /* data['request'] = 0;
        data['new_label'] = confidence_value
        this.lexicalService.refreshAfterEdit(data); */
        this.lexicalService.updateCoreCard(data)
        this.lexicalService.spinnerAction('off');
        this.senseCore.get('confidence').setValue(-1, { emitEvent: false });
        this.object.confidence = -1;
      },
      error => {
        console.log(error);
        /*  const data = this.object.etymology;
        data['request'] = 0;
        data['new_label'] = confidence_value;
        this.lexicalService.refreshAfterEdit(data); */
        this.lexicalService.spinnerAction('off');
        this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
        if (error.status == 200) {
          this.toastr.success('Confidence updated', '', { timeOut: 5000 })
          this.senseCore.get('confidence').setValue(-1, { emitEvent: false });
          this.object.confidence = -1;
        } else {
          this.toastr.error(error.error, 'Error', { timeOut: 5000 })

        }
      }
    )
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

      let senseId = this.object.senseInstanceName;

      let parameters = {
        relation: trait,
        value: value
      }

      this.lexicalService.deleteLinguisticRelation(senseId, parameters).subscribe(
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

  onChangeExistingDefinition(evt, i) {

    this.definitionArray = this.senseCore.get('definition') as FormArray;
    const trait = this.definitionArray.at(i).get('propertyID').value;
    const newValue = evt.target.value;
    const senseId = this.object.senseInstanceName;
    const parameters = { relation: trait, value: newValue }

    if (trait != undefined && newValue != '') {

      this.staticDef[i] = { trait: trait, value: newValue };
      this.lexicalService.updateSense(senseId, parameters).pipe(debounceTime(1000)).subscribe(
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
    const senseId = this.object.senseInstanceName;
    const parameters = { relation: trait, value: newValue }

    if (trait != undefined) {

      this.staticDef.push({ trait: trait, value: newValue });
      this.lexicalService.updateSense(senseId, parameters).pipe(debounceTime(1000)).subscribe(
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
          if (trait == 'definition') {
            const data = this.object;
            data['whatToSearch'] = 'sense';
            data['new_definition'] = newValue;
            data['request'] = 6;

            this.lexicalService.refreshAfterEdit(data);
            if (error.status != 200) {
              this.toastr.error(error.error, 'Error', {
                timeOut: 5000,
              });
            } else {
              this.toastr.success('Sense ' + trait + ' changed', '', {
                timeOut: 5000,
              });
            }
          }
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
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

  createLexicalConcept(e?) {
    if (e != undefined) {
      return this.formBuilder.group({
        lex_concept: new FormControl(e, [Validators.required, Validators.minLength(5)])
      })
    } else {
      return this.formBuilder.group({
        lex_concept: new FormControl(null, [Validators.required, Validators.minLength(5)])
      })
    }

  }

  addLexicalConcept(entity?) {
    this.lexicalConceptArray = this.senseCore.get('lexical_concept') as FormArray;
    if (entity != undefined) {
      this.lexicalConceptArray.push(this.createLexicalConcept(entity));
    } else {
      this.lexicalConceptArray.push(this.createLexicalConcept());
    }
  }

  removeLexicalConcept(index) {
    this.lexicalConceptArray = this.senseCore.get('lexical_concept') as FormArray;
    this.lexicalConceptArray.removeAt(index);
  }
}
