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
import { shareReplay } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LexicalEntriesService {

  private arrayPanelFormsData = {};

  private _coreFormData: BehaviorSubject<object> = new BehaviorSubject(null);
  private _attestationPanelData: BehaviorSubject<object> = new BehaviorSubject(null);
  private _etymologyData: BehaviorSubject<object> = new BehaviorSubject(null);
  private _rightPanelData: BehaviorSubject<object> = new BehaviorSubject(null);
  private _deleteLexicalEntryReq: BehaviorSubject<any> = new BehaviorSubject(null);
  private _addSubElementReq: BehaviorSubject<any> = new BehaviorSubject(null);
  private _updateCoreCardReq: BehaviorSubject<object> = new BehaviorSubject(null);
  private _spinnerAction: BehaviorSubject<string> = new BehaviorSubject(null);
  private _refreshLanguageTable: BehaviorSubject<object> = new BehaviorSubject(null);
  private _refreshAfterEdit : BehaviorSubject<object> = new BehaviorSubject(null);
  private _refreshFilter : BehaviorSubject<object> = new BehaviorSubject(null);
  private _updateLangSelect : BehaviorSubject<object> = new BehaviorSubject(null);
  private _triggerNotePanel : BehaviorSubject<boolean> = new BehaviorSubject(null);
  private _triggerAttestationPanel : BehaviorSubject<boolean> = new BehaviorSubject(null);
  private _changeDecompLabel : BehaviorSubject<string> = new BehaviorSubject(null);
  private _decompData : BehaviorSubject<object> = new BehaviorSubject(null);
  private _refreshLinkCounter: BehaviorSubject<string> = new BehaviorSubject(null);
  private _triggerLexicalEntryTree : BehaviorSubject<object> = new BehaviorSubject(null);
  private _triggerSameAs : BehaviorSubject<object> = new BehaviorSubject(null);

  morphologyData;

  private baseUrl = "/LexO-backend-itant_demo/service/"
  private key = "PRINitant19";
  private author = "";
  private bibliographyIRI = 'http://lexica/mylexicon/bibliography#'
  private lexicalIRI = 'http://lexica/mylexicon#';
  private lexicalPrefix = 'lex'

  coreData$ = this._coreFormData.asObservable();
  decompData$ = this._decompData.asObservable();
  attestationPanelData$ = this._attestationPanelData.asObservable();
  etymologyData$ = this._etymologyData.asObservable();
  rightPanelData$ = this._rightPanelData.asObservable();
  deleteReq$ = this._deleteLexicalEntryReq.asObservable();
  addSubReq$ = this._addSubElementReq.asObservable();
  updateCoreCardReq$ = this._updateCoreCardReq.asObservable();
  spinnerAction$ = this._spinnerAction.asObservable();
  refreshLangTable$ = this._refreshLanguageTable.asObservable();
  refreshAfterEdit$ = this._refreshAfterEdit.asObservable();
  refreshFilter$ = this._refreshFilter.asObservable();
  updateLangSelect$ = this._updateLangSelect.asObservable();
  triggerNotePanel$ = this._triggerNotePanel.asObservable();
  triggerAttestationPanel$ = this._triggerAttestationPanel.asObservable();
  changeDecompLabel$ = this._changeDecompLabel.asObservable();
  refreshLinkCounter$ = this._refreshLinkCounter.asObservable();
  triggerLexicalEntryTree$ = this._triggerLexicalEntryTree.asObservable();
  triggerSameAs$ = this._triggerSameAs.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) { }

  refreshLinkCounter(value:string){
    this._refreshLinkCounter.next(value);
  }

  sendToCoreTab(object: object) {
    this._coreFormData.next(object)
  } 

  sendToDecompTab(object: object){
    this._decompData.next(object);
  }
  
  sendToAttestationPanel(object: object) {
    this._attestationPanelData.next(object)
  } 

  changeDecompLabel(string:string){
    this._changeDecompLabel.next(string);
  }
  

  sendToRightTab(object: object) {
    this._rightPanelData.next(object);
  }

  sendToEtymologyTab(object: object) {
    this._etymologyData.next(object);
  }

  deleteRequest(request? : any) {
    this._deleteLexicalEntryReq.next(request);
  }

  addSubElementRequest(request?: any){
    this._addSubElementReq.next(request);
  }

  updateCoreCard(object: object) {
    this._updateCoreCardReq.next(object)
  }

  spinnerAction(string: string) {
    this._spinnerAction.next(string)
  }

  refreshLangTable(){
    this._refreshLanguageTable.next(null);
  }

  refreshAfterEdit(object: object){
    this._refreshAfterEdit.next(object);
  }

  refreshFilter(object: object){
    this._refreshFilter.next(object);
  }

  updateLangSelect(object: object){
    this._updateLangSelect.next(object);
  }

  triggerNotePanel(bool: boolean){
    this._triggerNotePanel.next(bool);
  }

  triggerAttestationPanel(bool: boolean){
    this._triggerAttestationPanel.next(bool);
  }

  triggerLexicalEntryTree(object : object){
    this._triggerLexicalEntryTree.next(object);
  }

  triggerSameAs(object : object){
    this._triggerSameAs.next(object);
  }

  //POST: /lexicon/lexicalEntries ---> get lexical entries list
  getLexicalEntriesList(parameters: any): Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/data/lexicalEntries", parameters);
  }

  //POST: /lexicon/lexicalSenses ---> get lexical entries list
  getLexicalSensesList(parameters: any): Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/data/filteredSenses", parameters);
  }

  //POST: /lexicon/data/forms ---> get form list
  getFormList(parameters: any): Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/data/filteredForms", parameters);
  }

  //GET /lexicon/data/{id}/elements --> get elements of lexical entry
  getLexEntryElements(instance: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/elements?key=lexodemo&id=" + encodeURIComponent(instance));
  }

  //GET ​/lexicon​/data​/{id}​/lexicalEntry --> get specific aspect (morphology, syntax, ...) associated with a given lexical entry
  getLexEntryData(instance: string): Observable<any> {
    return this.http.get(`${this.baseUrl}lexicon/data/lexicalEntry?key=${this.key}&module=core&id=${encodeURIComponent(instance)}`).pipe(
      shareReplay()
    );
  }

  //GET /lexicon/data/{id}/lexicalEntryLinguisticRelation --> This method returns the relations with other lexical entities according to the input type
  getLexEntryLinguisticRelation(lexId: string, property: string): Observable<any> {
    return this.http.get(`${this.baseUrl}lexicon/data/linguisticRelation?key=${this.key}&id=${encodeURIComponent(lexId)}&property=${property}`);
  }

  //GET /lexicon/data/{id}/lexicalEntryLinguisticRelation --> This method returns the relations with other lexical entities according to the input type
  getLexEntryGenericRelation(lexId: string, property: string): Observable<any> {
    return this.http.get(`${this.baseUrl}lexicon/data/genericRelation?key=${this.key}&id=${encodeURIComponent(lexId)}&property=${property}`);
  }


  //GET /lexicon/data/{id}/forms --> get forms of lexical entry
  getLexEntryForms(instance: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/forms?key=lexodemo&id="+encodeURIComponent(instance));
  }


  //GET /lexicon/data/{id}/form --> get data about a single form 
  getFormData(formId: string, aspect: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/form?key=" + this.key + "&module=" + aspect + "&id=" + encodeURIComponent(formId))
  }

  getOntolexRepresentations(): Observable<any> {
    return this.http.get(this.baseUrl + "ontolex/data/representation")
  }

  getLexinfoRepresentations(): Observable<any> {
    return this.http.get(this.baseUrl + "lexinfo/data/representation")
  }


  //GET /lexicon/data/{id}/lexicalSense --> get data about a single form 
  getSenseData(senseId: string, aspect: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/lexicalSense?key=" + this.key + "&module=" + aspect + "&id=" + encodeURIComponent(senseId))
  }

  //GET /lexicon/data/{id}/senses --> get list of senses of a lexical entry
  getSensesList(instance: any): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/senses?key=lexodemo&id="+encodeURIComponent(instance));
  }

  //GET /lexicon/data/languages --> Lexicon languages list
  getLexiconLanguages(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/languages");
  }

  //GET /lexicon/statistics/languages --> get languages list for lexical entries menu filter search
  getLanguages(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/statistics/languages?key=" + this.key + "");
  }

  //GET /lexicon/types --> get types list
  getTypes(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/statistics/types?key=" + this.key + "");
  }

  //GET /lexicon/authors --> get authors list
  getAuthors(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/statistics/authors?key=" + this.key + "");
  }

  //GET /lexicon/pos --> get pos list
  getPos(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/statistics/pos?key=" + this.key + "");
  }

  //GET /lexicon/states --> get states list
  getStatus(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/statistics/status?key=" + this.key + "");
  }

   //GET /lexicon/namespaces --> get namespaces list
   getNamespaces(): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/statistics/namespaces?key=" + this.key + "");
  }


  //GET /lexicon/creation/lexicalEntry --> create new lexical entry
  newLexicalEntry(): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/lexicalEntry?key=" + this.key + "&author=" + this.author + "&prefix=" + this.lexicalPrefix + "&baseIRI=" + encodeURIComponent(this.lexicalIRI));
  }


  //GET /lexicon/delete/{id}/lexicalEntry --> delete lexical entry
  deleteLexicalEntry(lexId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/lexicalEntry?key=" + this.key + "&id=" + encodeURIComponent(lexId));
  }

  //GET /lexicon/delete/{id}/form --> delete lexical entry
  deleteForm(lexId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/form?key=" + this.key + "&id=" + encodeURIComponent(lexId));
  }

  //GET /lexicon/delete/{id}/lexicalSense --> delete lexical entry
  deleteSense(lexId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/lexicalSense?key=" + this.key + "&id=" + encodeURIComponent(lexId));
  }

  //GET  /lexicon​/delete​/{id}​/language  --> Lexicon language deletion
  deleteLanguage(langId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/language?key=" + this.key + "&id=" + encodeURIComponent(langId));
  }

  //POST  /lexicon​/delete​/{id}​/linguisticRelation  --> delete linguistic relation
  deleteLinguisticRelation(lexId, parameters): Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/delete/relation?key=" + this.key + "&id=" + encodeURIComponent(lexId), parameters);
  }

  //POST ​/lexicon​/update​/{id}​/lexicalEntry --> lexical entry update
  updateLexicalEntry(lexId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/lexicalEntry?key=" + this.key + "&author=" + this.author + "&id=" + encodeURIComponent(lexId), parameters);
  }


  //POST ​/lexicon​/update​/{id}​/linguisticRelation --> linguistic Relation update for Core
  updateLinguisticRelation(lexId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/linguisticRelation?key=" + this.key + "&user=" + this.author + "&id=" + encodeURIComponent(lexId), parameters);
  }

  //POST ​/lexicon​/update​/{id}​/genericRelation --> Generic relation update
  updateGenericRelation(lexId, parameters) : Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/genericRelation?key=" + this.key + "&user=" + this.author + "&id=" + encodeURIComponent(lexId), parameters);
  }

  //POST /lexicon/update/{id}/form --> update form values
  updateForm(formId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/form?key=" + this.key + "&id=" + encodeURIComponent(formId), parameters);
  }

  //POST /lexicon/update/{id}/lexicalSense --> update form values
  updateSense(senseId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/lexicalSense?key=" + this.key + "&id=" + encodeURIComponent(senseId), parameters);
  }

  //GET  /lexinfo/data/morphology --> get data about morphology
  getMorphologyData() : Observable<object[]> {
    return this.http.get<object[]>(this.baseUrl + "lexinfo/data/morphology");
  }

  ///GET /ontolex/data/formType --> get data about form types
  getFormTypes(): Observable<any> {
    return this.http.get(this.baseUrl + "ontolex/data/formType");
  }

  ///GET /ontolex/data/lexicalEntryType --> get data about lexicalEntry types
  getLexEntryTypes(): Observable<object[]> {
    return this.http.get<object[]>(this.baseUrl + "ontolex/data/lexicalEntryType");
  }


  //GET /lexicon/creation/form --> create new form
  createNewForm(lexId): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/form?lexicalEntryID="+ encodeURIComponent(lexId)  +"&key=" + this.key + "&author=" + this.author + "&prefix=" + this.lexicalPrefix + "&baseIRI=" + encodeURIComponent(this.lexicalIRI));
  }

  //GET /lexicon/creation/lexicalSense --> create new sense
  createNewSense(lexId): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/lexicalSense?lexicalEntryID="+ encodeURIComponent(lexId)  +"&key=" + this.key + "&author=" + this.author + "&prefix=" + this.lexicalPrefix + "&baseIRI=" + encodeURIComponent(this.lexicalIRI));
  }

  //GET /lexicon/creation/language --> create new language
  createNewLanguage(langId): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/language?key=" + this.key + "&lang="+ langId +"&author=" + this.author + "&prefix=" + this.lexicalPrefix + "&baseIRI=" +encodeURIComponent(this.lexicalIRI));
  }

  //POST /lexicon/update/{id}/language --> update language
  updateLanguage(langId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/language?key=" + this.key + "&id=" + encodeURIComponent(langId), parameters);
  }
  

  //BIBLIOGRAPHY
  getBibliographyData(instance: string) : Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/bibliography?key=lexodemo&id="+encodeURIComponent(instance));
  }

  addBibliographyData(instance : string, parameters){
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/creation/bibliography?id=" + encodeURIComponent(instance) + "&key="+ this.key +"&author="+this.author+"&prefix=lexbib&baseIRI=" + encodeURIComponent(this.bibliographyIRI), parameters);
  }

  removeBibliographyItem(instance: string) {
    return this.http.get(this.baseUrl + "lexicon/delete/bibliography?key=PRINitant19&id="+encodeURIComponent(instance));
  }

  synchronizeBibliographyItem(lexId : string, itemKey : string) : Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/synchronizeBibliography?id="+encodeURIComponent(lexId)+"&key=PRINitant19&author="+this.author+"&itemKey="+itemKey,{})
  }


  //ETYMOLOGY
  createNewEtymology(instance: string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/etymology?lexicalEntryID="+ encodeURIComponent(instance) +"&key="+this.key+"&author="+this.author+"&prefix=" + this.lexicalPrefix + "&baseIRI=" + encodeURIComponent(this.lexicalIRI));
  }

  getEtymologies(instance: string) : Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/etymologies?key="+this.key+"&id="+encodeURIComponent(instance));
  }

  getEtymologyData(instance: string)  : Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/etymology?key="+this.key+ "&id=" + encodeURIComponent(instance));
  }

  updateEtymology(etymId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/etymology?key=" + this.key + "&id=" + encodeURIComponent(etymId), parameters);
  }

  createNewEtylink(lexInstance: string, etymInstance : string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/etymologicalLink?lexicalEntryID="+encodeURIComponent(lexInstance)+"&etymologyID="+encodeURIComponent(etymInstance)+"&key="+this.key+"&author="+this.author+"&prefix=" + this.lexicalPrefix + "&baseIRI=" + encodeURIComponent(this.lexicalIRI));
  }

  deleteEtymology(etymInstance : string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/delete/etymology?key="+this.key+"&author="+this.author+"&id=" + encodeURIComponent(etymInstance));
  }

  updateEtylink(etymId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/etymologicalLink?key=" + this.key + "&id=" + encodeURIComponent(etymId), parameters);
  }

  deleteEtylink(etyLinkInstance: string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/delete/etymologicalLink?key="+this.key+"&author="+this.author+"&id=" + encodeURIComponent(etyLinkInstance));
  }

  //DECOMP
  getSubTerms(lexicalEntityID: string) : Observable<any>{
    return this.http.get(this.baseUrl + "lexicon/data/subTerms?key="+this.key+"&id="+encodeURIComponent(lexicalEntityID));
  }

  getConstituents(lexicalEntityID: string) : Observable<any>{
    return this.http.get(this.baseUrl + "lexicon/data/"+lexicalEntityID+"/constituents?key="+this.key);
  }

  createComponent(lexicalEntityID : string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/component?id="+lexicalEntityID+"&key="+this.key+"&author="+this.author+"");
  }

  deleteComponent(compId : string) : Observable<any>{
    return this.http.get(this.baseUrl + "lexicon/delete/"+compId+"/component?key="+this.key);
  }

  getCorrespondsTo(compId: string) : Observable<any>{
    return this.http.get(this.baseUrl + "lexicon/data/"+compId+"/correspondsTo?key="+this.key);
  }

  exportLexicon(body : object) : Observable<any> {
    return this.http.post(this.baseUrl + "export/lexicon", body, { responseType: 'text'});
  } 

  getPanelCognate(cogInstanceName, lexInstanceName) : object{
    return this.arrayPanelFormsData[cogInstanceName+'-'+lexInstanceName];
  }

  newPanelForm(cogInstanceName, lexInstanceName) : void {
    this.arrayPanelFormsData[cogInstanceName+'-'+lexInstanceName] = {};
    this.arrayPanelFormsData[cogInstanceName+'-'+lexInstanceName].data = undefined;
    this.arrayPanelFormsData[cogInstanceName+'-'+lexInstanceName].isOpen = undefined;

  }

  closePanelForm(cogInstanceName, lexInstanceName) : void {
    this.arrayPanelFormsData[cogInstanceName+'-'+lexInstanceName] = undefined;
  }

  getAllPanelForms() : object {
    return this.arrayPanelFormsData;
  }
}