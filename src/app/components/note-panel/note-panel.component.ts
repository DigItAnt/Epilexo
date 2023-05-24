/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ConceptService } from 'src/app/services/concept/concept.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-note-panel',
  templateUrl: './note-panel.component.html',
  styleUrls: ['./note-panel.component.scss']
})
export class NotePanelComponent implements OnInit, OnChanges, OnDestroy {

  @Input() noteData: string;
  object: any;
  private subject: Subject<string> = new Subject();

  note_subscription: Subscription;
  lex_entry_update_subscription: Subscription;
  form_update_subscription: Subscription;
  sense_update_subscription: Subscription;
  etymology_update_subscription: Subscription;

  destroy$ : Subject<boolean> = new Subject();

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    /* //console.log(event) */
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  htmlContent: '';
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
  constructor(private lexicalService: LexicalEntriesService, 
              private toastr: ToastrService,
              private conceptService : ConceptService) { }

  ngOnInit(): void {
    this.editorConfig.editable = false;


    this.subject.pipe(debounceTime(1000), takeUntil(this.destroy$)).subscribe(
      newNote => {
        if (this.noteData != null) {
          this.lexicalService.spinnerAction('on');
          console.log(this.object)
          //console.log(this.object)
          if (this.object.lexicalEntry != undefined && this.object.form == undefined && this.object.sense == undefined) {
            var lexId = this.object.lexicalEntry;
            var parameters = {
              relation: "http://www.w3.org/2004/02/skos/core#note",
              value: newNote
            }
            this.lexicalService.updateLexicalEntry(lexId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
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
                this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
                this.lexicalService.spinnerAction('off');
                if(error.status != 200){
                  this.toastr.error(error.error, '', {
                    timeOut: 5000,
                  });
                }else if(error.status == 200){
                  this.toastr.success('Note updated', '', {
                    timeOut: 5000,
                  });
                }
                
              }
            )
          } else if (this.object.form != undefined) {
            var formId = this.object.form;
            var parameters = {
              relation: "http://www.w3.org/2004/02/skos/core#note",
              value: newNote
            }
            this.lexicalService.updateForm(formId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
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
                this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              }
            )
          } else if (this.object.sense != undefined) {
            var senseId = this.object.sense;
            var parameters = {
              relation: "http://www.w3.org/2004/02/skos/core#note",
              value: newNote
            }
            this.lexicalService.updateSense(senseId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
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
                this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
                this.lexicalService.spinnerAction('off');
                this.toastr.success('Note updated', '', {
                  timeOut: 5000,
                });
              }
            )
          } else if (this.object.etymology != undefined) {
            var etymId = this.object.etymology;
            var parameters = {
              relation: "http://www.w3.org/2004/02/skos/core#note",
              value: newNote
            }
            this.lexicalService.updateEtymology(etymId, parameters).pipe(takeUntil(this.destroy$)).subscribe(
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
                this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
                this.lexicalService.spinnerAction('off');
                if(error.status == 200){
                  this.toastr.success('Note updated', '', {
                    timeOut: 5000,
                  });
                }
                
              }
            )
          }else if(this.object.lexicalConcept !=undefined){
            let lexicalConceptID = this.object.lexicalConcept;

            let parameters = {
              relation: "http://www.w3.org/2004/02/skos/core#note",
              source: this.object.lexicalConcept,
              target: newNote,
              oldTarget: this.object.note ,
              targetLanguage: this.object.language,
              oldTargetLanguage : this.object.language
            }
    
    
            this.conceptService.updateNoteProperty(parameters).pipe(takeUntil(this.destroy$)).subscribe(
              data=> {
                console.log(data)
              }, error=> {
                console.log(error);
                
                //this.lexicalService.changeDecompLabel(next)
                if (error.status != 200) {
                    this.toastr.error(error.error, 'Error', {
                        timeOut: 5000,
                    });
                } else {
                  
                  this.lexicalService.spinnerAction('off');
                  this.lexicalService.updateCoreCard({ lastUpdate: error.error.text });
                  this.toastr.success('Definition changed correctly for ' + this.object.lexicalConcept, '', {
                      timeOut: 5000,
                  });

                  this.object.note = newNote;
                }
              }
            )

          } 
        }
      }
    )

    this.lexicalService.deleteReq$.pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        this.editorConfig.editable = false;
        this.noteData = null;
        this.object = null;
      }
    )
  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes.noteData.currentValue == null) {
      this.editorConfig.editable = false;
      this.noteData = null;
      this.object = null;
    } else {
      this.editorConfig.editable = true;
      this.noteData = changes.noteData.currentValue.note;
      /* if(changes.noteData.currentValue.lexicalConcept){
        this.noteData = '';
      } */
      this.object = changes.noteData.currentValue;
    }

    /* //console.log(changes) */

  }

  onChanges(evt) {
    if (evt.key != "Control" && evt.key != 'Alt' && evt.key != 'Shift') {
      this.subject.next(this.noteData);
    }

  }

  ngOnDestroy(): void {
   
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
