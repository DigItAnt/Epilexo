﻿/*
  © Copyright 2021-2022  Istituto di Linguistica Computazionale "A. Zampolli", Consiglio Nazionale delle Ricerche, Pisa, Italy.
 
This file is part of EpiLexo.

EpiLexo is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

EpiLexo is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with EpiLexo. If not, see <https://www.gnu.org/licenses/>.
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexicalEntryVartransFormComponent } from './lexical-entry-vartrans-form.component';

describe('LexicalEntryVartransFormComponent', () => {
  let component: LexicalEntryVartransFormComponent;
  let fixture: ComponentFixture<LexicalEntryVartransFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LexicalEntryVartransFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LexicalEntryVartransFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
