import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { DENTIST_DIRECTORY } from '../data/dentist-directory';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { SchedulingPageComponent } from './scheduling-page.component';

/** HU-APT-005/006 in scheduling: choose an appointment type and add a patient to the waiting list. */
describe('SchedulingPageComponent type and waiting list', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;
  let element: HTMLElement;
  const createWaitingListEntry = vi.fn(() => of({ id: 'w-1', status: 'WAITING', version: 1 }));

  beforeEach(async () => {
    createWaitingListEntry.mockClear();
    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        { provide: DENTIST_DIRECTORY, useValue: { listDentists: () => of([{ id: 'dentist-1', name: 'Dra. Rivera' }]) } },
        {
          provide: PatientsLookupService,
          useValue: {
            searchPatients: () => of({ data: [{ id: 'patient-1', name: 'Ana Torres', status: 'ACTIVE', version: 1,
              documentType: 'CC', documentNumber: '1' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
          },
        },
        {
          provide: AppointmentsApiService,
          useValue: {
            listAppointmentTypes: () => of({ data: [{ code: 'LIMPIEZA', label: 'Limpieza', color: '#0D9488' }] }),
            getDentistAvailability: () => of({ dentistId: 'dentist-1', intervals: [], blockedIntervals: [], version: 1 }),
            createWaitingListEntry,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SchedulingPageComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function choosePatientDentistAndReason(): void {
    const search = element.querySelector<HTMLInputElement>('#patient-search')!;
    search.value = 'Ana';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[data-patient-result]')!.click();
    const dentist = element.querySelector<HTMLSelectElement>('#dentist')!;
    dentist.value = 'dentist-1';
    dentist.dispatchEvent(new Event('change', { bubbles: true }));
    const reason = element.querySelector<HTMLTextAreaElement>('#reason')!;
    reason.value = 'Limpieza semestral';
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('offers the active appointment types from the catalog', () => {
    const options = Array.from(element.querySelectorAll<HTMLOptionElement>('#appointment-type option'));
    expect(options.map((option) => option.value)).toEqual(['', 'LIMPIEZA']);
    expect(options[1].textContent?.trim()).toBe('Limpieza');
  });

  it('adds the chosen patient, dentist and reason to the waiting list', () => {
    const add = () => element.querySelector<HTMLButtonElement>('[data-add-waiting-list]')!;
    expect(add().disabled).toBe(true);

    choosePatientDentistAndReason();
    expect(add().disabled).toBe(false);
    add().click();
    fixture.detectChanges();

    expect(createWaitingListEntry).toHaveBeenCalledWith(
      { patientId: 'patient-1', dentistId: 'dentist-1', reason: 'Limpieza semestral' }, expect.any(String));
    expect(element.querySelector('[data-waiting-list-feedback]')?.textContent).toContain('lista de espera');
  });
});
