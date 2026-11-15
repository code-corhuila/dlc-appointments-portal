import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { SHELL_CONTEXT } from '../../shell-contract';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { DENTIST_DIRECTORY } from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import {
  ClinicalAssignment,
  ClinicalAssignmentListQuery,
  CreateClinicalAssignmentRequest,
} from '../model/clinical-assignment';
import { EndClinicalAssignmentRequest } from '../model/appointment-operations';
import { Page } from '../model/page';
import { ClinicalAssignmentsPageComponent } from './clinical-assignments-page.component';

const assignment = (id: string, status: ClinicalAssignment['status'] = 'ACTIVE'): ClinicalAssignment => ({
  id,
  patientId: 'p-1',
  dentistId: 'd-1',
  status,
  reason: 'Ortodoncia',
  startedAt: '2026-11-02T15:00:00Z',
  startedBy: 'staff-1',
  version: 3,
});

describe('ClinicalAssignmentsPageComponent', () => {
  let lists: ClinicalAssignmentListQuery[];
  let listResponse: () => Observable<Page<ClinicalAssignment>>;
  let created: Array<{ request: CreateClinicalAssignmentRequest; key: string }>;
  let createResponse: () => Observable<ClinicalAssignment>;
  let ended: Array<{ id: string; request: EndClinicalAssignmentRequest; key: string }>;

  async function create(roles: readonly string[] = ['SECRETARY_ASSISTANT']): Promise<ComponentFixture<ClinicalAssignmentsPageComponent>> {
    await TestBed.configureTestingModule({
      imports: [ClinicalAssignmentsPageComponent],
      providers: [
        { provide: SHELL_CONTEXT, useValue: { session: { getSnapshot: () => ({ user: { id: 'staff-1', roles } }) } } },
        {
          provide: AppointmentsApiService,
          useValue: {
            listClinicalAssignments: (query: ClinicalAssignmentListQuery) => {
              lists.push(query);
              return listResponse();
            },
            createClinicalAssignment: (request: CreateClinicalAssignmentRequest, key: string) => {
              created.push({ request, key });
              return createResponse();
            },
            endClinicalAssignment: (id: string, request: EndClinicalAssignmentRequest, key: string) => {
              ended.push({ id, request, key });
              return of({ ...assignment(id, 'ENDED'), version: 4 });
            },
          },
        },
        {
          provide: PatientsLookupService,
          useValue: {
            getPatient: (id: string) => of({ id, name: 'Ana Torres', status: 'ACTIVE', version: 1 }),
            searchPatients: () =>
              of({ data: [{ id: 'p-2', name: 'Carlos López', status: 'ACTIVE', version: 1 }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
          },
        },
        { provide: DENTIST_DIRECTORY, useValue: { listDentists: () => of([{ id: 'd-1', name: 'Dra. Ruiz' }, { id: 'd-2', name: 'Dr. Mora' }]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ClinicalAssignmentsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const el = (fixture: ComponentFixture<unknown>) => fixture.nativeElement as HTMLElement;
  const set = (fixture: ComponentFixture<unknown>, selector: string, value: string, event = 'change') => {
    const field = el(fixture).querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event(event));
    fixture.detectChanges();
  };

  beforeEach(() => {
    lists = [];
    created = [];
    ended = [];
    listResponse = () => of({ data: [assignment('ca-1'), assignment('ca-2', 'ENDED')], meta: { page: 1, limit: 100, total: 2, totalPages: 1 } });
    createResponse = () => of(assignment('ca-3'));
  });

  it('lists the clinical assignments of the Appointments API with patient and dentist names', async () => {
    const fixture = await create();

    expect(lists[0]).toEqual({ page: 1, limit: 100 });
    const cards = el(fixture).querySelectorAll('[data-clinical-assignment]');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Ana Torres');
    expect(cards[0].textContent).toContain('Dra. Ruiz');
    expect(cards[0].textContent).toContain('Activa');
    expect(cards[1].textContent).toContain('Finalizada');
    expect(el(fixture).textContent).toContain('1 activas');
  });

  it('has no demonstration profile, sources or texts', async () => {
    const fixture = await create();

    expect(el(fixture).querySelector('[data-demo-profile]')).toBeNull();
    expect(el(fixture).textContent).not.toMatch(/demostrativ|Fuente/i);
  });

  it('does not call the API for a dentist, who is not eligible', async () => {
    const fixture = await create(['DENTIST']);

    expect(lists).toHaveLength(0);
    expect(el(fixture).querySelector('[data-assignments-forbidden]')).not.toBeNull();
    expect(el(fixture).querySelector('[data-new-assignment]')).toBeNull();
  });

  it('starts an assignment with a searched patient, a directory dentist, a reason and an idempotency key', async () => {
    const fixture = await create();

    el(fixture).querySelector<HTMLButtonElement>('[data-new-assignment]')!.click();
    fixture.detectChanges();
    set(fixture, '[data-assignment-patient-search]', 'Carl', 'input');
    el(fixture).querySelector<HTMLButtonElement>('[data-assignment-patient-option="p-2"]')!.click();
    fixture.detectChanges();
    set(fixture, '[data-assignment-dentist]', 'd-2');
    set(fixture, '[data-assignment-reason]', 'Tratamiento de ortodoncia', 'input');
    el(fixture).querySelector<HTMLButtonElement>('[data-create-assignment]')!.click();
    fixture.detectChanges();

    expect(created).toHaveLength(1);
    expect(created[0].request).toEqual({ patientId: 'p-2', dentistId: 'd-2', reason: 'Tratamiento de ortodoncia' });
    expect(created[0].key.length).toBeGreaterThanOrEqual(8);
    expect(lists).toHaveLength(2);
  });

  it('explains a duplicate active assignment returned by the owner', async () => {
    createResponse = () => throwError(() => ({ error: 'APPOINTMENT_CONFLICT', message: 'x', traceId: '' }));
    const fixture = await create();

    el(fixture).querySelector<HTMLButtonElement>('[data-new-assignment]')!.click();
    fixture.detectChanges();
    set(fixture, '[data-assignment-patient-search]', 'Carl', 'input');
    el(fixture).querySelector<HTMLButtonElement>('[data-assignment-patient-option="p-2"]')!.click();
    fixture.detectChanges();
    set(fixture, '[data-assignment-dentist]', 'd-1');
    set(fixture, '[data-assignment-reason]', 'Control', 'input');
    el(fixture).querySelector<HTMLButtonElement>('[data-create-assignment]')!.click();
    fixture.detectChanges();

    expect(el(fixture).querySelector('[role="alert"]')?.textContent).toContain('ya tiene una asignación activa');
  });

  it('ends an active assignment with a reason and its current version', async () => {
    const fixture = await create();

    el(fixture).querySelector<HTMLButtonElement>('[data-end-assignment="ca-1"]')!.click();
    fixture.detectChanges();
    set(fixture, '[data-ending-reason]', 'Tratamiento terminado', 'input');
    el(fixture).querySelector<HTMLButtonElement>('[data-confirm-ending]')!.click();
    fixture.detectChanges();

    expect(ended).toHaveLength(1);
    expect(ended[0]).toMatchObject({ id: 'ca-1', request: { reason: 'Tratamiento terminado', expectedVersion: 3 } });
    expect(lists).toHaveLength(2);
    expect(el(fixture).querySelector('[data-end-assignment="ca-2"]')).toBeNull();
  });

  it('shows the owner error when the list cannot be read', async () => {
    listResponse = () => throwError(() => ({ error: 'SERVICE_UNAVAILABLE', message: 'No disponible', traceId: 't' }));
    const fixture = await create();

    expect(el(fixture).querySelector('app-api-error-alert')).not.toBeNull();
  });
});
