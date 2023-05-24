/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';
import { DocumentSystemService } from 'src/app/services/document-system/document-system.service';
import { TreeNode } from '@circlon/angular-tree-component';
import { ExpanderService } from 'src/app/services/expander/expander.service';
import {saveAs as importedSaveAs} from "file-saver";
import { Subject, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ConceptService } from 'src/app/services/concept/concept.service';


@Component({
  selector: 'app-document-system-tree',
  templateUrl: './document-system-tree.component.html',
  styleUrls: ['./document-system-tree.component.scss'],
})

export class DocumentSystemTreeComponent implements OnInit, OnDestroy {

  switcher = false;
  @ViewChild('lexTree') lexTree: any;
  @ViewChild('textTree') textTree: any;
  @ViewChild('conceptTree') conceptTree: any;
  @ViewChild('skosTree') skosTree: any;
  @ViewChild('accordion') accordion: ElementRef; 
  destroy$ : Subject<boolean> = new Subject();
  refresh_after_edit_subscription : Subscription;
  trigger_lex_tree_subscription : Subscription;

  constructor(private exp: ExpanderService, 
              private lexicalService: LexicalEntriesService, 
              private toastr: ToastrService, 
              private renderer: Renderer2, 
              private documentService: DocumentSystemService,
              private conceptService : ConceptService) { }

  ngOnInit(): void {
    this.refresh_after_edit_subscription = this.refresh_after_edit_subscription = this.lexicalService.refreshAfterEdit$.subscribe(
      data => {
        this.refreshAfterEdit(data);
      }
    )


    this.trigger_lex_tree_subscription = this.lexicalService.triggerLexicalEntryTree$.subscribe(
      (data:any)=> {
        setTimeout(() => {
          if(data != null){
            if(data.request){

              this.updateTreeParent();
              
              let lex = {
                request : 'form',
                lexicalEntry : data.data.lexicalEntry,

              }
              
              this.lexTree.parameters['text'] = data.data.lexicalEntryLabel;
              this.lexTree.lexicalEntriesFilter(this.lexTree.parameters);
              

              setTimeout(() => {
                this.lexicalService.addSubElementRequest({'lex' : lex, 'data' : data.data});

              }, 500);

              let a_link = this.accordion.nativeElement.querySelectorAll('button[data-target="#lexicalCollapse"]');
              let collapse_container = this.accordion.nativeElement.querySelectorAll('div[aria-labelledby="lexicalHeading"]');
              a_link.forEach(element => {
                if(element.classList.contains("collapsed")){
                  element.classList.remove('collapsed')
                }else{
                  //element.classList.add('collapsed')
                }
              })
  
              collapse_container.forEach(element => {
                if(element.classList.contains("show")){
                  //element.classList.remove('collapsed')
                }else{
                  element.classList.add('show')
                }
              })

              let a_link_epigraphy = this.accordion.nativeElement.querySelectorAll('button[data-target="#epigraphyCollapse"]');
              let collapse_container_epigraphy = this.accordion.nativeElement.querySelectorAll('div[aria-labelledby="epigraphyHeading"]');
              a_link.forEach(element => {
                if(!element.classList.contains("collapse")){
                  element.classList.add('collapsed')
                }
              })
  
              collapse_container_epigraphy.forEach(element => {
                if(element.classList.contains("show")){
                  element.classList.remove('show')
                }else{
                  //element.classList.add('show')
                }
              })
  
              
            }else{
              setTimeout(() => {
                let a_link = this.accordion.nativeElement.querySelectorAll('a[data-target="#lexicalCollapse"]');
                a_link.forEach(element => {
                  element.classList.add('collapsed')
                  
                })
  
                let collapse_container = this.accordion.nativeElement.querySelectorAll('div[aria-labelledby="lexicalHeading"]');
                collapse_container.forEach(element => {
                  console.log(element)
                  if(element.classList.contains("show")){
                    element.classList.remove('show')
                  }
                })
              }, 100);
              
            }
          }
        }, 100);
      },error=> {
        console.log(error)
      }
    )
  }

