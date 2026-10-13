
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppointmentsApiService } from '../data/appointments-api.service';
import {
  DENTIST_DIRECTORY,
  DentistDirectory,
  DentistDirectoryItem,
} from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { SchedulingPageComponent } from './scheduling-page.component';

describe('SchedulingPageComponent dentist directory', () => {
  let fixture: ComponentFixture<SchedulingPageComponent>;

  async function renderWithDentists(
    dentists: readonly DentistDirectoryItem[],
  ): Promise<HTMLElement> {
    const directory: DentistDirectory = {
      listDentists: () => of(dentists),
    };

    await TestBed.configureTestingModule({
      imports: [SchedulingPageComponent],
      providers: [
        {
          provide: DENTIST_DIRECTORY,
          useValue: directory,
        },
        {
          provide: AppointmentsApiService,
          useValue: {},
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

    return fixture.nativeElement as HTMLElement;
  }

  it('renders dentists provided by the injected directory', async () => {
    const element = await renderWithDentists([
      {
        id: 'dentist-101',
        name: 'Dentist One',
      },
      {
        id: 'dentist-202',
        name: 'Dentist Two',
      },
    ]);

    const options = Array.from(
      element.querySelectorAll<HTMLOptionElement>(
        '#dentist option',
      ),
    );

    expect(
      options.map((option) => option.value),
    ).toEqual([
      '',
      'dentist-101',
      'dentist-202',
    ]);

    expect(
      options.map((option) => option.textContent?.trim()),
    ).toEqual([
      'Seleccione un odontólogo',
      'Dentist One',
      'Dentist Two',
    ]);
  });

  it('does not display fictional dentists when the directory is empty', async () => {
    const element = await renderWithDentists([]);

    const options = Array.from(
      element.querySelectorAll<HTMLOptionElement>(
        '#dentist option',
      ),
    );

    expect(options).toHaveLength(1);
    expect(options[0].value).toBe('');

    expect(element.textContent).not.toContain(
      'Dr. Martín Torres',
    );

    expect(element.textContent).not.toContain(
      'Dra. Elena Silva',
    );
  });
});
