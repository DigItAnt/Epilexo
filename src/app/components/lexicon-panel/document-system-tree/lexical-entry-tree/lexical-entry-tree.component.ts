/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { ApplicationRef, Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { TreeNode, TreeModel, TREE_ACTIONS, KEYS, IActionMapping, ITreeOptions, ITreeState } from '@circlon/angular-tree-component';
import { formTypeEnum, LexicalEntryRequest, searchModeEnum, typeEnum } from './interfaces/lexical-entry-interface'
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { FormControl, FormGroup } from '@angular/forms';
import { ContextMenuComponent } from 'ngx-contextmenu';

import * as _ from 'underscore';
declare var $: JQueryStatic;


import { debounceTime } from 'rxjs/operators';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';


const actionMapping: IActionMapping = {
  mouse: {

    dblClick: (tree, node, $event) => {
      if (node.hasChildren) {
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      }
    },
    click: (tree, node, $event) => {

      TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);
      TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
    },
    contextMenu: (tree, node, $event) => {

      TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);
      TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
    },
  }
};

@Component({
  selector: 'app-lexical-entry-tree',
  templateUrl: './lexical-entry-tree.component.html',
  styleUrls: ['./lexical-entry-tree.component.scss']
})

export class LexicalEntryTreeComponent implements OnInit {
  state!: ITreeState;
  show = false;
  modalShow = false;
  flagAuthor = false;
  searchIconSpinner = false;
  viewPort: any;
  titlePopover = "Search examples"
  popoverWildcards = "<span><b>Multiple character wildcard search:</b></span>&nbsp;<span><i>te*</i></span><br><span><b>Single character wildcard search:</b></span>&nbsp;<span><i>te?t</i></span><br> <b>Fuzzy search:</b></span>&nbsp;<span><i>test~</i></span><br><b>Weighted fuzzy search:</b></span>&nbsp;<span><i>test~0.8</i></span>"
  labelView = true;
  idView = false;
  offset = 0;
  limit = 500;
  interval;

  @ViewChild(ContextMenuComponent) public basicMenu: ContextMenuComponent;
  /* sub : Subscription; */

  counter = 0;

  @Input() triggerShowTree: any;
  @ViewChild('lexicalEntry') lexicalEntryTree: any;

  nodes;
  languages;
  types;
  authors;
  partOfSpeech;
  selectedNodeId;
  status = [{ "label": "false", "count": 0 }, { "label": "true", "count": 0 }];
  parameters: LexicalEntryRequest = {
    text: "",
    searchMode: searchModeEnum.startsWith,
    type: "",
    pos: "",
    formType: "entry",
    author: "",
    lang: "",
    status: "",
    offset: this.offset,
    limit: this.limit
  }


  options: ITreeOptions = {
    useVirtualScroll: true,
    scrollOnActivate: false,
    nodeHeight: 13,
    actionMapping,
    getChildren: this.getChildren.bind(this)
  };


  filterForm = new FormGroup({
    text: new FormControl(''),
    searchMode: new FormControl('startsWith'),
    type: new FormControl(''),
    pos: new FormControl(''),
    formType: new FormControl('entry'),
    author: new FormControl(''),
    lang: new FormControl(''),
    status: new FormControl('')
  });

  initialValues = this.filterForm.value;

  copySubject: Subject<string> = new Subject();

  constructor(private expander: ExpanderService, private renderer: Renderer2, private element: ElementRef, private lexicalService: LexicalEntriesService, private toastr: ToastrService) {

    var refreshTooltip = setInterval((val) => {
      //console.log('called'); 
      //@ts-ignore
      $('.lexical-tooltip').tooltip('disable');
      //@ts-ignore
      $('.lexical-tooltip').tooltip('enable');
      //@ts-ignore
      $('.note-tooltip').tooltip('disable');
      //@ts-ignore
      $('.note-tooltip').tooltip('enable');
    }, 2000)
  }

