/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BibliographyService {

  constructor(private http: HttpClient) { }


  private baseUrl = "https://api.zotero.org/groups/2552746/items";
  
  private _addBiblioItem: BehaviorSubject<any> = new BehaviorSubject(null);
  private _triggerPanel: BehaviorSubject<object> = new BehaviorSubject(null);
  addBiblioReq$ = this._addBiblioItem.asObservable();
  triggerPanel$ = this._triggerPanel.asObservable();

  sendDataToBibliographyPanel(object: any) {
    this._addBiblioItem.next(object)
  }

  triggerPanel(object: object) {
    this._triggerPanel.next(object)
  } 

  bootstrapData(start? : number, sortField? : string, direction? : string) : Observable<any> {
    return this.http.get(this.baseUrl + '?limit=25&start='+start+'&sort='+sortField+'&direction='+direction+'&v=3');
  }

  filterBibliography(start? : number, sortField? : string, direction? : string, query?, queryMode?) : Observable<any> {
    return this.http.get(this.baseUrl + '?limit=25&q='+query+'&qmode='+queryMode+'&start='+start+'&sort='+sortField+'&direction='+direction+'&v=3');
  }

}
