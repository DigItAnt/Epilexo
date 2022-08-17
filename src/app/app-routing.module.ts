/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './services/guard/auth.guard';
import { HomePageComponent } from './views/home-page/home-page.component';
import { LexiconPageComponent } from './views/lexicon-page/lexicon-page.component';
import { LoginPageComponent } from './views/login-page/login-page.component';
import { PageNotFoundComponent } from './views/page-not-found/page-not-found.component';
import { ProfilePageComponent } from './views/profile-page/profile-page.component';
import { SearchPageComponent } from './views/search-page/search-page.component';

const routes: Routes = [
  {path: '', redirectTo: 'lexicon', pathMatch: 'full'},
  /* {path: 'home', component: HomePageComponent}, */
  /* {path: 'login', component: LoginPageComponent}, */
  {path: 'lexicon', component: LexiconPageComponent, canActivate: [AuthGuard], data: {roles: ['USER']}},
  {path: 'user', component: ProfilePageComponent, canActivate: [AuthGuard], data: {roles: ['ADMIN']}},
  {path: 'search', component: SearchPageComponent},
  /* {path: '**', component: PageNotFoundComponent} */
  {path: '**', component: LexiconPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
