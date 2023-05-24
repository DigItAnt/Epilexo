import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptSetCoreFormComponent } from './concept-set-core-form.component';

describe('ConceptSetCoreFormComponent', () => {
  let component: ConceptSetCoreFormComponent;
  let fixture: ComponentFixture<ConceptSetCoreFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConceptSetCoreFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptSetCoreFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
