/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder, ValidatorFn, AbstractControl } from '@angular/forms';
import { TreeNode, TreeModel, TREE_ACTIONS, KEYS, IActionMapping, ITreeOptions } from '@circlon/angular-tree-component';
import { ModalComponent } from 'ng-modal-lib';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { AnnotatorService } from 'src/app/services/annotator/annotator.service';
import { DocumentSystemService } from 'src/app/services/document-system/document-system.service';
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
      
      if(node.data.rename_mode){
        $event.preventDefault();
      }/* else{
        TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event);
      } */
    },
    expanderClick: (tree, node, $event) => {
      if(node.data.rename_mode){
        $event.preventDefault();
      }else{
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
  selector: 'app-text-tree',
  templateUrl: './text-tree.component.html',
  styleUrls: ['./text-tree.component.scss'],
  providers: [DatePipe],
})

export class TextTreeComponent implements OnInit {
  @ViewChild('metadata_tags') metadata_tags_element: any;
  @ViewChild('treeText') treeText: any;
  @ViewChild(ContextMenuComponent) public basicMenu: ContextMenuComponent;
  
  @HostListener('document:click', ['$event'])
  clickout(event : MouseEvent) {
    if(this.renameNode_input != undefined){
      if(this.renameNode_input.nativeElement.contains(event.target)) {
        console.log("clicked inside");
        event.stopPropagation();
      } else {
        console.log("clicked outside");
        
        var that = this;

        setTimeout(() => {
          //@ts-ignore
          $('.input-tooltip').tooltip('hide');
          setTimeout(() => {
            that.treeText.treeModel.getNodeBy(
              item => {
                item.data.rename_mode = false;
              }
            )
          }, 100);
        }, 300);
      }
    }
  }
  
  show = false;
  nodes = [];

  renameNodeSelected : any;
  validName = null;
  searchIconSpinner = false;
  searchIconSpinner_input = false;
  selectedFileToCopy : any;
  selectedFileToCopyArray : any;
  selectedNodeId;
  selectedEpidocId;

  memoryMetadata = [];
  metadataForm = new FormGroup({
    element_id : new FormControl(null),
    metadata_array: new FormArray([], [Validators.required]),
  })
  
  
  metadata_array: FormArray;
  metadata_search : FormArray;

  
  options: ITreeOptions = {
    actionMapping,
    allowDrag: (node) => node.isLeaf,
    allowDrop: (element, { parent, index }) => {
      // return true / false based on element, to.parent, to.index. e.g.
      //console.log(element, parent, index, parent.data.type == 'folder')
      return parent.data.type == 'directory';
    },
    getNodeClone: (node) => ({
      ...node.data,
      id: v4(),
      name: `copy of ${node.data.name}`
    })
  };

  
/*   @ViewChild('renameFolderInput') renameFolder_input:ElementRef; 
  @ViewChild('renameFileInput') renameFile_input:ElementRef;  */
  @ViewChild('uploadFile') uploadFile_input:ElementRef; 
  @ViewChild('renameNodeInput') renameNode_input:ElementRef; 
  /* @ViewChild('renameFolderModel', {static: false}) renameFolderModal: ModalComponent; */
  @ViewChild('editMetadata', {static: false}) editMetadataModal: ModalComponent;
  
  date = this.datePipe.transform(new Date(), 'yyyy-MM-ddThh:mm');
  counter = 0;

  textFilterForm = new FormGroup({
    search_text : new FormControl(null),
    search_mode : new FormControl(null),
    import_date : new FormControl(this.date),
    date_mode : new FormControl(''),
    /* metadata_array : new FormArray([this.createMetadataItemSearch()]) */
  })

  initialValues;

  
  
  constructor(private lexicalService: LexicalEntriesService, private annotatorService : AnnotatorService, private expander : ExpanderService, private element: ElementRef, private documentService: DocumentSystemService, private renderer: Renderer2, private formBuilder: FormBuilder, private datePipe:DatePipe, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadTree();
    
    this.textFilterForm = this.formBuilder.group({
      search_text : new FormControl(null),
      search_mode : new FormControl('start'),
      import_date : new FormControl(this.date),
      date_mode : new FormControl('until'),
      metadata_array : new FormArray([])
    })

    this.onChanges();
    
    this.metadataForm = this.formBuilder.group({
      element_id : new FormControl(null),
      name : new FormControl(null),
      metadata_array: new FormArray([], [Validators.required]),
    });

    this.initialValues = this.textFilterForm.value
  }

  onChanges() {
    this.textFilterForm.valueChanges.pipe(debounceTime(500)).subscribe(searchParams => {
      console.log(searchParams)
      this.searchFilter(searchParams)
    })
  }
  
