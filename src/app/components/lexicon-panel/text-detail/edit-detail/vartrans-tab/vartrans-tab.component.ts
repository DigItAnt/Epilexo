/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

import {
  animate,
  style,
  transition,
  trigger,
  state
} from "@angular/animations";

@Component({
  selector: 'app-vartrans-tab',
  templateUrl: './vartrans-tab.component.html',
  styleUrls: ['./vartrans-tab.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        height: 'calc(100vh - 17rem)',
        
      })),
      state('out', style({
        height: 'calc(50vh - 12.5rem)',
      })),
      transition('in => out', animate('400ms ease-in-out')),
      transition('out => in', animate('400ms ease-in-out'))
    ])
  ]
})
export class VartransTabComponent implements OnInit {

  lock = 0;
  object: any;
  exp_trig = '';

  lexicalEntryData : any;
  senseData : any;

  isLexicalEntry = false;
  isSense = false;

  @ViewChild('expander') expander_body: ElementRef;

  constructor(private lexicalService: LexicalEntriesService, private expand: ExpanderService, private rend : Renderer2) { }

  ngOnInit(): void {
    this.lexicalService.coreData$.subscribe(
      object => {
        if(this.object != object){
          this.lexicalEntryData = null;
          this.senseData = null;
        }
        this.object = object
        
        if(this.object != null){
          if(this.object.lexicalEntry != undefined && this.object.sense == undefined){
            this.isLexicalEntry = true;
            this.isSense = false;
            this.lexicalEntryData = object;
          }else if(this.object.sense != undefined){
            this.isLexicalEntry = false;
            this.isSense = true;
            this.senseData = object;
            this.lexicalEntryData = null;
          }else if(this.object.form != undefined){
            this.isLexicalEntry = false;
            this.isSense = false;
            this.lexicalEntryData = null;
            this.object = null;
          }
        }
      }
    );
    
    this.expand.expEdit$.subscribe(
      trigger => {
        if(trigger){
          let isEditExpanded = this.expand.isEditTabExpanded();
          let isEpigraphyExpanded = this.expand.isEpigraphyTabExpanded();

          if(!isEpigraphyExpanded){
            this.exp_trig = 'in';
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(100vh - 17rem)')
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(100vh - 17rem)')
          }else{
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)');
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
            this.exp_trig = 'in';
          }
          
        }else if(trigger==null){
          return;
        }else{
          this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)');
          this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
          this.exp_trig = 'out';
        }
      }
    );

    this.expand.expEpigraphy$.subscribe(
      trigger => {
        setTimeout(() => {
          if(trigger){
            this.exp_trig = 'in';
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)')
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)')
          }else if(trigger==null){
            return;
          }else{
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
            this.exp_trig = 'out';
          }
        }, 100);
        
      }
    );
  }

  changeStatus() {
    if (this.lock < 2) {
      this.lock++;
    } else if (this.lock > 1) {
      this.lock--;
    }
    setTimeout(() => {
      //@ts-ignore
      $('.locked-tooltip').tooltip({
        trigger: 'hover'
      });
    }, 10);
  }

}
