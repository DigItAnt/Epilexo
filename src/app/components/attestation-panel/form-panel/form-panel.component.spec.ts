import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPanelComponent } from './form-panel.component';

describe('FormPanelComponent', () => {
  let component: FormPanelComponent;
  let fixture: ComponentFixture<FormPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
