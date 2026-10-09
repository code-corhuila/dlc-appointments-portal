
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
  let element: HTMLElement;

  beforeEach(async () => {
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
                intervals: [
                  {
                    startAt: '2026-07-06T13:00:00Z',
                    endAt: '2026-07-06T14:00:00Z',
                  },
                ],
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

    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function loadDentistAvailability(): void {
    const select = element.querySelector<HTMLSelectElement>(
      '[data-dentist-select]',
    );

    expect(select).not.toBeNull();

    const option = document.createElement('option');
    option.value = 'dentist-123';
    option.textContent = 'Test dentist';

    select!.append(option);
    select!.value = 'dentist-123';
    select!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();
  }

  it('displays the configured clinic time zone', () => {
    expect(element.textContent).toContain(
      'America/New_York',
    );
  });

  it('displays loaded availability in the configured time zone', () => {
    loadDentistAvailability();

    const start = element.querySelector<HTMLInputElement>(
      '[data-day="monday"] [data-shift-one-start]',
    );

    const end = element.querySelector<HTMLInputElement>(
      '[data-day="monday"] [data-shift-one-end]',
    );

    expect(start?.value).toBe('09:00');
    expect(end?.value).toBe('10:00');
  });

  it('updates a shift using the configured time zone', () => {
    loadDentistAvailability();

    const start = element.querySelector<HTMLInputElement>(
      '[data-day="monday"] [data-shift-one-start]',
    );

    const end = element.querySelector<HTMLInputElement>(
      '[data-day="monday"] [data-shift-one-end]',
    );

    expect(start).not.toBeNull();

    start!.value = '09:30';
    start!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();

    expect(start?.value).toBe('09:30');
    expect(end?.value).toBe('10:00');
  });
});
