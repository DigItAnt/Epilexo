/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { LexicalEntriesService } from '../../../../../services/lexical-entries/lexical-entries.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';

import {
  animate,
  style,
  transition,
  trigger,
  state
} from "@angular/animations";
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';


@Component({
  selector: 'app-decomposition-tab',
  templateUrl: './decomposition-tab.component.html',
  styleUrls: ['./decomposition-tab.component.scss'],
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
export class DecompositionTabComponent implements OnInit, OnDestroy {

  lock = 0;
  object: any;
  exp_trig = '';

  creationDate;
  lastUpdate;

  isLexicalEntry = false;
  searchIconSpinner = false;

  decompData: any;
  destroy$: Subject<boolean> = new Subject();
  core_data_subscription: Subscription;
  decomp_data_subscription: Subscription;
  expand_edit_subscription: Subscription;
  expand_epigraphy_subscription: Subscription;

  @ViewChild('expander') expander_body: ElementRef;

  constructor(private toastr: ToastrService, private lexicalService: LexicalEntriesService, private expand: ExpanderService, private rend: Renderer2) { }

  ngOnInit(): void {
    /* this.core_data_subscription = this.lexicalService.coreData$.subscribe(
      object => {
        this.object = null;
        if(this.object != object){
          this.decompData = null;
        }
        this.object = object
        
        if(this.object != null){
          if(this.object.lexicalEntry != undefined && this.object.sense == undefined){
            this.isLexicalEntry = true;
            this.decompData = object;

            this.creationDate = object['creationDate'];
            this.lastUpdate = object['lastUpdate']
          }else if(this.object.form != undefined){
            this.isLexicalEntry = false;
            this.decompData = null;
            this.object = null;
          }else if(this.object.sense != undefined){
            this.isLexicalEntry = false;
            this.decompData = null;
            this.object = null;
          }
        }
      }
    ); */

    this.decomp_data_subscription = this.lexicalService.decompData$.subscribe(
      object => {
        this.object = null;
        if (this.object != object) {
          this.decompData = null;
        }
        this.object = object

        if (this.object != null) {
          if (this.object.lexicalEntry != undefined && this.object.sense == undefined) {
            this.isLexicalEntry = true;
            this.decompData = object;

            this.creationDate = object['creationDate'];
            this.lastUpdate = object['lastUpdate']
          } else if (this.object.form != undefined) {
            this.isLexicalEntry = false;
            this.decompData = null;
            this.object = null;
          } else if (this.object.sense != undefined) {
            this.isLexicalEntry = false;
            this.decompData = null;
            this.object = null;
          }
        }
      }
    );


    this.expand_edit_subscription = this.expand.expEdit$.subscribe(
      trigger => {
        setTimeout(() => {
          if (trigger) {
            let isEditExpanded = this.expand.isEditTabExpanded();
            let isEpigraphyExpanded = this.expand.isEpigraphyTabExpanded();

            if (!isEpigraphyExpanded) {
              this.exp_trig = 'in';
              this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(100vh - 17rem)')
              this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(100vh - 17rem)')
            } else {
              this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)');
              this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
              this.exp_trig = 'in';
            }

          } else if (trigger == null) {
            return;
          } else {
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)');
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
            this.exp_trig = 'out';
          }
        }, 100);

      }
    );

    this.expand_epigraphy_subscription = this.expand.expEpigraphy$.subscribe(
      trigger => {
        setTimeout(() => {
          if (trigger) {
            this.exp_trig = 'in';
            this.rend.setStyle(this.expander_body.nativeElement, 'height', 'calc(50vh - 12.5rem)')
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)')
          } else if (trigger == null) {
            return;
          } else {
            this.rend.setStyle(this.expander_body.nativeElement, 'max-height', 'calc(50vh - 12.5rem)');
            this.exp_trig = 'out';
          }
        }, 100);

      }
    );
  }

  /* changeStatus() {
    if (this.lock < 2) {
      this.lock++;
    } else if (this.lock > 1) {
      this.lock--;
    }

    if(this.lock==2){
      setTimeout(() => {
        //@ts-ignore
        $('.locked-tooltip').tooltip({
          trigger: 'hover'
        });
      }, 10);
    }else if(this.lock < 2){
      setTimeout(() => {
        //@ts-ignore
        $('.locked-tooltip').tooltip('disable');
      }, 10);
    }
    
  } */

  addNewForm() {
    this.searchIconSpinner = true;
    /* console.log(this.object) */
    this.object['request'] = 'form'
    if (this.isLexicalEntry) {
      let lexicalId = this.object.lexicalEntry;
      this.lexicalService.createNewForm(lexicalId).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          this.toastr.success('Form added correctly', '', {
            timeOut: 5000,
          });
          console.log(data);
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
        }, error => {
          console.log(error)
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
          this.searchIconSpinner = false;
        }
      )
    }

  }

  addNewSense() {
    this.searchIconSpinner = true;
    this.object['request'] = 'sense'
    if (this.isLexicalEntry) {
      let lexicalId = this.object.lexicalEntry;
      this.lexicalService.createNewSense(lexicalId).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          if (data['creator'] == this.object.creator) {
            data['flagAuthor'] = false;
          } else {
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
          this.searchIconSpinner = false;
          this.toastr.success('Sense added correctly', '', {
            timeOut: 5000,
          });
        }, error => {
          this.searchIconSpinner = false;
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });

        }
      )
    }/* else if(this.isSense){
      let parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      this.object['request'] = 'sense'
      //console.log(this.object);
      this.lexicalService.createNewSense(parentNodeInstanceName).subscribe(
        data=>{
          if(data['creator'] == this.object.creator){
            data['flagAuthor'] = false;
          }else{
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({'lex' : this.object, 'data' : data});
          this.searchIconSpinner = false;
          this.toastr.success('Sense added correctly', '', {
            timeOut: 5000,
          });
        },error=> {
          this.searchIconSpinner = false;
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        }
      )
    }else if(this.isForm){
      let parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      this.object['request'] = 'sense'
      //console.log(this.object);
      this.lexicalService.createNewSense(parentNodeInstanceName).subscribe(
        data=>{
          if(data['creator'] == this.object.creator){
            data['flagAuthor'] = false;
          }else{
            data['flagAuthor'] = true;
          }
          this.lexicalService.addSubElementRequest({'lex' : this.object, 'data' : data});
          this.searchIconSpinner = false;
          this.toastr.success('Sense added correctly', '', {
            timeOut: 5000,
          });
          //this.lexicalService.refreshLexEntryTree();
        },error=> {
          this.searchIconSpinner = false;
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
          //this.lexicalService.refreshLexEntryTree();
        }
      )
    } */

  }

  addNewEtymology() {
    this.searchIconSpinner = true;
    this.object['request'] = 'etymology'
    let parentNodeInstanceName = '';
    if (this.object.lexicalEntry != undefined
      && this.object.senseInstanceName == undefined) {
      console.log(1)
      parentNodeInstanceName = this.object.lexicalEntry;
    }/* else if(this.object.formInstanceName != undefined){
      parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      console.log(2)
    }else if(this.object.senseInstanceName != undefined){
      parentNodeInstanceName = this.object.parentNodeInstanceName;
      this.object['lexicalEntry'] = parentNodeInstanceName
      console.log(3)
    } */

    console.log(parentNodeInstanceName)
    this.lexicalService.createNewEtymology(parentNodeInstanceName).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)
        if (data['creator'] == this.object.creator) {
          data['flagAuthor'] = false;
        } else {
          data['flagAuthor'] = true;
        }
        this.lexicalService.addSubElementRequest({ 'lex': this.object, 'data': data });
        this.searchIconSpinner = false;
        this.toastr.success('Etymology added correctly', '', {
          timeOut: 5000,
        });
      }, error => {
        this.searchIconSpinner = false;
      }
    )

  }

  ngOnDestroy(): void {
    //this.core_data_subscription.unsubscribe();
    this.expand_edit_subscription.unsubscribe();
    this.expand_epigraphy_subscription.unsubscribe();

    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
