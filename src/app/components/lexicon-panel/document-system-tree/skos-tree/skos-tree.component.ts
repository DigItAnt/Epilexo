import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { IActionMapping, TREE_ACTIONS, KEYS, ITreeState, ITreeOptions, TreeModel, TreeNode } from '@circlon/angular-tree-component';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, tap, timeout } from 'rxjs/operators';
import { BibliographyService } from 'src/app/services/bibliography-service/bibliography.service';
import { ConceptService } from 'src/app/services/concept/concept.service';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { v4 } from 'uuid';

const actionMapping: IActionMapping = {
  mouse: {
    /* dblClick: (tree, node, $event) => {
      if (node.hasChildren) {
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      }
    }, */
    click: (tree, node, $event) => {
      $event.shiftKey
        ? TREE_ACTIONS.TOGGLE_ACTIVE_MULTI(tree, node, $event)
        : TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);

      if (node.data.rename_mode) {
        $event.preventDefault();
      }/* else{
        TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);
      } */
    },
    expanderClick: (tree, node, $event) => {
      if (node.data.rename_mode) {
        $event.preventDefault();
      } else {
        //console.log(node);
        TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event);
      }
    }
    /* contextMenu: (tree, node, $event) => {
      //$event.preventDefault();
      //alert(`context menu for ${node.data.name}`);
      TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);
    } */
  },
  keys: {
    [KEYS.ENTER]: (tree, node, $event) => alert(`This is ${node.data.name}`)
  }
};


@Component({
  selector: 'app-skos-tree',
  templateUrl: './skos-tree.component.html',
  styleUrls: ['./skos-tree.component.scss']
})
export class SkosTreeComponent implements OnInit, OnDestroy {

  state!: ITreeState;
  @ViewChild('skosTree') skosTree: any;
  @ViewChild('lexicalConceptRemoverModal') lexicalConceptRemoverModal;
  @ViewChild(ContextMenuComponent) public skosMenu: ContextMenuComponent;

  selectedNodeId;
  destroy$: Subject<boolean> = new Subject();



  searchIconSpinner = false;
  initialValues
  skosFilterForm = new FormGroup({
    search_text: new FormControl(null),
    search_mode: new FormControl(null)
  })

  counter = 0;
  skos_nodes = [];
  show = false;
  offset: number;
  modalShow: boolean;
  limit: any;

  processRequestForm : FormGroup;

  nodeToRemove : any;

  options: ITreeOptions = {
    getChildren: this.getChildren.bind(this),
    actionMapping,
    allowDrag: (node) => {
      return node.data.conceptSet == undefined;
    },
    allowDrop: (element, { parent, index }) => {
      // return true / false based on element, to.parent, to.index. e.g.
      //console.log(element, parent, index, parent.data.type == 'folder')
      return element.data.conceptSet == undefined;
    },
    getNodeClone: (node) => ({
      ...node.data,
      id: v4(),
      name: `copy of ${node.data.name}`
    })
  };
  
  

  constructor(private element: ElementRef,
    private formBuilder: FormBuilder,
    private lexicalService: LexicalEntriesService,
    private conceptService: ConceptService,
    private expander: ExpanderService,
    private toastr: ToastrService,
    private biblioService : BibliographyService,
    private modalService: NgbModal,

  ) { }

  ngOnInit(): void {

    this.processRequestForm = this.formBuilder.group(
      {
        oneOrAll : new FormControl('one'),
      }
    )
    
    this.skosFilterForm = this.formBuilder.group({
      search_text: new FormControl(null),
      search_mode: new FormControl('startsWith')
    })
    this.onChanges();
    this.initialValues = this.skosFilterForm.value
    this.loadTree();
    this.conceptService.deleteSkosReq$.pipe(takeUntil(this.destroy$)).subscribe(
      signal => {

        if (signal != null) {
          this.skosDeleteRequest(signal);
        }

      }
    )

    this.conceptService.addSubReq$.subscribe(
      signal => {

        if (signal != null) {
          this.addSubElement(signal)
        }
      }
    )
  }


  onChanges() {

    this.skosFilterForm.valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(searchParams => {
      console.log(searchParams)
      this.searchFilter(searchParams)
    })
  }

