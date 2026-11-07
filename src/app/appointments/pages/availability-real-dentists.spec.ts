import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { DENTIST_DIRECTORY } from '../data/dentist-directory';
import { DentistAvailability, UpdateDentistAvailabilityRequest } from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

/** Real integration: dentists come from the IAM directory and a dentist without a schedule starts one (version 1). */
describe('AvailabilityPageComponent with real dentists', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let element: HTMLElement;
  const update = vi.fn((dentistId: string, request: UpdateDentistAvailabilityRequest) =>
    of<DentistAvailability>({ id: 'schedule-1', dentistId, intervals: request.intervals, blockedIntervals: [], version: 2 }),
  );

  beforeEach(async () => {
    update.mockClear();
    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
      providers: [
        {
          provide: AppointmentsApiService,
          useValue: {
            getDentistAvailability: () =>
              throwError(() => ({ error: 'NOT_FOUND', message: 'The resource does not exist.', traceId: 't-1' })),
            updateDentistAvailability: update,
          },
        },
        {
          provide: DENTIST_DIRECTORY,
          useValue: { listDentists: () => of([{ id: 'd-1', name: 'Dra. Ruiz' }, { id: 'd-2', name: 'Dr. Mora' }]) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AvailabilityPageComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  function choose(id: string): void {
    const select = element.querySelector<HTMLSelectElement>('[data-dentist-select]')!;
    select.value = id;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  it('lists the dentists of the IAM directory', () => {
    const options = Array.from(element.querySelectorAll<HTMLOptionElement>('[data-dentist-select] option'))
      .map((option) => [option.value, option.textContent?.trim()]);

    expect(options).toEqual([
      ['', 'Seleccione un odontólogo'],
      ['d-1', 'Dra. Ruiz'],
      ['d-2', 'Dr. Mora'],
    ]);
  });

  it('treats a dentist without a stored schedule as empty instead of an error', () => {
    choose('d-1');

    expect(element.querySelector('[data-availability-empty]')).not.toBeNull();
    expect(element.querySelector('app-api-error-alert')).toBeNull();
  });

  it('creates the first schedule with expectedVersion 1', () => {
    choose('d-1');
    element.querySelector<HTMLButtonElement>('[data-availability-save]')!.click();
    fixture.detectChanges();

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0]).toBe('d-1');
    expect(update.mock.calls[0][1]).toMatchObject({ blockedIntervals: [], expectedVersion: 1 });
  });
});