  onEvent = ($event: any) => {
    console.log($event);

    if ($event.eventName == 'activate' && $event.node.data.type != 'directory' && this.selectedNodeId != $event.node.data['element-id']) {
      this.selectedNodeId = $event.node.data['element-id'];
      this.selectedEpidocId = $event.node.data.metadata['itAnt_ID'];
      //@ts-ignore
      $("#epigraphyTabModal").modal("show");
      $('.modal-backdrop').appendTo('.epigraphy-tab-body');
      //@ts-ignore
      $('#epigraphyTabModal').modal({backdrop: 'static', keyboard: false})  
      $('body').removeClass("modal-open")
      $('body').css("padding-right", "");


      this.annotatorService.getIdText(this.selectedEpidocId);

      this.documentService.getContent(this.selectedNodeId).subscribe(
        data=>{

          //console.log("XML", data)
          let text = data.text;
          let object = {
            xmlString : text
          }

          let xmlDom = new DOMParser().parseFromString(text, "text/xml");

          this.annotatorService.getTokens(this.selectedNodeId).subscribe(
            data => {
    
              console.log(data)
              let element_id = this.selectedNodeId;
              let tokens = data.tokens;


              this.documentService.sendToEpigraphyTab({
                tokens : tokens,
                element_id : element_id,
                epidoc_id : this.selectedEpidocId,
                xmlDoc : xmlDom
              })

    
              if(!this.expander.isEditTabOpen() && !this.expander.isEpigraphyTabOpen()){
                if(!this.expander.isEditTabExpanded() && !this.expander.isEpigraphyTabExpanded()){
                  
                  this.expander.expandCollapseEpigraphy(true);
                  this.expander.openCollapseEpigraphy(true);
                }
              }else if(this.expander.isEditTabOpen() && !this.expander.isEpigraphyTabOpen()){
                if(this.expander.isEditTabExpanded() && !this.expander.isEpigraphyTabExpanded()){
                  this.expander.openCollapseEpigraphy(true);
                  this.expander.expandCollapseEdit(false);
                }
              }
    
              let metadata = $event.node.data.metadata;
              metadata['path'] = $event.node.data.path;
              metadata['element-id'] = $event.node.data['element-id'];
              if(metadata != undefined && Object.keys(metadata).length > 5){
                this.documentService.sendToMetadataPanel(metadata);
                this.documentService.triggerMetadataPanel(true)
              }else{
                this.documentService.sendToMetadataPanel(null);
                this.documentService.triggerMetadataPanel(false)
              }
            },
            error => {
              console.log(error)
            }
          );

          this.documentService.sendLeidenToEpigraphyTab(null);
          this.documentService.testConvert(object).subscribe(
            data=>{
              //console.log("TEST", data);
              
              if(data != undefined){
                try {
                  let raw = data.xml;
                  let HTML =  new DOMParser().parseFromString(raw, "text/html");
                  console.log(HTML)

                  let domNodes = new DOMParser().parseFromString(raw, "text/html").querySelectorAll('#edition .textpart');
                  let childNodes = [];
                  if(Array.from(domNodes).length > 1){
                    Array.from(domNodes).forEach(childNode=> {
                      Array.from(childNode.childNodes).forEach(subChild => {
                        Array.from(subChild.childNodes).forEach(x => {
                          childNodes.push(x)
                        })
                      })
                    })
                  }else{
                    childNodes = Array.from(new DOMParser().parseFromString(raw, "text/html").querySelectorAll('#edition .textpart')[0].childNodes[0].childNodes);
                  }
                  
                  
                  
                  let leidenLines = []; 

                  for(var i = 0; i < childNodes.length; i++){
                    let node = childNodes[i];

                    if(node.nodeName == 'A' || node.nodeName == 'BR'){
                      
                      let string = '';
                      //console.log("LINE BREAK: " + i)
                      for(var j = i; j < childNodes.length; j++){

                        let textNode = childNodes[j];
                        
                        if(textNode.nodeName == '#text' && textNode.nodeValue.trim() != ''){

                          string += textNode.nodeValue;

                          if(j == childNodes.length-1){
                            leidenLines.push(string);
                            break;
                          }

                          //console.log(textNode.nodeValue)
                        }else if((textNode.nodeName == 'BR' || textNode?.id?.toLowerCase().includes('face'))&& i != j){
                          leidenLines.push(string)
                          
                          i = j-1;
                          break;
                        }

                        if(j == childNodes.length-1 && string != ''){
                          leidenLines.push(string);
                          break;
                        }
                      }
                    }
                  }

                  this.documentService.sendLeidenToEpigraphyTab(leidenLines);


                  let translations = new DOMParser().parseFromString(raw, "text/html").querySelectorAll('#translation');
                  let translationArray = [];            
                  translations.forEach(element=>{
                    let childNodes = element.childNodes;
                    let string = '';
                    childNodes.forEach((child : any) =>{
                      if(child.nodeName == 'P'){
                        
                        string += child.innerHTML;
                      }
                    })
                    translationArray.push(string)
                  })
                  
                  this.documentService.sendTranslationToEpigraphyTab(translationArray);

                } catch (error) {
                  console.log(error)
                  
                }
              } 
            },error =>{
              console.log("ERROR TEST", error)
              this.documentService.sendLeidenToEpigraphyTab(null);
              this.documentService.sendTranslationToEpigraphyTab(null);
            }
          )

        },error=>{
          console.log(error)
        }
      )

      
      
      
      

      /* this.annotatorService.getText(this.selectedNodeId).subscribe(
        data=>{
          console.log(data);
          if(data != undefined){
            this.documentService.sendTextToEpigraphyTab(data.text);
          }
        },
        error=>{
          if(error.status == 200){
            if(error.error.text != ""){
              this.documentService.sendTextToEpigraphyTab(error.error.text);
            }  
          }
          console.log(error)
        }
      ) */

      
    
    }
  }

  