  ngOnInit(): void {

    this.viewPort = this.element.nativeElement.querySelector('tree-viewport');
    this.renderer.addClass(this.viewPort, 'search-results');

    this.onChanges();

    this.lexicalService.deleteReq$.subscribe(
      signal => {

        ////console.log("richiesta eliminazione lexical entry");
        if (signal != null) {
          this.lexEntryDeleteReq(signal);
        }

      }
    )

    this.lexicalService.addSubReq$.subscribe(
      signal => {

        if (signal != null) {
          this.addSubElement(signal)
        }
      }
    )

    this.copySubject.pipe(debounceTime(500)).subscribe(v => {
      let selBox = document.createElement('textarea');
      selBox.style.position = 'fixed';
      selBox.style.left = '0';
      selBox.style.top = '0';
      selBox.style.opacity = '0';
      selBox.value = v;
      document.body.appendChild(selBox);
      selBox.focus();
      selBox.select();
      document.execCommand('copy');
      document.body.removeChild(selBox);

      this.toastr.info('URI copied', 'Info', {
        timeOut: 5000,
      });
    })

    this.lexicalService.refreshFilter$.subscribe(
      signal => {

        if (signal != null) {

          this.lexicalService.getLexicalEntriesList(this.parameters).subscribe(
            data => {
              this.counter = data['totalHits'];
            },
            error => {
              //console.log(error)
            }
          );


          this.lexicalService.getLanguages().subscribe(
            data => {

              this.languages = data;
            }
          );

          this.lexicalService.getTypes().subscribe(
            data => {
              this.types = data;
            }
          );

          this.lexicalService.getAuthors().subscribe(
            data => {
              this.authors = data;
            }
          );

          this.lexicalService.getPos().subscribe(
            data => {
              this.partOfSpeech = data;
            }
          )

          this.lexicalService.getStatus().subscribe(
            data => {
              this.status = data;
            }
          )


        }
      }
    )

    /* //console.log(this.parameters) */
    this.lexicalService.getLexicalEntriesList(this.parameters).subscribe(
      data => {
        this.nodes = data['list'];
        this.counter = data['totalHits'];
      },
      error => {
        //console.log(error)
      }
    );

    this.lexicalService.getLanguages().subscribe(
      data => {
        this.languages = data;
      }
    );

    this.lexicalService.getTypes().subscribe(
      data => {
        this.types = data;
      }
    );

    this.lexicalService.getAuthors().subscribe(
      data => {
        this.authors = data;
      }
    );

    this.lexicalService.getPos().subscribe(
      data => {
        this.partOfSpeech = data;
      }
    )

    this.lexicalService.getStatus().subscribe(
      data => {
        this.status = data;
      }
    )
  }

  onChanges() {
    this.filterForm.valueChanges.pipe(debounceTime(500)).subscribe(searchParams => {
      this.offset = 0;
      this.lexicalEntriesFilter(searchParams);
    })
  }

