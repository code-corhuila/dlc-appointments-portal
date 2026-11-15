import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { DentistAvailability, UpdateDentistAvailabilityRequest } from '../model/availability';
import { AvailabilityPageComponent } from './availability-page.component';

/** "Generar Slots" turns the weekly schedule into dated intervals and saves them. */
describe('AvailabilityPageComponent generate slots', () => {
  let fixture: ComponentFixture<AvailabilityPageComponent>;
  let element: HTMLElement;
  let updateAvailability: ReturnType<typeof vi.fn>;
  const empty: DentistAvailability = { id: '', dentistId: 'dentist-123', intervals: [], blockedIntervals: [], version: 1 };

  beforeEach(async () => {
    updateAvailability = vi.fn((_id: string, request: UpdateDentistAvailabilityRequest) =>
      of({ ...empty, id: 'availability-1', intervals: request.intervals, version: 2 }));
    await TestBed.configureTestingModule({
      imports: [AvailabilityPageComponent],
      providers: [{ provide: AppointmentsApiService, useValue: {
        getDentistAvailability: () => of(empty), updateDentistAvailability: updateAvailability } }],
    }).compileComponents();
    fixture = TestBed.createComponent(AvailabilityPageComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    const select = element.querySelector<HTMLSelectElement>('[data-dentist-select]')!;
    const option = document.createElement('option');
    option.value = 'dentist-123';
    select.append(option);
    select.value = 'dentist-123';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  });

  function setDate(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  function generate(): void {
    element.querySelector<HTMLButtonElement>('[data-generate-slots]')!.click();
    fixture.detectChanges();
  }

  it('shows the default weekly hours for a dentist without stored availability', () => {
    expect(element.querySelector<HTMLInputElement>('[data-day="monday"] [data-shift-one-start]')!.value)
      .toBe('08:00');
  });

  it('saves the weekly shifts for each date of the range', () => {
    for (const day of ['tuesday', 'wednesday', 'thursday', 'friday']) {
      const toggle = element.querySelector<HTMLInputElement>(`#${day}-enabled`)!;
      toggle.checked = false;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
    fixture.detectChanges();
    setDate('[data-start-date]', '2026-11-16');
    setDate('[data-end-date]', '2026-11-17');

    generate();

    expect(updateAvailability).toHaveBeenCalledTimes(1);
    const request = updateAvailability.mock.calls[0][1] as UpdateDentistAvailabilityRequest;
    expect(request.expectedVersion).toBe(1);
    expect(request.intervals.map((interval) => new Date(interval.startAt).toISOString())).toEqual([
      '2026-11-16T13:00:00.000Z', '2026-11-16T19:00:00.000Z']);
  });

  it('asks for both dates before generating', () => {
    generate();

    expect(updateAvailability).not.toHaveBeenCalled();
    expect(element.querySelector('[data-generate-error]')?.textContent).toContain('fecha de inicio y de fin');
  });
});
