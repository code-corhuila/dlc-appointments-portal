import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { DENTIST_DIRECTORY, DentistDirectoryItem } from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { SchedulingPageComponent } from './scheduling-page.component';

/** The native select is visually hidden, so every IAM dentist needs a visible, clickable option. */
describe('SchedulingPageComponent visible dentists', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;

  async function render(dentists: readonly DentistDirectoryItem[]): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        { provide: DENTIST_DIRECTORY, useValue: { listDentists: () => of(dentists) } },
        { provide: AppointmentsApiService, useValue: {} },
        { provide: PatientsLookupService, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SchedulingPageComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows one visible option per directory dentist and marks the chosen one', async () => {
    const element = await render([
      { id: 'd-1', name: 'Dra. Ruiz' },
      { id: 'd-2', name: 'Dr. Mora' },
    ]);
    const options = () => Array.from(element.querySelectorAll<HTMLButtonElement>('[data-dentist-option]'));

    expect(options().map((option) => option.textContent?.trim())).toEqual(['Dra. Ruiz', 'Dr. Mora']);

    options()[1].click();
    fixture.detectChanges();

    expect(options()[1].getAttribute('aria-pressed')).toBe('true');
    expect(options()[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('says so when the directory has no dentists', async () => {
    const element = await render([]);

    expect(element.querySelector('[data-dentist-directory-empty]')?.textContent).toContain(
      'No hay odontólogos disponibles',
    );
  });
});
