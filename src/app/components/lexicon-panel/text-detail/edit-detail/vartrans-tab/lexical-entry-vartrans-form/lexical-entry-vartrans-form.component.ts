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
  selector: 'app-lexical-entry-vartrans-form',
  templateUrl: './lexical-entry-vartrans-form.component.html',
  styleUrls: ['./lexical-entry-vartrans-form.component.scss']
})
export class LexicalEntryVartransFormComponent implements OnInit, OnDestroy {

  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;
  componentRef: any;

  destroy$ : Subject<boolean> = new Subject();

  @Input() lexData : any;

  vartransForm = new FormGroup({
    label: new FormControl(''),
    translatableAs: new FormArray([this.createTranslatableAs()]),
    lexicalRelationDirect: new FormArray([this.createLexicalRelationDirect()]),
    lexicalRelationIndirect: new FormArray([this.createLexicalRelationIndirect()])
  })

  translatableAs: FormArray;
  lexicalRelationDirect: FormArray;
  lexicalRelationIndirect: FormArray;
  lexicalRelationIndirectSub : FormArray;

  constructor( private lexicalService: LexicalEntriesService, private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    
    this.vartransForm = this.formBuilder.group({
      label: '',
      translatableAs: this.formBuilder.array([this.createTranslatableAs()]),
      lexicalRelationDirect: this.formBuilder.array([this.createLexicalRelationDirect()]),
      lexicalRelationIndirect: this.formBuilder.array([])
    })
    this.onChanges();
    this.loadPeople();
    this.triggerTooltip();
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(()=> {
      if(this.object != changes.lexData.currentValue){
        if(this.lexicalRelationIndirect != null){
          this.lexicalRelationIndirect.clear();
        }
      }
      this.loadPeople();
      this.object = changes.lexData.currentValue;
      if(this.object != null){
        this.vartransForm.get('label').setValue(this.object.label, {emitEvent:false});
        this.addLexicalRelationIndirect();
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
    /* this.peopleLoading = true;
    this.dataService.getPeople().subscribe(x => {
      this.people = x;
      this.peopleLoading = false;
    }); */
  }

  onChanges(): void {
    this.vartransForm.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$)).subscribe(searchParams => {
      /* //console.log(searchParams) */
    })
  }

  createTranslatableAs(): FormGroup {
    return this.formBuilder.group({
      entity: ''
    })
  }

  addTranslatableAs() {
    this.translatableAs = this.vartransForm.get('translatableAs') as FormArray;
    this.translatableAs.push(this.createTranslatableAs());
    this.triggerTooltip();
  }

  removeTranslatableAs(index) {
    this.translatableAs = this.vartransForm.get('translatableAs') as FormArray;
    this.translatableAs.removeAt(index);
  }

  addLexicalRelationDirect() {
    this.lexicalRelationDirect = this.vartransForm.get('lexicalRelationDirect') as FormArray;
    this.lexicalRelationDirect.push(this.createLexicalRelationDirect());
    this.triggerTooltip();
  }

  removeLexicalRelationDirect(index) {
    this.lexicalRelationDirect = this.vartransForm.get('lexicalRelationDirect') as FormArray;
    this.lexicalRelationDirect.removeAt(index);
  }

  addLexicalRelationIndirect() {
    this.lexicalRelationIndirect = this.vartransForm.get('lexicalRelationIndirect') as FormArray;
    this.lexicalRelationIndirect.push(this.createLexicalRelationIndirect());
    this.triggerTooltip();
  }

  removeLexicalRelationIndirect(index) {
    this.lexicalRelationIndirect = this.vartransForm.get('lexicalRelationIndirect') as FormArray;
    this.lexicalRelationIndirect.removeAt(index);
  }

  addLexicalRelationIndirectSub(index) {
    const control = (<FormArray>this.vartransForm.controls['lexicalRelationIndirect']).at(index).get('sub_rel') as FormArray;
    control.insert(index, this.createSubLexicalRelationIndirect())
    this.triggerTooltip();
  }

  removeLexicalRelationIndirectSub(index, iy) {
    const control = (<FormArray>this.vartransForm.controls['lexicalRelationIndirect']).at(index).get('sub_rel') as FormArray;
    control.removeAt(iy);
  }

  createLexicalRelationDirect(): FormGroup {
    return this.formBuilder.group({
      relation: '',
      entity: ''
    })
  }

  createLexicalRelationIndirect(): FormGroup {
    return this.formBuilder.group({
      a_entity: '',
      relation: '',
      b_entity: '',
      sub_rel: new FormArray([])
    })
  }

  createSubLexicalRelationIndirect(): FormGroup {
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
