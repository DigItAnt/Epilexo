import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalComponent } from 'ng-modal-lib';
import { Subscription } from 'rxjs';
import { debounceTime, first } from 'rxjs/operators';
import { AnnotatorService } from 'src/app/services/annotator/annotator.service';

@Component({
  selector: 'app-form-panel',
  templateUrl: './form-panel.component.html',
  styleUrls: ['./form-panel.component.scss']
})
export class FormPanelComponent implements OnInit, OnDestroy {
  public formId: string;
  public label : any;
  public subscription: Subscription;
  public formData : any;
  public id : any;

  @ViewChild('formPanelModal', {static: false}) formPanelModal: ModalComponent;
  
  constructor(private annotatorService : AnnotatorService) { }

  ngOnInit(): void {
    
  }

  ngOnDestroy() : void {
    this.subscription.unsubscribe();
  }


  triggerFormPanel(data?){
    setTimeout(() => {
      this.formPanelModal.show();
      
    }, 100);
    
  }

  onCloseModal(idForm){
    this.annotatorService.closePanelForm(idForm);
    console.log(this.annotatorService.getAllPanelForms())
  }
}
