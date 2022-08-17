/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">lex-o-angular documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-59b2b2de1fdde061c0593bb8f3cf82c8"' : 'data-target="#xs-components-links-module-AppModule-59b2b2de1fdde061c0593bb8f3cf82c8"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-59b2b2de1fdde061c0593bb8f3cf82c8"' :
                                            'id="xs-components-links-module-AppModule-59b2b2de1fdde061c0593bb8f3cf82c8"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AttestationPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AttestationPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BibliographyPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BibliographyPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CoreTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CoreTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DataSearchFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DataSearchFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DecompositionTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DecompositionTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DictionaryTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DictionaryTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DocumentSystemTreeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DocumentSystemTreeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditDetailComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EditDetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EpidocTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EpidocTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EpigraphyDetailComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EpigraphyDetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EpigraphyTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EpigraphyTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EtymologyFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EtymologyFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EtymologyTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EtymologyTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FileTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FormCoreFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FormCoreFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FormTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FormTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FrameTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FrameTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HomePageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomePageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LanguageManagerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LanguageManagerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalConceptFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalConceptFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalEntryCoreFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalEntryCoreFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalEntryDecompFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalEntryDecompFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalEntrySynsemFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalEntrySynsemFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalEntryTreeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalEntryTreeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalEntryVartransFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalEntryVartransFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexiconPageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexiconPageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexiconPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexiconPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LinkPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LinkPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoginPageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginPageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MetadataPanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetadataPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NotePanelComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotePanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PageNotFoundComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PageNotFoundComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfilePageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfilePageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfilesTableComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfilesTableComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SameAsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SameAsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SearchPageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SearchPageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SeeAlsoComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SeeAlsoComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SenseCoreFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SenseCoreFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SenseTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SenseTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SenseVartransFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SenseVartransFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SynsemTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SynsemTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TextDetailComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TextDetailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TextTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TextTabComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TextTreeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TextTreeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/VartransTabComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >VartransTabComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/BibliographyService.html" data-type="entity-link" >BibliographyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DataService.html" data-type="entity-link" >DataService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DocumentSystemService.html" data-type="entity-link" >DocumentSystemService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExpanderService.html" data-type="entity-link" >ExpanderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LexicalEntriesService.html" data-type="entity-link" >LexicalEntriesService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/LexicalEntryRequest.html" data-type="entity-link" >LexicalEntryRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Person.html" data-type="entity-link" >Person</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});