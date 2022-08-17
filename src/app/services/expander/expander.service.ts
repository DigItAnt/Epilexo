/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpanderService {
  
  isEpigraphyExpanded = false;
  isEditExpanded = false;

  isEditOpen = false;
  isEpigraphyOpen = false;

  private _openEdit : BehaviorSubject<boolean> = new BehaviorSubject(null);
  private _openEpigraphy : BehaviorSubject<boolean> = new BehaviorSubject(null);
  private _expandEpigraphy: BehaviorSubject<boolean> = new BehaviorSubject(null);
  private _expandEdit: BehaviorSubject<boolean> = new BehaviorSubject(null);
  expEpigraphy$ = this._expandEpigraphy.asObservable();
  expEdit$ = this._expandEdit.asObservable();
  openEdit$ = this._openEdit.asObservable();
  openEpigraphy$ = this._openEpigraphy.asObservable();

  constructor() { }

  expandCollapseEpigraphy(trigger?){
    if(trigger != undefined){
      this.isEpigraphyExpanded = trigger;
      this._expandEpigraphy.next(this.isEpigraphyExpanded)
    }else{
      this.isEpigraphyExpanded = !this.isEpigraphyExpanded;
      this._expandEpigraphy.next(this.isEpigraphyExpanded)
    }
  }
  
  expandCollapseEdit(trigger?){
    if(trigger != undefined){
      this.isEditExpanded = trigger;
      this._expandEdit.next(this.isEditExpanded)
    }else{
      this.isEditExpanded = !this.isEditExpanded;
      this._expandEdit.next(this.isEditExpanded)
    }
  }

  openCollapseEdit(trigger?){
    if(trigger != undefined){
      this.isEditOpen = trigger;
      this._openEdit.next(trigger);
    }else{
      this.isEditOpen = !this.isEditOpen
      this._openEdit.next(this.isEditOpen);
    }
  }

  openCollapseEpigraphy(trigger?){
    if(trigger != undefined){
      this.isEpigraphyOpen = trigger;
      this._openEpigraphy.next(trigger)
    }else{
      this.isEpigraphyOpen = !this.isEpigraphyOpen
      this._openEpigraphy.next(this.isEpigraphyOpen)
    }
  }

  isEditTabExpanded(){
    return this.isEditExpanded;
  }

  isEpigraphyTabExpanded(){
    return this.isEpigraphyExpanded;
  }

  isEditTabOpen(){
    return this.isEditOpen;
  }

  isEpigraphyTabOpen(){
    return this.isEpigraphyOpen;
  }

}