  addSubElement(signal?) {

    setTimeout(() => {
      let instanceName;
      let lex = signal.lex;
      let data = signal.data;
      console.log(lex)
      console.log(data)
      switch (lex.request) {
        case 'form': instanceName = 'formInstanceName'; break;
        case 'sense': instanceName = 'senseInstanceName'; break;
        case 'etymology': instanceName = 'etymologyInstanceName'; break;
        case 'subterm': instanceName = 'lexicalEntryInstanceName'; break;
        case 'constituent': instanceName = 'componentInstanceName'; break;
      }
      this.lexicalEntryTree.treeModel.getNodeBy(x => {
        if (lex.lexicalEntryInstanceName != undefined) {
          if (x.data.lexicalEntryInstanceName === lex.lexicalEntryInstanceName) {
            if (x.data.children == undefined && !x.isExpanded) {
              x.expand();
              var that = this;
              this.interval = setInterval((val) => {
                if (x.data.children != undefined) {
                  this.lexicalEntryTree.treeModel.getNodeBy(y => {
                    if (y.data[instanceName] != undefined) {
                      /* console.log(y.data[instanceName]) */
                      if (y.data['creator'] == x.data.creator) {
                        y.data['flagAuthor'] = false;
                      } else {
                        y.data['flagAuthor'] = true;
                      }
                      if (y.data[instanceName] === data[instanceName]) {
                        y.setActiveAndVisible();
                        clearInterval(that.interval)
                        return true;
                      } else {
                        return false;
                      }
                    } else {
                      return false;
                    }
                  })
                }
              }, 3000)

            } else if (x.data.children != undefined) {
              let checkExistence = x.data.children.filter(element => {
                return element.label === lex.request
              });
              if (checkExistence.length == 1) {
                x.data.children.filter(element => {
                  if (element.label === lex.request) {
                    if (lex.request == 'sense') {
                      data['label'] = 'no definition'
                      data['definition'] = 'no definition'
                    } else if (lex.request == 'etymology') {
                      data['label'] = "Etymology of: " + lex.parentNodeLabel;
                      console.log(data['label'])
                    } else if (lex.request == 'subterm') {
                      data.label = data.label;
                      data.children = null;
                      data.hasChildren = false;
                    } else if (lex.request == 'constituent') {
                      data.label = '';
                      data.children = null;
                      data.hasChildren = false;
                    } else {
                      data['label'] = data[instanceName];
                    }
                    /* console.log(data['creator'] == x.data.creator);
                    console.log(data['creator'], x.data.creator) */

                    if (data['creator'] == x.data.creator) {
                      data['flagAuthor'] = false;
                    } else {
                      data['flagAuthor'] = true;
                    }

                    element.count++;
                    element.children.push(data);
                    this.lexicalEntryTree.treeModel.update();
                    this.lexicalEntryTree.treeModel.getNodeBy(y => {
                      if (y.data.etymology == undefined && y.data.label === data['label'] && lex.request != 'subterm') {
                        y.setActiveAndVisible();
                      } else if (y.data.etymology != undefined && y.data.etymologyInstanceName === data['etymologyInstanceName'] && lex.request != 'subterm') {
                        y.setActiveAndVisible();
                      }
                    })
                    return true;
                  } else {
                    return false;
                  }
                });
              } else if (checkExistence.length == 0) {
                let node = {
                  hasChildren: true,
                  label: lex.request,
                  children: [],
                  count: 0
                }
                x.data.children.push(node);
                x.data.children.sort(function (a, b) {
                  var textA = a.label.toUpperCase();
                  var textB = b.label.toUpperCase();
                  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                })
                this.lexicalEntryTree.treeModel.update();
                x.data.children.filter(element => {
                  if (element.label === lex.request) {
                    console.log(data['creator'], x.data.reator)
                    if (data['creator'] == x.data.creator) {
                      data['flagAuthor'] = false;
                    } else {
                      data['flagAuthor'] = true;
                    }
                    
                    if (lex.request == 'sense') {
                      data['definition'] = 'no definition';
                      data.label = 'no definintion'
                    }else if (lex.request == 'subterm') {
                      data.label = data.label;
                      data.children = null;
                      data.hasChildren = false;
                    }else{
                      data['label'] = data[instanceName];
                    }

                    if (lex.request == 'subterm') {
                      data.children == null;
                      data.hasChildren = false;
                      data.label = data.label;
                    }

                    if (lex.request == 'constituent') {
                      data.children == null;
                      data.label = '';
                    }

                    element.count++;
                    element.children.push(data);
                    this.lexicalEntryTree.treeModel.update();
                    this.lexicalEntryTree.treeModel.getNodeBy(y => {
                      if (y.data.label === data['label']  && lex.request != 'subterm') { /* && lex.request != 'subterm' */
                        y.setActiveAndVisible();
                      }
                    })
                    return true;
                  } else {
                    return false;
                  }
                });
              }
            } else {
              return false;
            }
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
    }, 300);
  }

  lexEntryDeleteReq(signal?) {


    setTimeout(() => {

      this.lexicalEntryTree.treeModel.getNodeBy(x => {
        if (signal.lexicalEntryInstanceName != undefined) {
          if (x.data.lexicalEntryInstanceName === signal.lexicalEntryInstanceName) {

            x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1);

            let countSubterm = x.parent.data.count;
            if (countSubterm != 0) {
              x.parent.data.count--;
              countSubterm--;
            }

            //this.lexicalEntryTree.treeModel.update();
            if (this.nodes.length == 0) {
              this.lexicalEntriesFilter(this.parameters);
            }



            if (countSubterm == 0) {
              x.parent.parent.data.children.splice(x.parent.parent.data.children.indexOf(x.parent.data), 1)
            }
            console.log(x.parent)

            this.lexicalEntryTree.treeModel.update()

            return true;
          } else {
            return false;
          }
        } else if (signal.formInstanceName != undefined) {
          if (x.data.formInstanceName === signal.formInstanceName) {

            x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1);
            let countForm = x.parent.data.count;
            if (countForm != 0) {
              x.parent.data.count--;
              countForm--;
            }

            if (countForm == 0) {
              x.parent.parent.data.children.splice(x.parent.parent.data.children.indexOf(x.parent.data), 1)
            }
            console.log(x.parent)

            this.lexicalEntryTree.treeModel.update()

            return true;
          } else {
            return false;
          }
        } else if (signal.senseInstanceName != undefined) {
          if (x.data.senseInstanceName === signal.senseInstanceName) {

            x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1);
            let countSense = x.parent.data.count;
            if (countSense != 0) {
              x.parent.data.count--;
              countSense--;
            }

            if (countSense == 0) {
              x.parent.parent.data.children.splice(x.parent.parent.data.children.indexOf(x.parent.data), 1)
            }
            console.log(x.parent)

            this.lexicalEntryTree.treeModel.update()

            return true;
          } else {
            return false;
          }
        } else if (signal.etymology != undefined) {
          if (x.data.etymologyInstanceName === signal.etymology.etymologyInstanceName) {
            x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1);
            let countSense = x.parent.data.count;
            if (countSense != 0) {
              x.parent.data.count--;
              countSense--;
            }

            if (countSense == 0) {
              x.parent.parent.data.children.splice(x.parent.parent.data.children.indexOf(x.parent.data), 1)
            }
            console.log(x.parent)

            this.lexicalEntryTree.treeModel.update()

            return true;
          } else {
            return false;
          }
        } else if (signal.componentInstanceName != undefined) {
          if (x.data.componentInstanceName === signal.componentInstanceName) {
            x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1);
            let countSense = x.parent.data.count;
            if (countSense != 0) {
              x.parent.data.count--;
              countSense--;
            }

            if (countSense == 0) {
              x.parent.parent.data.children.splice(x.parent.parent.data.children.indexOf(x.parent.data), 1)
            }
            console.log(x.parent)

            this.lexicalEntryTree.treeModel.update()

            return true;
          } else {
            return false;
          }
        } else if(signal.subtermInstanceName != undefined){
          let parent = signal.parentNodeInstanceName;
          if(x.data.lexicalEntryInstanceName == signal.parentNodeInstanceName ){
            console.log(x)
            let children = x.data.children;

            if(children.length >= 1){
              Array.from(children).forEach((y : any) => {
                if(y.lexicalEntryInstanceName == signal.subtermInstanceName){
                
                  console.log(y, x)

                  x.data.children.splice(x.data.children.indexOf(y), 1);

                  let countSubterm = x.data.count;
                  if (countSubterm != 0) {
                    x.data.count--;
                    countSubterm--;
                  }

                  if (this.nodes.length == 0) {
                    this.lexicalEntriesFilter(this.parameters);
                  }
      
      
      
                  if (countSubterm == 0) {
                    x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1)
                  }

                  this.lexicalEntryTree.treeModel.update()
                  return true
                  
                }else{
                  return false
                }
              })
            }
          }
        }else {
          return false;
        }
        return false;
      })

    }, 300);
  }

  lexicalEntriesFilter(newPar) {

    setTimeout(() => {
      const viewPort_prova = this.element.nativeElement.querySelector('tree-viewport') as HTMLElement;
      viewPort_prova.scrollTop = 0
    }, 300);

    this.searchIconSpinner = true;
    let parameters = newPar;
    parameters['offset'] = this.offset;
    parameters['limit'] = this.limit;
    console.log(parameters)
    this.lexicalService.getLexicalEntriesList(newPar).subscribe(
      data => {
        console.log(data)
        if (data['list'].length > 0) {
          this.show = false;
        } else {
          this.show = true;
        }
        this.nodes = data['list'];
        this.counter = data['totalHits'];
        this.lexicalEntryTree.treeModel.update();
        this.updateTreeView();
        this.searchIconSpinner = false;
      },
      error => {
        console.log(error)
      }
    )
  }

  getParameters() {
    return this.initialValues;
  }

  ngAfterViewInit(): void {
    //@ts-ignore
    $('[data-toggle="popover"]').popover({
      html: true,
      title: this.titlePopover,
      content: this.popoverWildcards
    });
  }

  resetFields() {
    this.initialValues.text = '';
    this.parameters.text = '';
    this.offset = 0;
    this.filterForm.reset(this.initialValues, { emitEvent: false });
    setTimeout(() => {
      //this.filterForm.get('text').setValue('', {eventEmit : false});
      this.lexicalEntriesFilter(this.parameters);
      this.lexicalEntryTree.treeModel.update();
      //this.updateTreeView();
      /* this.lexicalService.sendToCoreTab(null);
      this.lexicalService.sendToRightTab(null); */
    }, 500);

  }

  updateTreeView() {

    setTimeout(() => {
      this.lexicalEntryTree.sizeChanged();
      //@ts-ignore
      $('.lexical-tooltip').tooltip();
    }, 1000);
  }

  onEvent = ($event: any) => {

    console.log($event)
    setTimeout(() => {
      //@ts-ignore
      $('.lexical-tooltip').tooltip();
    }, 2000);

    if ($event.eventName == 'activate' && $event.node.data.lexicalEntry != undefined
      && $event.node.data.form == undefined
      && $event.node.data.sense == undefined
      && $event.node.data.etymology == undefined
      && $event.node.data.lexicalEntryInstanceName != this.selectedNodeId) {
      //this.lexicalService.sendToCoreTab($event.node.data);
      let idLexicalEntry = $event.node.data.lexicalEntryInstanceName;
      this.lexicalService.getLexEntryData(idLexicalEntry).subscribe(
        data => {

          console.log(data);
          this.selectedNodeId = $event.node.data.lexicalEntryInstanceName;
          this.lexicalService.sendToCoreTab(data);
          this.lexicalService.sendToRightTab(data);
          this.lexicalService.sendToEtymologyTab(null);
          this.lexicalService.updateCoreCard({ lastUpdate: data['lastUpdate'], creationDate: data['creationDate'] });

          //this.lexicalService.sendToAttestationPanel(null);
          //this.lexicalService.triggerAttestationPanel(false);


          /* if(this.expander.isEpigraphyTabExpanded() && !this.expander.isEditTabExpanded()){
            this.expander.expandCollapseEdit(false);
            this.expander.expandCollapseEpigraphy(false);
          }else if(!this.expander.isEpigraphyTabExpanded() && !this.expander.isEditTabExpanded()){
            this.expander.expandCollapseEdit(true);
          } */

          if (!this.expander.isEditTabOpen() && !this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && !this.expander.isEpigraphyTabExpanded()) {

              this.expander.expandCollapseEdit(true);
              this.expander.openCollapseEdit(true);
            }
          } else if (!this.expander.isEditTabOpen() && this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && this.expander.isEpigraphyTabExpanded()) {
              this.expander.expandCollapseEpigraphy(false);
              this.expander.openCollapseEdit(true)
            }
          }


          //@ts-ignore
          $("#coreTabModal").modal("show");
          $('.modal-backdrop').appendTo('.core-tab-body');
          //@ts-ignore
          $('#coreTabModal').modal({ backdrop: 'static', keyboard: false })
          $('body').removeClass("modal-open")
          $('body').css("padding-right", "");

          if (data.note != undefined) {
            if (data.note != "") {
              this.lexicalService.triggerNotePanel(true);
            } else {
              this.lexicalService.triggerNotePanel(false);
            }
          }
        },
        error => {

        }
      )
    } else if ($event.eventName == 'activate'
      && $event.node.data.form != undefined
      && $event.node.data.formInstanceName != this.selectedNodeId) {

      let formId = $event.node.data.formInstanceName;

      this.lexicalService.getFormData(formId, 'core').subscribe(
        data => {
          console.log(data)
          this.selectedNodeId = $event.node.data.formInstanceName;
          data['parentNodeLabel'] = $event.node.parent.parent.data.label;
          data['parentNodeInstanceName'] = $event.node.parent.parent.data.lexicalEntryInstanceName;
          this.lexicalService.sendToCoreTab(data)
          this.lexicalService.sendToEtymologyTab(null);
          this.lexicalService.sendToRightTab(data);
          this.lexicalService.updateCoreCard({ lastUpdate: data['lastUpdate'], creationDate: data['creationDate'] })
          //@ts-ignore
          $("#coreTabModal").modal("show");
          $('.modal-backdrop').appendTo('.core-tab-body');
          //@ts-ignore
          $('#coreTabModal').modal({ backdrop: 'static', keyboard: false })
          $('body').removeClass("modal-open")
          $('body').css("padding-right", "");

          // this.lexicalService.sendToAttestationPanel(null);
          // this.lexicalService.triggerAttestationPanel(false);

          if (!this.expander.isEditTabOpen() && !this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && !this.expander.isEpigraphyTabExpanded()) {

              this.expander.expandCollapseEdit(true);
              this.expander.openCollapseEdit(true);
            }
          } else if (!this.expander.isEditTabOpen() && this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && this.expander.isEpigraphyTabExpanded()) {
              this.expander.expandCollapseEpigraphy(false);
              this.expander.openCollapseEdit(true)
            }
          }

          if (data.note != undefined) {
            if (data.note != "") {
              this.lexicalService.triggerNotePanel(true);
            } else {
              this.lexicalService.triggerNotePanel(false);
            }
          }
        },
        error => {
          //console.log(error)
        }
      )

    } else if ($event.eventName == 'activate'
      && $event.node.data.sense != undefined
      && $event.node.data.senseInstanceName != this.selectedNodeId) {

      let senseId = $event.node.data.senseInstanceName;

      this.lexicalService.getSenseData(senseId, 'core').subscribe(
        data => {
          this.selectedNodeId = $event.node.data.senseInstanceName;
          data['parentNodeLabel'] = $event.node.parent.parent.data.label;
          data['parentNodeInstanceName'] = $event.node.parent.parent.data.lexicalEntryInstanceName;
          data['type'] = $event.node.parent.parent.data.type;
          console.log(data)
          this.lexicalService.sendToCoreTab(data)
          this.lexicalService.sendToEtymologyTab(null);
          this.lexicalService.sendToRightTab(data);
          this.lexicalService.updateCoreCard({ lastUpdate: data['lastUpdate'], creationDate: data['creationDate'] })

          // this.lexicalService.sendToAttestationPanel(null);
          // this.lexicalService.triggerAttestationPanel(false);
          //@ts-ignore
          $("#coreTabModal").modal("show");
          $('.modal-backdrop').appendTo('.core-tab-body');
          //@ts-ignore
          $('#coreTabModal').modal({ backdrop: 'static', keyboard: false })
          $('body').removeClass("modal-open")
          $('body').css("padding-right", "");

          if (!this.expander.isEditTabOpen() && !this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && !this.expander.isEpigraphyTabExpanded()) {

              this.expander.expandCollapseEdit(true);
              this.expander.openCollapseEdit(true);
            }
          } else if (!this.expander.isEditTabOpen() && this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && this.expander.isEpigraphyTabExpanded()) {
              this.expander.expandCollapseEpigraphy(false);
              this.expander.openCollapseEdit(true)
            }
          }

          if (data.note != undefined) {
            if (data.note != "") {
              this.lexicalService.triggerNotePanel(true);
            } else {
              this.lexicalService.triggerNotePanel(false);
            }
          }
        },
        error => {
          //console.log(error)
        }
      )
    } else if ($event.eventName == 'activate'
      && $event.node.data.etymology != undefined
      && $event.node.data.etymologyInstanceName != this.selectedNodeId) {

      let etymologyId = $event.node.data.etymologyInstanceName;

      this.lexicalService.getEtymologyData(etymologyId).subscribe(
        data => {
          this.selectedNodeId = $event.node.data.etymologyInstanceName;
          data['parentNodeLabel'] = $event.node.parent.parent.data.label;
          data['parentNodeInstanceName'] = $event.node.parent.parent.data.lexicalEntryInstanceName;
          console.log(data)
          data['type'] = $event.node.parent.parent.data.type;
          // this.lexicalService.sendToAttestationPanel(null);
          // this.lexicalService.triggerAttestationPanel(false);

          //this.lexicalService.sendToCoreTab(null);
          this.lexicalService.sendToEtymologyTab(data);
          this.lexicalService.sendToRightTab(data);
          this.lexicalService.updateCoreCard({ lastUpdate: data['etymology']['lastUpdate'], creationDate: data['etymology']['creationDate'] })
          //@ts-ignore
          $("#etymologyTabModal").modal("show");
          $('.modal-backdrop').appendTo('.etym-tab-body');
          //@ts-ignore
          $('#etymologyTabModal').modal({ backdrop: 'static', keyboard: false })
          $('body').removeClass("modal-open")
          $('body').css("padding-right", "");

          if (!this.expander.isEditTabOpen() && !this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && !this.expander.isEpigraphyTabExpanded()) {

              this.expander.expandCollapseEdit(true);
              this.expander.openCollapseEdit(true);
            }
          } else if (!this.expander.isEditTabOpen() && this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && this.expander.isEpigraphyTabExpanded()) {
              this.expander.expandCollapseEpigraphy(false);
              this.expander.openCollapseEdit(true)
            }
          }

          if (data.note != undefined) {
            if (data.note != "") {
              this.lexicalService.triggerNotePanel(true);
            } else {
              this.lexicalService.triggerNotePanel(false);
            }
          }
        },
        error => {
          console.log(error)
        }
      )
    } else if ($event.eventName == 'activate'
      && $event.node.data.component != undefined
      && $event.node.data.componentInstanceName != this.selectedNodeId) {

      let compId = $event.node.data.componentInstanceName;
      let parentInstanceLabel = $event.node.parent.parent.data.label;
      let parentInstanceName = $event.node.parent.parent.data.lexicalEntryInstanceName;

      this.lexicalService.getLexEntryData(parentInstanceName).subscribe(
        data => {
          this.selectedNodeId = $event.node.data.parentNodeInstanceName;
          
          console.log(data)
          //this.lexicalService.sendToCoreTab(data);
          //this.lexicalService.sendToEtymologyTab(data);
          //this.lexicalService.sendToDecompTab(data);
          this.lexicalService.sendToRightTab(data);
          // this.lexicalService.sendToAttestationPanel(null);
          // this.lexicalService.triggerAttestationPanel(false);
          this.lexicalService.updateCoreCard({ lastUpdate: data['lastUpdate'], creationDate: data['creationDate'] })
          //@ts-ignore
          $("#etymologyTabModal").modal("show");
          $('.modal-backdrop').appendTo('.etym-tab-body');
          //@ts-ignore
          $('#etymologyTabModal').modal({ backdrop: 'static', keyboard: false })
          $('body').removeClass("modal-open")
          $('body').css("padding-right", "");

          if (!this.expander.isEditTabOpen() && !this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && !this.expander.isEpigraphyTabExpanded()) {

              this.expander.expandCollapseEdit(true);
              this.expander.openCollapseEdit(true);
            }
          } else if (!this.expander.isEditTabOpen() && this.expander.isEpigraphyTabOpen()) {
            if (!this.expander.isEditTabExpanded() && this.expander.isEpigraphyTabExpanded()) {
              this.expander.expandCollapseEpigraphy(false);
              this.expander.openCollapseEdit(true)
            }
          }

          if (data.note != undefined) {
            if (data.note != "") {
              this.lexicalService.triggerNotePanel(true);
            } else {
              this.lexicalService.triggerNotePanel(false);
            }
          }
        },
        error => {
          console.log(error)
        }
      )
    }

  };

  onKey = ($event: any) => {
    var that = this;
    setTimeout(function () {
      var results = document.body.querySelectorAll('tree-node-collection > div')[1].children.length;
      if (results == 0) {
        that.show = true;
      } else {
        that.show = false;
      }
    }, 5);
  };

  onScrollDown(treeModel: TreeModel) {

    this.offset += 500;
    this.modalShow = true;

    //@ts-ignore
    $("#lazyLoadingModal").modal("show");
    $('.modal-backdrop').appendTo('.tree-view');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    let parameters = this.filterForm.value;
    parameters['offset'] = this.offset;
    parameters['limit'] = this.limit;

    this.lexicalService.getLexicalEntriesList(parameters).pipe(debounceTime(200)).subscribe(
      data => {
        //@ts-ignore
        $('#lazyLoadingModal').modal('hide');
        $('.modal-backdrop').remove();
        for (var i = 0; i < data['list'].length; i++) {
          this.nodes.push(data['list'][i]);
        };
        //this.counter = this.nodes.length;
        this.lexicalEntryTree.treeModel.update();
        this.updateTreeView();
        this.modalShow = false;

        setTimeout(() => {
          //@ts-ignore
          $('#lazyLoadingModal').modal('hide');
          $('.modal-backdrop').remove();
        }, 300);
      },
      error => {

      }
    )
  }

  getChildren(node: any) {

    let newNodes: any;
    if (node.data.lexicalEntryInstanceName != undefined) {
      let instance = node.data.lexicalEntryInstanceName;
      this.lexicalService.getLexEntryElements(instance).subscribe(
        data => {
          console.log(data['elements'])
          data["elements"] = data["elements"].filter(function (obj) {
            return obj.count != 0;
          })
          newNodes = data["elements"].map((c) => Object.assign({}, c));

          newNodes.forEach(element => {
            setTimeout(() => {
              try {
                const someNode = this.lexicalEntryTree.treeModel.getNodeById(element.id);

                someNode.expand();
                //console.log(someNode)
                var that = this;
                /* this.interval = setInterval((val)=>{                
                               
                  
                }, 2000) */
              } catch (e) {
                console.log(e)
              }

            }, 1000);

          });

        },
        error => {

        }
      );
    } else if (node.data.label == "form") {
      let parentInstance = node.parent.data.lexicalEntryInstanceName;
      this.lexicalService.getLexEntryForms(parentInstance).subscribe(
        data => {
          newNodes = data.map((c) => Object.assign({}, c));
          for (var i = 0; i < newNodes.length; i++) {
            if (newNodes[i].creator == node.parent.data.creator) {
              newNodes[i]['flagAuthor'] = false
            } else {
              newNodes[i]['flagAuthor'] = true
            }
          }
        }
      )
    } else if (node.data.label == "sense") {
      let parentInstance = node.parent.data.lexicalEntryInstanceName;
      this.lexicalService.getSensesList(parentInstance).subscribe(
        data => {
          /* //console.log(data) */
          newNodes = data.map((c) => Object.assign({}, c));
          for (var i = 0; i < newNodes.length; i++) {
            newNodes[i]['hasChildren'] = null;
            if (newNodes[i].creator == node.parent.data.creator) {
              newNodes[i]['flagAuthor'] = false
            } else {
              newNodes[i]['flagAuthor'] = true
            }
          }
        }, error => {
          //console.log(error)
        }
      )
    } else if (node.data.label == "etymology") {
      let parentInstance = node.parent.data.lexicalEntryInstanceName;
      this.lexicalService.getEtymologies(parentInstance).subscribe(
        data => {
          console.log(data)
          newNodes = data.map((c) => Object.assign({}, c));
          for (var i = 0; i < newNodes.length; i++) {
            newNodes[i]['hasChildren'] = null;
            if (newNodes[i].creator == node.parent.data.creator) {
              newNodes[i]['flagAuthor'] = false
            } else {
              newNodes[i]['flagAuthor'] = true
            }
          }
        }, error => {
          //console.log(error)
        }
      )

    } else if (node.data.label == "constituent") {
      let parentInstance = node.parent.data.lexicalEntryInstanceName;
      this.lexicalService.getConstituents(parentInstance).subscribe(
        data => {
          console.log(data)
          newNodes = data.map((c) => Object.assign({}, c));
          for (var i = 0; i < newNodes.length; i++) {
            newNodes[i]['hasChildren'] = null;
            /* if (newNodes[i].creator == node.parent.data.creator) {
              newNodes[i]['flagAuthor'] = false
            } else {
              newNodes[i]['flagAuthor'] = true
            } */
          }
        }, error => {
          //console.log(error)
        }
      )

    } else if (node.data.label == "subterm") {
      let parentInstance = node.parent.data.lexicalEntryInstanceName;
      this.lexicalService.getSubTerms(parentInstance).subscribe(
        data => {
          console.log(data)
          newNodes = data.map((c) => Object.assign({}, c));
          for (var i = 0; i < newNodes.length; i++) {
            newNodes[i]['hasChildren'] = null;
            /* if (newNodes[i].creator == node.parent.data.creator) {
              newNodes[i]['flagAuthor'] = false
            } else {
              newNodes[i]['flagAuthor'] = true
            } */
          }
        }, error => {
          //console.log(error)
        }
      )

    }

    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(newNodes), 1000);
    });
  }


  /* To copy any Text */
  copyText(val: string) {
    console.log(val)

    let value = '';
    if (val['lexicalEntry'] != undefined && val['sense'] == undefined && val['etymology'] == undefined) {
      value = val['lexicalEntry']
    } else if (val['form'] != undefined) {
      value = val['form']
    } else if (val['sense'] != undefined) {
      value = val['sense']
    } else if (val['etymology'] != undefined) {
      value = val['etymology']
    }
    this.copySubject.next(value);
  }
}