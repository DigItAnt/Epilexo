import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CognatePanelComponent } from './cognate-panel.component';

describe('CognatePanelComponent', () => {
  let component: CognatePanelComponent;
  let fixture: ComponentFixture<CognatePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CognatePanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CognatePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