  onMoveNode($event) {
    console.log($event);
    let node_type = $event.node.type;
    let target_type = $event.to.parent.type;
    if(node_type === 'directory' && target_type === 'directory'){
      this.moveFolder($event)
    }else if(node_type === 'file' && target_type === 'directory'){
      this.moveFile($event)
    }
    
  }

  loadTree(){
    this.documentService.getDocumentSystem().subscribe(
      data => {
        console.log(data);

        if(data['documentSystem'].length != 0){
          //console.log("CIAO")
          this.nodes = data['documentSystem'];
          setTimeout(() => {
            this.treeText.treeModel.getNodeBy(
              item => {
                item.data.rename_mode = false;
              }
            )
          }, 100);
        }
        
        
        this.counter = data['results'];
      },
      error => {
        console.log(error)
      }
    )
  }

  

  isFolder = (item : any) : boolean =>{
    if(item.type != undefined){
      return item.type == 'directory' && (this.treeText.treeModel.activeNodes.length == 1 || this.treeText.treeModel.activeNodes.length == 0);
    }else{
      return false
    }
  }

  isFile = (item : any) : boolean =>{
    if(item.type != undefined){
      return item.type == 'file' && (this.treeText.treeModel.activeNodes.length == 1 || this.treeText.treeModel.activeNodes.length == 0);
    }else{
      return false
    }
  }

  enableMetadata = (item : any) : boolean => {
    return (item.type == 'file' || item.type == 'folder') && (this.treeText.treeModel.activeNodes.length == 1 || this.treeText.treeModel.activeNodes.length == 0);
  }

  multipleSelection = (item : any): boolean =>{
    //console.log(this.treeText.treeModel.activeNodes)
    return this.treeText.treeModel.activeNodes.length > 1;
  }

  noRoot(item : any){
    return item.name != 'root';
  }

  isFolderMultiple = (item : any) : boolean => {
    if(this.selectedFileToCopyArray != undefined){
      return item.type == 'directory' && this.selectedFileToCopyArray.length > 1;
    }else{
      return false;
    }
  }

  pasteElementsReq = (item : any) : boolean => {
    if(this.selectedFileToCopyArray != undefined){
      return this.selectedFileToCopyArray.length > 1;
    }else{
      return false;
    }
    
  }

  pasteElements(item){
    console.log(item)
    let target_element_id = item['element-id']
    if(this.selectedFileToCopyArray != undefined){
      this.selectedFileToCopyArray.forEach((element : any) => {
        if(element.data.type == 'file'){

          let parameters = {
            "requestUUID": "string",
            "user-id": 0,
            "element-id": element?.data['element-id'],
            "target-id": target_element_id
          }

          this.documentService.copyFileTo(parameters).subscribe(
            data=>{
              console.log(data);
              //this.nodes = data['documentSystem'];
              this.toastr.info('File '+ element?.data?.name +' copied', '', {
                timeOut: 5000,
              });
              this.treeText.treeModel.getNodeBy(x => {
                if(x.data['element-id'] === target_element_id){
                  console.log('entrato')
                  x.expand();
      
                  let node = {
                    children : element?.data.children,
                    "element-id" : element?.data['element-id']+123213,
                    id : element?.data?.id+1232312,
                    metadata : element?.data?.metadata,
                    name : element?.data?.name,
                    path : element?.data?.path,
                    rename_mode : false,
                    type : element?.data?.type
                  }
                  
                  x.data.children.push(node)
                    setTimeout(() => {
                      this.counter = this.nodes.length;
                      this.updateTreeView();
                      this.treeText.treeModel.update();
                      //this.treeText.treeModel.getNodeById(node.id).setActiveAndVisible();
                    }, 100);
                  }
                })              
      
                this.treeText.treeModel.update()
              
                this.selectedFileToCopyArray = null;
            },error=>{
              //console.log(error)
              this.selectedFileToCopyArray = null;
            }
          )
        }else{
          this.toastr.error('You can\'t copy folder, please select only files or move entire folder', 'Error', {
            timeOut: 5000
          })
        }
      });
    }
  }

  copyElements(){
    this.selectedFileToCopy = null;
    this.selectedFileToCopyArray = this.treeText.treeModel.activeNodes;
  }
  
