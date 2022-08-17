/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { TreeModule } from '@circlon/angular-tree-component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AngularEditorModule } from '@kolkov/angular-editor'
import { NgSelectModule } from '@ng-select/ng-select';
import { ContextMenuModule } from 'ngx-contextmenu';
import { ToastrModule } from 'ngx-toastr';
import { initializer } from '../app/services/initializer/app-init';
import { KeycloakService, KeycloakAngularModule } from 'keycloak-angular';




import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LexiconPageComponent } from './views/lexicon-page/lexicon-page.component';
import { LoginPageComponent } from './views/login-page/login-page.component';
import { PageNotFoundComponent } from './views/page-not-found/page-not-found.component';
import { HomePageComponent } from './views/home-page/home-page.component';
import { ProfilePageComponent } from './views/profile-page/profile-page.component';
import { LexiconPanelComponent } from './components/lexicon-panel/lexicon-panel.component';
import { NotePanelComponent } from './components/note-panel/note-panel.component';
import { LinkPanelComponent } from './components/link-panel/link-panel.component';
import { SearchPageComponent } from './views/search-page/search-page.component';
import { DataSearchFormComponent } from './components/data-search-form/data-search-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DocumentSystemTreeComponent } from './components/lexicon-panel/document-system-tree/document-system-tree.component';
import { TextTreeComponent } from './components/lexicon-panel/document-system-tree/text-tree/text-tree.component';
import { TextDetailComponent } from './components/lexicon-panel/text-detail/text-detail.component';
import { EpigraphyDetailComponent } from './components/lexicon-panel/text-detail/epigraphy-detail/epigraphy-detail.component';
import { EditDetailComponent } from './components/lexicon-panel/text-detail/edit-detail/edit-detail.component';
import { EpigraphyTabComponent } from './components/lexicon-panel/text-detail/epigraphy-detail/epigraphy-tab/epigraphy-tab.component';
import { DictionaryTabComponent } from './components/lexicon-panel/text-detail/edit-detail/dictionary-tab/dictionary-tab.component';
import { LexicalEntryTreeComponent } from './components/lexicon-panel/document-system-tree/lexical-entry-tree/lexical-entry-tree.component';
import { CoreTabComponent } from './components/lexicon-panel/text-detail/edit-detail/core-tab/core-tab.component';
import { VartransTabComponent } from './components/lexicon-panel/text-detail/edit-detail/vartrans-tab/vartrans-tab.component';
import { SynsemTabComponent } from './components/lexicon-panel/text-detail/edit-detail/synsem-tab/synsem-tab.component';
import { DecompositionTabComponent } from './components/lexicon-panel/text-detail/edit-detail/decomposition-tab/decomposition-tab.component';
import { ProfilesTableComponent } from './components/profiles-table/profiles-table.component';
import { HttpClientModule } from '@angular/common/http';
import { BibliographyPanelComponent } from './components/bibliography-panel/bibliography-panel.component';
import { AttestationPanelComponent } from './components/attestation-panel/attestation-panel.component';
import { LexicalEntryCoreFormComponent } from './components/lexicon-panel/text-detail/edit-detail/core-tab/lexical-entry-core-form/lexical-entry-core-form.component';
import { ModalModule } from 'ng-modal-lib';
import { SeeAlsoComponent } from './components/link-panel/see-also/see-also.component';
import { SameAsComponent } from './components/link-panel/same-as/same-as.component';
import { LexicalEntryVartransFormComponent } from './components/lexicon-panel/text-detail/edit-detail/vartrans-tab/lexical-entry-vartrans-form/lexical-entry-vartrans-form.component';
import { LexicalEntrySynsemFormComponent } from './components/lexicon-panel/text-detail/edit-detail/synsem-tab/lexical-entry-synsem-form/lexical-entry-synsem-form.component';
import { FormCoreFormComponent } from './components/lexicon-panel/text-detail/edit-detail/core-tab/form-core-form/form-core-form.component';
import { LexicalEntryDecompFormComponent } from './components/lexicon-panel/text-detail/edit-detail/decomposition-tab/lexical-entry-decomp-form/lexical-entry-decomp-form.component';
import { SenseCoreFormComponent } from './components/lexicon-panel/text-detail/edit-detail/core-tab/sense-core-form/sense-core-form.component';
import { SenseVartransFormComponent } from './components/lexicon-panel/text-detail/edit-detail/vartrans-tab/sense-vartrans-form/sense-vartrans-form.component';
import { LexicalConceptFormComponent } from './components/lexicon-panel/text-detail/edit-detail/core-tab/lexical-concept-form/lexical-concept-form.component';
import { LanguageManagerComponent } from './components/lexicon-panel/document-system-tree/language-manager/language-manager.component';
import { EtymologyTabComponent } from './components/lexicon-panel/text-detail/edit-detail/etymology-tab/etymology-tab.component';
import { EtymologyFormComponent } from './components/lexicon-panel/text-detail/edit-detail/etymology-tab/etymology-form/etymology-form.component';
import { MetadataPanelComponent } from './components/metadata-panel/metadata-panel.component';
import { EpigraphyFormComponent } from './components/lexicon-panel/text-detail/epigraphy-detail/epigraphy-tab/epigraphy-form/epigraphy-form.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SearchFormComponent } from './components/lexicon-panel/text-detail/epigraphy-detail/epigraphy-tab/epigraphy-form/search-form/search-form.component';
import { AuthService } from './services/auth/auth.service';;
import { UnauthorizedPageComponent } from './views/unauthorized-page/unauthorized-page/unauthorized-page.component'
;
import { ConceptTreeComponent } from './components/lexicon-panel/document-system-tree/concept-tree/concept-tree.component'
;
import { FormPanelComponent } from './components/attestation-panel/form-panel/form-panel.component'
import { CognatePanelComponent } from './components/lexicon-panel/text-detail/edit-detail/core-tab/lexical-entry-core-form/cognate-panel/cognate-panel.component';
@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LexiconPageComponent,
    LoginPageComponent,
    PageNotFoundComponent,
    HomePageComponent,
    ProfilePageComponent,
    LexiconPanelComponent,
    NotePanelComponent,
    LinkPanelComponent,
    SearchPageComponent,
    DataSearchFormComponent,
    DocumentSystemTreeComponent,
    TextTreeComponent,
    TextDetailComponent,
    EpigraphyDetailComponent,
    EditDetailComponent,
    EpigraphyTabComponent,
    DictionaryTabComponent,
    LexicalEntryTreeComponent,
    CoreTabComponent,
    VartransTabComponent,
    SynsemTabComponent,
    DecompositionTabComponent,
    ProfilesTableComponent,
    BibliographyPanelComponent,
    AttestationPanelComponent,
    LexicalEntryCoreFormComponent,
    SeeAlsoComponent,
    SameAsComponent,
    LexicalEntryVartransFormComponent,
    LexicalEntrySynsemFormComponent,
    FormCoreFormComponent,
    LexicalEntryDecompFormComponent,
    SenseCoreFormComponent,
    SenseVartransFormComponent,
    LexicalConceptFormComponent,
    LanguageManagerComponent,
    EtymologyTabComponent,
    EtymologyFormComponent,
    MetadataPanelComponent,
    EpigraphyFormComponent,
    SearchFormComponent,
    UnauthorizedPageComponent ,
    ConceptTreeComponent ,
    FormPanelComponent,
    CognatePanelComponent],
  imports: [
    ContextMenuModule.forRoot({useBootstrap4: true}),
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    TreeModule,
    InfiniteScrollModule,
    HttpClientModule,
    AngularEditorModule,
    NgSelectModule,
    ModalModule,
    NgbModule,
    FormsModule,
    KeycloakAngularModule,
    ReactiveFormsModule,
    ToastrModule.forRoot()
  ],
  providers: [
    { 
      provide: APP_INITIALIZER, 
      useFactory: initializer, 
      deps: [ KeycloakService ], 
      multi: true
    },
    AuthService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }