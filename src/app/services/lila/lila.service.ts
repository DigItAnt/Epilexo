/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LilaService {

  private baseUrl_document = "/LexO-backend-itant/service/fedex/search"
  private endpoint = 'https://lila-erc.eu/sparql/lila_knowledge_base/sparql'

  constructor(private http: HttpClient) { }

  queryCognate(label: string): Observable<any> {
    return this.http.post(this.baseUrl_document+'?sparqlQuery='+encodeURIComponent('prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>  prefix ontolex: <http://www.w3.org/ns/lemon/ontolex#>  prefix lila: <http://lila-erc.eu/ontologies/lila/>  SELECT ?lemma ?pos  WHERE {  ?lemma a lila:Lemma ;  ontolex:writtenRep \''+label+'\';  lila:hasPOS ?pos  }')+'&endpoint='+this.endpoint, null)
  }

  queryEtymon(label: string): Observable<any> {
    return this.http.post(this.baseUrl_document+'?sparqlQuery='+encodeURIComponent(`
    PREFIX lime: <http://www.w3.org/ns/lemon/lime#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX lemonEty: <http://lari-datasets.ilc.cnr.it/lemonEty#>
    PREFIX igvll: <http://lila-erc.eu/data/lexicalResources/IGVLL/>
    SELECT  ?etymon ?language ?label ?comment WHERE
    { ?etymon a lemonEty:Etymon ;
      rdfs:label ?label ;
      rdfs:comment ?comment ;
      lime:language ?language .
    FILTER regex(?label, "^\\\\*`+label+`", "i")}`)+'&endpoint='+this.endpoint, null)
  }
}
