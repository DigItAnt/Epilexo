/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConceptService {

  private baseUrl = "/LexO-backend-itant_demo/service/"
  private key = "PRINitant19";
  private author = "";
  private lexicalIRI = 'http://lexica/mylexicon#';
  private lexicalPrefix = 'lex'

  private _deleteConceptSetReq: BehaviorSubject<any> = new BehaviorSubject(null);
  private _addSubElementReq: BehaviorSubject<any> = new BehaviorSubject(null);

  deleteSkosReq$ = this._deleteConceptSetReq.asObservable();
  addSubReq$ = this._addSubElementReq.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) { }

  addSubElementRequest(request?: any){
    this._addSubElementReq.next(request);
  }

  getLexicalIRI(){
    return this.lexicalIRI;
  }

  deleteRequest(request? : any) {
    this._deleteConceptSetReq.next(request);
  }

  getConceptSets(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/conceptSets");
  }

  getRootLexicalConcepts(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/lexicalConcepts?id=root");
  }

  getLexicalConcepts(instance : string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/lexicalConcepts?id="+encodeURIComponent(instance));
  }

  getLexicalConceptData(instance : string) : Observable<any>{
    return this.http.get(this.baseUrl + "lexicon/data/lexicalConcept?id="+encodeURIComponent(instance));
  }

  createNewConceptSet(): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/conceptSet?key="+this.key+"&author="+this.author+"&prefix="+encodeURIComponent(this.lexicalPrefix)+"&baseIRI="+encodeURIComponent(this.lexicalIRI));
  }

  createNewLexicalConcept(): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/lexicalConcept?key="+this.key+"&author="+this.author+"&prefix="+encodeURIComponent(this.lexicalPrefix)+"&baseIRI="+encodeURIComponent(this.lexicalIRI));
  }


  linkLexicalConceptTo(parameters) : Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/creation/lexicalConcept?key="+this.key, parameters);
  }

  deleteConceptSet(conceptSetID) : Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/conceptSet?key="+this.key + "&id="+encodeURIComponent(conceptSetID));
  }

  deleteLexicalConcept(lexicalConceptID, recursive?) : Observable<any> {
    if(recursive == undefined){
      return this.http.get(this.baseUrl + "lexicon/delete/lexicalConcept?key="+this.key + "&id="+encodeURIComponent(lexicalConceptID)+"&recursive=false");
    }else{
      return this.http.get(this.baseUrl + "lexicon/delete/lexicalConcept?key="+this.key + "&id="+encodeURIComponent(lexicalConceptID)+"&recursive=true");
    }
  }

  updateSkosLabel(parameters) : Observable<any> {
    return this.http.post(this.baseUrl + "skos/updateLexicalLabel?key="+this.key, parameters);
  }

  updateSchemeProperty(parameters) : Observable<any> {
    return this.http.post(this.baseUrl + "skos/updateSchemeProperty?key="+this.key, parameters);
  }

  updateSemanticRelation(parameters) : Observable<any> {
    return this.http.post(this.baseUrl + "skos/updateSemanticRelation?key="+this.key, parameters);
  }

  updateNoteProperty(parameters) : Observable<any> {
    return this.http.post(this.baseUrl + "skos/updateNoteProperty?key="+this.key, parameters);
  }

  deleteRelation(instance, parameters) : Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/delete/relation?key="+this.key+"&id="+encodeURIComponent(instance), parameters);
  }

  conceptFilter(parameters: any): Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/data/filteredLexicalConcepts", parameters);
  }
}
