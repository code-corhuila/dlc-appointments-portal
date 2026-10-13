
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { DENTIST_DIRECTORY } from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { PatientView } from '../model/patient';
import { SchedulingPageComponent } from './scheduling-page.component';

describe('SchedulingPageComponent selection safety', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;
  let element: HTMLElement;

  const patient: PatientView = {
    id: 'patient-123',
    name: 'Ana Torres',
    status: 'ACTIVE',
    version: 1,
    documentType: 'CC',
    documentNumber: '123456789',
  };

  const createAppointment = vi.fn();

  beforeEach(async () => {
    createAppointment.mockReset();

    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        {
          provide: DENTIST_DIRECTORY,
          useValue: {
            listDentists: () =>
              of([
                {
                  id: 'dentist-123',
                  name: 'Dra. Elisa Rivera',
                },
              ]),
          },
        },
        {
          provide: PatientsLookupService,
          useValue: {
            searchPatients: (query: {
              search: string;
            }) =>
              of({
                data:
                  query.search === 'Ana'
                    ? [patient]
                    : [],
                meta: {
                  page: 1,
                  limit: 20,
                  total:
                    query.search === 'Ana'
                      ? 1
                      : 0,
                  totalPages:
                    query.search === 'Ana'
                      ? 1
                      : 0,
                },
              }),
          },
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
            createAppointment,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      SchedulingPageComponent,
    );

    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function searchPatient(value: string): void {
    const input =
      element.querySelector<HTMLInputElement>(
        '#patient-search',
      );

    expect(input).not.toBeNull();

    input!.value = value;
    input!.dispatchEvent(
      new Event('input', { bubbles: true }),
    );

    fixture.detectChanges();
  }

  it('clears the previously selected patient when a new search starts', () => {
    searchPatient('Ana');

    const patientResult =
      element.querySelector<HTMLButtonElement>(
        '[data-patient-result]',
      );

    expect(patientResult).not.toBeNull();

    patientResult!.click();
    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-selected-patient]',
      )?.textContent,
    ).toContain('Ana Torres');

    // Starting a different search must invalidate
    // the previous patient selection.
    searchPatient('Beatriz');

    expect(
      element.querySelector(
        '[data-selected-patient]',
      )?.textContent,
    ).toContain('No seleccionado');

    expect(
      element.querySelector(
        '[data-selected-patient]',
      )?.textContent,
    ).not.toContain('Ana Torres');
  });

  it('shows the selected dentist name in the appointment summary', () => {
    const select =
      element.querySelector<HTMLSelectElement>(
        '#dentist',
      );

    expect(select).not.toBeNull();

    const dentistOption = Array.from(
      select!.options,
    ).find(
      (option) =>
        option.value === 'dentist-123',
    );

    expect(dentistOption).toBeDefined();

    select!.value = 'dentist-123';
    select!.dispatchEvent(
      new Event('change', { bubbles: true }),
    );

    fixture.detectChanges();

    expect(
      element.querySelector(
        '[data-selected-dentist]',
      )?.textContent,
    ).toContain('Dra. Elisa Rivera');
  });
});
