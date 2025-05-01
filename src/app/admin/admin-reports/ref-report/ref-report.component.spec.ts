import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { RefReportComponent } from './ref-report.component';

describe('RefReportComponent', () => {
  let component: RefReportComponent;
  let fixture: ComponentFixture<RefReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefReportComponent],
    })
      .compileComponents();
    fixture = TestBed.createComponent(RefReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