  updateTreeParent() {
    this.lexTree.updateTreeView();
  }

  switchLabel() {
    this.lexTree.labelView = !this.lexTree.labelView;
    this.lexTree.idView = !this.lexTree.idView;
    this.switcher = !this.switcher;
  }

  lexEdit(data) {

    var that = this;
    let instanceName = '';
    if (data['lexicalEntry'] != undefined && data['form'] == undefined && data['sense'] == undefined) {
      instanceName = data['lexicalEntry']
    } else if (data['form'] != undefined) {
      instanceName = data['form']
    } else if (data['sense'] != undefined) {
      instanceName = data['sense']
    } else if (data['etymology'] != undefined) {
      instanceName = data['etymology']
    };
    if (data['new_note'] != undefined) {

      
      setTimeout(() => {
        this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
          function (x) {
            if (data['lexicalEntry'] != undefined && data['form'] == undefined && data['sense'] == undefined) {
              if (x.data.lexicalEntry == instanceName) {

                x.data.note = data['new_note']
                that.lexTree.lexicalEntryTree.treeModel.update();
                that.lexTree.updateTreeView();

                //console.log(x)
                //@ts-ignore
                $('.note_' + x.data.id).attr('data-original-title', data['new_note']);

                data['new_note'] = undefined;
                return true;
              } else {
                return false;
              }
            } else if (data['form'] != undefined) {

              if (x.data.form == instanceName) {
                x.data.note = data['new_note']
                that.lexTree.lexicalEntryTree.treeModel.update();
                that.lexTree.updateTreeView();
                data['new_note'] = undefined;
                return true;
              } else {
                return false;
              }
            } else if (data['sense'] != undefined) {

              if (x.data.sense == instanceName) {
                x.data.note = data['new_note']
                that.lexTree.lexicalEntryTree.treeModel.update();
                that.lexTree.updateTreeView();
                data['new_note'] = undefined;
                return true;
              } else {
                return false;
              }
            }
            else if (data['etymology'] != undefined) {

              if (x.data.etymology == instanceName) {
                x.data.note = data['new_note']
                that.lexTree.lexicalEntryTree.treeModel.update();
                that.lexTree.updateTreeView();
                data['new_note'] = undefined;
                return true;
              } else {
                return false;
              }
            }
            else {
              return false;
            }
          }
        );
      }, 500);
    } else if (data['new_label'] != undefined) {
      //console.log("cambio label cambio tutto")
      //console.log(data)
      let instanceName = '';
      if (data['lexicalEntry'] != undefined && data['form'] == undefined) {
        instanceName = data['lexicalEntry']
      } else if (data['form'] != undefined) {
        instanceName = data['form']
      } else if (data['sense'] != undefined) {
        instanceName = data['sense']
      } else if (data['etymology'] != undefined) {
        instanceName = data['etymology']
      } else if (data['conceptSet'] != undefined){
        instanceName = data['conceptSet']
      }else if (data['lexicalConcept'] != undefined){
        instanceName = data['lexicalConcept']
      };
      
      setTimeout(() => {
        if(data['conceptSet'] == undefined && data['lexicalConcept'] == undefined){
          this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
            function (x) {
              if (data['lexicalEntry'] != undefined) {
                if (x.data.lexicalEntry == instanceName) {
                  x.data.label = data['new_label']
                  //x.setActiveAndVisible()
                  x.scrollIntoView();
                  data['new_label'] = undefined
                  return true;
                } else {
                  return false;
                }
              } else if (data['form'] != undefined) {
  
                if (x.data.form == instanceName) {
                  x.data.label = data['new_label']
                  //x.setActiveAndVisible()
                  x.scrollIntoView();
                  data['new_label'] = undefined
                  return true;
                } else {
                  return false;
                }
              } else if (data['sense'] != undefined) {
  
                if (x.data.sense == instanceName) {
                  x.data.label = data['new_label']
                  //x.setActiveAndVisible()
                  x.scrollIntoView();
                  data['new_label'] = undefined
                  return true;
                } else {
                  return false;
                }
              } else if (data['etymology'] != undefined) {
  
                if (x.data.etymology == instanceName) {
                  x.data.label = data['new_label']
                  //x.setActiveAndVisible()
                  x.scrollIntoView();
                  data['new_label'] = undefined
                  return true;
                } else {
                  return false;
                }
              }
              else {
                return false;
              }
            }
          );
        }else{
          this.skosTree.skosTree.treeModel.getNodeBy(
            function (x) {
              if (data['conceptSet'] != undefined) {
                if (x.data.conceptSet == instanceName) {
                  x.data.defaultLabel = data['new_label']
                  //x.setActiveAndVisible()
                  x.scrollIntoView();
                  data['new_label'] = undefined
                  return true;
                } else {
                  return false;
                }
              } else if (data['lexicalConcept'] != undefined) {
  
                if (x.data.lexicalConcept == instanceName) {
                  x.data.defaultLabel = data['new_label']
                  //x.setActiveAndVisible()
                  x.scrollIntoView();
                  data['new_label'] = undefined
                  return true;
                } else {
                  return false;
                }
              }
              else {
                return false;
              }
            }
          );
        }
        
      }, 500);
    } else if (data['new_type'] != undefined) {
      //console.log("cambio type cambio tutto")
      let instanceName = '';
      if (data['lexicalEntry'] != undefined) {
        instanceName = data['lexicalEntry']
      } else if (data['form'] != undefined) {
        instanceName = data['form']
      } else if (data['sense'] != undefined) {
        instanceName = data['sense']
      };
      setTimeout(() => {
        this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
          function (x) {
            if (data['lexicalEntry'] != undefined) {
              if (x.data.lexicalEntry == instanceName) {
                x.data.type = data['new_type']
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_type'] = undefined
                return true;

              } else {
                return false;
              }
            } else if (data['form'] != undefined) {

              if (x.data.form == instanceName) {
                x.data.type = data['new_type']
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_type'] = undefined
                return true;
              } else {
                return false;
              }
            } else if (data['sense'] != undefined) {

              if (x.data.seame == instanceName) {
                x.data.type = data['new_type']
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_type'] = undefined
                return true;
              } else {
                return false;
              }
            }
            else {
              return false;
            }
          }
        );
      }, 500);
    } else if (data['new_lang'] != undefined) {
      //console.log("cambio lang cambio tutto")
      let instanceName = '';
      if (data['lexicalEntry'] != undefined) {
        instanceName = data['lexicalEntry']
      } else if (data['form'] != undefined) {
        instanceName = data['form']
      } else if (data['sense'] != undefined) {
        instanceName = data['sense']
      };
      setTimeout(() => {
        this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
          function (x) {
            if (data['lexicalEntry'] != undefined) {
              if (x.data.lexicalEntry == instanceName) {
                x.data.language = data['new_lang']
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_lang'] = undefined
                return true;
              } else {
                return false;
              }
            } else if (data['form'] != undefined) {

              if (x.data.form == instanceName) {
                x.data.language = data['new_lang']
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_lang'] = undefined
                return true;
              } else {
                return false;
              }
            } else if (data['sense'] != undefined) {

              if (x.data.seame == instanceName) {
                x.data.language = data['new_lang']
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_lang'] = undefined
                return true;
              } else {
                return false;
              }
            }
            else {
              return false;
            }
          }
        );
      }, 500);
    } else if (data['new_pos'] != undefined) {
      //console.log("cambio pos cambio tutto")
      let instanceName = '';
      if (data['lexicalEntry'] != undefined) {
        instanceName = data['lexicalEntry']
      } else if (data['form'] != undefined) {
        instanceName = data['form']
      } else if (data['sense'] != undefined) {
        instanceName = data['sense']
      };
      setTimeout(() => {
        this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
          function (x) {
            if (data['lexicalEntry'] != undefined) {
              if (x.data.lexicalEntry == instanceName) {
                x.data.pos = data['new_pos'].split('#')[1]
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_pos'] = undefined
                return true;
              } else {
                return false;
              }
            } else if (data['form'] != undefined) {

              if (x.data.form == instanceName) {
                x.data.pos = data['new_pos'].split('#')[1]
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_pos'] = undefined
                return true;
              } else {
                return false;
              }
            } else if (data['sense'] != undefined) {

              if (x.data.sense == instanceName) {
                x.data.pos = data['new_pos'].split('#')[1]
                //x.setActiveAndVisible()
                x.scrollIntoView();
                data['new_pos'] = undefined
                return true;
              } else {
                return false;
              }
            }
            else {
              return false;
            }
          }
        );
      }, 500);
    } else if (data['new_status'] != undefined){
      setTimeout(() => {
        this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
          function (x) {
            if (data['lexicalEntry'] != undefined && data['form'] == undefined && data['sense'] == undefined) {
              if (x.data.lexicalEntry == instanceName) {

                x.data.status = data['new_status']
                that.lexTree.lexicalEntryTree.treeModel.update();
                that.lexTree.updateTreeView();

                

                return true;
              } else {
                return false;
              }
            } 
            else {
              return false;
            }
          }
        );
      }, 500);
    }

  }

  changeSenseDefinition(data) {
    var that = this;
    setTimeout(() => {
      that.lexTree.lexicalEntryTree.treeModel.getNodeBy(
        function (x) {
          if (x.data.sense != undefined) {
            if (x.data.sense == data['sense']) {
              
              x.data.definition = data['new_definition'] != '' ? data['new_definition'] : 'no definition';
              that.lexTree.lexicalEntryTree.treeModel.update();
              that.lexTree.updateTreeView();
              return true;
            } else {
              return false;
            }

          } else {
            return false;
          }
        }
      );
    }, 500);
  }

  changeFormLabel(data) {
    var that = this;
    setTimeout(() => {
      this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
        function (x) {
          if (x.data.form != undefined) {
            if (x.data.form == data['form']) {
              x.data.label = data['new_label'];
              that.lexTree.lexicalEntryTree.treeModel.update();
              that.lexTree.updateTreeView();
              return true;
            } else {
              return false;
            }

          } else {
            return false;
          }
        }
      );
    }, 500);
  }



  changeFormType(data) {
    var that = this;
    //console.log("prova")
    setTimeout(() => {
      this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
        function (x) {
          if (x.data.form != undefined) {
            if (x.data.form == data['form']) {
              x.data.type = data['new_type'];
              //console.log(x.data.note)
              that.lexTree.lexicalEntryTree.treeModel.update();
              that.lexTree.updateTreeView();
              return true;
            } else {
              return false;
            }

          } else {
            return false;
          }
        }
      );
    }, 500);
  }

  refreshAfterEdit(data) {
    // 0 -> lexEdit: quando creo una nuova lexical entry
    // 3 -> quando devo cambiare solo la label di una forma
    // 5 -> quando devo cambiare il tipo di una forma
    // 6 -> quando devo cambiare definizione a un senso
    if (data != null) {
      setTimeout(() => {
        switch (data['request']) {
          case 0: this.lexEdit(data); break;
          case 3: this.changeFormLabel(data); break;
          case 5: this.changeFormType(data); break;
          case 6: this.changeSenseDefinition(data); break;
        }
      }, 100);
    }


  }

  triggerLoad() {
    this.lexicalService.refreshLangTable();
  }

  newLexicalEntry() {

    this.lexicalService.newLexicalEntry().pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data);
        let newLexEntryLabel = data['label'];
        let parameters = this.lexTree.getParameters();
        this.lexTree.lexicalEntriesFilter(parameters);
        
        this.toastr.success(data['lexicalEntry'] + ' added correctly', '', {
          timeOut: 5000,
        });

        setTimeout(() => {
          
          //parameters['text'] = newLexEntryLabel
          this.lexTree.lexicalEntryTree.treeModel.update();
          this.lexTree.updateTreeView();
          

          setTimeout(() => {
            this.lexTree.lexicalEntryTree.treeModel.getNodeBy(
              function (x) {
                if (x.data.lexicalEntry == data['lexicalEntry']) {
                  x.setActiveAndVisible()
                  return true;
                } else {
                  return false;
                }
              }
            );
          }, 500);
        }, 200);
      },
      error => {
        console.log(error);
        this.toastr.error(error.error, 'Error', {
          timeOut: 5000,
        });
      }
    )
  }

  createNewFile(){
    let element_id = 0;
    let parameters = {
      requestUUID : "string",
      "user-id" : 0,
      "element-id" : element_id,
      filename : "new_file"+Math.floor(Math.random() * (99999 - 10) + 10)
    }

    this.documentService.createFile(parameters).pipe(takeUntil(this.destroy$)).subscribe(
      data =>{
        console.log(data)
        this.textTree.treeText.treeModel.nodes.push(data.node);
        this.textTree.counter = this.textTree.treeText.treeModel.nodes.length
        this.textTree.treeText.treeModel.update();
        this.toastr.info('New file added', '', {
          timeOut: 5000,
        });
        this.textTree.treeText.treeModel.getNodeById(data.node.id).setActiveAndVisible();
      },error=> {
        console.log(error)
      }
    )
  }


  addNewFile(evt?) {
    let element_id = 0;
    console.log(evt.target.files)
    let parameters, file_name;

    if (evt.target.files != undefined) {
      if (evt.target.files.length == 1) {
        file_name = evt.target.files[0].name;
        parameters = {
          "requestUUID": "string",
          "user-id": 0,
          "element-id": element_id,
          "file-name": file_name
        }
        const formData = new FormData();
        formData.append('file', evt.target.files[0]);

        this.documentService.uploadFile(formData, element_id, 11).pipe(takeUntil(this.destroy$)).subscribe(
          data => {
            console.log(data)

            this.toastr.info('New file added', '', {
              timeOut: 5000,
            });
            setTimeout(() => {

              this.textTree.treeText.treeModel.nodes.push(data.node);
              this.textTree.counter = this.textTree.treeText.treeModel.nodes.length
              //console.log(this.textTree.treeText.treeModel.nodes.length)
              //this.textTree.treeText.treeModel.updateTreeView();
              this.textTree.treeText.treeModel.update();
              this.textTree.treeText.treeModel.getNodeById(data.node.id).setActiveAndVisible();

            }, 500);


          }, error => {
            console.log(error);
            this.toastr.error('Error when adding new file', '', {
              timeOut: 5000,
            });
          }
        )
      } else {

        let files_array = Array.from(evt.target.files);
        files_array.forEach((element : any) => {

          file_name = element.name;
          parameters = {
            "requestUUID": "string",
            "user-id": 0,
            "element-id": element_id,
            "file-name": file_name
          }

          const formData = new FormData();
          formData.append('file', element);

          this.documentService.uploadFile(formData, element_id, 11).pipe(takeUntil(this.destroy$)).subscribe(
            data => {
              console.log(data)

              this.toastr.info('New file added', '', {
                timeOut: 5000,
              });
              setTimeout(() => {

                this.textTree.treeText.treeModel.nodes.push(data.node);
                this.textTree.counter = this.textTree.treeText.treeModel.nodes.length
                //console.log(this.textTree.treeText.treeModel.nodes.length)
                //this.textTree.treeText.treeModel.updateTreeView();
                this.textTree.treeText.treeModel.update();
                this.textTree.treeText.treeModel.getNodeById(data.node.id).setActiveAndVisible();

              }, 500);


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

    console.log(evt);
  }

  addNewFolder() {

    let element_id = 0;
    let parameters = {
      "requestUUID": "string",
      "user-id": 0,
      "element-id": element_id
    }


    this.documentService.addFolder(parameters).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        console.log(data)
        let id_new_node = 243;
        /* let new_node = {
          "children" : [],
          "element-id" : id_new_node,
          "id" : Math.floor(Math.random() * (99999 - 10) + 10),
          "metadata" : {},
          "path" : "",
          "name" : "new-folder_"+ Math.floor(Math.random() * (99999 - 10) + 10),
          "type" : "directory"
        } */
        if (data.node != undefined) {
          this.toastr.info('New folder added', '', {
            timeOut: 5000,
          });
          this.textTree.nodes.push(data.node);
          this.textTree.updateTreeView();
          this.textTree.treeText.treeModel.update();
        }

      }, error => {
        console.log(error);
        this.toastr.error('Error when creating new folder', '', {
          timeOut: 5000,
        });
      }
    )

  }

  exportLexicon(){
    let parameters = {
      "fileName": "export",
      "format": "turtle",
      "inferred": false
    }

    this.lexicalService.exportLexicon(parameters).pipe(takeUntil(this.destroy$)).subscribe(
      data=> {
        console.log(data);
        var blob = new Blob([data], { type: 'text/turtle' });
        var url = window.URL.createObjectURL(blob);
        importedSaveAs(blob,"file_name.txt");
       // window.open(url); 
        
      }, error=> {
        console.log(error);
        
      }
    )
  }

  /* downloadFile(data: any) {
    const blob = new Blob([data], { type: 'text/turtle' });
    const url= window.URL.createObjectURL(blob);
    window.open(url);
  } */

  addNewConceptSet(){
    this.conceptService.createNewConceptSet().pipe(takeUntil(this.destroy$)).subscribe(
      data=>{
        console.log(data);
        if (data != undefined) {
          this.toastr.info('New Concept Set added', '', {
            timeOut: 5000,
          });
          data['hasChildren'] = true;
          this.skosTree.nodes.push(data);
          this.skosTree.updateTreeView();
          this.skosTree.skosTree.treeModel.update();
          this.skosTree.skosTree.treeModel.getNodeById(data.id).setActiveAndVisible();
        }
       
      },error=> {
        console.log(error)
        this.toastr.error('Error when creating new Concept Set', '', {
          timeOut: 5000,
        });
      }
    )
  }

  addNewLexicalConcept(){
    this.conceptService.createNewLexicalConcept().pipe(takeUntil(this.destroy$)).subscribe(
      data=>{
        console.log(data);
        if (data != undefined) {
          this.toastr.info('New Lexical Concept added', '', {
            timeOut: 5000,
          });
          data['hasChildren'] = true;
          
          this.skosTree.skos_nodes.push(data);
          this.skosTree.updateTreeView();
          this.skosTree.skosTree.treeModel.update();

          setTimeout(() => {
            this.skosTree.skosTree.treeModel.getNodeBy(element=>{
              if(element.data.lexicalConcept == data.lexicalConcept){
                element.setActiveAndVisible();
              }
            })  
          }, 300);
          
        }
       
      },error=> {
        console.log(error)
        this.toastr.error('Error when creating new Concept Set', '', {
          timeOut: 5000,
        });
      }
    )
  }

  ngOnDestroy(): void {
      this.refresh_after_edit_subscription.unsubscribe();
      this.trigger_lex_tree_subscription.unsubscribe();
      this.destroy$.next(true);
      this.destroy$.complete();
  }
}
