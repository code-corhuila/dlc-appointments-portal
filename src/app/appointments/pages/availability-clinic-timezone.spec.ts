
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { of } from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { CLINIC_TIME_ZONE_CONFIG } from '../data/clinic-time-zone-config';
import { AvailabilityPageComponent } from './availability-page.component';

describe('AvailabilityPageComponent clinic time zone', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;

  it('displays the configured clinic time zone', async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
      providers: [
        {
          provide: CLINIC_TIME_ZONE_CONFIG,
          useValue: 'America/New_York',
        },
        {
          provide: AppointmentsApiService,
          useValue: {
            getDentistAvailability: () =>
              of({
                id: 'availability-123',
                dentistId: 'dentist-123',
                intervals: [],
                blockedIntervals: [],
                version: 1,
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      AvailabilityPageComponent,
    );

    fixture.detectChanges();

    const element =
      fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'America/New_York',
    );
  });
});
