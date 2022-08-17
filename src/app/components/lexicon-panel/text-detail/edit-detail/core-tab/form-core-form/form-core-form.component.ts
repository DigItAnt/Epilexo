/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Form, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, pairwise, startWith } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-form-core-form',
  templateUrl: './form-core-form.component.html',
  styleUrls: ['./form-core-form.component.scss']
})
export class FormCoreFormComponent implements OnInit {

  @Input() formData: any;

  private subject_label: Subject<any> = new Subject();
  private subject_ex_label: Subject<any> = new Subject();

  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;
  typesData = [];
  morphologyData = [];
  valueTraits = [];
  memoryTraits = [];
  interval;

  formCore = new FormGroup({
    inheritance: new FormArray([this.createInheritance()]),
    type: new FormControl(''),
    confidence : new FormControl(null),
    label: new FormArray([this.createLabel()]),
    morphoTraits: new FormArray([this.createMorphoTraits()])
  })

  labelData = [];
  memoryLabel = [];

  typeDesc = '';

  staticOtherDef = [];
  staticMorpho = [];

  morphoTraits: FormArray;
  inheritanceArray: FormArray;
  labelArray: FormArray;

  disableAddOther = false;
  disableAddMorpho = false;

  constructor( private lexicalService: LexicalEntriesService, private formBuilder: FormBuilder, private toastr: ToastrService) { }

