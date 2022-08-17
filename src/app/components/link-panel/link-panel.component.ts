/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-link-panel',
  templateUrl: './link-panel.component.html',
  styleUrls: ['./link-panel.component.scss']
})
export class LinkPanelComponent implements OnInit {

  @Input() linkData: any[] | any;
  
  seeAlsoData : {};
  sameAsData : {};
  counterElement = 0;
  object : any;
  constructor(private lexicalService: LexicalEntriesService) { }

  ngOnInit(): void {

    this.lexicalService.refreshLinkCounter$.subscribe(
      data=>{
        console.log(data)
        if(data!=null){
          this.counterElement = eval(this.counterElement.toString()+data)
        }
      },error=>{

      }
    )
  }

  ngOnChanges(changes: SimpleChanges){
    if(changes.linkData.currentValue != null){
      this.counterElement = 0;
      this.object = changes.linkData.currentValue;
      this.sameAsData = null;
      this.seeAlsoData = null;
      
      /* //console.log(changes.linkData.currentValue) */

      if(this.object.lexicalEntryInstanceName != undefined){
        let lexId = this.object.lexicalEntryInstanceName;
        this.lexicalService.getLexEntryLinguisticRelation(lexId, 'sameAs').subscribe(
          data=>{
            console.log(data, this.object);
            this.sameAsData = {}
            this.sameAsData['array'] = data;
            this.sameAsData['parentNodeLabel']= this.object['lexicalEntry'];
            this.sameAsData['lexicalEntryInstanceName']= this.object['lexicalEntryInstanceName'];
            this.sameAsData['type'] = this.object.type;
          }, error=>{
            console.log(this.object)
            this.sameAsData = {}
            this.sameAsData['array'] = [];
            this.sameAsData['parentNodeLabel']= this.object['lexicalEntry'];
            this.sameAsData['lexicalEntryInstanceName']= this.object['lexicalEntryInstanceName'];
            this.sameAsData['label']= this.object['label'];
            this.sameAsData['type'] = this.object.type;
            console.log(error);
            
          }
        )

        this.lexicalService.getLexEntryLinguisticRelation(lexId, 'seeAlso').subscribe(
          data=>{
            console.log(data)
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = data;
            this.seeAlsoData['parentNodeLabel']= this.object['lexicalEntry'];
            this.seeAlsoData['lexicalEntryInstanceName']= this.object['lexicalEntryInstanceName'];
          }, error=>{
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = [];
            this.seeAlsoData['parentNodeLabel']= this.object['lexicalEntry'];
            this.seeAlsoData['lexicalEntryInstanceName']= this.object['lexicalEntryInstanceName'];
            //console.log(error);
            
          }
        )

        //console.log(this.object)
        this.object.links.forEach(element => {
          if(element.type != undefined){
            if(element.type == 'Reference'){
              element.elements.forEach(sub => {
                this.counterElement += sub.count;
              });
            }
          }
        });
      }else if(this.object.formInstanceName != undefined){
        let formId = this.object.formInstanceName;
        this.lexicalService.getLexEntryLinguisticRelation(formId, 'sameAs').subscribe(
          data=>{
            //console.log(data);
            this.sameAsData = {}
            this.sameAsData['array'] = data;
            this.sameAsData['formInstanceName']= this.object['formInstanceName'];
          }, error=>{
            this.sameAsData = {}
            this.sameAsData['array'] = [];
            this.sameAsData['formInstanceName']= this.object['formInstanceName'];
            //console.log(error);
            
          }
        )

        this.lexicalService.getLexEntryLinguisticRelation(formId, 'seeAlso').subscribe(
          data=>{
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = data;
            this.seeAlsoData['formInstanceName']= this.object['formInstanceName'];
          }, error=>{
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = [];
            this.seeAlsoData['formInstanceName']= this.object['formInstanceName'];
            //console.log(error);
            
          }
        )

        //console.log(this.object)
        if(this.object.links != null){
          this.object.links.forEach(element => {
            if(element.type != undefined){
              if(element.type == 'Reference'){
                element.elements.forEach(sub => {
                  this.counterElement += sub.count;
                });
              }
            }
          });
        }
        
      }else if(this.object.senseInstanceName != undefined){
        let senseId = this.object.senseInstanceName;
        this.lexicalService.getLexEntryLinguisticRelation(senseId, 'sameAs').subscribe(
          data=>{
            //console.log(data);
            this.sameAsData = {}
            this.sameAsData['array'] = data;
            this.sameAsData['senseInstanceName']= this.object['senseInstanceName'];
          }, error=>{
            this.sameAsData = {}
            this.sameAsData['array'] = [];
            this.sameAsData['senseInstanceName']= this.object['senseInstanceName'];
            //console.log(error);
            
          }
        )

        this.lexicalService.getLexEntryLinguisticRelation(senseId, 'seeAlso').subscribe(
          data=>{
            //console.log(data)
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = data;
            this.seeAlsoData['senseInstanceName']= this.object['senseInstanceName'];
          }, error=>{
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = [];
            this.seeAlsoData['senseInstanceName']= this.object['senseInstanceName'];
            //console.log(error);
            
          }
        )

        //console.log(this.object)
        if(this.object.links != null){
          this.object.links.forEach(element => {
            if(element.type != undefined){
              if(element.type == 'Reference'){
                element.elements.forEach(sub => {
                  this.counterElement += sub.count;
                });
              }
            }
          });
        }
      }else if(this.object.etymologyInstanceName != undefined){
        let etymId = this.object.etymologyInstanceName;
        this.lexicalService.getLexEntryLinguisticRelation(etymId, 'sameAs').subscribe(
          data=>{
            //console.log(data);
            this.sameAsData = {}
            this.sameAsData['array'] = data;
            this.sameAsData['etymologyInstanceName']= this.object['etymologyInstanceName'];
          }, error=>{
            this.sameAsData = {}
            this.sameAsData['array'] = [];
            this.sameAsData['etymologyInstanceName']= this.object['etymologyInstanceName'];
            //console.log(error);
            
          }
        )

        this.lexicalService.getLexEntryLinguisticRelation(etymId, 'seeAlso').subscribe(
          data=>{
            //console.log(data)
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = data;
            this.seeAlsoData['etymologyInstanceName']= this.object['etymologyInstanceName'];
          }, error=>{
            this.seeAlsoData = {}
            this.seeAlsoData['array'] = [];
            this.seeAlsoData['etymologyInstanceName']= this.object['etymologyInstanceName'];
            //console.log(error);
            
          }
        )

        //console.log(this.object)
        if(this.object.links != null){
          this.object.links.forEach(element => {
            if(element.type != undefined){
              if(element.type == 'Reference'){
                element.elements.forEach(sub => {
                  this.counterElement += sub.count;
                });
              }
            }
          });
        }
      }  
    }else{
      this.counterElement = 0;
      this.sameAsData = null;
      this.seeAlsoData = null;
    }
  }

  

}
