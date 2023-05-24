import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, pairwise, startWith, takeUntil } from 'rxjs/operators';
import { ConceptService } from 'src/app/services/concept/concept.service';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';

@Component({
  selector: 'app-concept-set-core-form',
  templateUrl: './concept-set-core-form.component.html',
  styleUrls: ['./concept-set-core-form.component.scss']
})
export class ConceptSetCoreFormComponent implements OnInit, OnDestroy {

  @Input() conceptSetData: any;
  object : any;

  destroy$: Subject<boolean> = new Subject();

  constructor(private formBuilder: FormBuilder,
              private conceptService : ConceptService,
              private lexicalService : LexicalEntriesService,
              private toastr : ToastrService) { }

  conceptSetForm = new FormGroup({
    defaultLabel : new FormControl('', [Validators.required])
  })

  ngOnInit(): void {
    this.conceptSetForm = this.formBuilder.group({
      defaultLabel : '',
    })

    this.onChanges();
  }

  onChanges() {
    this.conceptSetForm.get('defaultLabel').valueChanges.pipe(debounceTime(1000), startWith(this.conceptSetForm.get('defaultLabel').value), pairwise(), takeUntil(this.destroy$)).subscribe(([prev, next]: [any, any]) => {
      if(next != '') {
        let parameters = {
          relation: "http://www.w3.org/2004/02/skos/core#prefLabel",
          source: this.object.conceptSet,
          target: next,
          oldTarget: prev == '' ? this.object.defaultLabel : prev,
          targetLanguage: this.object.language,
          oldTargetLanguage : this.object.language
        }


        this.conceptService.updateSkosLabel(parameters).pipe(takeUntil(this.destroy$)).subscribe(
          data=> {
            console.log(data)
          }, error=> {
            console.log(error);
            if (error.status != 200) {
              this.toastr.error(error.error, 'Error', {
                  timeOut: 5000,
              });
            } else {
              const data = this.object;
              data['request'] = 0;
              data['new_label'] = next;
              this.lexicalService.refreshAfterEdit(data);
              this.lexicalService.spinnerAction('off');
              this.lexicalService.updateCoreCard({ lastUpdate: error.error.text });
              //this.lexicalService.changeDecompLabel(next)
              this.toastr.success('Label changed correctly for ' + this.object.conceptSet, '', {
                  timeOut: 5000,
              });
            }
          }
        )
      }
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    setTimeout(() => {
      if (this.object != changes.conceptSetData.currentValue) {
        //logica varia
      }
      this.object = changes.conceptSetData.currentValue;


      if (this.object != null) {

        let defaultLabel = this.object.defaultLabel;
        this.conceptSetForm.get('defaultLabel').setValue(defaultLabel, {emitEvent : false});
        
      }


    }, 10)

  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
