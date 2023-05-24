import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkosTreeComponent } from './skos-tree.component';

describe('SkosTreeComponent', () => {
  let component: SkosTreeComponent;
  let fixture: ComponentFixture<SkosTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SkosTreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkosTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
