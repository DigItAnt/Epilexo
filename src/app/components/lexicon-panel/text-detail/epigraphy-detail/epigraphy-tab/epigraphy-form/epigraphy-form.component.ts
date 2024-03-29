﻿/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { AfterViewInit, ApplicationRef, Component, ComponentFactoryResolver, ComponentRef, ContentChild, ElementRef, HostListener, Injector, Input, OnDestroy, OnInit, QueryList, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { NgbPopover, NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { AnnotatorService } from 'src/app/services/annotator/annotator.service';
import { DocumentSystemService } from 'src/app/services/document-system/document-system.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { SearchFormComponent } from './search-form/search-form.component';
declare var $: JQueryStatic;

@Component({
  selector: 'app-epigraphy-form',
  templateUrl: './epigraphy-form.component.html',
  styleUrls: ['./epigraphy-form.component.scss']
})
export class EpigraphyFormComponent implements OnInit, OnDestroy {

  @Input() epiData: any;
  object: any;
  tokenArray: FormArray;
  textEpigraphy = '';
  leidenLines: any;

  epigraphy_text_subscription: Subscription;
  leiden_subscription: Subscription;
  translation_subscription: Subscription;
  delete_annotation_subscription: Subscription;

  private bind_subject: Subject<any> = new Subject();
  searchResults = [];
  memoryForms = [];

  selectedPopover = {
    htmlNodeName: '',
    tokenId: ''
  };

  spanSelection;

  data: object;
  sel_t: object;
  message: string;
  isOpen = false;
  bind = this;
  @ViewChildren('span_modal') spanPopovers: QueryList<any>;
  @ViewChild('search_form') searchForm: SearchFormComponent;

  //@ViewChild('span_modal') spanPopover: ElementRef;



  epigraphyForm = new FormGroup({
    tokens: new FormArray([this.createToken()]),
  })


  multiWordMode = false;
  annotationArray = [];
  token_annotationArray = [];
  epidoc_annotation_array = [];
  leiden_array = [];
  translation_array = [];

  fileId;

  isEmptyFile = false;

  destroy$: Subject<boolean> = new Subject();

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event): void {
    setTimeout(() => {
      try {
        let evtPath = Array.from(event.path);
        let isMultiwordRequest = false;
        evtPath.some((element: HTMLElement) => {
          //console.log(element)
          if (element.classList != undefined) {
            if (element.classList.contains('ok-button')) {
              isMultiwordRequest = true;
              return true;
            } else {
              isMultiwordRequest
              return false;
            }
          } else {
            return false;
          }
        })


        let event_el;

        if (isMultiwordRequest) {
          let multiWordArray = Array.from(document.getElementsByClassName('multiword'));
          multiWordArray.forEach(element => {
            let children = Array.from(element.children);
            children.forEach(subchild => {
              if (subchild.classList.contains('multiword-button')) {
                event_el = element.children
                subchild.remove();
              }
            })
          });
          document.querySelectorAll('.multiword').forEach(element => {
            this.renderer.removeClass(element, 'multiword');
            this.renderer.addClass(element, 'multiword-span-' + 1);

            let prev = element.previousElementSibling;
            let next = element.nextElementSibling;

            if (prev != undefined) {
              if (prev.classList != undefined) {
                let classNames = prev.className;
                let matchTest = /(^|\s)(multiword-span-\d)(\s|$)/.test(classNames)
                if (matchTest) {
                  this.renderer.addClass(element, 'border-left-0')
                }
              }
            } else if (next != undefined) {
              if (next.classList != undefined) {
                let classNames = next.className;
                let matchTest = /(^|\s)(multiword-span-\d)(\s|$)/.test(classNames)
                if (matchTest) {
                  this.renderer.addClass(element, 'border-right-0')
                }
              }
            }
          })

          let position_popover;

          Array.from(event_el).forEach(
            (element: HTMLElement) => {
              position_popover = element.getAttribute('position');
              return;
            }
          )

          this.message = '';

          this.spanPopovers.toArray()[position_popover - 1].open();

          let popover_id = this.spanPopovers.toArray()[position_popover - 1]._ngbPopoverWindowId;
          this.selectedPopover.tokenId = (position_popover - 1).toString();
          this.annotatorService.triggerSearch(null);
          this.selectedPopover.htmlNodeName = popover_id;
          let multiwordSpan = Array.from(document.querySelectorAll("[class*=multiword-span-]"));
          let spansArray = [];
          multiwordSpan.forEach(element => {
            let children = Array.from(element.children);
            children.forEach(
              span => {
                let position = parseInt(span.getAttribute('position'));
                let object = {
                  start: this.object[position - 1].begin,
                  end: this.object[position - 1].end
                }

                spansArray.push(object)
              }
            )
          })

          console.log(spansArray);
          this.spanSelection = spansArray;


        } else {
          if (!this.multiWordMode) {

            //console.log(document.querySelectorAll('.token'))
            document.querySelectorAll('.multiword').forEach(element => {
              this.renderer.removeClass(element, 'multiword')
              this.renderer.removeClass(element, 'border-right-0');
            });
          }
        }
      } catch (error) {
        console.log(error)
      }

    }, 10);
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event): void {

    setTimeout(() => {

      //PREVENIRE CHE I POPOVER SI CHIUDANO SE CLICCATI FUORI DAL COMPONENTE
      let index = this.selectedPopover.tokenId

      //SE IL CLICK AVVIENE FUORI QUESTO COMPONENTE, L'EVENTUALE POPOVER DEVE RESTARE APERTO, 
      //SE SI CLICCA QUESTO COMPONENTE IL POPOVER VA CHIUSO E RIATTIVATO L'AUTOCLOSE
      if (index != '') {
        //console.log(this.config)
        let popover = this.spanPopovers.toArray()[index];
        /*  if (popover.isOpen()) {
           //console.log(popover.isOpen())
           //console.log(popover)
           //popover.autoClose = false;
         } */
      }



    }, 17);

    setTimeout(() => {
      /* console.log(event.path) */
      try {
        let evtPath = Array.from(event.path)
        //console.log(this.selectedPopover.htmlNodeName)

        let htmlNode = document.getElementById(this.selectedPopover.htmlNodeName)
        console.log
        let tokenId = this.selectedPopover.tokenId;
        if (evtPath.includes(htmlNode)) {

        } else {
          if (this.object != null) {
            this.object.forEach(element => {
              //console.log(element.position != tokenId)
              if (element.position != tokenId) {

                element.editing = false;

                this.selectedPopover.htmlNodeName = '';
                this.selectedPopover.tokenId = ''
              }
            });
          }


          let parentMarkElement = document.getElementsByClassName('token-' + tokenId)[0];
          //console.log(document.getElementsByClassName('token-'+tokenId))
          if (parentMarkElement != null) {
            let i = 0;
            Array.from(parentMarkElement.childNodes).forEach(
              element => {
                //              console.log(element)
                let textMarkElement = element.textContent;
                let prev, next;
                if (element['classList'] != undefined) {

                  if (element['classList'].contains('mark') || element['classList'].contains('mark_test')) {

                    prev = Array.from(parentMarkElement.childNodes)[i - 1];
                    next = Array.from(parentMarkElement.childNodes)[i];

                    if (next == element) {
                      next = Array.from(parentMarkElement.childNodes)[i + 1];
                    }

                    if (prev != undefined) {
                      if (prev.nodeName == '#text') {
                        textMarkElement = prev.textContent += textMarkElement;
                        prev.remove();
                      }
                    }

                    if (next != undefined) {
                      if (next.nodeName == '#text') {
                        textMarkElement += next.textContent;
                        next.remove()
                      }
                    }

                    const text = this.renderer.createText(textMarkElement)

                    this.renderer.insertBefore(parentMarkElement, text, element)
                    //this.renderer.removeChild(parentMarkElement, element);

                    element.remove();


                  }
                }

                i++;
              }
            );

          }

        }
      }
      catch (e) {
        console.log(e)
      }

    }, 17);

  }



    /* @HostListener('window:keydown', ['$event'])
    enableMultiword(event: KeyboardEvent) {
    
      if (event.altKey && event.ctrlKey) {
        this.multiWordMode = true;
        if (this.object != undefined) {
          this.object.forEach(element => {
            element.editing = false;
            this.selectedPopover.htmlNodeName = '';
            this.selectedPopover.tokenId = ''
          });
        }

      } else if (event.code == 'Escape') {

        let htmlNode = document.getElementById(this.selectedPopover.htmlNodeName)
        let tokenId = this.selectedPopover.tokenId;

        if (this.object != undefined) {
          this.object.forEach(element => {
            if (element.id != tokenId) {

              element.editing = false;

              this.selectedPopover.htmlNodeName = '';
              this.selectedPopover.tokenId = ''
            }
          });

          let parentMarkElement = document.getElementsByClassName('token-' + tokenId)[0];
          if (parentMarkElement != null) {
            let i = 0;
            Array.from(parentMarkElement.children).forEach(
              element => {
                console.log(element)
                if (element.classList.contains('mark')) {

                  let textMarkElement = element.textContent;
                  const text = this.renderer.createText(textMarkElement)
                  
                  this.renderer.insertBefore(parentMarkElement, text, element)
                  this.renderer.removeChild(parentMarkElement, element);
                  
                  i++;
                  return;
                }
                i++;
              }
            );

          }
        }




      }
    }

    @HostListener('window:keyup', ['$event'])
    disableMultiword(event: KeyboardEvent) {
      if (!event.altKey && !event.ctrlKey) {
        this.multiWordMode = false;
      }
    } */

  constructor(private router: Router, private annotatorService: AnnotatorService, private expander: ExpanderService, private renderer: Renderer2, private documentService: DocumentSystemService, private formBuilder: FormBuilder, private toastr: ToastrService, private lexicalService: LexicalEntriesService, private config: NgbPopoverConfig) {
    /* this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((val) => {
      setTimeout(() => {
        this.lexicalService.sendToCoreTab(null);
        this.documentService.sendToEpigraphyTab(null)
        this.documentService.sendTextToEpigraphyTab(null);
        this.expander.openCollapseEdit(false);
        this.expander.openCollapseEpigraphy(false);
        this.expander.expandCollapseEpigraphy(false);
        this.expander.expandCollapseEdit(false)
      }, 1000);
      
    }) */
  }


  ngOnInit(): void {

    /* this.config.autoClose = false */


    this.epigraphyForm = this.formBuilder.group({
      tokens: this.formBuilder.array([this.createToken()])
    })

    this.epigraphy_text_subscription = this.documentService.epigraphyTextData$.subscribe(
      data => {
        if (data != null) {
          this.textEpigraphy = data;
        } else {
          this.textEpigraphy = '';
        }
      }, error => {
        console.log(error)
      }
    )

    this.leiden_subscription = this.documentService.epigraphyLeidenData$.subscribe(
      data => {
        console.log(data)
        if (data != null) {
          this.leidenLines = data;


        } else {
          this.leidenLines = [];
        }
      }, error => {
        console.log(error)
      }
    )

    this.translation_subscription = this.documentService.epigraphyTranslationData$.subscribe(
      data => {
        console.log(data)
        if (data != null) {
          this.translation_array = data;


        } else {
          this.translation_array = [];
        }
      }, error => {
        console.log(error)
      }
    )



    this.bind_subject.pipe(debounceTime(100), takeUntil(this.destroy$)).subscribe(
      data => {
        /* console.log(data) */
        this.bindSelection(data.popover, data.evt, data.i);
      }
    )

    this.delete_annotation_subscription = this.annotatorService.deleteAnnoReq$.subscribe(
      data => {

        let localArray = [];
        if (data != null) {


          this.annotationArray = this.annotationArray.filter(
            element => {
              return element.id != data.id
            }
          )
          //console.log(this.annotationArray)

          if (this.object != undefined) {
            this.object.forEach(element => {
              if (element.id == data.node_id) {
                /* let position = element.position;
  
                let elementHTML = document.getElementsByClassName('token-'+(position-1))[0]
                this.renderer.removeClass(elementHTML, 'annotation'); */

                let start = element.begin;
                let end = element.end;

                this.annotationArray.forEach(element => {
                  if (element.spans[0].start >= start && element.spans[0].end <= end) {
                    localArray.push(element);
                  }
                })

                console.log(localArray, localArray.length);

                if (localArray.length == 0) {
                  let position = element.position;
                  let elementHTML = document.getElementsByClassName('token-' + (position - 1))[0]
                  this.renderer.removeClass(elementHTML, 'annotation');
                }
              }
            });
          }

        }
      }
    )

  }


  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (changes.epiData.currentValue != null) {
        if (this.object != changes.epiData.currentValue) {
          this.tokenArray = this.epigraphyForm.get('tokens') as FormArray;
          this.tokenArray.clear();
          this.spanSelection = null;
          this.annotationArray = [];
          this.epidoc_annotation_array = [];
        }

        this.object = changes.epiData.currentValue['tokens'];
        this.getAnnotations(changes);

      } else {
        this.object = null;
      }



    }, 10)

  }

  async getAnnotations(changes) {

    let element_id = changes.epiData.currentValue['element_id']
    this.fileId = changes.epiData.currentValue['epidoc_id']
    let xmlDoc = changes.epiData.currentValue['xmlDoc']
    console.log(this.object)

    if (this.object.length == 0) {
      this.isEmptyFile = true;
      console.log("FILE VUOTO")
    } else {
      this.isEmptyFile = false;
      console.log("FILE NON VUOTO")
    }

    //console.log(this.object)

    try {
      let get_anno_req = await this.annotatorService.getAnnotation(element_id).toPromise();
      console.log(get_anno_req);

      if (get_anno_req.annotations != undefined) {
        get_anno_req.annotations.forEach(element => {
          //console.log(element)
          if (element.layer == 'attestation') {
            if (element.attributes.bibliography == undefined) {
              element.attributes['bibliography'] = [];
            }

            if (!Array.isArray(element.attributes.bibliography)) {
              let tmp_arr = [];
              tmp_arr.push(element.attributes['bibliography']);
              element.attributes['bibliography'] = tmp_arr;
            }


            if (Array.isArray(element.attributes['bibliography'])) {
              Array.from(element.attributes['bibliography']).forEach(element => {

                if (element['note'] == undefined) {
                  element['note'] = "";
                }

                if (element['textualRef'] == undefined) {
                  element['textualRef'] = "";
                }
              });
            }

            if (this.isEmptyFile) {
              element['empty_file'] = this.isEmptyFile;
              if (element.attributes.leiden == undefined) {
                element.attributes.leiden = '';
              }
            } else {
              element['empty_file'] = this.isEmptyFile;
            }
            this.annotationArray.push(element);
          } else if (element.layer == 'epidoc') {
            this.epidoc_annotation_array.push(element);
          }
        });

        if (this.annotationArray.length > 0) {
          if (this.object != null) {
            for (const element of this.object) {
              let startElement = element.begin;
              let endElement = element.end;

              
              for (const annotation of this.annotationArray) {

                
                  if (annotation.spans.length == 1) {
                    let startAnnotation = annotation.spans[0].start;
                    let endAnnotation = annotation.spans[0].end;
  
                    if (startAnnotation >= startElement && endAnnotation <= endElement) {
                      let positionElement = element.position;
                      let elementHTML = document.getElementsByClassName('token-' + (positionElement - 1))[0]
                      var that = this;
  
                      let xmlNode = xmlDoc.querySelectorAll('[*|id=\'' + element.xmlid + '\']')[0].outerHTML;
                      let object = {
                        xmlString: xmlNode
                      }

                      if (elementHTML != undefined) {
                        that.renderer.addClass(elementHTML, 'annotation');
                      }
                      
                      if(annotation.attributes.leiden == undefined){
                        try {
                          let convert_to_leiden = await this.documentService.testConvertItAnt(object).toPromise();
                          console.log(convert_to_leiden);
                          let raw = convert_to_leiden['xml'];
                          let bodyResponse = new DOMParser().parseFromString(raw, "text/html").body;
                          let leidenToken = '';
                          bodyResponse.childNodes.forEach(
                            x => {
                              if (x.nodeName != undefined) {
                                if (x.nodeName == '#text') {
                                  leidenToken += x.nodeValue.replace('\n', '');
                                }
                              }
                            }
                          )
    
                          //TODO: check leiden
                          if (leidenToken != '') {
                            annotation.attributes['leiden'] = leidenToken;
                          } else {
                            annotation.attributes['leiden'] = '';
                          }
                          
                        } catch (error) {
    
                        }
                      }
                      
  
  
  
  
                    }
                  }
                
                
              }
            }

            this.lexicalService.triggerAttestationPanel(true);
            this.lexicalService.sendToAttestationPanel(this.annotationArray);
          }
        } else {
          this.annotationArray = [];
          this.lexicalService.triggerAttestationPanel(false);
          this.lexicalService.sendToAttestationPanel(null);
        }
      } else {
        this.annotationArray = [];
        this.epidoc_annotation_array = [];
        this.lexicalService.triggerAttestationPanel(null);
        this.lexicalService.sendToAttestationPanel(null);
      }
    } catch (error) {
      if (error.status != 200) {
        this.toastr.error("Something went wrong", "Error", { timeOut: 5000 })
      }
    }
  }


  createToken(token?) {
    if (token != undefined) {
      return this.formBuilder.group({
        entity: new FormControl(token)
      })
    } else {
      return this.formBuilder.group({
        entity: new FormControl('')
      })
    }
  }

  enterCell(evt, i) {
    //console.log("enter cell " + i);
    //console.log(evt);
    if (evt.target.innerText != '.' && evt.target.innerText != ':' && evt.target.innerText != '') {
      let parentNode = evt.target.parentElement
      if (parentNode != undefined) {
        let classNames = parentNode.className;
        let matchTest = /(^|\s)(multiword-span-\d)(\s|$)/.test(classNames)
        if (matchTest) {

        } else {
          this.object[i]['selected'] = true;

          if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
              window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
              window.getSelection().removeAllRanges();
            }
          }
        }
      }
    }




  }

  leavingCell(evt, i) {
    //console.log("leaving cell " + i);
    this.object[i]['selected'] = false;

  }

  deleteSelection(popover, evt, i) {
    setTimeout(() => {

    }, 10);
    let popoverHtml = popover._elementRef.nativeElement;
    //console.log(popoverHtml.querySelectorAll('.annotation'))
    if (popoverHtml.querySelectorAll('.annotation').length > 0) {

    } else {
      popoverHtml.textContent = popoverHtml.textContent.trim();
    }


  }

  triggerBind(popover, evt, i) {
    if (!this.multiWordMode) {
      if (evt.target.innerText != '.' && evt.target.innerText != ':' && evt.target.innerText != '') {
        this.bind_subject.next({ popover, evt, i })
      }

    } else {
      //console.log("multiword mode", i)
      console.log(popover);
      this.multiWordCreator(popover, evt, i);
    }
  }


  multiWordCreator(popover, evt, i) {
    let span = popover._elementRef.nativeElement.parentNode.parentNode.childNodes[i];
    let prevSibling, nextSibling;
    prevSibling = popover._elementRef.nativeElement.parentNode.previousSibling;
    nextSibling = popover._elementRef.nativeElement.parentNode.nextSibling;



    if (span.classList.contains('multiword')) {
      this.renderer.removeClass(span, 'multiword')
      if (prevSibling != null) {
        if (prevSibling.classList.contains('multiword')) {
          this.renderer.removeClass(prevSibling, 'border-right-0')
        }
      }
      if (nextSibling != null) {
        if (nextSibling.classList != undefined) {
          if (nextSibling.classList.contains('multiword')) {
            this.renderer.removeClass(span, 'border-right-0')
          }
        }

      }
      let multiWordArray = Array.from(document.getElementsByClassName('multiword'));
      multiWordArray.forEach(element => {
        let children = Array.from(element.children);
        children.forEach(subchild => {
          if (subchild.classList.contains('multiword-button')) {
            subchild.remove();
          }
        })
      });

      if (multiWordArray.length > 1) {
        console.log(multiWordArray[multiWordArray.length - 1])
        this.createDynamicButtons(multiWordArray[multiWordArray.length - 1]);
      }


    } else {
      this.renderer.addClass(span, 'multiword');
      if (prevSibling != null) {
        if (prevSibling.classList.contains('multiword')) {
          this.renderer.addClass(prevSibling, 'border-right-0');
        }
      }
      if (nextSibling != null) {
        if (nextSibling.classList != undefined) {
          if (nextSibling.classList.contains('multiword')) {
            this.renderer.addClass(span, 'border-right-0')
          }
        }
      }
      let multiWordArray = Array.from(document.getElementsByClassName('multiword'));
      multiWordArray.forEach(element => {
        let children = Array.from(element.children);
        children.forEach(subchild => {
          if (subchild.classList.contains('multiword-button')) {
            subchild.remove();
          }
        })
      });

      if (multiWordArray.length > 1) {
        this.createDynamicButtons(span);
      } else if (multiWordArray.length == 1) {
        multiWordArray.forEach(element => {
          let children = Array.from(element.children);
          children.forEach(subchild => {
            if (subchild.classList.contains('multiword-button')) {
              subchild.remove();
            }
          })
        });
      }
    }

  }

  createDynamicButtons(span) {
    let div = this.renderer.createElement('div');
    this.renderer.addClass(div, 'multiword-button');
    let okButton = this.renderer.createElement('button');
    let leaveButton = this.renderer.createElement('button');

    let okIcon = this.renderer.createElement('i');
    this.renderer.addClass(okIcon, 'fas');
    this.renderer.addClass(okIcon, 'fa-check');

    let leaveIcon = this.renderer.createElement('i');
    this.renderer.addClass(leaveIcon, 'fas');
    this.renderer.addClass(leaveIcon, 'fa-times');

    this.renderer.appendChild(okButton, okIcon);
    this.renderer.appendChild(leaveButton, leaveIcon);
    this.renderer.setStyle(okButton, 'position', 'absolute');
    this.renderer.setStyle(okButton, 'top', '-1.5rem');
    this.renderer.setStyle(okIcon, 'font-size', '10px');
    this.renderer.setStyle(okIcon, 'width', '10px');

    this.renderer.addClass(okButton, 'ok-button');
    this.renderer.addClass(leaveButton, 'no-button')

    this.renderer.setStyle(leaveButton, 'position', 'absolute');
    this.renderer.setStyle(leaveButton, 'top', '-1.5rem');
    this.renderer.setStyle(leaveIcon, 'font-size', '10px');
    this.renderer.setStyle(leaveIcon, 'width', '10px');
    this.renderer.setStyle(leaveButton, 'left', '1.5rem');

    this.renderer.appendChild(div, okButton)
    this.renderer.appendChild(div, leaveButton)
    this.renderer.appendChild(span, div);
  }

  populateLocalAnnotation(tokenData) {
    this.token_annotationArray = [];
    //console.log(anno)
    this.annotationArray.forEach(
      annotation => {
        //console.log(annotation)
        let start_token, end_token;
        if (!this.isEmptyFile) {
          start_token = tokenData.begin;
          end_token = tokenData.end;
        } else {
          start_token = tokenData.spans[0].start;
          end_token = tokenData.spans[0].end;
        }

        annotation.spans.forEach(element => {
          if (element.start >= start_token && element.end <= end_token) {
            this.token_annotationArray.push(annotation);
          }
        });


      }
    )
    if (this.token_annotationArray.length > 0) {
      this.lexicalService.triggerAttestationPanel(true);
      this.lexicalService.sendToAttestationPanel(this.token_annotationArray)
    }
  }

  bindSelection(popover, evt, i) {

    console.log(this.object[i])
    this.token_annotationArray = [];
    this.annotationArray.forEach(
      annotation => {

        let start_token = this.object[i].begin;
        let end_token = this.object[i].end;

        //console.log(annotation.spans)

        if (annotation.spans.length == 1) {
          annotation.spans.forEach(element => {
            if (element.start >= start_token && element.end <= end_token) {
              this.token_annotationArray.push(annotation);
            }
          });
        } else {

        }
      }
    )

    if (this.token_annotationArray.length > 0) {
      this.lexicalService.triggerAttestationPanel(true)
      this.lexicalService.sendToAttestationPanel(this.token_annotationArray);
    } else {
      this.lexicalService.triggerAttestationPanel(false)
      this.lexicalService.sendToAttestationPanel(null);
    }

    //console.log(evt)
    setTimeout(() => {

      this.message = '';
      this.object[i]['editing'] = true;
      this.message = window.getSelection().toString();
      if (this.selectedPopover.htmlNodeName == '') {
        this.selectedPopover.htmlNodeName = popover._ngbPopoverWindowId;
        this.selectedPopover.tokenId = i;
      }
      else if (popover._ngbPopoverWindowId != this.selectedPopover) {
        this.selectedPopover.htmlNodeName = popover._ngbPopoverWindowId
        this.selectedPopover.tokenId = i
        this.object.forEach(element => {
          if (element.id != i + 1) {
            //console.log(element)
            element.editing = false;
          } else {
            //console.log(element)
            element.editing = true;
          }
        });
      }

      if (popover.isOpen()) {

      } else if (!popover.isOpen()) {
        popover.open()
      }

      let popoverHtml = popover._elementRef.nativeElement;
      let innerText = popoverHtml.innerText;
      let selection = document.getSelection();
      let anchorNode = selection.anchorNode;
      let focusNode = selection.focusNode;
      let isThereMark, areThereAnnotations;
      //isThereMark = popoverHtml.querySelectorAll('.mark').length > 0;
      //areThereAnnotations = popoverHtml.querySelectorAll('.annotation').length > 0;

      if (anchorNode != null && focusNode != null) {
        let anchorNodeParent = selection.anchorNode.parentNode;
        let focusNodeParent = selection.focusNode.parentNode;

        if (anchorNodeParent == focusNodeParent && this.message != '') { /* && !areThereAnnotations */
          //SE SELEZIONO UNA PARTE DEL TOKEN

          if (selection.anchorNode.textContent.trim().length == innerText.length && this.message != innerText) { //!isThereMark && 

            let anchorOffset = selection.anchorOffset;
            let focusOffset = selection.focusOffset;


            if (anchorOffset > focusOffset) {
              let tmp = anchorOffset;
              anchorOffset = focusOffset;
              focusOffset = tmp;
            }

            //console.log(innerText.substring(anchorOffset, focusOffset))
            console.log(anchorOffset)
            console.log(focusOffset);

            popoverHtml.innerText = "";

            const span = this.renderer.createElement('span');
            const l_text = this.renderer.createText(innerText.substring(0, anchorOffset))
            const text = this.renderer.createText(this.message);
            const r_text = this.renderer.createText(innerText.substring(focusOffset, innerText.length))


            /* console.log("l_text:", l_text)
            console.log("text:", text)
            console.log("r_text:", r_text) */


            this.renderer.appendChild(span, text)
            this.renderer.appendChild(popoverHtml, span);
            this.renderer.addClass(span, 'mark'),
              this.renderer.setAttribute(span, 'startoffset', anchorOffset.toString());
            this.renderer.setAttribute(span, 'endoffset', focusOffset.toString())

            if (l_text.textContent != "") {
              this.renderer.insertBefore(popoverHtml, l_text, span);
            }

            if (r_text.textContent != "") {
              this.renderer.appendChild(popoverHtml, r_text);
            }
            //console.log(popoverHtml.childNodes)
            this.spanSelection = {}
            this.spanSelection['start'] = this.object[i].begin + anchorOffset;
            this.spanSelection['end'] = this.object[i].begin + focusOffset;
            this.annotatorService.triggerSearch(this.message);
          } else if (selection.anchorNode.textContent.trim().length == innerText.length && this.message == innerText) {
            this.message = '';
            this.annotatorService.triggerSearch(innerText);
          }
        }
        //SE SELEZIONO L'INTERO TOKEN

        else if (this.message == '') {
          this.annotatorService.triggerSearch(innerText);
          this.spanSelection = {}
          this.spanSelection['start'] = 0;
          this.spanSelection['end'] = 0;
        }

      }




      let parentNode = evt.target.parentElement;
      let classNames = parentNode.className;

      if (/(^|\s)(multiword-span-\d)(\s|$)/.test(classNames)) {
        let multiwordSpan = Array.from(document.querySelectorAll("[class*=multiword-span-]"));
        let text = '';
        multiwordSpan.forEach(element => {
          console.log(element)
          text += element.textContent + ' ';
        })
        //this.annotatorService.triggerSearch(text);
      }
    }, 10);

  }

  triggerEmptySearch() {
    this.annotatorService.triggerSearch('');
  }

  async deleteAnnotation(annotation, index, token) {
    let anno_id = annotation.id;
    let token_position = token.position;

    try {
      let delete_anno_req = await this.annotatorService.deleteAnnotation(anno_id).toPromise();
      console.log(delete_anno_req);

      this.token_annotationArray.splice(index, 1)
      this.annotationArray.splice(index, 1);
      this.lexicalService.triggerAttestationPanel(false)
    } catch (error) {
      if (error.status == 200) {
        this.token_annotationArray.splice(index, 1)
        this.annotationArray.splice(index, 1);
      } else {
        this.toastr.error("Something went wront, check the log", "Error", { timeOut: 5000 })
      }
    }


  }


  showAllAnnotations() {
    this.lexicalService.triggerAttestationPanel(true)
    this.lexicalService.sendToAttestationPanel(this.annotationArray);
  }

  replaceBetween(origin, startIndex, endIndex, insertion) {
    return origin.substring(0, startIndex) + insertion + origin.substring(endIndex);
  }


  ngOnDestroy() {
    this.epigraphy_text_subscription.unsubscribe();
    this.leiden_subscription.unsubscribe();
    this.translation_subscription.unsubscribe();
    this.delete_annotation_subscription.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