  ngOnInit() {
    this.lexicalService.getMorphologyData().subscribe(
      data => {
        this.morphologyData = data;
        this.morphologyData = this.morphologyData.filter(x => {
          if (x.propertyId != 'partOfSpeech') {
            return true;
          } else {
            return false
          }
        })
        /* //console.log(this.morphologyData) */
      }
    )

    setTimeout(() => {
      //@ts-ignore
      $('.denotes-tooltip').tooltip({
        trigger: 'hover'
      });
    }, 1000);
    this.loadPeople();

    this.formCore = this.formBuilder.group({
      inheritance: this.formBuilder.array([]),
      type: '',
      confidence : null,
      label: this.formBuilder.array([]),
      morphoTraits: this.formBuilder.array([]),
    })

    this.onChanges();
    this.subject_label.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onChangeLabel(data)
      }
    )

    this.subject_ex_label.pipe(debounceTime(1000)).subscribe(
      data => {

        this.onChangeExistingLabelValue(data['evt'], data['i']);
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

  }

  private loadPeople() {
    this.peopleLoading = true;
    /* this.dataService.getPeople().subscribe(x => {
      this.people = x;
      this.peopleLoading = false;
    }); */
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (this.object != changes.formData.currentValue) {
        this.morphoTraits = this.formCore.get('morphoTraits') as FormArray;
        this.morphoTraits.clear();

        this.inheritanceArray = this.formCore.get('inheritance') as FormArray;
        this.inheritanceArray.clear();

        this.labelArray = this.formCore.get('label') as FormArray;
        this.labelArray.clear();

        this.staticMorpho = [];
        this.staticOtherDef = [];
      }
      this.object = changes.formData.currentValue;
      //console.log(this.object)
      if (this.object != null) {

        this.valueTraits = [];
        this.memoryTraits = [];
        this.memoryLabel = [];
        this.labelData = [];

        if(this.object.inheritedMorphology != undefined){
          for (var i = 0; i < this.object.inheritedMorphology.length; i++) {
            const trait = this.object.inheritedMorphology[i]['trait'];
            const value = this.object.inheritedMorphology[i]['value'];
            this.addInheritance(trait, value);
          }
        }

        

        this.formCore.get('confidence').setValue(this.object.confidence, { emitEvent : false});
        this.formCore.get('type').setValue(this.object.type, { emitEvent: false });

        for (var i = 0; i < this.object.label.length; i++) {

          const trait = this.object.label[i]['propertyID'];
          const value = this.object.label[i]['propertyValue'];

          this.labelData.push(trait);

          if (value != '') {
            this.addLabel(trait, value);
            this.memoryLabel.push(trait);


            this.staticOtherDef.push({ trait: trait, value: value })
          }

        }

        setTimeout(() => {
          for (var i = 0; i < this.object.morphology.length; i++) {
            const trait = this.object.morphology[i]['trait'];
            const value = this.object.morphology[i]['value'];

            let traitDescription = '';
            this.morphologyData.filter(x => {
              if (x.propertyId == trait && trait != 'partOfSpeech') {
                x.propertyValues.filter(y => {
                  if (y.valueId == value) {
                    traitDescription = y.valueDescription;
                    return true;
                  } else {
                    return false;
                  }
                })
                return true;
              } else {
                return false;
              }
            })
            this.addMorphoTraits(trait, value, traitDescription);
            this.onChangeTrait(trait, i);

            this.staticMorpho.push({ trait: trait, value: value })
          }
        }, 100);


        setTimeout(() => {
          let type = this.formCore.get('type').value;
          this.typesData.forEach(el => {
            if (el.valueId == type) {

              this.typeDesc = el.valueDescription;
            }
          })
          //@ts-ignore
          $('.type-tooltip').tooltip({
            trigger: 'hover'
          });


        }, 1000);

        setTimeout(() => {

          //@ts-ignore
          $('.trait-tooltip').tooltip({
            trigger: 'hover'
          });


        }, 1000);
      }
    }, 200)

  }

  onChanges(): void {

    this.formCore.controls['confidence'].valueChanges.pipe(startWith(undefined), debounceTime(1000), pairwise()).subscribe(newConfidence => {
      console.log('Old value: ', newConfidence[0]);
      console.log('New value: ', newConfidence[1]);
      this.lexicalService.spinnerAction('on');
      let parameters = {};
      let lexId = this.object.formInstanceName;
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
      this.lexicalService.updateGenericRelation(lexId, parameters).subscribe(
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
            this.formCore.get('confidence').setValue(newValue, { emitEvent: false });
            this.object.confidence = newValue;
          } else {
            this.toastr.error(error.error, 'Error', { timeOut: 5000 })

          }
        }
      )
    })
  }

  applyUncertain() {
    this.lexicalService.spinnerAction('on');
    let oldValue = this.formCore.get('confidence').value;
    let lexId = this.object.formInstanceName;
    let parameters = {
      relation: 'confidence',
      value: 0
    }
    console.log(parameters)
    this.lexicalService.deleteLinguisticRelation(lexId, parameters).subscribe(
      data => {
        console.log(data);
        /* data['request'] = 0;
        data['new_label'] = confidence_value
        this.lexicalService.refreshAfterEdit(data); */
        this.lexicalService.updateCoreCard(data)
        this.lexicalService.spinnerAction('off');
        this.formCore.get('confidence').setValue(-1, { emitEvent: false });
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
          this.formCore.get('confidence').setValue(-1, { emitEvent: false });
          this.object.confidence = -1;

        } else {
          this.toastr.error(error.error, 'Error', { timeOut: 5000 })

        }
      }
    )
  }

  onChangeType(evt) {
    this.lexicalService.spinnerAction('on');
    const newType = evt.target.value;
    const formId = this.object.formInstanceName
    const parameters = { relation: "type", value: newType }
    this.lexicalService.updateForm(formId, parameters).pipe(debounceTime(500)).subscribe(
      data => {
        console.log(data)
        this.lexicalService.spinnerAction('off');
        data['request'] = 5;
        data['new_type'] = newType;
        this.lexicalService.refreshAfterEdit(data);
        this.lexicalService.updateCoreCard(this.object)

        setTimeout(() => {
          let type = this.formCore.get('type').value;
          this.typesData.forEach(el => {
            if (el.valueId == type) {

              this.typeDesc = el.valueDescription;
            }
          })
          //@ts-ignore
          $('.type-tooltip').tooltip({
            trigger: 'hover'
          });


        }, 1000);
      }, error => {
        console.log(error);
        const data = this.object;
        data['request'] = 5;
        data['new_type'] = newType;
        this.lexicalService.refreshAfterEdit(data);
        this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
        this.lexicalService.spinnerAction('off');

        if (typeof (error.error) != 'object') {
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        } else {
          this.toastr.success('Type changed', '', {
            timeOut: 5000,
          });
        }

        setTimeout(() => {
          let type = this.formCore.get('type').value;
          this.typesData.forEach(el => {
            if (el.valueId == type) {

              this.typeDesc = el.valueDescription;
            }
          })
          //@ts-ignore
          $('.type-tooltip').tooltip({
            trigger: 'hover'
          });


        }, 1000);
      }
    )
  }

  debounceKeyup(evt, i) {
    this.lexicalService.spinnerAction('on');
    this.subject_label.next({ evt, i })
  }

  debounceKeyupExisting(evt, i) {
    this.lexicalService.spinnerAction('on');
    this.subject_ex_label.next({ evt, i })
  }

  onChangeExistingValue(evt, i) {
    this.lexicalService.spinnerAction('on');
    this.morphoTraits = this.formCore.get('morphoTraits') as FormArray;
    const trait = this.morphoTraits.at(i).get('trait').value;
    const oldValue = this.morphoTraits.at(i).get('value').value;
    const newValue = evt.target.value;

    this.morphoTraits.at(i).get('value').setValue(newValue, { emitEvent: false });

    if (newValue != '') {
      let parameters = {
        type: "morphology",
        relation: trait,
        value: newValue,
        currentValue: oldValue
      }

      this.staticMorpho[i] = { trait: trait, value: newValue }
      let formId = this.object.formInstanceName;
      console.log(parameters)

      this.lexicalService.updateLinguisticRelation(formId, parameters).pipe(debounceTime(1000)).subscribe(
        data => {
          console.log(data)
          //this.lexicalService.refreshAfterEdit(data);
          this.lexicalService.updateCoreCard(data)
          this.lexicalService.spinnerAction('off');
        },
        error => {
          console.log(error)
          //this.lexicalService.refreshAfterEdit({ label: this.object.label });
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status != 200) {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          } else {
            this.toastr.success('Morphologic trait changed', '', {
              timeOut: 5000,
            });
          }
        }
      )

    } else {
      this.lexicalService.spinnerAction('off');
    }
  }

  onChangeValue(i) {
    this.lexicalService.spinnerAction('on');
    this.morphoTraits = this.formCore.get('morphoTraits') as FormArray;
    const trait = this.morphoTraits.at(i).get('trait').value;
    const value = this.morphoTraits.at(i).get('value').value;
    if (trait != '' && value != '') {

      let parameters = {
        type: "morphology",
        relation: trait,
        value: value
      }
      let formId = this.object.formInstanceName;

      let traitDescription = '';
      this.morphologyData.filter(x => {
        if (x.propertyId == trait && trait != 'partOfSpeech') {
          x.propertyValues.filter(y => {
            if (y.valueId == value) {
              traitDescription = y.valueDescription;
              return true;
            } else {
              return false;
            }
          })
          return true;
        } else {
          return false;
        }
      })
      console.log(parameters);
      this.morphoTraits.at(i).get('description').setValue(traitDescription, { emitEvent: false });

      this.staticMorpho.push({ trait: trait, value: value })

      this.lexicalService.updateLinguisticRelation(formId, parameters).pipe(debounceTime(1000)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.spinnerAction('off');
          this.lexicalService.updateCoreCard(this.object)
          this.disableAddMorpho = false;
          setTimeout(() => {

            //@ts-ignore
            $('.trait-tooltip').tooltip({
              trigger: 'hover'
            });


          }, 1000);
        },
        error => {
          console.log(error)
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          this.disableAddMorpho = false;
          if (typeof (error.error) != 'object') {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          } else {
            this.toastr.success('Morphotrait changed correctly', 'Ok', {
              timeOut: 5000,
            });
          }

          setTimeout(() => {

            //@ts-ignore
            $('.trait-tooltip').tooltip({
              trigger: 'hover'
            });


          }, 1000);
        }
      )
    } else {
      this.lexicalService.spinnerAction('off');
    }
  }

  onChangeTrait(evt, i) {

    if (evt.target != undefined) {
      setTimeout(() => {
        this.morphoTraits = this.formCore.get('morphoTraits') as FormArray;
        this.morphoTraits.at(i).patchValue({ trait: evt.target.value, value: "" });
        //console.log(evt.target.value)
        if (evt.target.value != '') {
          var arrayValues = this.morphologyData.filter(x => {
            return x['propertyId'] == evt.target.value;
          })['0']['propertyValues'];
          this.valueTraits[i] = arrayValues;
          this.memoryTraits[i] = evt.target.value;
        } else {
          let arrayValues = [];
          this.valueTraits[i] = arrayValues
          this.memoryTraits.splice(i, 1)
        }



      }, 500);
    } else {

      var timer = setInterval((val) => {
        try {
          var arrayValues = this.morphologyData.filter(x => {
            return x['propertyId'] == evt;
          })['0']['propertyValues'];
          this.valueTraits[i] = arrayValues;
          this.memoryTraits.push(evt);
          //console.log("CIAO")
          if (this.valueTraits != undefined) {
            clearInterval(timer)
          }

        } catch (e) {
          console.log(e)
        }
      }, 500)

      /* setTimeout(() => {

        var arrayValues = this.morphologyData.filter(x => {
          return x['propertyId'] == evt;
        })['0']['propertyValues'];
        this.valueTraits[i] = arrayValues;
        //console.log(this.valueTraits)
        this.memoryTraits.push(evt);

      }, 500); */
    }
  }

  onChangeLabelTrait(evt, i) {

    setTimeout(() => {
      this.labelArray = this.formCore.get('label') as FormArray;
      this.labelArray.at(i).patchValue({ propertyID: evt.target.value, propertyValue: "" });
      //console.log(this.labelArray)
      if (evt.target.value != '') {

        this.memoryLabel[i] = evt.target.value;
      } else {

        this.memoryLabel.splice(i, 1)
      }



    }, 250);
  }

  onChangeExistingLabelValue(evt, i) {
    this.lexicalService.spinnerAction('on');
    this.labelArray = this.formCore.get('label') as FormArray;
    const trait = this.labelArray.at(i).get('propertyID').value;
    const newValue = evt.target.value;

    //console.log(this.object)

    if (newValue != '') {
      const parameters = { relation: trait, value: newValue }

      this.staticOtherDef[i] = { trait: trait, value: newValue }
      let formId = this.object.formInstanceName;



      this.lexicalService.updateForm(formId, parameters).pipe(debounceTime(1000)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.spinnerAction('off');
          //this.lexicalService.refreshLexEntryTree();
          this.lexicalService.updateCoreCard(data)
        }, error => {
          console.log(error);
          //this.lexicalService.refreshLexEntryTree();

          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');

          if (typeof (error.error) != 'object') {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          } else {
            this.toastr.success('Label changed', '', {
              timeOut: 5000,
            });
          }
        }
      )

      if (trait == 'writtenRep') {
        const data = this.object;
        data['whatToSearch'] = 'form';
        data['new_label'] = newValue;
        data['request'] = 3;
        this.lexicalService.refreshAfterEdit(data);
      }

    } else {
      this.lexicalService.spinnerAction('off');
      this.staticOtherDef[i] = { trait: trait, value: "" }
    }
  }

  onChangeLabel(object) {

    this.labelArray = this.formCore.get('label') as FormArray;
    const trait = this.labelArray.at(object.i).get('propertyID').value;
    const newValue = object.evt.target.value;
    const formId = this.object.formInstanceName;
    const parameters = { relation: trait, value: newValue }
    //console.log(this.object)

    this.staticOtherDef.push({ trait: trait, value: newValue })

    if (trait != undefined && newValue != '') {
      this.lexicalService.updateForm(formId, parameters).pipe(debounceTime(1000)).subscribe(
        data => {
          console.log(data)
          this.lexicalService.spinnerAction('off');
          /* this.lexicalService.refreshAfterEdit(data); */
          this.lexicalService.updateCoreCard(data)
          this.disableAddOther = false;
        }, error => {
          console.log(error);
          this.disableAddOther = false;

          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
        }
      )
    } else {
      this.lexicalService.spinnerAction('off');
    }
  }

  createMorphoTraits(t?, v?, d?): FormGroup {
    if (t != undefined) {
      return this.formBuilder.group({
        trait: new FormControl(t, [Validators.required, Validators.minLength(0)]),
        value: new FormControl(v, [Validators.required, Validators.minLength(0)]),
        description: new FormControl(d, [Validators.required, Validators.minLength(0)])
      })
    } else {
      return this.formBuilder.group({
        trait: new FormControl('', [Validators.required, Validators.minLength(0)]),
        value: new FormControl('', [Validators.required, Validators.minLength(0)]),
        description: new FormControl('', [Validators.required, Validators.minLength(0)])
      })
    }
  }

  createInheritance(t?, v?): FormGroup {
    return this.formBuilder.group({
      trait: t,
      value: v
    })
  }

  createLabel(t?, v?): FormGroup {
    if (t != undefined) {
      return this.formBuilder.group({
        propertyID: new FormControl(t, [Validators.required, Validators.minLength(0)]),
        propertyValue: new FormControl(v, [Validators.required, Validators.minLength(0)])
      })
    } else {
      return this.formBuilder.group({
        propertyID: new FormControl('', [Validators.required, Validators.minLength(0)]),
        propertyValue: new FormControl('', [Validators.required, Validators.minLength(0)])
      })
    }

  }

  addLabel(t?, v?) {
    this.labelArray = this.formCore.get('label') as FormArray;
    if (t != undefined) {
      this.labelArray.push(this.createLabel(t, v));
    } else {
      this.disableAddOther = true;
      this.labelArray.push(this.createLabel());
    }

  }

  addInheritance(t?, v?) {
    this.inheritanceArray = this.formCore.get('inheritance') as FormArray;
    this.inheritanceArray.push(this.createInheritance(t, v));
  }

  addMorphoTraits(t?, v?, d?) {
    this.morphoTraits = this.formCore.get('morphoTraits') as FormArray;
    if (t != undefined) {
      this.morphoTraits.push(this.createMorphoTraits(t, v, d));
    } else {
      this.morphoTraits.push(this.createMorphoTraits());
      this.disableAddMorpho = true;
    }
  }

  removeElement(index) {
    this.morphoTraits = this.formCore.get('morphoTraits') as FormArray;

    const trait = this.morphoTraits.at(index).get('trait').value;
    const value = this.morphoTraits.at(index).get('value').value;

    //console.log(trait + value)

    if (trait != '') {

      let formId = this.object.formInstanceName;

      let parameters = {
        type: 'morphology',
        relation: trait,
        value: value
      }

      this.lexicalService.deleteLinguisticRelation(formId, parameters).subscribe(
        data => {
          console.log(data)
          this.toastr.success('Element removed', '', {
            timeOut: 5000,
          });
          this.lexicalService.updateCoreCard(this.object)
        }, error => {
          console.log(error)
          if (error.status != 200) {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }
        }
      )
    } else {
      this.disableAddMorpho = false;
    }

    this.staticMorpho.splice(index, 1);
    this.morphoTraits.removeAt(index);
    this.memoryTraits.splice(index, 1);
    this.valueTraits.splice(index, 1)
  }

  removeLabel(index) {
    this.labelArray = this.formCore.get('label') as FormArray;


    const trait = this.labelArray.at(index).get('propertyID').value;
    const value = this.labelArray.at(index).get('propertyValue').value;

    //console.log(trait + value)

    if (trait != '') {

      let formId = this.object.formInstanceName;

      let parameters = {
        type: 'morphology',
        relation: trait,
        value: value
      }

      this.lexicalService.deleteLinguisticRelation(formId, parameters).subscribe(
        data => {
          console.log(data)
          this.lexicalService.updateCoreCard(this.object)
        }, error => {
          console.log(error)
        }
      )
    } else {
      this.disableAddOther = false;

    }
    this.staticOtherDef.splice(index, 1)
    this.labelArray.removeAt(index);
  }

}
