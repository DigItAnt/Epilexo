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
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sense-vartrans-form',
  templateUrl: './sense-vartrans-form.component.html',
  styleUrls: ['./sense-vartrans-form.component.scss']
})
export class SenseVartransFormComponent implements OnInit, OnDestroy {

  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;
  componentRef: any;

  @Input() senseData : any;

  senseVartransForm = new FormGroup({
    label: new FormControl(''),
    translation: new FormArray([this.createTranslation()]),
    senseTranslation: new FormArray([this.createSenseTranslation()]),
    terminologicalRelation: new FormArray([this.createTerminologicalRelation()])
  })

  translation: FormArray;
  senseTranslation: FormArray;
  terminologicalRelation: FormArray;
  terminologicalRelationSub : FormArray;
  destroy$ : Subject<boolean> = new Subject();
  constructor(private lexicalService: LexicalEntriesService, private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    
    this.senseVartransForm = this.formBuilder.group({
      label: '',
      translation: this.formBuilder.array([this.createTranslation()]),
      senseTranslation: this.formBuilder.array([this.createSenseTranslation()]),
      terminologicalRelation: this.formBuilder.array([this.createTerminologicalRelation()])
    })
    this.onChanges();
    this.loadPeople();
    this.triggerTooltip();
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(()=> {
      if(this.object != changes.senseData.currentValue){
        if(this.terminologicalRelation != null){
          this.terminologicalRelation.clear();
          this.senseTranslation.clear();
          this.translation.clear();
        }
      }
      this.loadPeople();
      this.object = changes.senseData.currentValue;
      if(this.object != null){
        this.senseVartransForm.get('label').setValue(this.object.label, {emitEvent:false});
      }
      this.triggerTooltip();
  }, 10)
  }

  triggerTooltip(){
    setTimeout(() => {
      //@ts-ignore
      $('.vartrans-tooltip').tooltip({
        trigger : 'hover'
      });
    }, 500);
  }

  private loadPeople() {
   
  }

  onChanges(): void {
    this.senseVartransForm.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$)).subscribe(searchParams => {
      //console.log(searchParams)
    })
  }

  createTranslation(): FormGroup {
    return this.formBuilder.group({
      type: '',
      confidence: 0.0,
      target: ''
    })
  }

  addTranslation() {
    this.translation = this.senseVartransForm.get('translation') as FormArray;
    this.translation.push(this.createTranslation());
    this.triggerTooltip();
  }

  removeTranslation(index) {
    this.translation = this.senseVartransForm.get('translation') as FormArray;
    this.translation.removeAt(index);
  }

  addSenseTranslation() {
    this.senseTranslation = this.senseVartransForm.get('senseTranslation') as FormArray;
    this.senseTranslation.push(this.createSenseTranslation());
    this.triggerTooltip();
  }

  removeSenseTranslation(index) {
    this.senseTranslation = this.senseVartransForm.get('senseTranslation') as FormArray;
    this.senseTranslation.removeAt(index);
  }

  addTerminologicalRelation() {
    this.terminologicalRelation = this.senseVartransForm.get('terminologicalRelation') as FormArray;
    this.terminologicalRelation.push(this.createTerminologicalRelation());
    this.triggerTooltip();
  }

  removeTerminologicalRelation(index) {
    this.terminologicalRelation = this.senseVartransForm.get('terminologicalRelation') as FormArray;
    this.terminologicalRelation.removeAt(index);
  }

  addTerminologicalRelationSub(index) {
    const control = (<FormArray>this.senseVartransForm.controls['terminologicalRelation']).at(index).get('sub_rel') as FormArray;
    control.insert(index, this.createSubTerminologicalRelation())
    this.triggerTooltip();
  }

  removeTerminologicalRelationSub(index, iy) {
    const control = (<FormArray>this.senseVartransForm.controls['terminologicalRelation']).at(index).get('sub_rel') as FormArray;
    control.removeAt(iy);
  }

  createSenseTranslation(): FormGroup {
    return this.formBuilder.group({
      relation: '',
      entity: ''
    })
  }

  createTerminologicalRelation(): FormGroup {
    return this.formBuilder.group({
      a_entity: '',
      relation: '',
      b_entity: '',
      sub_rel: new FormArray([])
    })
  }

  createSubTerminologicalRelation(): FormGroup {
    return this.formBuilder.group({
      sub_relation: 'eee',
      sub_entity: ''
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