  removeElements(){
    let selected_elements = Array.from(this.treeText.treeModel.activeNodes);
    selected_elements.forEach(
      (elements : any) => {
        try {
          let data_node = elements.data;
          let parameters = {
            "requestUUID" : "string",
            "user-id" : 0,
            "element-id" : data_node['element-id'],
          }

          if(data_node.type == 'file'){
            this.documentService.removeFile(parameters).subscribe(
              data=>{
                console.log(data);
                this.toastr.info('File '+ data_node.name +' deleted', '', {
                  timeOut: 5000,
                });
                
                //this.nodes = data['documentSystem'];
                this.lexicalService.sendToAttestationPanel(null);
                this.documentService.sendToEpigraphyTab(null)
                this.expander.expandCollapseEpigraphy(false);
                this.expander.openCollapseEpigraphy(false);

                if(this.expander.isEditOpen){
                  this.expander.expandCollapseEdit(true);
                }
      
                this.documentService.sendToMetadataPanel(null)
                
                /* expandedNodes.forEach( (node: TreeNode) => {
                
                  setTimeout(() => {
                    this.treeText.treeModel.getNodeBy(x => {
                      if(x.data['element-id'] === node.data['element-id']){
                        x.expand()
                      }
                    })              
                  }, 300);
                }) */
      
                this.treeText.treeModel.getNodeBy(x => {
                  if(x.data['element-id'] === data_node['element-id']){
                    x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1)
                  }
                })
      
                this.treeText.treeModel.update()
      
                setTimeout(() => {
                  console.log(this.nodes)
                  this.counter = this.nodes.length;
                }, 100);
                
                
              },error=>{
                console.log(error)
                if(typeof(error.error) == 'string'){
                  this.toastr.info(error.error, '', {
                    timeOut: 5000,
                  });
                }
                
              }
            )
          }else if(data_node.type == 'directory'){
            this.documentService.removeFolder(parameters).subscribe(
              data=>{
                console.log(data);
                
                this.toastr.info('Folder ' + data_node.name + ' removed correctly', 'Info', {
                  timeOut: 5000
                })
      
                this.treeText.treeModel.getNodeBy(x => {
                  if(x.data['element-id'] === data_node['element-id']){
                    x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1)
                  }
                })
      
                this.treeText.treeModel.update()
      
                setTimeout(() => {
                  console.log(this.nodes)
                  this.counter = this.nodes.length;
                }, 100);
                
                
              },error=>{
                console.log(error)
                this.toastr.error('Something went wront ', 'Error', {
                  timeOut: 5000
                })
                if(typeof(error.error) == 'string'){
                  this.toastr.info(error.error, '', {
                    timeOut: 5000,
                  });
                }
              }
            )
          }

          
        } catch (error) {
          
        }
        

      }
    )
  }

  createNewFile(evt){
    if(evt != undefined){
      console.log(evt)
      let element_id = evt['element-id'];
      let parameters = {
        requestUUID : "string",
        "user-id" : 0,
        "element-id" : element_id,
        filename : "new_file"+Math.floor(Math.random() * (99999 - 10) + 10)
      }

      this.documentService.createFile(parameters).subscribe(
        data =>{
          console.log(data)
          this.treeText.treeModel.getNodeBy(x => {
            if(x.data['element-id'] === element_id){
              x.expand()
              
              this.toastr.info('New file added', '', {
                timeOut: 5000,
              });
              console.log(x)
              x.data.children.push(data.node)
              setTimeout(() => {
                this.counter = this.nodes.length;
                this.updateTreeView();
                this.treeText.treeModel.update();
                this.treeText.treeModel.getNodeById(data.node.id).setActiveAndVisible();
              }, 100);
              
            }
          })
        },error=> {
          console.log(error)
        }
      )
    }
  }
  

  addFolder(evt){
    if(evt != undefined){
      let element_id = evt['element-id'];
      let parameters = {
        "requestUUID" : "string",
        "user-id" : 0,
        "element-id" : element_id
      }
      
      const expandedNodes = this.treeText.treeModel.expandedNodes;
      
      this.documentService.addFolder(parameters).subscribe(
        data=>{
          console.log(data)
          this.toastr.info('New folder added', '', {
            timeOut: 5000,
          });
          this.treeText.treeModel.getNodeBy(x => {
            if(x.data['element-id'] === element_id){
              x.expand()

              let element_id_new_node = data.node['element-id'];
              let id_new_node = Math.floor(Math.random() * (9728157429307 - 1728157429307) + 1728157429307);
              let new_node = {
                "children" : [],
                "element-id" : element_id_new_node,
                "id" : id_new_node,
                "metadata" : {},
                "path" : "",
                "name" : data.node.name,
                "type" : "directory",
                "rename_mode" : false
              }
              console.log(x)
              x.data.children.push(new_node);
              
              setTimeout(() => {
                this.updateTreeView();
                this.treeText.treeModel.update();
                this.treeText.treeModel.getNodeById(id_new_node).setActiveAndVisible();
              }, 100);
              
            }
          }) 
          
        },error=>{
          console.log(error)
        }
      )
    }
  }

  addFile(evt){
    console.log(evt)
    let element_id = this.uploadFile_input.nativeElement['element-id'];
    this.selectedFileToCopy = null;
    let file_name, parameters;

    if(evt.target.files != undefined){
      if(evt.target.files.length == 1){
        file_name = evt.target.files[0].name;
        parameters = {
          "requestUUID" : "string",
          "user-id" : 0,
          "element-id" : element_id,
          "file-name" : file_name
        }
        const formData = new FormData();
        formData.append('file', evt.target.files[0])
        this.documentService.uploadFile(formData, element_id, 11).subscribe(
          data=>{
            console.log(data)
           
            this.treeText.treeModel.getNodeBy(x => {
              if(x.data['element-id'] === element_id){
                x.expand()
                
                this.toastr.info('New file added', '', {
                  timeOut: 5000,
                });
                console.log(x)
                x.data.children.push(data.node)
                setTimeout(() => {
                  this.counter = this.nodes.length;
                  this.updateTreeView();
                  this.treeText.treeModel.update();
                  this.treeText.treeModel.getNodeById(data.node.id).setActiveAndVisible();
                }, 100);
                
              }
            })    
            
            
            
          },error=>{
            console.log(error)
          }
        )
      }else{
        let files_array = evt.target.files;
        Array.from(files_array).forEach((element : any) => {

          file_name = element.name;
          parameters = {
            "requestUUID": "string",
            "user-id": 0,
            "element-id": element_id,
            "file-name": file_name
          }

          const formData = new FormData();
          formData.append('file', element);

          this.documentService.uploadFile(formData, element_id, 11).subscribe(
            data => {
              console.log(data)
              this.treeText.treeModel.getNodeBy(x => {
                if(x.data['element-id'] === element_id){
                  x.expand()
                  
                  this.toastr.info('New file added', '', {
                    timeOut: 5000,
                  });
                  console.log(x)
                  x.data.children.push(data.node)
                  setTimeout(() => {
                    this.counter = this.nodes.length;
                    this.updateTreeView();
                    this.treeText.treeModel.update();
                    this.treeText.treeModel.getNodeById(data.node.id).setActiveAndVisible();
                  }, 100);
                  
                }
              })



            }, error => {
              console.log(error);
              this.toastr.error('Error when adding new file', '', {
                timeOut: 5000,
              });
            }
          )
        });
      }
    }
        
    console.log(parameters)
    const expandedNodes = this.treeText.treeModel.expandedNodes;
    
  }

  triggerUploader(evt){
    let element_id = evt['element-id']
    this.renderer.setProperty(this.uploadFile_input.nativeElement, 'element-id', element_id)
    this.uploadFile_input.nativeElement.click();
    
  }

  copyFile(evt){
    console.log(evt);
    this.selectedFileToCopy = evt;
    this.selectedFileToCopyArray = null;
  }

  pasteFile(evt){
    console.log(evt)
    let element_id_target = evt['element-id'];
    let element_id_source = this.selectedFileToCopy['element-id'];
    let parameters = {
      "requestUUID": "string",
      "user-id": 0,
      "element-id": element_id_source,
      "target-id": element_id_target
    }
            
    this.documentService.copyFileTo(parameters).subscribe(
      data=>{
        console.log(data);
        //this.nodes = data['documentSystem'];
        this.toastr.info('File '+ evt['name'] +' copied', '', {
          timeOut: 5000,
        });
        this.treeText.treeModel.getNodeBy(x => {
          if(x.data['element-id'] === element_id_target){
            console.log('entrato')
            x.expand();

            let node = {
              children : this.selectedFileToCopy.children,
              "element-id" : this.selectedFileToCopy['element-id'],
              id : this.selectedFileToCopy.id+1232312,
              metadata : this.selectedFileToCopy.metadata,
              name : this.selectedFileToCopy.name,
              path : '',
              rename_mode : false,
              type : this.selectedFileToCopy.type
            }
            
            x.data.children.push(node)
              setTimeout(() => {
                this.counter = this.nodes.length;
                this.updateTreeView();
                this.treeText.treeModel.update();
                this.treeText.treeModel.getNodeById(node.id).setActiveAndVisible();
              }, 100);
            }
          })              

          this.treeText.treeModel.update()
        
          this.selectedFileToCopy = null;
      },error=>{
        //console.log(error)
        this.selectedFileToCopy = null;
      }
    )
    

  }

  downloadFile(evt){
    console.log(evt)
    let element_id = evt['element-id'];
    let parameters = {
      "requestUUID": "string",
      "user-id": 0,
      "element-id": element_id,
    }
            
    this.documentService.downloadFile(parameters).subscribe(
      data=>{
        console.log(data);
        this.toastr.info('File '+ evt['name'] +' downloaded', '', {
          timeOut: 5000,
        });
        
      },error=>{
        //console.log(error)
      }
    )
  }
  
  removeFile(evt){
    this.selectedFileToCopy = null;
    if(evt != undefined){
      let element_id = evt['element-id'];
      let parameters = {
        "requestUUID" : "string",
        "user-id" : 0,
        "element-id" : element_id,
      }


      const expandedNodes = this.treeText.treeModel.expandedNodes;

      this.documentService.removeFile(parameters).subscribe(
        data=>{
          console.log(data);
          this.toastr.info('File '+ evt['name'] +' deleted', '', {
            timeOut: 5000,
          });
          
          //this.nodes = data['documentSystem'];
          this.lexicalService.sendToAttestationPanel(null);
          this.documentService.sendToEpigraphyTab(null)
          this.expander.expandCollapseEpigraphy(false);
          this.expander.openCollapseEpigraphy(false);

          this.documentService.sendToMetadataPanel(null)

          if(this.expander.isEditOpen){
            this.expander.expandCollapseEdit();
          }
          
          /* expandedNodes.forEach( (node: TreeNode) => {
          
            setTimeout(() => {
              this.treeText.treeModel.getNodeBy(x => {
                if(x.data['element-id'] === node.data['element-id']){
                  x.expand()
                }
              })              
            }, 300);
          }) */

          this.treeText.treeModel.getNodeBy(x => {
            if(x.data['element-id'] === element_id){
              x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1)
            }
          })

          this.treeText.treeModel.update()

          setTimeout(() => {
            console.log(this.nodes)
            this.counter = this.nodes.length;
          }, 100);
          
          
        },error=>{
          console.log(error)
          if(typeof(error.error) == 'string'){
            this.toastr.info(error.error, '', {
              timeOut: 5000,
            });
          }
          
        }
      )
    }
  }
  


  removeFolder(evt){
    if(evt != undefined){
      let element_id = evt['element-id'];
      let parameters = {
        "requestUUID" : "string",
        "user-id" : 0,
        "element-id" : element_id
      }
      this.toastr.info('Folder '+ evt['name'] +' deleted', '', {
        timeOut: 5000,
      });
      const expandedNodes = this.treeText.treeModel.expandedNodes;

      this.documentService.removeFolder(parameters).subscribe(
        data=>{
          console.log(data);
          
          //this.nodes = data['documentSystem'];
          /* expandedNodes.forEach( (node: TreeNode) => {
          
            setTimeout(() => {
              this.treeText.treeModel.getNodeBy(x => {
                if(x.data['element-id'] === node.data['element-id']){
                  x.expand()
                }
              })              
            }, 300);
          }) */

          this.treeText.treeModel.getNodeBy(x => {
            if(x.data['element-id'] === element_id){
              x.parent.data.children.splice(x.parent.data.children.indexOf(x.data), 1)
            }
          })

          this.treeText.treeModel.update()

          setTimeout(() => {
            console.log(this.nodes)
            this.counter = this.nodes.length;
          }, 100);
          
          
        },error=>{
          console.log(error)
          if(typeof(error.error) == 'string'){
            this.toastr.info(error.error, '', {
              timeOut: 5000,
            });
          }
        }
      )
    }
  }

  moveFolder(evt){
    if(evt != undefined){
      //console.log(evt);
      let element_id = evt.node['element-id'];
      let target_id = evt.to.parent['element-id'];
      let parameters = {
        "requestUUID": "string",
        "user-id": 0,
        "element-id": element_id,
        "target-id": target_id
      }
            
      
      this.documentService.moveFolder(parameters).subscribe(
        data=>{
          this.toastr.info('Folder '+ evt.node['name'] +' moved', '', {
            timeOut: 5000,
          });
          /* //console.log(data); */
        },error=>{
          console.log(error)
        }
      )
    }
  }

  moveFile(evt){
    if(evt != undefined){
      console.log(evt);
      let element_id = evt.node['element-id'];
      let target_id = evt.to.parent['element-id'];
      let parameters = {
        "requestUUID": "string",
        "user-id": 0,
        "element-id": element_id,
        "target-id": target_id
      }
            
      
      this.documentService.moveFileTo(parameters).subscribe(
        data=>{
          console.log(data);
          this.toastr.info('File '+ evt.node['name'] +' moved', '', {
            timeOut: 5000,
          });
          
        },error=>{
          //console.log(error)
        }
      )
    }
  }

  renameNode(evt){
    setTimeout(() => {
      this.renameNode_input.nativeElement.focus();
      //@ts-ignore
      $('.input-tooltip').tooltip({
          trigger: 'hover'
      });
    }, 300);
    console.log(evt)
    
    this.treeText.treeModel.getNodeBy(
      node => {
        if(node.data['element-id'] == evt['element-id']){
          node.data.rename_mode = true;
          
        }else{
          node.data.rename_mode = false;
        }
      }
    )
  }

  onRenamingNode(evt, node, new_value){
    console.log(evt, node);
    setTimeout(() => {
      //@ts-ignore
      $('.input-tooltip').tooltip({
          trigger: 'hover'
      });
    }, 300);
    switch(evt.key){
      case 'Enter' : this.updateNodeName(node, new_value); break;
      case 'Escape': this.exitRenamingMode(); break;
      default: console.log(evt)
    }
    
  }

  updateNodeName(node, new_value){
    this.searchIconSpinner_input = true;
    let node_type = node.data.type;

    if(new_value.match(/^[A-Za-z-_0-9. ]{3,}$/)){
      let element_id = node.data['element-id'];
      let parameters = {
        "requestUUID": "string",
        "user-id": 0,
        "element-id": element_id,
        "rename-string": new_value
      }

      if(node_type == 'directory'){
        
        this.documentService.renameFolder(parameters).subscribe(
          data=> {
            //console.log(data);
            this.toastr.info('Folder '+ node.data.name +' renamed', '', {
              timeOut: 5000,
            });
            setTimeout(() => {
              this.treeText.treeModel.getNodeBy(x => {
                if(x.data['element-id'] === element_id){
                  x.data.name = new_value;
                }
              })              
            }, 300);
            this.searchIconSpinner_input = false;
            this.renameNode_input.nativeElement.value = '';
            var that = this;

            setTimeout(() => {
              //@ts-ignore
              $('.input-tooltip').tooltip('hide');
              setTimeout(() => {
                that.treeText.treeModel.getNodeBy(
                  item => {
                    item.data.rename_mode = false;
                  }
                )
              }, 100);
            }, 100);
          },error=>{
            console.log(error)
            var that = this;

            setTimeout(() => {
              //@ts-ignore
              $('.input-tooltip').tooltip('hide');
              setTimeout(() => {
                that.treeText.treeModel.getNodeBy(
                  item => {
                    item.data.rename_mode = false;
                  }
                )
              }, 100);
            }, 100);
          }
        )

      }else if(node_type == 'file'){
        this.documentService.renameFile(parameters).subscribe(
          data=> {
            this.toastr.info('File renamed', '', {
              timeOut: 5000,
            });
            //console.log(data);
            setTimeout(() => {
              this.treeText.treeModel.getNodeBy(x => {
                if(x.data['element-id'] === element_id){
                  x.data.name = new_value;
                }
              })              
            }, 300);
            this.searchIconSpinner_input = false;
            this.renameNode_input.nativeElement.value = '';
            var that = this;

            setTimeout(() => {
              //@ts-ignore
              $('.input-tooltip').tooltip('hide');
              setTimeout(() => {
                that.treeText.treeModel.getNodeBy(
                  item => {
                    item.data.rename_mode = false;
                  }
                )
              }, 100);
            }, 100);
          },error=>{
            console.log(error)
            var that = this;

            setTimeout(() => {
              //@ts-ignore
              $('.input-tooltip').tooltip('hide');
              setTimeout(() => {
                that.treeText.treeModel.getNodeBy(
                  item => {
                    item.data.rename_mode = false;
                  }
                )
              }, 100);
            }, 100);
          }
        )
      }
    }
    
  }

  exitRenamingMode(){
    var that = this;

    setTimeout(() => {
      //@ts-ignore
      $('.input-tooltip').tooltip('hide');
      setTimeout(() => {
        
        that.searchIconSpinner_input = false;
        that.treeText.treeModel.getNodeBy(
          item => {
            item.data.rename_mode = false;
          }
        )
      }, 100);
    }, 300);
  }

  saveMetadata(){
    console.log(this.metadata_array.value)
    let element_id = this.metadataForm.get('element_id').value;
    let name = this.metadataForm.get('name').value;
    let parameters = {
      "requestUUID": "string",
      "metadata": {},
      "user-id": 0,
      "element-id": element_id
    };
    
    this.metadata_array.value.forEach(element => {
      parameters.metadata[element.key] = element.value
    });

    const expandedNodes = this.treeText.treeModel.expandedNodes;

    this.documentService.updateMetadata(parameters).subscribe(
      data=> {
        this.toastr.info('Metadata updated for ' + name + ' node' , '', {
          timeOut: 5000,
        });
        //console.log(data);
        this.nodes = data['documentSystem'];
        expandedNodes.forEach( (node: TreeNode) => {
          
          setTimeout(() => {
            this.treeText.treeModel.getNodeBy(x => {
              if(x.data['element-id'] === node.data['element-id']){
                x.setActiveAndVisible()
              }
            })              
          }, 300);
        })
      },error =>{
        console.log(error)
      }
    )
  }

  removeMetadataItem(index){
    this.metadata_array = this.metadataForm.get('metadata_array') as FormArray;
    let name = this.metadata_array.at(index).get('key').value;
    this.toastr.info('Metadata deleted for ' + name + ' node' , '', {
      timeOut: 5000,
    });
    this.memoryMetadata.splice(index, 1)
    this.metadata_array.removeAt(index);
    this.metadataForm.markAsTouched();
    
  }

  addMetadata(k?, v?){
    this.metadata_array = this.metadataForm.get('metadata_array') as FormArray;

    if (k == undefined) {
      this.metadata_array.push(this.createMetadataItem());
    } else {
      this.metadata_array.push(this.createMetadataItem(k, v));
    }
  }

  onCloseRemoveMetadata(){
    this.selectedFileToCopy = null;
  }

  deleteMetadata(){
    let element_id = this.selectedFileToCopy['element-id'];
    let name = this.selectedFileToCopy['name'];
    let parameters = {
      "requestUUID": "string",
      "user-id": 0,
      "element-id": element_id
    }
    
    const expandedNodes = this.treeText.treeModel.expandedNodes;

    this.documentService.deleteMetadata(parameters).subscribe(
      data=> {
        //console.log(data);
        this.toastr.info('Metadata deleted for ' + name + ' node' , '', {
          timeOut: 5000,
        });
        this.nodes = data['documentSystem'];
        expandedNodes.forEach( (node: TreeNode) => {
          
          setTimeout(() => {
            this.treeText.treeModel.getNodeBy(x => {
              if(x.data['element-id'] === node.data['element-id']){
                x.setActiveAndVisible()
              }
            })              
          }, 300);
        })
      },error =>{
        console.log(error)
      }
    )
  }

  onCloseModal(){
    this.metadataForm.markAsUntouched();
    this.metadata_array.clear();
    this.memoryMetadata = [];
  }

  populateMetadata(item : any){
    let element_id = item['element-id'];
    let name = item['name'];
    this.metadataForm.get('name').setValue(name, {emitEvent : false})
    this.metadataForm.get('element_id').setValue(element_id, {emitEvent : false});
    this.editMetadataModal.show();

    this.metadata_array = this.metadataForm.get('metadata_array') as FormArray;
    this.metadata_array.clear();
    this.memoryMetadata = [];

    if(Object.keys(item.metadata).length != 0){
      for (const [key, value] of Object.entries(item.metadata)) {
        console.log(`${key}: ${value}`);
        this.addMetadata(key, value)
      }
    }else{
      null;
    }
    
  }

  createMetadataItem(k?, v?){
    if(k != undefined){
      return this.formBuilder.group({
        key: new FormControl(k, [Validators.required, Validators.minLength(0)]),
        value: new FormControl(v, [Validators.required, Validators.minLength(0)])
      })
    }else{
      return this.formBuilder.group({
        key: new FormControl('', [Validators.required, Validators.minLength(0), this.uniqueIdValidator.bind(this)]),
        value: new FormControl('', [Validators.required, Validators.minLength(0)])
      })
    }
  }

  uniqueIdValidator(control: FormControl) {
    /* console.log(control)
    console.log(this.metadata_array) */
    if(control.value != ''){
      if (this.metadata_array.value.find(item => item.key === control.value)) {
        return { duplicate: true };
      } else {
        return null;
      }
    }else{
      return null
    }
    
  }

  updateTreeView() {
    setTimeout(() => {
      //@ts-ignore
      $('.input-tooltip').tooltip({
          trigger: 'hover'
      });
    }, 300);
    
    setTimeout(() => {
      this.treeText.sizeChanged();
      //@ts-ignore
      $('.lexical-tooltip').tooltip();
    }, 1000);
  }

  resetFields(){
    
    this.textFilterForm.reset(this.initialValues, {emitEvent : false});
    setTimeout(() => {
      this.loadTree();
      this.treeText.treeModel.update();
      this.updateTreeView();
      
    }, 500);  
    
  }

  searchFilter(newPar) {
    
    setTimeout(() => {
      const viewPort_prova = this.element.nativeElement.querySelector('tree-viewport') as HTMLElement;
      viewPort_prova.scrollTop = 0
    }, 300);

    let search_text = newPar.search_text != null ? newPar.search_text : '';
    let date_pipe = this.datePipe.transform(newPar.import_date, 'yyyy-MM-ddThh:mm:ss.zzzZ')
    this.searchIconSpinner = true;
    let parameters = {
      "requestUUID" : "string",
      "contains" : newPar.search_mode == 'contains' ? true : false,
      "metadata" : {},
      "search-text": search_text,
      "start-with" : newPar.search_mode == 'start' ? true : false,
      "user-id": 0,
      "import-date": date_pipe,
      "exact-date": newPar.date_mode == 'exact' ? true : false,
      "from-date":  newPar.date_mode == 'from' ? true : false,
      "util-date":  newPar.date_mode == 'until' ? true : false
    };
    
    console.log(parameters)
    
    this.documentService.searchFiles(newPar).subscribe(
      data => {
        if(data['files'].length > 0){
          this.show = false;
        }else {
          this.show = true;
        }
        this.nodes = data['files'];
        this.counter = data['results'];
        this.treeText.treeModel.update();
        this.updateTreeView();
        this.searchIconSpinner = false;
        
      },
      error => {
        console.log(error)
        this.searchIconSpinner = false;

        this.toastr.error('Error on search text', 'Error', {
          timeOut : 5000
        })
      }
    )
  }

  addTagFn(name) {
    return { name: name, tag: true };
  }

  triggerMetadata(){
    console.log(this.metadata_tags_element.selectedItems)
  }

}

