/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { HttpClient } from '@angular/common/http';
import { Component, OnInit, AfterViewInit, ViewChild, OnChanges, SimpleChanges, ElementRef, Input } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { KeycloakService } from 'keycloak-angular';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ConfirmedValidator } from './validator/password-match';

@Component({
  selector: 'app-profiles-table',
  templateUrl: './profiles-table.component.html',
  styleUrls: ['./profiles-table.component.scss']
})
export class ProfilesTableComponent implements OnInit, OnChanges {

  message = '';
  users = [];
  private idClient;
  private selected_idUser;
  private modalRef : NgbModalRef;
  private temporaryId : string;
  public isPopulated = false;
  public creationRequest = false;
  public itsMe = null;

  private initialValue : any;
  

  selectedRoles = [];
  filterSelectedRoles = [];
  roles: any[] = [];
  //rolesNames = ['ADMIN', 'USER', 'REVIEWER'];

  @ViewChild('user_list') user_list:ElementRef; 
  @ViewChild('button_create') button_create:ElementRef; 
  @Input() isNotTheSameId : boolean;


  userDetailForm = new FormGroup({
    id: new FormControl(null),
    username: new FormControl(null, Validators.required),
    email: new FormControl(null, Validators.required),
    password: new FormControl(null),
    repeat_password: new FormControl(null),
    roles: new FormArray([]),
    enabled: new FormControl(null, Validators.required)
  })

  private search_subject: Subject<any> = new Subject();
  roles_array: FormArray;

  constructor(private httpClient: HttpClient, private auth: AuthService, private formBuilder: FormBuilder, private modalService: NgbModal, private keycloakService : KeycloakService) { }


