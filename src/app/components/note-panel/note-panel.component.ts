/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, HostListener, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-note-panel',
  templateUrl: './note-panel.component.html',
  styleUrls: ['./note-panel.component.scss']
})
export class NotePanelComponent implements OnInit, OnChanges {

  @Input() noteData: string;
  object : any;
  private subject : Subject<string> = new Subject();
  
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    /* //console.log(event) */
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  htmlContent : '';
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '0',
    maxHeight: '150px',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],
    uploadUrl: 'v1/image',
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      [
        'undo',
        'redo',
        'strikeThrough',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'indent',
        'outdent',
        'insertUnorderedList',
        'insertOrderedList',
        'heading',
        'fontName'
      ],
      [
        'fontSize',
        'textColor',
        'backgroundColor',
        'customClasses',
        'link',
        'unlink',
        'insertImage',
        'insertVideo',
        'insertHorizontalRule',
        'toggleEditorMode'
      ]
    ]
  };
  constructor(private lexicalService: LexicalEntriesService, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.editorConfig.editable = false;


    this.subject.pipe(debounceTime(1000)).subscribe(
      newNote => {
        if(this.noteData != null){
          this.lexicalService.spinnerAction('on');
          console.log(this.object)
          //console.log(this.object)
          if(this.object.lexicalEntryInstanceName != undefined){
            var lexId = this.object.lexicalEntryInstanceName;
            var parameters = {
              relation : "note",
              value : newNote
            }
            this.lexicalService.updateLexicalEntry(lexId, parameters).subscribe(
              data => {
                //console.log(data);
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              },
              error => {
                //console.log(error);
                const data = this.object;
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.updateCoreCard({lastUpdate : error.error.text})
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              }
            )
          }else if(this.object.formInstanceName != undefined){
            var formId = this.object.formInstanceName;
            var parameters = {
              relation : "note",
              value : newNote
            }
            this.lexicalService.updateForm(formId, parameters).subscribe(
              data => {
                //console.log(data);
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              },
              error => {
                //console.log(error);
                const data = this.object;
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.updateCoreCard({lastUpdate : error.error.text})
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              }
            )
          }else if(this.object.senseInstanceName != undefined){
            var senseId = this.object.senseInstanceName;
            var parameters = {
              relation : "note",
              value : newNote
            }
            this.lexicalService.updateSense(senseId, parameters).subscribe(
              data => {
                //console.log(data);
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              },
              error => {
                //console.log(error);
                const data = this.object;
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.updateCoreCard({lastUpdate : error.error.text})
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              }
            )
          }else if(this.object.etymologyInstanceName != undefined){
            var etymId = this.object.etymologyInstanceName;
            var parameters = {
              relation : "note",
              value : newNote
            }
            this.lexicalService.updateEtymology(etymId, parameters).subscribe(
              data => {
                //console.log(data);
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              },
              error => {
                //console.log(error);
                const data = this.object;
                data['request'] = 0;
                data['new_note'] = newNote;
                this.lexicalService.refreshAfterEdit(data);
                this.lexicalService.updateCoreCard({lastUpdate : error.error.text})
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              }
            )
          }
        }
      }
    )

    this.lexicalService.deleteReq$.subscribe(
      data => {
        this.editorConfig.editable = false;
        this.noteData = null;
        this.object = null;
      }
    )
  }

  ngOnChanges(changes: SimpleChanges) { 
    
      if(changes.noteData.currentValue == null){
        this.editorConfig.editable = false;
        this.noteData = null;
        this.object = null;
      }else{
        this.editorConfig.editable = true;
        this.noteData = changes.noteData.currentValue.note;
        this.object = changes.noteData.currentValue;
      }
      
      /* //console.log(changes) */
    
  }

  onChanges(evt){
    if(evt.key != "Control" && evt.key != 'Alt' && evt.key != 'Shift'){
      this.subject.next(this.noteData);
    }
    
  }

}
