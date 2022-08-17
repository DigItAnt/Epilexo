/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { DocumentSystemService } from 'src/app/services/document-system/document-system.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';

@Component({
  selector: 'app-epigraphy-detail',
  templateUrl: './epigraphy-detail.component.html',
  styleUrls: ['./epigraphy-detail.component.scss']
})
export class EpigraphyDetailComponent implements OnInit, OnDestroy {

  @ViewChild('navTabsEpigraphy') navtabs: ElementRef; 
  @ViewChild('navContentEpigraphy') navcontent: ElementRef; 

  object : any;
  subscription : Subscription;
  constructor(private documentService: DocumentSystemService, private exp : ExpanderService) { }

  ngOnInit(): void {
    this.exp.openEpigraphy$.subscribe(
      boolean => {
        if(boolean){
          setTimeout(() => {
            var text_detail = document.querySelectorAll('#epigraphy-dettaglio');
            text_detail.forEach(element => {
              if(!element.classList.contains('show')){
                element.classList.add('show')
              }
            })
            let a_link = document.querySelectorAll('a[data-target="#epigraphy-dettaglio"]');
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

    this.subscription = this.documentService.epigraphyData$.subscribe(
      object => {
       /*  console.log(object) */
        if(object != null){
          setTimeout(() => {
            var navTabLinks = this.navtabs.nativeElement.querySelectorAll('a')
            this.object = object;
            /* console.log(this.object) */
            navTabLinks.forEach(element => {
              /* //console.log(element) */
              if(element.text == 'Epigraphy'){
                element.classList.add('active')
              }else{
                element.classList.remove('active')
                //console.log(element.id)
              }
            });

            var navContent = this.navcontent.nativeElement.querySelectorAll('.tab-pane');
            
            navContent.forEach(element => {
              
              if(element.id == 'epigraphy'){
                element.classList.add('active')
                element.classList.add('show')
              }else{
                
                element.classList.remove('active')
                element.classList.remove('show')
                //console.log(element)
              }
            });
          }, 200);
          
        }else{
          this.object = null;
          setTimeout(() => {
            var navTabLinks = this.navtabs.nativeElement.querySelectorAll('a')
            this.object = object;
            /* console.log(this.object) */
            navTabLinks.forEach(element => {
              /* //console.log(element) */
              if(element.text == 'Epigraphy'){
                element.classList.remove('active')
              }
            });

            var navContent = this.navcontent.nativeElement.querySelectorAll('.tab-pane');
            
            navContent.forEach(element => {
              
              if(element.id == 'epigraphy'){
                element.classList.remove('active')
                element.classList.remove('show')
              }
            });
          }, 200);
        }
      }
    );
  }

  triggerExpansionEpigraphy(){


    setTimeout(() => {
      if(!this.exp.isEditTabOpen() && this.exp.isEpigraphyTabOpen()){
        if(!this.exp.isEditTabExpanded() && this.exp.isEpigraphyTabExpanded()){
          this.exp.openCollapseEpigraphy();
          this.exp.expandCollapseEpigraphy();
        }
      }else if(!this.exp.isEditTabOpen() && !this.exp.isEpigraphyTabOpen()){
        if(!this.exp.isEditTabExpanded() && !this.exp.isEpigraphyTabExpanded()){
          this.exp.openCollapseEpigraphy();
          this.exp.expandCollapseEpigraphy();
        }
      }else if(this.exp.isEditTabOpen() && this.exp.isEpigraphyTabOpen()){
        this.exp.openCollapseEpigraphy();
        this.exp.expandCollapseEdit(true);
      }else if(this.exp.isEditTabOpen() && !this.exp.isEpigraphyTabOpen()){
        if(this.exp.isEditTabExpanded() && !this.exp.isEpigraphyTabExpanded()){
          this.exp.expandCollapseEdit(false);
          this.exp.openCollapseEpigraphy(true)
        }
        
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
