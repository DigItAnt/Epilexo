/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-lexical-entry-synsem-form',
  templateUrl: './lexical-entry-synsem-form.component.html',
  styleUrls: ['./lexical-entry-synsem-form.component.scss']
})
export class LexicalEntrySynsemFormComponent implements OnInit {

  switchInput = false;
  subscription: Subscription;
  object: any;
  peopleLoading = false;
  counter = 0;
  componentRef: any;

  @Input() lexData: any;

  synsemForm = new FormGroup({
    label: new FormControl(''),
    frames: new FormArray([this.createFrame()])
  })

  frameArray: FormArray;

  constructor(private lexicalService: LexicalEntriesService, private formBuilder: FormBuilder) {
  }

  ngOnInit() {

    this.synsemForm = this.formBuilder.group({
      label: '',
      frames: this.formBuilder.array([])
    })
    this.onChanges();
    this.loadPeople();
    this.triggerTooltip();
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (this.object != changes.lexData.currentValue) {
        if (this.frameArray != null) {
          this.frameArray.clear();
        }
      }
      this.loadPeople();
      this.object = changes.lexData.currentValue;
      if (this.object != null) {
        this.synsemForm.get('label').setValue(this.object.label, { emitEvent: false });

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

  private loadPeople() {
    /* this.peopleLoading = true;
    this.dataService.getPeople().subscribe(x => {
      this.people = x;
      this.peopleLoading = false;
    }); */
  }

  onChanges(): void {
    this.synsemForm.valueChanges.pipe(debounceTime(200)).subscribe(searchParams => {
      //console.log(searchParams)
    })
  }

  addFrame() {
    this.frameArray = this.synsemForm.get('frames') as FormArray;
    this.frameArray.push(this.createFrame());
  }

  addArg(index){
    const control = (<FormArray>this.synsemForm.controls['frames']).at(index).get('args') as FormArray;
    control.push(this.createArg());
  }

  addForm(ix, iy){
    const control = ((<FormArray>this.synsemForm.controls['frames']).at(ix).get('args') as FormArray).at(iy).get('form') as FormArray;
    control.push(this.createForm());
  }

  removeArg(ix, iy){
    const control = (<FormArray>this.synsemForm.controls['frames']).at(ix).get('args') as FormArray;
    control.removeAt(iy);
  }

  removeForm(ix, iy, iz){
    const control = ((<FormArray>this.synsemForm.controls['frames']).at(ix).get('args') as FormArray).at(iy).get('form') as FormArray;
    control.removeAt(iz);
  }

  removeFrame(index) {
    this.frameArray = this.synsemForm.get('frames') as FormArray;
    this.frameArray.removeAt(index);
  }

  createFrame(): FormGroup {
    return this.formBuilder.group({
      label: '',
      type: '',
      example: '',
      args: new FormArray([])
    })
  }

  createArg() : FormGroup {
    return this.formBuilder.group({
      label: '',
      type: '',
      marker: '',
      optional: false,
      form: new FormArray([])
    })
  }

  createForm() : FormGroup {
    return this.formBuilder.group({
      form_label: ''
    })
  }


}
