/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-edit-detail',
  templateUrl: './edit-detail.component.html',
  styleUrls: ['./edit-detail.component.scss']
})
export class EditDetailComponent implements OnInit, OnDestroy {

  object : any;
  showTrigger = false;
  hideEtymology = true;
  hideDecomp = true;
  hideDictionary = true;
  @ViewChild('navtabs') navtabs: ElementRef; 
  @ViewChild('navcontent') navcontent: ElementRef; 

  expand_edit_subscription : Subscription;
  expand_epi_subscription : Subscription;
  core_data_subscription : Subscription;
  decomp_data_subscription : Subscription;
  etymology_data_subscription : Subscription;

  constructor(private lexicalService: LexicalEntriesService, private exp : ExpanderService) { }

  ngOnInit(): void {
    
    this.object = null;
    this.expand_edit_subscription = this.exp.openEdit$.subscribe(
      boolean => {
        if(boolean){
          setTimeout(() => {
            var text_detail = document.querySelectorAll('#text-dettaglio');
            text_detail.forEach(element => {
              if(!element.classList.contains('show')){
                element.classList.add('show')
              }
            })
            let a_link = document.querySelectorAll('a[data-target="#text-dettaglio"]');
            a_link.forEach(element => {
              if(element.classList.contains("collapsed")){
                element.classList.remove('collapsed')
              }else{
                //element.classList.add('collapsed')
              }
            })
           }, 100);
        }
      }
    )

    this.core_data_subscription = this.lexicalService.coreData$.subscribe(
      object => {
        if(object != null){
          if(object['lexicalEntry'] != undefined ||
             object['form'] != undefined ||
             object['sense'] != undefined ||
             object['etymology'] != undefined ||
             object['conceptSet'] != undefined ||
             object['lexicalConcept'] != undefined){
               setTimeout(() => {
                var navTabLinks = this.navtabs.nativeElement.querySelectorAll('a')
                this.object = object;
                navTabLinks.forEach(element => {
                  /* //console.log(element) */
                  if(element.text == 'Core'){
                    element.classList.add('active');
                    this.hideDecomp = true;
                    this.hideEtymology = true;
                  }else{
                    element.classList.remove('active')
                    //console.log(element.id)
                  }
                });
    
                
    
                var navContent = this.navcontent.nativeElement.querySelectorAll('.tab-pane');
                
                navContent.forEach(element => {
                  
                  if(element.id == 'core'){
                    element.classList.add('active')
                    element.classList.add('show')
                    /* console.log("picchio");
                    console.log(element) */
                  }else{
                    
                    element.classList.remove('active')
                    element.classList.remove('show')
                    /* console.log("picchio21")
                    console.log(element) */
                  }
                });
               }, 100);
            

          }else {
            this.object = null;
          }
        }
      }
    );
    
    this.decomp_data_subscription = this.lexicalService.decompData$.subscribe(
      object => {
        if(object != null){
          setTimeout(() => {
            var navTabLinks = this.navtabs.nativeElement.querySelectorAll('a')
            this.object = object;
            navTabLinks.forEach(element => {
              /* //console.log(element) */
              if(element.text == 'Decomposition'){
                element.classList.add('active')
                this.hideDecomp = false;
                this.hideEtymology = true;
              }else{
                element.classList.remove('active')
                //console.log(element.id)
              }
            });

            

            var navContent = this.navcontent.nativeElement.querySelectorAll('.tab-pane');
            
            navContent.forEach(element => {
              
              if(element.id == 'decomposition'){
                element.classList.add('active')
                element.classList.add('show')
                /* console.log("picchio");
                console.log(element) */
              }else{
                
                element.classList.remove('active')
                element.classList.remove('show')
                /* console.log("picchio21")
                console.log(element) */
              }
            });
           }, 100);
        }else{
          this.object = null;
        }
      }
    )
    

    this.etymology_data_subscription = this.lexicalService.etymologyData$.subscribe(
      object => {
        if(object != null){
          if(object['etymology']['etymology'] != undefined){
            this.object = object;
            var navTabLinks = this.navtabs.nativeElement.querySelectorAll('a')
            
            navTabLinks.forEach(element => {
              //console.log(element.text)
              if(element.text == 'Etymology'){
                /* console.log("aggiungo active a:") */
                element.classList.add('active');
                this.hideEtymology = false;
                this.hideDecomp = true;
              }else{
                element.classList.remove('active')
                /* console.log("tolgo active a:") */
              }
            });
            var navContent = this.navcontent.nativeElement.querySelectorAll('.tab-pane');
            
            navContent.forEach(element => {
              //console.log(element.id)
              if(element.id == 'etymology'){
                element.classList.add('active')
                element.classList.add('show')
              }else{
                element.classList.remove('active')
                element.classList.remove('show')
                //console.log(element.id)
              }
            });
            
          }else {
            this.object = null;
          }
        }
      }
    );
  }

  triggerExpansionEdit(){
 
    setTimeout(() => {

      if(this.exp.isEditTabOpen() && !this.exp.isEpigraphyTabOpen()){
        if(this.exp.isEditTabExpanded() && !this.exp.isEpigraphyTabExpanded()){
          this.exp.openCollapseEdit();
          this.exp.expandCollapseEdit();
        }
      }else if(!this.exp.isEditTabOpen() && !this.exp.isEpigraphyTabOpen()){
        if(!this.exp.isEditTabExpanded() && !this.exp.isEpigraphyTabExpanded()){
          this.exp.openCollapseEdit();
          this.exp.expandCollapseEdit();
        }
      }else if(this.exp.isEditTabOpen() && this.exp.isEpigraphyTabOpen()){
        this.exp.openCollapseEdit();
        this.exp.expandCollapseEpigraphy(true);
      }else if(!this.exp.isEditTabOpen() && this.exp.isEpigraphyTabOpen()){
        if(!this.exp.isEditTabExpanded() && this.exp.isEpigraphyTabExpanded()){
          this.exp.expandCollapseEpigraphy(false);
          this.exp.openCollapseEdit(true)
        }
        
      }
      
    }, 200);
  }

  ngOnDestroy(): void {
      this.core_data_subscription.unsubscribe();
      //this.expand_epi_subscription.unsubscribe();
      this.decomp_data_subscription.unsubscribe();
      this.expand_edit_subscription.unsubscribe();
      this.etymology_data_subscription.unsubscribe();
  }

}
