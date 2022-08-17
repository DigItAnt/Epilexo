import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptTreeComponent } from './concept-tree.component';

describe('ConceptTreeComponent', () => {
  let component: ConceptTreeComponent;
  let fixture: ComponentFixture<ConceptTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConceptTreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
