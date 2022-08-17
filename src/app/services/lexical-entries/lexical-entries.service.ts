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

import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LexicalEntriesService {

  private arrayPanelFormsData = {};

  private _coreFormData: BehaviorSubject<object> = new BehaviorSubject(null);
  private _attestationPanelData: BehaviorSubject<object> = new BehaviorSubject(null);
  /* private _vartransData: BehaviorSubject<object> = new BehaviorSubject(null); */
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


  private baseUrl = "/LexO-backend-itant_demo/service/"
  private key = "PRINitant19";
  private author = "";

  coreData$ = this._coreFormData.asObservable();
  decompData$ = this._decompData.asObservable();
  attestationPanelData$ = this._attestationPanelData.asObservable();
  /* vartransData = this._vartransData.asObservable(); */
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
  
  /* sendToVartransTab(object: object) {
    this._vartransData.next(object)
  } */

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
    return this.http.post(this.baseUrl + "lexicon/data/lexicalSenses", parameters);
  }

  //POST: /lexicon/data/forms ---> get form list
  getFormList(parameters: any): Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/data/forms", parameters);
  }

  //GET /lexicon/data/{id}/elements --> get elements of lexical entry
  getLexEntryElements(instance: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + instance + "/elements");
  }

  //GET ​/lexicon​/data​/{id}​/lexicalEntry --> get specific aspect (morphology, syntax, ...) associated with a given lexical entry
  getLexEntryData(instance: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + instance + "/lexicalEntry?key=" + this.key + "&aspect=core");
  }

  //GET /lexicon/data/{id}/lexicalEntryLinguisticRelation --> This method returns the relations with other lexical entities according to the input type
  getLexEntryLinguisticRelation(lexId: string, property: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + lexId + "/linguisticRelation?key=" + this.key + "&property=" + property + "");
  }


  //GET /lexicon/data/{id}/forms --> get forms of lexical entry
  getLexEntryForms(instance: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + instance + "/forms");
  }


  //GET /lexicon/data/{id}/form --> get data about a single form 
  getFormData(formId: string, aspect: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + formId + "/form?key=" + this.key + "&aspect=" + aspect)
  }


  //GET /lexicon/data/{id}/lexicalSense --> get data about a single form 
  getSenseData(senseId: string, aspect: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + senseId + "/lexicalSense?key=" + this.key + "&aspect=" + aspect)
  }

  //GET /lexicon/data/{id}/senses --> get list of senses of a lexical entry
  getSensesList(instance: string): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + instance + "/senses");
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


  //GET /lexicon/creation/lexicalEntry --> create new lexical entry
  newLexicalEntry(): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/lexicalEntry?key=" + this.key + "&author=" + this.author);
  }


  //GET /lexicon/delete/{id}/lexicalEntry --> delete lexical entry
  deleteLexicalEntry(lexId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/" + lexId + "/lexicalEntry?key=" + this.key);
  }

  //GET /lexicon/delete/{id}/form --> delete lexical entry
  deleteForm(lexId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/" + lexId + "/form?key=" + this.key);
  }

  //GET /lexicon/delete/{id}/lexicalSense --> delete lexical entry
  deleteSense(lexId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/" + lexId + "/lexicalSense?key=" + this.key);
  }

  //GET  /lexicon​/delete​/{id}​/language  --> Lexicon language deletion
  deleteLanguage(langId): Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/delete/" + langId + "/language?key=" + this.key);
  }

  //POST  /lexicon​/delete​/{id}​/linguisticRelation  --> delete linguistic relation
  deleteLinguisticRelation(lexId, parameters): Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/delete/" + lexId + "/relation?key=" + this.key, parameters);
  }

  //POST ​/lexicon​/update​/{id}​/lexicalEntry --> lexical entry update
  updateLexicalEntry(lexId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + lexId + "/lexicalEntry?key=" + this.key + "&user=" + this.author, parameters);
  }


  //POST ​/lexicon​/update​/{id}​/linguisticRelation --> linguistic Relation update for Core
  updateLinguisticRelation(lexId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + lexId + "/linguisticRelation?key=" + this.key + "&user=" + this.author, parameters);
  }

  //POST ​/lexicon​/update​/{id}​/genericRelation --> Generic relation update
  updateGenericRelation(lexId, parameters) : Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + lexId + "/genericRelation?key=" + this.key + "&user=" + this.author, parameters);
  }

  //POST /lexicon/update/{id}/form --> update form values
  updateForm(formId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + formId + "/form?key=" + this.key + "&user=" + this.author, parameters);
  }

  //POST /lexicon/update/{id}/lexicalSense --> update form values
  updateSense(senseId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + senseId + "/lexicalSense?key=" + this.key + "&user=" + this.author, parameters);
  }

  //GET  /lexinfo/data/morphology --> get data about morphology
  getMorphologyData(): Observable<any> {
    return this.http.get(this.baseUrl + "lexinfo/data/morphology");
  }

  ///GET /ontolex/data/formType --> get data about form types
  getFormTypes(): Observable<any> {
    return this.http.get(this.baseUrl + "ontolex/data/formType");
  }

  ///GET /ontolex/data/lexicalEntryType --> get data about lexicalEntry types
  getLexEntryTypes(): Observable<any> {
    return this.http.get(this.baseUrl + "ontolex/data/lexicalEntryType");
  }


  //GET /lexicon/creation/form --> create new form
  createNewForm(lexId): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/form?lexicalEntryID="+ lexId +"&key=" + this.key + "&author=" + this.author);
  }

  //GET /lexicon/creation/lexicalSense --> create new sense
  createNewSense(lexId): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/lexicalSense?lexicalEntryID="+ lexId +"&key=" + this.key + "&author=" + this.author);
  }

  //GET /lexicon/creation/language --> create new language
  createNewLanguage(langId): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/language?key=" + this.key + "&lang="+ langId +"&author=" + this.author);
  }

  //POST /lexicon/update/{id}/language --> update language
  updateLanguage(langId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + langId + "/language?key=" + this.key + "&author=" + this.author, parameters);
  }
  

  //BIBLIOGRAPHY
  getBibliographyData(instance: string) : Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + instance + "/bibliography?key=lexodemo");
  }

  addBibliographyData(instance : string, parameters){
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/creation/bibliography?lexicalEntityID=" + instance + "&key="+ this.key +"&author="+this.author+"", parameters);
  }

  removeBibliographyItem(instance: string) {
    return this.http.get(this.baseUrl + "lexicon/delete/" + instance + "/bibliography?key=PRINitant19");
  }

  synchronizeBibliographyItem(lexId : string, itemKey : string) : Observable<any> {
    return this.http.post(this.baseUrl + "lexicon/update/synchronizeBibliography?lexicalEntityID="+lexId+"&key=PRINitant19&author=demo&itemKey="+itemKey,{})
  }


  //ETYMOLOGY
  createNewEtymology(instance: string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/creation/etymology?lexicalEntryID="+instance+"&key="+this.key+"&author="+this.author+"");
  }

  getEtymologies(instance: string) : Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + instance + "/etymologies?key="+this.key+"");
  }

  getEtymologyData(instance: string)  : Observable<any> {
    return this.http.get(this.baseUrl + "lexicon/data/" + instance + "/etymology?key="+this.key+"");
  }

  updateEtymology(etymId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + etymId + "/etymology?key=" + this.key + "&author=" + this.author, parameters);
  }

  createNewEtylink(lexInstance: string, etymInstance : string) : Observable<any>{
    return this.http.get(this.baseUrl + "lexicon/creation/etymologicalLink?lexicalEntryID="+lexInstance+"&etymologyID="+etymInstance+"&key="+this.key+"&author="+this.author+"");
  }

  deleteEtymology(etymInstance : string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/delete/"+etymInstance+"/etymology?key="+this.key+"&author="+this.author+"");
  }

  updateEtylink(etymId, parameters): Observable<any> {
    this.author = this.auth.getUsername();
    return this.http.post(this.baseUrl + "lexicon/update/" + etymId + "/etymologicalLink?key=" + this.key + "&author=" + this.author, parameters);
  }

  deleteEtylink(etyLinkInstance: string) : Observable<any>{
    this.author = this.auth.getUsername();
    return this.http.get(this.baseUrl + "lexicon/delete/"+etyLinkInstance+"/etymologicalLink?key="+this.key+"&author="+this.author+"");
  }

  //DECOMP
  getSubTerms(lexicalEntityID: string) : Observable<any>{
    return this.http.get(this.baseUrl + "lexicon/data/"+lexicalEntityID+"/subTerms?key="+this.key);
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