  onEvent = ($event: any) => {
    console.log($event);

    if ($event.eventName == 'activate' &&
      $event.node.data.conceptSet != undefined /* &&
      this.selectedNodeId != $event.node.data.conceptSet */) {

      /* setTimeout(() => {
        this.selectedNodeId = $event.node.data.conceptSet;
        this.lexicalService.sendToCoreTab($event.node.data);
        this.lexicalService.sendToRightTab($event.node.data);
        this.lexicalService.updateCoreCard({ lastUpdate: $event.node.data['lastUpdate'], creationDate: $event.node.data['creationDate'] })
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
      }, 10); */
    } else if ($event.eventName == 'activate' &&
      $event.node.data.lexicalConcept != undefined /* &&
      this.selectedNodeId != $event.node.data.lexicalConcept */) {

      let instance = $event.node.data.lexicalConcept;
      this.conceptService.getLexicalConceptData(instance).pipe(takeUntil(this.destroy$)).subscribe(
        data=> {
          this.selectedNodeId = data.lexicalConcept;
          this.lexicalService.sendToCoreTab(data);
          this.lexicalService.sendToRightTab(data);
          console.log(data)
          this.lexicalService.updateCoreCard({ lastUpdate: data['lastUpdate'], creationDate: $event.node.data['creationDate'] })
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
        
        error=>{
          console.log(error)
        }
      );
    }
  }

  isConceptSet = (item: any): boolean => {
    return item.conceptSet != undefined && item.conceptSet != '';
  }

  isLexicalConcept = (item: any): boolean => {
    return item.lexicalConcept != undefined && item.lexicalConcept != '';
  }

  onMoveNode($event) {
    console.log($event);
    
    if ($event != undefined) {
      //console.log(evt);
      

      let node_source = $event.node.lexicalConcept;
      let node_target = $event.to.parent.lexicalConcept;

      let parameters = {
        relation : "http://www.w3.org/2004/02/skos/core#narrower",
        source : node_source,
        target : node_target
      }

      if(node_target != undefined){
        this.conceptService.updateSemanticRelation(parameters).pipe(takeUntil(this.destroy$)).subscribe(
          next=>{
            console.log(next);
          },error=>{
            console.log(error);
            if(error.status == 200){
              this.toastr.success('Lexical concept moved', '', {timeOut : 5000})
            }else{
              this.toastr.error(error.error, '', {timeOut : 5000})
            }
          },()=>{
            console.log('complete')
          }
        )
      }else{
        let from_node = $event.from.parent.lexicalConcept;

        let parameters = {
          relation : "http://www.w3.org/2004/02/skos/core#narrower",
          value : from_node,

        }

        if(from_node != undefined){
          this.conceptService.deleteRelation(node_source, parameters).pipe(takeUntil(this.destroy$)).subscribe(
            data=>{
              console.log(data);
              this.toastr.success('Lexical Concept moved', '', {timeOut : 5000})
            },
            error=>{
              console.log(error);
              if(error.status == 200){
                this.toastr.success('Lexical Concept moved', '', {timeOut : 5000})
              }else{
                this.toastr.error('Error on moving Lexical Concept')
              }
            }
          )
        }
        
      }

      
    }

  }

  async loadTree() {
    let conceptSets = []
    let rootConceptSets = [];
    let tmp = [];

    /* try {
      conceptSets = await this.conceptService.getConceptSets().toPromise().then(
        response => response.list
      );

    } catch (error) {
      console.log(error)
    } */


    try {
      rootConceptSets = await this.conceptService.getRootLexicalConcepts().toPromise().then(
        response => response.list
      );

    } catch (error) {
      console.log(error)
    }


    /* if (conceptSets.length > 0) {
      conceptSets.map(
        element => element['hasChildren'] = true
      )
      this.skos_nodes = conceptSets;
    } */

    if (rootConceptSets.length > 0 && conceptSets.length == 0) {
      rootConceptSets.map(
        element => {
          element['hasChildren'] = true,
          element['children'] = undefined;
        },
      )

      this.skos_nodes = rootConceptSets;
    }

    

    this.counter = this.skos_nodes.length;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onScrollDown(treeModel: TreeModel) {


    this.offset += 500;
    this.modalShow = true;

    //@ts-ignore
    $("#lazyLoadingModal").modal("show");
    $('.modal-backdrop').appendTo('.tree-view');
    $('body').removeClass("modal-open")
    $('body').css("padding-right", "");

    let parameters = this.skosFilterForm.value;
    parameters['offset'] = this.offset;
    parameters['limit'] = this.limit;

    /* this.lexicalService.getLexicalEntriesList(parameters).pipe(debounceTime(200), takeUntil(this.destroy$)).subscribe(
      data => {
        //@ts-ignore
        $('#lazyLoadingModal').modal('hide');
        $('.modal-backdrop').remove();
        for (var i = 0; i < data['list'].length; i++) {
          this.skos_nodes.push(data['list'][i]);
        };
        //this.counter = this.skos_nodes.length;
        this.skosTree.treeModel.update();
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
    ) */
  }

  updateTreeView() {


    setTimeout(() => {
      this.counter = this.skos_nodes.length;
      this.skosTree.sizeChanged();

    }, 1000);
  }

  resetFields() {
    this.skosFilterForm.reset(this.initialValues, { emitEvent: false });
    setTimeout(() => {
      this.loadTree();
      this.skosTree.treeModel.update();
      this.updateTreeView();

    }, 500);
  }


  searchFilter(newPar) {
    
    this.skos_nodes = [];

    setTimeout(() => {
      const viewPort_prova = this.element.nativeElement.querySelector('tree-viewport') as HTMLElement;
      viewPort_prova.scrollTop = 0
    }, 300);

    let search_text = newPar.search_text != null ? newPar.search_text : '';
    this.searchIconSpinner = true;
    let parameters = {
      text: search_text,
      searchMode: newPar.search_mode,
      labelType: "prefLabel",
      author: "",
      offset: 0,
      limit: 500
    }

    this.conceptService.conceptFilter(parameters).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)

        if (data.list.length > 0) {
          let filter_lang = [];
          filter_lang = data.list.filter(
            element => element.language != 'null'
          )

          filter_lang.forEach(
            el=> {
              el['hasChildren'] = true;
              el['children'] = [];
            }
          )

          console.log(filter_lang)
          this.skos_nodes = filter_lang;

          
          
        } else{
          this.skos_nodes = [];
        }

      }, error => {
        console.log(error)
        
      }
    )

    
    this.searchIconSpinner = false;


  }

  async getChildren(node: any) {
    let newNodes: any;
    if (node.data.conceptSet != undefined || node.data.lexicalConcept != undefined) {

      try {
        let instance = node.data.conceptSet != undefined ? node.data.conceptSet : node.data.lexicalConcept;

        let data = await this.conceptService.getLexicalConcepts(instance).toPromise();
        console.log(data)

        newNodes = data['list'].map((c) => Object.assign({}, c));

        if (Object.keys(newNodes).length > 0) {

          for (const element of newNodes) {

            element['children'] = undefined;
            element['hasChildren'] = true;
            

          }
          return newNodes;
        } else {
          this.toastr.info('No childs for this node', 'Info', { timeOut: 5000 });
          
          return newNodes;
        }

      } catch (error) {
        console.log(error)
        if (error.status != 200) {
          this.toastr.error("Something went wrong, please check the log", "Error", { timeOut: 5000 })
        }
      }



    }

  }

 

  processRequest(){
    
    let request = this.processRequestForm.get('oneOrAll').value;
    if(request == 'one'){
      this.deleteLexicalConcept(this.nodeToRemove, true);
    }else{
      this.deleteLexicalConceptRecursive(this.nodeToRemove)
      return;
      
    }
  }
  
  deleteLexicalConceptRecursive(item){
    
    let lexicalConceptID = item.lexicalConcept;
    this.searchIconSpinner = true;

    this.conceptService.deleteLexicalConcept(lexicalConceptID, true).pipe(takeUntil(this.destroy$)).subscribe(
      data=> {
        console.log(data)
      },error=>{
        console.log(error);
        if(error.status != 200){
          this.toastr.error(error.error, 'Error', {
            timeOut: 5000,
          });
        }else{
          this.toastr.success(lexicalConceptID + ' and all his children deleted correctly', '', {
            timeOut: 5000,
          });
          this.searchIconSpinner = false;
          this.conceptService.deleteRequest(item);
          this.lexicalService.sendToCoreTab(null);
          this.lexicalService.sendToRightTab(null);
          this.biblioService.sendDataToBibliographyPanel(null);

          this.expander.expandCollapseEdit(false);
          this.expander.openCollapseEdit(false)
          if (this.expander.isEpigraphyOpen) {
            this.expander.expandCollapseEpigraphy();
          }
          this.nodeToRemove = null;
        }
      }
    )
  }

  deleteLexicalConcept(item, force?){
    
    let lexicalConceptID = item.lexicalConcept;
    this.searchIconSpinner = true;

    if(item.children != undefined && item.children.length > 0 && (force == undefined)){
      this.nodeToRemove = item;
      setTimeout(() => {
        this.modalService.open(this.lexicalConceptRemoverModal, {centered: true})

      }, 1000);
      
    }else if(item.children == undefined && (force == undefined)){
      this.conceptService.getLexicalConcepts(lexicalConceptID).pipe(takeUntil(this.destroy$)).subscribe(
        data=>{
          console.log(data);
          
          if(data!= undefined){
            if(data.list.length > 0){
              this.nodeToRemove = item;
              setTimeout(() => {
                this.modalService.open(this.lexicalConceptRemoverModal, {centered: true})

              }, 100);
            }else{
              this.conceptService.deleteLexicalConcept(lexicalConceptID).pipe(takeUntil(this.destroy$)).subscribe(
                data=> {
                  console.log(data)
                },error=>{
                  console.log(error);
                  if(error.status != 200){
                    this.toastr.error(error.error, 'Error', {
                      timeOut: 5000,
                    });
                  }else{
                    this.toastr.success(lexicalConceptID + 'deleted correctly', '', {
                      timeOut: 5000,
                    });
                    this.searchIconSpinner = false;
                    this.conceptService.deleteRequest(item);
                    this.lexicalService.sendToCoreTab(null);
                    this.lexicalService.sendToRightTab(null);
                    this.biblioService.sendDataToBibliographyPanel(null);
          
                    this.expander.expandCollapseEdit(false);
                    this.expander.openCollapseEdit(false)
                    if (this.expander.isEpigraphyOpen) {
                      this.expander.expandCollapseEpigraphy();
                    }
                  }
                }
              )
            }
          }
          
        },error=>{
          console.log(error);
          if(error.status == 200){
            setTimeout(() => {
              this.modalService.open(this.lexicalConceptRemoverModal, {centered: true})

            }, 100);
          }else{
            this.toastr.error(error.error, 'Error', {timeOut : 5000})
          }
        }
      )
    }else{
      this.conceptService.deleteLexicalConcept(lexicalConceptID).pipe(takeUntil(this.destroy$)).subscribe(
        data=> {
          console.log(data)
        },error=>{
          console.log(error);
          if(error.status != 200){
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }else{
            this.toastr.success(lexicalConceptID + 'deleted correctly', '', {
              timeOut: 5000,
            });
            this.searchIconSpinner = false;
            this.conceptService.deleteRequest(item);
            this.lexicalService.sendToCoreTab(null);
            this.lexicalService.sendToRightTab(null);
            this.biblioService.sendDataToBibliographyPanel(null);
  
            this.expander.expandCollapseEdit(false);
            this.expander.openCollapseEdit(false)
            if (this.expander.isEpigraphyOpen) {
              this.expander.expandCollapseEpigraphy();
            }
          }
        }
      )
    }
    
  }

  skosDeleteRequest(signal?) {



    this.skosTree.treeModel.getNodeBy(x => {
      if (signal.conceptSet != undefined && signal.lexicalConcept == undefined) {
        if (x.data.conceptSet === signal.conceptSet) {

          x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1);

          this.skosTree.treeModel.update()

          setTimeout(() => {
            this.counter = this.skosTree.treeModel.nodes.length;
          }, 1000);

          return true;
        } else {
          return false;
        }
      } else if (signal.lexicalConcept != undefined) {
        if (x.data.lexicalConcept === signal.lexicalConcept) {

          x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1);

          this.skosTree.treeModel.update()
          setTimeout(() => {
            this.counter = this.skosTree.treeModel.nodes.length;
          }, 1000);

          return true;
        } else {
          return false;
        }

      } else {
        return false;
      }
    })


  }

  addSubElement(signal?) {

    setTimeout(() => {
      let instanceName;
      let lex = signal.lex;
      let data = signal.data;
      console.log(lex)
      console.log(data)
      
      this.skosTree.treeModel.getNodeBy(x => {
        if (lex.lexicalConcept != undefined) {
          if (x.data.lexicalConcept === lex.lexicalConcept) {
            if (x.data.children == undefined) {
              x.data.children = [];
              x.data.children.push(data);
              x.expand();
              
              this.skosTree.treeModel.update();
              this.skosTree.treeModel.getNodeBy(y => {
                if (y.data.lexicalConcept != undefined && y.data.lexicalConcept === data.lexicalConcept) {
                  y.setActiveAndVisible();
                }
              })
              
              return true;
            } else {
              x.data.children.push(data);
              x.expand();
              this.skosTree.treeModel.update();
              this.skosTree.treeModel.getNodeBy(y => {
                if (y.data.lexicalConcept != undefined && y.data.lexicalConcept === data.lexicalConcept) {
                  y.setActiveAndVisible();
                }
              })
              return true;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      })
    }, 300);
  }

  addLexicalConcept(parentNode: any, type : string) {

    if(parentNode){
      let relation = "http://www.w3.org/2004/02/skos/core#narrower";
      
      this.conceptService.createNewLexicalConcept().pipe(takeUntil(this.destroy$)).subscribe(
        data => {
          console.log(data);
          if (data != undefined) {
            /* this.toastr.info('New Concept Set added', '', {
              timeOut: 5000,
            }); */
            
            let parameters = {
              relation : relation,
              source : data['lexicalConcept'],
              target : parentNode['lexicalConcept']
            }

            data['hasChildren'] = true;  
            
            if(type == 'conceptSet'){
              this.conceptService.updateSchemeProperty(parameters).pipe(takeUntil(this.destroy$)).subscribe(
                data=> {
                  console.log(data);
                },error=>{
                  console.log(error);
                  if(error.status == 200){
                    if(parentNode.children == undefined) parentNode.children = [];
                    parentNode.children.push(data);
                    this.toastr.success('Added Lexical Concept', '', {timeOut : 5000});
                    this.skosTree.treeModel.update()
                    this.skosTree.treeModel.getNodeBy(y => {
                      if (y.data.lexicalConcept != undefined) {    
                        if (y.data.lexicalConcept === data.lexicalConcept) {
                          y.setActiveAndVisible();
                          return true;
                        } else {
                          return false;
                        }
                      } else {
                        return false;
                      }
                    })
                    setTimeout(() => {
                      this.counter = this.skosTree.treeModel.nodes.length;
                    }, 1000);
                  }
                }
              );
            }else{
              this.conceptService.updateSemanticRelation(parameters).pipe(takeUntil(this.destroy$)).subscribe(
                data=> {
                  console.log(data);
                },error=>{
                  console.log(error);
                  if(error.status == 200){
                    if(parentNode.children == undefined) parentNode.children = [];
                    parentNode.children.push(data);
                    this.toastr.success('Added Lexical Concept', '', {timeOut : 5000});
                    this.skosTree.treeModel.update()
                    this.skosTree.treeModel.getNodeBy(y => {
                      if (y.data.lexicalConcept != undefined) {    
                        if (y.data.lexicalConcept === data.lexicalConcept) {
                          y.setActiveAndVisible();
                          return true;
                        } else {
                          return false;
                        }
                      } else {
                        return false;
                      }
                    })
                    setTimeout(() => {
                      this.counter = this.skosTree.treeModel.nodes.length;
                    }, 1000);
                  }
                }
              );
            }
            
            

            /* this.skos_nodes.push(data);
            this.updateTreeView();
            this.skosTree.treeModel.update();
            this.skosTree.treeModel.getNodeById(data.id).setActiveAndVisible(); */
          }
  
        }, error => {
          console.log(error)
          this.toastr.error('Error when creating new Concept Set', '', {
            timeOut: 5000,
          });
        }
      )

      /* let parameters = {
        relation : relation,
        source : //nuovo lexical concept,
        target : //conceptSet target
      }
      this.conceptService.updateSchemeProperty() */
    }
    
  }

  addNewConceptSet() {
    this.conceptService.createNewConceptSet().pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data);
        if (data != undefined) {
          this.toastr.info('New Concept Set added', '', {
            timeOut: 5000,
          });
          data['hasChildren'] = true;
          this.skos_nodes.push(data);
          this.updateTreeView();
          this.skosTree.treeModel.update();
          this.skosTree.treeModel.getNodeById(data.id).setActiveAndVisible();
        }

      }, error => {
        console.log(error)
        this.toastr.error('Error when creating new Concept Set', '', {
          timeOut: 5000,
        });
      }
    )
  }

}
