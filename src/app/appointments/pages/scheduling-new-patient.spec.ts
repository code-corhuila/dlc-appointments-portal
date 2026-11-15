import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CompositionNavigationService } from '../../composition-navigation.service';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { DENTIST_DIRECTORY } from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { SchedulingPageComponent } from './scheduling-page.component';

/** Patients owns registration: "Nuevo Paciente" asks the shell to open its form (C04). */
describe('SchedulingPageComponent new patient', () => {
  it('requests shell navigation to the Patients registration form', async () => {
    const requestShellPath = vi.fn();
    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        { provide: DENTIST_DIRECTORY, useValue: { listDentists: () => of([]) } },
        { provide: AppointmentsApiService, useValue: {} },
        { provide: PatientsLookupService, useValue: {} },
        { provide: CompositionNavigationService, useValue: { requestShellPath } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SchedulingPageComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-new-patient]')!
      .click();

    expect(requestShellPath).toHaveBeenCalledExactlyOnceWith('/app/patients/new');
  });
});
