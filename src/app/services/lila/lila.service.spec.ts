import { TestBed } from '@angular/core/testing';

import { LilaService } from './lila.service';

describe('LilaService', () => {
  let service: LilaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LilaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
