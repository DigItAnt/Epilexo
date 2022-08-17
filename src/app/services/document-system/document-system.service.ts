/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentSystemService {

  private baseUrl_document = "/cash_demo/"
  //private baseUrl_document = "https://lari2.ilc.cnr.it/cash/"

  private _epigraphyData: BehaviorSubject<object> = new BehaviorSubject(null);
  private _epigraphyTextData: BehaviorSubject<string> = new BehaviorSubject(null);
  private _epigraphyLeidenData: BehaviorSubject<any> = new BehaviorSubject(null);
  private _epigraphyTranslationData: BehaviorSubject<any> = new BehaviorSubject(null);
  private _metadataData : BehaviorSubject<object> = new BehaviorSubject(null);
  private _triggerMetadataPanel : BehaviorSubject<boolean> = new BehaviorSubject(null);

  epigraphyData$ = this._epigraphyData.asObservable();
  epigraphyTextData$ = this._epigraphyTextData.asObservable();
  epigraphyLeidenData$ = this._epigraphyLeidenData.asObservable();
  epigraphyTranslationData$ = this._epigraphyTranslationData.asObservable();
  metadataData$ = this._metadataData.asObservable();
  triggerMetadataPanel$ = this._triggerMetadataPanel.asObservable();

  constructor(private http: HttpClient) { }

  sendToEpigraphyTab(object: object) {
    this._epigraphyData.next(object)
  } 

  sendTextToEpigraphyTab(string : string){
    this._epigraphyTextData.next(string);
  }

  sendTranslationToEpigraphyTab(array : any){
    this._epigraphyTranslationData.next(array);
  }

  sendLeidenToEpigraphyTab(string : any){
    this._epigraphyLeidenData.next(string);
  }

  sendToMetadataPanel(object : object){
    this._metadataData.next(object);
  }

  triggerMetadataPanel(bool: boolean){
    this._triggerMetadataPanel.next(bool);
  }

  //GET /api/getDocumentSystem  ---> return document system
  getDocumentSystem(): Observable<any> {
    return this.http.get(this.baseUrl_document + "api/getDocumentSystem?requestUUID=11")
  }

  //POST ​/api​/crud​/addFolder --> add folder to document system
  addFolder(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/addFolder", parameters)
  }

  //POST ​/api​/crud​/removeFolder --> remove Folder folder from document system
  removeFolder(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/removeFolder", parameters)
  }

  //POST ​/api​/crud​/moveFolder --> move Folder to another folder
  moveFolder(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/moveFolder", parameters)
  }

  //POST ​/api​/crud​/renameFolder --> rename folder
  renameFolder(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/renameFolder", parameters)
  }


  //POST ​/api​/crud​/uploadFile --> upload text
  uploadFile(parameters, element_id, request_uuid): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/uploadFile?requestUUID="+request_uuid+"&element-id="+element_id+"", parameters)
  }

  //POST ​/api​/crud​/removeFile --> upload text
  removeFile(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/removeFile", parameters)
  }

  //POST ​/api​/crud​/renameFile --> upload text
  renameFile(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/renameFile", parameters)
  }

  //POST ​/api​/crud​/moveFileTo --> move file to another folder
  moveFileTo(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/moveFileTo", parameters)
  }

  //POST ​/api​/crud​/copyFileTo --> move file to another folder
  copyFileTo(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/copyFileTo", parameters)
  }

  //POST ​/api​/crud​/downloadFile --> move file to another folder
  downloadFile(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/downloadFile", parameters)
  }

  //POST ​/api​/crud​/updateMetadata --> move file to another folder
  updateMetadata(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/updateMetadata", parameters)
  }
  
  //POST ​/api​/crud​/deleteMetadata --> move file to another folder
  deleteMetadata(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/deleteMetadata", parameters)
  }

  //POST ​/api​/crud​/searchFiles --> move file to another folder
  searchFiles(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/searchFiles", parameters)
  }

  //POST ​/api​/crud​/createFile --> create file
  createFile(parameters): Observable<any> {
    return this.http.post(this.baseUrl_document + "api/crud/createFile", parameters)
  }


  getContent(nodeId) : Observable<any> {
    return this.http.get(this.baseUrl_document + "api/v1/getcontent?requestUUID=11&nodeid="+nodeId);
  }


  testConvert(parameters) : Observable<any> {
    return this.http.post('/leiden/', parameters);
  }
}
