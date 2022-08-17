/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-language-manager',
  templateUrl: './language-manager.component.html',
  styleUrls: ['./language-manager.component.scss']
})
export class LanguageManagerComponent implements OnInit {

  languageList = [];
  editLangArray = [];
  isValid = false;
  loadingService = false;
  removeMessage;

  private subject: Subject<any> = new Subject();
  /* public urlRegex = /(^|\s)((https?:\/\/.+))/ */

  editLangForm = new FormGroup({
    description: new FormControl(''),
    lexvo : new FormControl('', [Validators.required, Validators.minLength(3)]),
    label: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(3)])
  })
  constructor(private lexicalService: LexicalEntriesService, private toastr: ToastrService) { }


  ngOnInit(): void {

    /* this.loadLangData(); */

    /*  this.onChanges(); */
    this.lexicalService.refreshLangTable$.subscribe(
      data => {
        /* //console.log("refresh"); */
        this.loadLangData();
      }, error => {
        //console.log("no refresh")
      }
    )

    this.subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onEditLanguage(data)
      }
    )
  }


  loadLangData() {
    this.lexicalService.getLexiconLanguages().subscribe(
      data => {
        /* //console.log(data) */
        this.languageList = data;
      }, error => {
        //console.log(error)
      }
    )
  }

  onSubmit(inputValue: string) {
    //console.log(inputValue.match(/^[A-Za-z]{2,3}$/))
    if (inputValue.match(/^[A-Za-z]{2,3}$/)) {
      this.isValid = true;
      this.loadingService = true;
      
      this.lexicalService.createNewLanguage(inputValue).subscribe(
        data => {
          console.log(data)
          this.loadingService = false;
          this.lexicalService.refreshFilter({request: true});
          this.lexicalService.updateLangSelect({request: true});
          this.lexicalService.refreshLangTable();
          this.toastr.info('Language '+ data['label'] + ' created', '', {
            timeOut: 5000,
          });

        }, error => {
          console.log(error)
          this.loadingService = false;
          this.lexicalService.refreshLangTable();
          this.lexicalService.refreshFilter({request: true});
          this.lexicalService.updateLangSelect({request: true});
        }
      )
    } else {
      this.isValid = false;
    }
  }

  triggerEdit(i, v) {
    this.subject.next({ i, v })
  }

  onEditLanguage(data) {
    
    if(data['v'].trim() != ''){
      if (data['i'] == "description") {
        let langId = this.editLangArray['languageInstanceName'];
        let parameters = {
          relation: 'description',
          value: data['v']
        }
  
        this.lexicalService.updateLanguage(langId, parameters).subscribe(
          data => {
            console.log(data)
            this.lexicalService.refreshLangTable();
            this.lexicalService.refreshFilter({request : true})
          }, error => {
            console.log(error)
            this.lexicalService.refreshLangTable();
            this.lexicalService.refreshFilter({request : true})
            if(error.statusText == 'OK'){
              this.toastr.info('Description for '+langId+' updated', '', {
                timeOut: 5000,
              });
            }else{
              this.toastr.error(error.error, 'Error', {
                timeOut: 5000,
              });
            }
          }
        )
      } else if (data['i'] == "lexvo") {
        //console.log(data)
        let langId = this.editLangArray['languageInstanceName'];
        let parameters = {
          relation: 'lexvo',
          value: data['v']
        }
  
        this.lexicalService.updateLanguage(langId, parameters).subscribe(
          data => {
            console.log(data)
            this.lexicalService.refreshLangTable();
            this.lexicalService.refreshFilter({request : true})
          }, error => {
            console.log(error)
            this.lexicalService.refreshLangTable();
            this.lexicalService.refreshFilter({request : true})
            if(error.statusText == 'OK'){
              this.toastr.info('Description for '+langId+' updated', '', {
                timeOut: 5000,
              });
            }else{
              this.toastr.error(error.error, 'Error', {
                timeOut: 5000,
              });
            }
          }
        )
      }else if (data['i'] == "label") {
        if(this.editLangForm.get('label').valid){
          let langId = this.editLangArray['languageInstanceName'];
          let parameters = {
            relation: 'language',
            value: data['v']
          }
    
          this.lexicalService.updateLanguage(langId, parameters).subscribe(
            data => {
              console.log(data)
              this.lexicalService.refreshLangTable();
            }, error => {
              console.log(error)
              this.lexicalService.refreshLangTable();
              if(error.statusText == 'OK'){
                this.toastr.info('Description for '+langId+' updated', '', {
                  timeOut: 5000,
                });
              }else{
                this.toastr.error(error.error, 'Error', {
                  timeOut: 5000,
                });
              }
            }
          )
        }else{
          this.toastr.error('Not valid string for label field', 'Error', {
            timeOut: 5000,
          });
        }
        
      }
    }else{
      this.toastr.error("Don't insert empty value", 'Error', {
        timeOut: 5000,
      });
    }
    
  }

  editLang(index) {
    this.editLangArray = this.languageList[index]
    this.editLangForm.get('description').setValue(this.editLangArray['description'], { eventEmit: false })
    this.editLangForm.get('lexvo').setValue(this.editLangArray['lexvo'], { eventEmit: false })
    this.editLangForm.get('label').setValue(this.editLangArray['label'], { eventEmit: false })
    //console.log(this.editLangArray)
  }

  checkEditValid(index) {
    return this.editLangForm.get(index).valid;
  }

  removeLang(index) {
    this.removeMessage = this.languageList[index]['languageInstanceName']
  }

  deleteLangRequest(){
    let langId = this.removeMessage;
    this.lexicalService.deleteLanguage(langId).subscribe(
      data=>{
        console.log(data);
        this.lexicalService.refreshLangTable();
        this.lexicalService.refreshFilter({request : true})
        this.toastr.info('Language ' +langId+' removed', '', {
          timeOut: 5000,
        });
      },error=>{
        console.log(error);
        this.lexicalService.refreshLangTable();
        this.lexicalService.refreshFilter({request : true})
        this.toastr.error(error.error, 'Error', {
          timeOut: 5000,
        });
      }
    )
  }


}
