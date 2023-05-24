/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { ApplicationRef, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { TreeNode, TreeModel, TREE_ACTIONS, KEYS, IActionMapping, ITreeOptions, ITreeState } from '@circlon/angular-tree-component';
import { formTypeEnum, LexicalEntryRequest, searchModeEnum, typeEnum } from './interfaces/lexical-entry-interface'
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { FormControl, FormGroup } from '@angular/forms';
import { ContextMenuComponent } from 'ngx-contextmenu';

import * as _ from 'underscore';
declare var $: JQueryStatic;


import { debounceTime, take, takeUntil } from 'rxjs/operators';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { Subject, Subscription } from 'rxjs';
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

export class LexicalEntryTreeComponent implements OnInit, OnDestroy {
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

  destroy$ : Subject<boolean> = new Subject();

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

  delete_req_subscription : Subscription;
  add_sub_subscription : Subscription;
  copy_subject_subscription : Subscription;
  refresh_filter_subscription : Subscription;
  get_lex_entry_list_subscription : Subscription;
  get_languages_subscription : Subscription;
  get_types_subscription : Subscription;
  get_authors_subscription : Subscription;
  get_pos_subscription : Subscription;
  get_status_subscription : Subscription;

  constructor(private expander: ExpanderService, 
              private renderer: Renderer2, 
              private element: ElementRef, 
              private lexicalService: LexicalEntriesService, 
              private toastr: ToastrService) {

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

    this.delete_req_subscription = this.lexicalService.deleteReq$.subscribe(
      signal => {

        ////console.log("richiesta eliminazione lexical entry");
        if (signal != null) {
          this.lexEntryDeleteReq(signal);
        }

      }
    )

    this.add_sub_subscription = this.lexicalService.addSubReq$.subscribe(
      signal => {

        if (signal != null) {
          this.addSubElement(signal)
        }
      }
    )

    this.copy_subject_subscription = this.copySubject.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(v => {
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

    this.refresh_filter_subscription = this.lexicalService.refreshFilter$.subscribe(
      signal => {

        if (signal != null) {

          this.get_lex_entry_list_subscription = this.lexicalService.getLexicalEntriesList(this.parameters).pipe(takeUntil(this.destroy$)).subscribe(
            data => {
              this.counter = data['totalHits'];
            },
            error => {
              //console.log(error)
            }
          );


          this.get_languages_subscription = this.lexicalService.getLanguages().pipe(takeUntil(this.destroy$)).subscribe(
            data => {

              this.languages = data;
            }
          );

          this.get_types_subscription = this.lexicalService.getTypes().pipe(takeUntil(this.destroy$)).subscribe(
            data => {
              this.types = data;
            }
          );

          this.get_authors_subscription = this.lexicalService.getAuthors().pipe(takeUntil(this.destroy$)).subscribe(
            data => {
              this.authors = data;
            }
          );

          this.get_pos_subscription = this.lexicalService.getPos().pipe(takeUntil(this.destroy$)).subscribe(
            data => {
              this.partOfSpeech = data;
            }
          )

          this.get_status_subscription = this.lexicalService.getStatus().pipe(takeUntil(this.destroy$)).subscribe(
            data => {
              this.status = data;
            }
          )


        }
      }
    )

    /* //console.log(this.parameters) */
    this.get_lex_entry_list_subscription = this.lexicalService.getLexicalEntriesList(this.parameters).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        this.nodes = data['list'];
        this.counter = data['totalHits'];
      },
      error => {
        //console.log(error)
      }
    );

    this.get_languages_subscription = this.lexicalService.getLanguages().subscribe(
      data => {
        this.languages = data;
      }
    );

    this.get_types_subscription = this.lexicalService.getTypes().subscribe(
      data => {
        this.types = data;
      }
    );

    this.get_authors_subscription = this.lexicalService.getAuthors().subscribe(
      data => {
        this.authors = data;
      }
    );

    this.get_pos_subscription = this.lexicalService.getPos().subscribe(
      data => {
        this.partOfSpeech = data;
      }
    )

    this.get_status_subscription = this.lexicalService.getStatus().subscribe(
      data => {
        this.status = data;
      }
    )
  }

  onChanges() {
    this.filterForm.valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(searchParams => {
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
        case 'form': instanceName = 'form'; break;
        case 'sense': instanceName = 'sense'; break;
        case 'etymology': instanceName = 'etymology'; break;
        case 'subterm': instanceName = 'lexicalEntry'; break;
        case 'constituent': instanceName = 'component'; break;
      }
      this.lexicalEntryTree.treeModel.getNodeBy(x => {
        if (lex.lexicalEntry != undefined) {
          if (x.data.lexicalEntry === lex.lexicalEntry) {
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
                      } else if (y.data.etymology != undefined && y.data.etymology === data['etymology'] && lex.request != 'subterm') {
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
                    } else if (lex.request == 'subterm') {
                      data.label = data.label;
                      data.children = null;
                      data.hasChildren = false;
                    } else {
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
                      if (y.data.label === data['label'] && lex.request != 'subterm') { /* && lex.request != 'subterm' */
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



    this.lexicalEntryTree.treeModel.getNodeBy(x => {
      if (signal.lexicalEntry != undefined && signal.form == undefined && signal.sense == undefined) {
        if (x.data.lexicalEntry === signal.lexicalEntry) {

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
      } else if (signal.form != undefined) {
        if (x.data.form === signal.form) {

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
      } else if (signal.sense != undefined) {
        if (x.data.sense === signal.sense) {

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
        if (x.data.etymology === signal.etymology.etymology) {
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
      } else if (signal.subtermInstanceName != undefined) {
        let parent = signal.parentNodeInstanceName;
        if (x.data.lexicalEntry == signal.parentNodeInstanceName) {
          console.log(x)
          let children = x.data.children;

          if (children.length >= 1) {
            Array.from(children).forEach((y: any) => {
              if (y.lexicalEntry == signal.subtermInstanceName) {

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

              } else {
                return false
              }
            })
          }
        }
      } else {
        return false;
      }
      return false;
    })


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
    this.lexicalService.getLexicalEntriesList(newPar).pipe(takeUntil(this.destroy$)).subscribe(
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
      && $event.node.data.lexicalEntry != this.selectedNodeId) {
      //this.lexicalService.sendToCoreTab($event.node.data);
      let idLexicalEntry = $event.node.data.lexicalEntry;
      this.lexicalService.getLexEntryData(idLexicalEntry).pipe(takeUntil(this.destroy$)).subscribe(
        data => {

          console.log(data);
          this.selectedNodeId = $event.node.data.lexicalEntry;
          this.lexicalService.sendToCoreTab(data);
          this.lexicalService.sendToRightTab(data);
          this.lexicalService.sendToEtymologyTab(null);
          this.lexicalService.updateCoreCard({ lastUpdate: data['lastUpdate'], creationDate: data['creationDate'] });

          

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
          console.log(error)
        }
      )
    } else if ($event.eventName == 'activate'
      && $event.node.data.form != undefined
      && $event.node.data.form != this.selectedNodeId) {

      let formId = $event.node.data.form;

      this.lexicalService.getFormData(formId, 'core').pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data)
          this.selectedNodeId = $event.node.data.form;
          data['parentNodeLabel'] = $event.node.parent.parent.data.label;
          data['parentNodeInstanceName'] = $event.node.parent.parent.data.lexicalEntry;
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
      && $event.node.data.sense != this.selectedNodeId) {

      let senseId = $event.node.data.sense;

      this.lexicalService.getSenseData(senseId, 'core').pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          this.selectedNodeId = $event.node.data.sense;
          data['parentNodeLabel'] = $event.node.parent.parent.data.label;
          data['parentNodeInstanceName'] = $event.node.parent.parent.data.lexicalEntry;
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
      && $event.node.data.etymology != this.selectedNodeId) {

      let etymologyId = $event.node.data.etymology;

      this.lexicalService.getEtymologyData(etymologyId).pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          this.selectedNodeId = $event.node.data.etymology;
          data['parentNodeLabel'] = $event.node.parent.parent.data.label;
          data['parentNodeInstanceName'] = $event.node.parent.parent.data.lexicalEntry;
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
      let parentInstanceName = $event.node.parent.parent.data.lexicalEntry;

      this.lexicalService.getLexEntryData(parentInstanceName).pipe(takeUntil(this.destroy$)).subscribe(
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

  async onScrollDown(treeModel: TreeModel) {

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

    try {
      let get_entry_list = await this.lexicalService.getLexicalEntriesList(parameters).toPromise();
      //@ts-ignore
      $('#lazyLoadingModal').modal('hide');
      $('.modal-backdrop').remove();
      for (var i = 0; i < get_entry_list['list'].length; i++) {
        this.nodes.push(get_entry_list['list'][i]);
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
    } catch (error) {
      console.log(error)
      
    }
  }

  async getChildren(node: any) {
    let newNodes: any;
    if (node.data.lexicalEntry != undefined) {

      try {
        let instance = node.data.lexicalEntry;
        let data = await this.lexicalService.getLexEntryElements(instance).toPromise();
        console.log(data['elements'])
        data["elements"] = data["elements"].filter(function (obj) {
          return obj.count != 0 && (obj.label != 'lexicalConcept' && obj.label != 'concept');
        })
        newNodes = data["elements"].map((c) => Object.assign({}, c));

        if (Object.keys(newNodes).length > 0) {

          for (const element of newNodes) {

            if (element.label == 'form') {
              let form_data = await this.lexicalService.getLexEntryForms(instance).toPromise();
              element.isExpanded = true;
              element.children = [];

              form_data.forEach(form => {
                element.children.push(form);
              });
            } else if (element.label == 'sense') {
              let sense_data = await this.lexicalService.getSensesList(instance).toPromise();
              element.isExpanded = true;
              element.children = [];
              sense_data.forEach(sense => {
                element.children.push(sense);
              });
            } else if (element.label == 'etymology') {
              let etymology_data = await this.lexicalService.getEtymologies(instance).toPromise();
              element.isExpanded = true;
              element.children = [];
              etymology_data.forEach(etym => {
                element.children.push(etym);
              });
            } else if (element.label == 'subterm') {
              let subterm_data = await this.lexicalService.getSubTerms(instance).toPromise();
              element.isExpanded = true;
              element.children = [];
              subterm_data.forEach(subterm => {
                subterm.hasChildren = false;
                element.children.push(subterm);
              });
            }

          }
          return newNodes;
        } else {
          this.toastr.info('No childs for this node', 'Info', { timeOut: 5000 });
          return newNodes;
        }
        
      } catch (error) {
        console.log(error)
        if(error.status != 200){
          this.toastr.error("Something went wrong, please check the log", "Error", {timeOut: 5000})
        }
      }
      


    }

  }


  /* To copy any Text */
  copyText(val: object) {
    console.log(val)

    let value = '';
    if (val['lexicalEntry'] != undefined && val['sense'] == undefined && val['etymology'] == undefined && val['form'] == undefined) {
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

  ngOnDestroy(): void {
    this.delete_req_subscription.unsubscribe();
    this.add_sub_subscription.unsubscribe();
    this.copy_subject_subscription.unsubscribe();
    this.refresh_filter_subscription.unsubscribe();
    this.get_lex_entry_list_subscription.unsubscribe();
    this.get_languages_subscription.unsubscribe();
    this.get_types_subscription.unsubscribe();
    this.get_authors_subscription.unsubscribe();
    this.get_pos_subscription.unsubscribe();
    this.get_status_subscription.unsubscribe();

    this.destroy$.next(true);
    this.destroy$.complete();
  }
}