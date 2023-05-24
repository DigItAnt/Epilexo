import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from 'ng-modal-lib';
import { Subscription } from 'rxjs';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-cognate-panel',
  templateUrl: './cognate-panel.component.html',
  styleUrls: ['./cognate-panel.component.scss']
})
export class CognatePanelComponent implements OnInit {

  public lexicalEntryId: string;
  public cogInstanceName : any;
  public label : any;
  public subscription: Subscription;
  public lexicalEntryData : any;
  public id : any;

  @ViewChild('cognatePanelModal', {static: false}) cognatePanelModal: ModalComponent;


  constructor(private lexicalService: LexicalEntriesService) { }

  ngOnInit(): void {
  }

  triggerCognatePanel(data?){
    setTimeout(() => {
      this.cognatePanelModal.show();
      
    }, 100);
    
  }

  onCloseModal(cogInstanceName, lexInstanceName){
    this.lexicalService.closePanelForm(cogInstanceName, lexInstanceName);
    console.log(this.lexicalService.getAllPanelForms())
  }

}
