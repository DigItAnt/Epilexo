/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DocumentSystemService } from 'src/app/services/document-system/document-system.service';

@Component({
  selector: 'app-metadata-panel',
  templateUrl: './metadata-panel.component.html',
  styleUrls: ['./metadata-panel.component.scss']
})
export class MetadataPanelComponent implements OnInit, OnChanges {

  object : any;
  @Input() metadataData: any;

  constructor(private documentService : DocumentSystemService) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) { 
    console.log(changes)
    if(changes.metadataData.currentValue != null){
      this.object = changes.metadataData.currentValue;

      if(changes.metadataData.currentValue != this.object){
        this.object = null;
      }

      this.object = changes.metadataData.currentValue;
    }else{
      this.object = null;
      this.documentService.triggerMetadataPanel(false);
    }
    
  }

  isArray(val): boolean { return Array.isArray(val); }

  isNumber(val): boolean { return typeof val == 'number'; }

  isObject(val): boolean { return typeof val === 'object' && !Array.isArray(val); }

  isLink(val) : boolean { 
    const re = /((http|https):\/\/)(([\w.-]*)\.([\w]*))/;
    return val.match(re); 
  }

}
