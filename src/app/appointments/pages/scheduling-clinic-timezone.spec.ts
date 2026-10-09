
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { CLINIC_TIME_ZONE_CONFIG } from '../data/clinic-time-zone-config';
import { DENTIST_DIRECTORY } from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { SchedulingPageComponent } from './scheduling-page.component';

interface SchedulingTestView {
  readonly dateOptions: readonly {
    readonly value: string;
  }[];

  readonly availableSlots: () => readonly {
    readonly startAt: string;
    readonly endAt: string;
    readonly label: string;
  }[];

  selectDentist(dentistId: string): void;
  selectDate(date: string): void;
}

describe('SchedulingPageComponent clinic time zone', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;

  async function createSchedulingPage(): Promise<SchedulingTestView> {
    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        {
          provide: CLINIC_TIME_ZONE_CONFIG,
          useValue: 'America/New_York',
        },
        {
          provide: DENTIST_DIRECTORY,
          useValue: {
            listDentists: () =>
              of([
                {
                  id: 'dentist-123',
                  name: 'Test Dentist',
                },
              ]),
          },
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
        {
          provide: PatientsLookupService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      SchedulingPageComponent,
    );

    fixture.detectChanges();

    return fixture.componentInstance as unknown as SchedulingTestView;
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates dates from the configured clinic calendar day', async () => {
    // New York is already on July 6, while Bogota is on July 5.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(
      new Date('2026-07-06T04:30:00Z'),
    );

    const component = await createSchedulingPage();

    expect(
      component.dateOptions.map((date) => date.value),
    ).toEqual([
      '2026-07-06',
      '2026-07-07',
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
    ]);
  });

  it('generates appointment slots using the configured summer offset', async () => {
    const component = await createSchedulingPage();

    component.selectDentist('dentist-123');
    component.selectDate('2026-07-06');

    fixture.detectChanges();

    expect(component.availableSlots()).toEqual([
      {
        startAt: '2026-07-06T09:00:00-04:00',
        endAt: '2026-07-06T09:30:00-04:00',
        label: '09:00',
      },
      {
        startAt: '2026-07-06T09:30:00-04:00',
        endAt: '2026-07-06T10:00:00-04:00',
        label: '09:30',
      },
    ]);
  });
});
