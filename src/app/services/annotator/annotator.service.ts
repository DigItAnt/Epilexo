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
export class AnnotatorService {
  //private baseUrl = "https://lari2.ilc.cnr.it/cash/api/v1/"
  private baseUrl = "/cash_demo/api/v1/"


  constructor(private http: HttpClient) { }
  
  private _triggerSearch: BehaviorSubject<any> = new BehaviorSubject(null);
  private _deleteAnnoRequest: BehaviorSubject<any> = new BehaviorSubject(null);
  private _getIdText: BehaviorSubject<any> = new BehaviorSubject(null);

  private arrayPanelFormsData = {};


  triggerSearch$ = this._triggerSearch.asObservable();
  deleteAnnoReq$ = this._deleteAnnoRequest.asObservable();
  getIdText$ = this._getIdText.asObservable();

  triggerSearch(string : string) {
    this._triggerSearch.next(string)
  } 

  deleteAnnotationRequest(id : number, node_id : number){
    this._deleteAnnoRequest.next({id, node_id})
  }

  getIdText(object: any){
    this._getIdText.next(object);
  }

  getPanelForm(id_annotation) : object{
    return this.arrayPanelFormsData[id_annotation];
  }

  getAllPanelForms() : object {
    return this.arrayPanelFormsData;
  }

  closePanelForm(id_annotation) : void {
    this.arrayPanelFormsData[id_annotation] = undefined;
  }

  newPanelForm(id_annotation) : void {
    this.arrayPanelFormsData[id_annotation] = {};
    this.arrayPanelFormsData[id_annotation].data = undefined;
    this.arrayPanelFormsData[id_annotation].isOpen = undefined;

  }

  getTokens(id: number) : Observable<any> {
    return this.http.get(this.baseUrl + 'token?requestUUID=test123&nodeid='+id);
  }

  getText(id: number) : Observable<any> {
    return this.http.get(this.baseUrl + 'gettext?requestUUID=test123&nodeid='+id);
  }

  addAnnotation(parameters : object, id : number) : Observable<any>{
    return this.http.post(this.baseUrl + 'annotation?requestUUID=test123&nodeid='+id, parameters);
  }

  getAnnotation(id : number) : Observable<any>{
    return this.http.get(this.baseUrl + 'annotation?requestUUID=test123&nodeid='+id);
  }

  deleteAnnotation(id: number) : Observable<any> {
    return this.http.delete(this.baseUrl + 'annotate?requestUUID=test123&annotationID='+id);
  }

  updateAnnotation(annotation : object) : Observable<any>{
    return this.http.put(this.baseUrl + 'annotation?requestUUID=test123', annotation);
  }

}