  ngOnInit(): void {

    //this.keycloakService.isTokenExpired();
    //this.keycloakService.updateToken(15);
    this.userDetailForm = this.formBuilder.group({
      id : new FormControl(null),
      username : new FormControl(null, [Validators.required, Validators.minLength(3)]),
      email : new FormControl(null, [Validators.required, Validators.minLength(3), Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
      password : new FormControl(null, [Validators.required, Validators.minLength(8)]),
      repeat_password : new FormControl(null, [Validators.required]),
      roles : [],
      enabled : new FormControl(false, [Validators.required]),
    }, {validator : ConfirmedValidator('password', 'repeat_password')});

    this.auth.getClientsInfo().subscribe(
      data => {
        if (data != undefined && Array.isArray(data)) {
          /* this.idClient = data[0].id; */
          data.forEach(element => {
            if(element.clientId == 'princlient'){
              this.idClient = element.id;
            }
          })
        }
      },
      error => { console.log(error) }
    )

    
    var checkIdTimer = setInterval((val)=>{                 
      try{
          if(this.idClient !=undefined){

            this.auth.getAllClientsRoles(this.idClient).subscribe(
              data => {
                let array = [];
                data.forEach((element, i) => {
                  if (element.name.toUpperCase() == element.name) {
                    array.push({name: element.name, id: element.id});
                  };
                });
                console.log(array)
                array.forEach((c, i) => {
                  this.roles.push({ id: i, name: c.name, role_id: c.id });
                });
        
        
                this.getUsersByRole(array);
        
                // this.selectedRoles = ['ADMIN', 'USER']
              },
              error => { console.log(error) }
            )
            
            clearInterval(checkIdTimer)
          }else{
            clearInterval(checkIdTimer)
          }
          
      }catch(e){
          console.log(e)
      }    
    }, 500)

    
    
    

    /* this.rolesNames.forEach((c, i) => {
      this.roles.push({ id: i, name: c });
    }); */

    this.auth.searchUser().subscribe(
      data => {
        //this.users = data;
        if(data!= undefined){
          Array.from(data).forEach((usr:any) => {
            if(usr.username != undefined){
              if(usr.username != 'prinadmin'){
                this.users.push(usr);
              }
            }
          })
        }
      }, error => {
        console.log(error)
      }
    )


    this.search_subject.pipe(debounceTime(1000)).subscribe(
      data => {
        this.searchUsers(data);
      }
    )


  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)
  }

  public getUsersByRole(roles_array) {
    
    roles_array.forEach(element => {
      
      
      this.auth.getUsersByRole(this.idClient, element.name).subscribe(
        (data : any[])=>{
          //console.log(element, data);

          data.forEach(usr => {
            this.users.filter(obj => {
              if(obj.id == usr.id){
                obj[element.name] = true;
                obj['haveRoles'] = true;
              }
            })
          })
          
        }, error => {
          console.log(error)
        }
      )
    });
    
  }

  searchUsers(data?) {
    // console.log(data)
    this.auth.searchUser(data).subscribe(
      data => {
        //console.log(data);
        this.users = data;

        let array = [];
        
        this.roles.forEach(
          element => { array.push(element.name)}
        )
        this.getUsersByRole(array)
      }, error => {
        console.log(error)
      }
    )
  }

  triggerSearch(event?) {
    if (event != undefined) {
      let value = event.target.value;
      this.search_subject.next(value);
    }
  }

  userDetail(id) {
    if(id != undefined){
      this.selected_idUser = id;

      this.button_create.nativeElement.classList.remove('active');

      this.auth.getUserInfo(id).subscribe(
        responseUserInfo=>{
          //console.log(responseUserInfo);

          this.auth.getUserRoles(this.selected_idUser, this.idClient).subscribe(
            responseUserRoles => {
              //console.log(responseUserRoles)

              if(responseUserRoles != undefined && Array.isArray(responseUserRoles)){
                let filter = responseUserRoles.filter(element=> element.name.toUpperCase() === element.name);

                const extractRoleName = (obj) => {
                  return obj.name;
                }

                let id = responseUserInfo.id;
                let username = responseUserInfo.username;
                let roles = filter.map(extractRoleName);
                let enabled = responseUserInfo.enabled;
                let email = responseUserInfo.email;
                console.log("RUOLI", roles);
                this.populateForm(id, username, email, roles, enabled)
              }
            }, errorUserRoles => {
              console.log(errorUserRoles)
            }
          )
        }, error=>{
          console.log(error)
        }
      )
    }
  }

  populateForm(id, username, email, roles, enabled){
    

    this.userDetailForm = this.formBuilder.group({
      id : new FormControl(id),
      username : new FormControl(username, [Validators.required, Validators.minLength(3)]),
      email : new FormControl(email, [Validators.required, Validators.minLength(3), Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
      password : new FormControl(null),
      repeat_password : new FormControl(null),
      roles : [],
      enabled : new FormControl(enabled, [Validators.required]),
    }, {validator : ConfirmedValidator('password', 'repeat_password')});

    
    


    this.selectedRoles = roles;
    this.creationRequest = false;
    this.isPopulated = true;

    setTimeout(() => {
      this.initialValue = this.userDetailForm.value;
    }, 500);


    this.itsMe = this.auth.getLoggedUser().sub == this.selected_idUser;

    
  }

  markAsTouched(){
    this.userDetailForm.markAsTouched();
  }

  updateUser(){
    if(this.userDetailForm.valid && !(JSON.stringify(this.initialValue) == JSON.stringify(this.userDetailForm.value))){
      let parameters = {
        enabled: this.userDetailForm.get('enabled').value,
        email: this.userDetailForm.get('email').value,
        username: this.userDetailForm.get('username').value,
      }
      console.log(parameters);

      this.auth.updateUser(this.selected_idUser, parameters).subscribe(
        data=>{
          console.log(data);

          if(JSON.stringify(this.initialValue.roles) != JSON.stringify(this.userDetailForm.get('roles').value)){

            /* if(this.selectedRoles.length == 0){
              let object = [];
              let obj = {};
              this.roles.forEach(roles=>{
                obj = {
                  id : roles.role_id,
                  name: roles.name
                }
                object.push(obj);

                console.log(object)
                this.auth.deleteRolesToUser(this.selected_idUser, this.idClient, object).subscribe(
                  data=>{
                    console.log(data);
                    this.users.forEach(element => {
                      if(element.id == this.selected_idUser){
                        element[obj['name']] = false;
                        element['haveRoles'] = false;
                      }
                    });

                    this.userDetail(this.selected_idUser);
                  },
                  error=>{console.log(error)}
                );

                object = [];
              })


              
            }else{

              

            } */


            let initialRoles = this.initialValue.roles;
            let updatedRoles = this.userDetailForm.get('roles').value;

            let difference = updatedRoles.filter(x => !initialRoles.includes(x));
            let removeDiff = initialRoles.filter(x => !updatedRoles.includes(x));

            console.log(difference, removeDiff);

            if(difference.length != 0){
              difference.forEach(element=>{

                let object = [];
                let obj = {};
                this.roles.forEach(roles=>{
                  if(element == roles.name){
                    obj = {
                      id : roles.role_id,
                      name: roles.name
                    }

                    object.push(obj);
                    console.log(object)
                    this.auth.assignRolesToUser(this.selected_idUser, this.idClient, object).subscribe(
                      data=>{
                        console.log(data);
                        this.users.forEach(element => {
                          if(element.id == this.selected_idUser){
                            element[obj['name']] = true;
                            element['haveRoles'] = true;
                          }
                        });
                        this.userDetail(this.selected_idUser);
                      },
                      error=>{console.log(error)}
                    )

                    object = [];
                    
                  }
                })

                

                
              });
            }else if(removeDiff.length != 0){
              removeDiff.forEach(element => {
                let object = [];
                let obj = {};
                this.roles.forEach(roles=>{
                  if(element == roles.name){
                    obj = {
                      id : roles.role_id,
                      name: roles.name
                    }
                    object.push(obj);
  
                    console.log(object)
                    this.auth.deleteRolesToUser(this.selected_idUser, this.idClient, object).subscribe(
                      data=>{
                        console.log(data);
                        this.users.forEach(element => {
                          if(element.id == this.selected_idUser){
                            element[obj['name']] = false;
                            element['haveRoles'] = false;
                          }
                        });

                        this.userDetail(this.selected_idUser);
                      },
                      error=>{console.log(error)}
                    );
    
                    object = [];
                  }
                  
                  
                })
              });
              
            }
          }
        },
        error=>{
          console.log(error)
        }
      )
    }else{
      alert("No update. There are same info")
    }

  }

  
  registerUser() {
    console.log(this.userDetailForm)
    if(this.userDetailForm.valid){
      let parameters = {
        /* id: this.temporaryId, */
        enabled: this.userDetailForm.get('enabled').value,
        email: this.userDetailForm.get('email').value,
        username: this.userDetailForm.get('username').value,
        credentials: [
          {
            type: "password",
            value: this.userDetailForm.get('password').value,
            temporary: false
          }
        ]
      }

      console.log(parameters);

      this.auth.createUser(parameters).subscribe(
        data=>{
          console.log(data);

          this.auth.getUserByUsername(this.userDetailForm.get('username').value).subscribe(
            data=>{
              console.log(data);
              if(data != undefined){
              
                this.cleanActiveLinks();
                data.forEach(newUser => {

                  if(this.selectedRoles.length > 0){

    
                    this.selectedRoles.forEach(element=>{

                      let object = [];
                      let obj = {};
                      this.roles.forEach(roles=>{
                        if(element == roles.name){
                          obj = {
                            id : roles.role_id,
                            name: roles.name
                          }

                          object.push(obj);
                        }
                      })

                      

                      console.log(object)
                      this.auth.assignRolesToUser(newUser.id, this.idClient, object).subscribe(
                        data=>{
                          console.log(data);
                          this.users.forEach(element => {
                            if(element.id == newUser.id){
                              element[obj['name']] = true;
                              element['haveRoles'] = true;
                            }
                          });
                        },
                        error=>{console.log(error)}
                      )
                    });

                    
                  }
                  
                  

                  this.users.push(newUser);

                  this.userDetail(newUser.id);


                  setTimeout(() => {
                    this.activeNewUserLink(this.userDetailForm.get('username').value)
                  }, 100);
                  
                });

                
              } 
            },
            error=>{
              console.log(error)
            }
          )
        },
        error=>{
          console.log(error)
        }
      )
    }
  }

  resetForm(){
    this.userDetailForm.reset();
    this.userDetailForm.markAsUntouched();
    this.userDetailForm.markAsPristine();
  }

  deleteUser(){
    console.log(this.selected_idUser);

    this.auth.deleteUser(this.selected_idUser).subscribe(
      data=>{
        console.log(data)
        let filtered = this.users.filter(
          element=> element.id != this.selected_idUser
        )

        this.users = filtered;
    
        this.cleanActiveLinks();
        this.userDetailForm.reset();
        this.isPopulated = false;
        this.creationRequest = false;
    
        this.modalRef.close();
      },
      error=>{console.log(error)}
    )

    
  }


  /* addRoles(role){
    this.rolesArray = this.userDetailForm.get('roles') as FormArray;
    if(role == undefined){
      this.rolesArray.push(this.createRoles());
    }else{
      this.rolesArray.push(this.createRoles(role));
    }
  } */


  createNewUser(){

    this.cleanActiveLinks();
    this.selected_idUser = null;

    const makeId = function makeid() {
          var result           = '';
          var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          var charactersLength = characters.length;
          for ( var i = 0; i < 9; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }

          result += '-'

          for ( var j = 0; j < 5; j++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }

          result += '-'

          for ( var l = 0; l < 5; l++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }

          result += '-'

          for ( var m = 0; m < 13; m++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }
          
          return result;
    }

    this.temporaryId = makeId();
    

    this.userDetailForm = this.formBuilder.group({
      id : new FormControl(this.temporaryId),
      username : new FormControl(null, [Validators.required, Validators.minLength(3)]),
      email : new FormControl(null, [Validators.required, Validators.minLength(3), Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]),
      password : new FormControl(null, [Validators.required, Validators.minLength(8)]),
      repeat_password : new FormControl(null, [Validators.required]),
      roles : [],
      enabled : new FormControl(false, [Validators.required]),
    }, {validator : ConfirmedValidator('password', 'repeat_password')});
    this.creationRequest = true;
    this.isPopulated = true;
    this.selectedRoles = [];

    this.itsMe = false;
  }

  cleanActiveLinks(){
    var links = this.user_list.nativeElement.querySelectorAll('a')
    links.forEach(element => {
      if(element.classList.contains('active')){
        element.classList.remove('active');
      }
    });
  }

  activeNewUserLink(username){
    var links = this.user_list.nativeElement.querySelectorAll('a')
    links.forEach(element => {
//      console.log(element.innerText, username)
      if(element.innerText == username){
        element.classList.add('active');
      }
      
    });
  }


  findInvalidControls() {
    const invalid = [];
    const controls = this.userDetailForm.controls;
    for (const name in controls) {
        if (controls[name].invalid) {
            invalid.push(name);
        }
    }

    
    return invalid;
  }

  open(content) {

    this.modalRef = this.modalService.open(content)
  }

  /* addTagFn(name) {
    return { name: name, tag: true };
  } */
}
