/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { LexicalEntriesService } from 'src/app/services/lexical-entries/lexical-entries.service';
import { ToastrService } from 'ngx-toastr';
import { BibliographyService } from 'src/app/services/bibliography-service/bibliography.service';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-bibliography-panel',
  templateUrl: './bibliography-panel.component.html',
  styleUrls: ['./bibliography-panel.component.scss']
})
export class BibliographyPanelComponent implements OnInit {

  @Input() biblioData: any[];
  bibliographyData: any[];
  object: any;
  countElement = 0;
  loadingSynchro = [];
  bibliographyForm = new FormGroup({
    bibliography: new FormArray([this.createBibliography()]),
  })
  biblioArray: FormArray;
  memoryNote = [];
  memoryTextualRef = [];

  private subject: Subject<any> = new Subject();

  constructor(private lexicalService: LexicalEntriesService, private biblioService: BibliographyService, private formBuilder: FormBuilder, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.bibliographyForm = this.formBuilder.group({
      bibliography: this.formBuilder.array([])
    })

    this.biblioService.addBiblioReq$.subscribe(
      incomingBiblio => {
        if (incomingBiblio != null) {

          let id = incomingBiblio.id != undefined ? incomingBiblio.id : '';
          let title = incomingBiblio.title != undefined ? incomingBiblio.title : '';
          let author = incomingBiblio.author != undefined ? incomingBiblio.author : '';
          let date = incomingBiblio.date != undefined ? incomingBiblio.date : '';
          let note = incomingBiblio.note != undefined ? incomingBiblio.note : '';
          let textualReference = incomingBiblio.textualReference != undefined ? incomingBiblio.textualReference : '';
          this.bibliographyData.push(incomingBiblio)
          this.addBibliographyElement(id, title, author, date, note, textualReference);
          this.memoryNote.push(note)
          this.memoryTextualRef.push(textualReference)
          this.countElement++;
        } else {
          this.object = null;
          this.bibliographyData = null;
        }
      }
    )

    this.subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.onChanges(data)
      }
    )
  }


  ngOnChanges(changes: SimpleChanges) {

    if (changes.biblioData.currentValue != undefined) {
      this.object = changes.biblioData.currentValue;
      this.bibliographyData = [];
      this.countElement = 0;
      this.memoryNote = [];
      this.memoryTextualRef = [];
      this.biblioArray = this.bibliographyForm.get('bibliography') as FormArray;
      this.biblioArray.clear();

      if (this.object.lexicalEntryInstanceName != undefined) {
        let lexId = this.object.lexicalEntryInstanceName;
        this.lexicalService.getBibliographyData(lexId).subscribe(
          data => {
            console.log(data);
            if (data != []) {
              let count = 0;
              data.forEach(element => {
                this.bibliographyData.push(element);

                this.addBibliographyElement(element.id, element.title, element.author, element.date, element.note, element.textualReference)
                this.memoryNote[count] = element.note;
                this.memoryTextualRef[count] = element.textualReference
                count++;
                this.countElement++;
              });

              /* this.bibliographyData['parentNodeLabel']= this.object['lexicalEntry'];
              this.bibliographyData['lexicalEntryInstanceName']= this.object['lexicalEntryInstanceName']; */
            }



          }, error => {


            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });

          }
        )

      } else if (this.object.formInstanceName != undefined) {
        let formId = this.object.formInstanceName;
        this.lexicalService.getBibliographyData(formId).subscribe(
          data => {
            console.log(data);
            let count = 0;
            data.forEach(element => {
              this.bibliographyData.push(element);

              this.addBibliographyElement(element.id, element.title, element.author, element.date, element.note, element.textualReference)
              this.memoryNote[count] = element.note;
              this.memoryTextualRef[count] = element.textualReference
              count++;
              this.countElement++;
            });

            this.bibliographyData['parentNodeLabel'] = this.object['form'];
            this.bibliographyData['formInstanceName'] = this.object['formInstanceName'];
          }, error => {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
            console.log(error);

          }
        )

      } else if (this.object.senseInstanceName != undefined) {
        let senseId = this.object.senseInstanceName;
        this.lexicalService.getBibliographyData(senseId).subscribe(
          data => {
            console.log(data);
            let count = 0;
            data.forEach(element => {
              this.bibliographyData.push(element);

              this.addBibliographyElement(element.id, element.title, element.author, element.date, element.note, element.textualReference)
              this.memoryNote[count] = element.note;
              this.memoryTextualRef[count] = element.textualReference
              count++;
              this.countElement++;
            });

            this.bibliographyData['parentNodeLabel'] = this.object['sense'];
            this.bibliographyData['senseInstanceName'] = this.object['senseInstanceName'];
          }, error => {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
            console.log(error);

          }
        )
      } else if (this.object.etymologyInstanceName != undefined) {
        let etymId = this.object.etymologyInstanceName;
        this.lexicalService.getBibliographyData(etymId).subscribe(
          data => {
            console.log(data);
            let count = 0;
            data.forEach(element => {
              this.bibliographyData.push(element);

              this.addBibliographyElement(element.id, element.title, element.author, element.date, element.note, element.textualReference)
              this.memoryNote[count] = element.note;
              this.memoryTextualRef[count] = element.textualReference
              count++;
              this.countElement++;
            });

            this.bibliographyData['parentNodeLabel'] = this.object['etymology'];
            this.bibliographyData['etymologyInstanceName'] = this.object['etymologyInstanceName'];
          }, error => {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
            console.log(error);

          }
        )
      }
    } else {
      this.countElement = 0;
      this.bibliographyData = null;
    }
  }

  debounceKeyup(evt, index, field) {
    this.lexicalService.spinnerAction('on');
    this.subject.next({ evt, index, field })
  }


  onChanges(data) {
    let fieldType = '';
    console.log(data)
    if (data != undefined) {

      let newValue = data.evt.target.value;
      let currentValue;
      let index = data?.index;

      let oldValue = '';
      fieldType = data['field']
      if (fieldType == 'note') {
        oldValue = this.memoryNote[index];
      } else if (fieldType == 'label') {
        oldValue = this.memoryTextualRef[index];
      }

      //this.biblioArray = this.bibliographyForm.get('bibliography') as FormArray;



      let instanceName = this.bibliographyData[index].bibliographyInstanceName;


      let parameters;

      if (oldValue == '') {
        parameters = {
          type: "bibliography",
          relation: fieldType,
          value: newValue
        }
      } else {
        parameters = {
          type: "bibliography",
          relation: fieldType,
          value: newValue,
          currentValue: oldValue
        }
      }



      console.log(this.biblioArray.at(index))
      console.log(parameters)

      this.lexicalService.updateGenericRelation(instanceName, parameters).subscribe(
        data => {
          console.log(data);
          this.lexicalService.spinnerAction('off');
          this.lexicalService.updateCoreCard(this.object);
          this.toastr.success('Bibliography item updated', '', {
            timeOut: 5000,
          });
        }, error => {
          console.log(error);
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.lexicalService.spinnerAction('off');
          if (error.status == 200) {
            this.toastr.success('Bibliography item updated', '', {
              timeOut: 5000,
            });
          } else {
            this.toastr.error(error.error, 'Error', {
              timeOut: 5000,
            });
          }

        }
      )


      if (fieldType == 'note') {
        this.memoryNote[index] = newValue;
      } else if (fieldType == 'label') {
        this.memoryTextualRef[index] = newValue;
      }



    }
  }

  removeItem(index) {
    this.biblioArray = this.bibliographyForm.get('bibliography') as FormArray;
    this.countElement--;

    let instanceName = this.bibliographyData[index].bibliographyInstanceName;

    this.lexicalService.removeBibliographyItem(instanceName).subscribe(
      data => {
        console.log(data)
        this.lexicalService.updateCoreCard(this.object);
        this.toastr.success('Element removed', '', {
          timeOut: 5000,
        });
      }, error => {
        //console.log(error)
        this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
        this.toastr.error(error.error, 'Error', {
          timeOut: 5000,
        });
      }
    )


    this.biblioArray.removeAt(index);
    this.bibliographyData.splice(index, 1);
    this.memoryNote.splice(index, 1)
    this.memoryTextualRef.splice(index, 1)

  }


  addBibliographyElement(i?, t?, a?, d?, n?, l?) {
    this.biblioArray = this.bibliographyForm.get('bibliography') as FormArray;
    if (t == undefined) {
      this.biblioArray.push(this.createBibliography());
    } else {
      this.biblioArray.push(this.createBibliography(i, t, a, d, n, l));
    }
  }

  createBibliography(i?, t?, a?, d?, n?, l?) {
    if (t == undefined) {
      return this.formBuilder.group({
        id: new FormControl(null),
        title: new FormControl(null),
        author: new FormControl(null),
        date: new FormControl(null),
        note: new FormControl(null),
        textualReference: new FormControl(null)
      })
    } else {
      return this.formBuilder.group({
        id: new FormControl(i),
        title: new FormControl(t),
        author: new FormControl(a),
        date: new FormControl(d),
        note: new FormControl(n),
        textualReference: new FormControl(l)
      })
    }
  }

  synchronizeBibliography(id, i) {
    console.log(id)
    this.loadingSynchro[i] = true;
    let lexId = '';
    if (this.object.lexicalEntryInstanceName != undefined
      && this.object.senseInstanceName == undefined) {
      console.log(1)
      lexId = this.object.lexicalEntryInstanceName;
    } else if (this.object.formInstanceName != undefined) {
      lexId = this.object.formInstanceName;
      console.log(2)
    } else if (this.object.senseInstanceName != undefined) {
      lexId = this.object.senseInstanceName;
      console.log(3)
    } else if (this.object.etymologyInstanceName != undefined) {
      lexId = this.object.etymologyInstanceName;
    }

    this.lexicalService.synchronizeBibliographyItem(lexId, id).pipe(debounceTime(500)).subscribe(
      data => {
        console.log(data);
        this.loadingSynchro[i] = false;
      }, error => {
        console.log(error);
        if (error.status == 200) {
          this.lexicalService.updateCoreCard({ lastUpdate: error.error.text })
          this.toastr.success('Item n°' + id + ' synchronized', '')
        }
        this.loadingSynchro[i] = false;
      }
    );
  }

}
