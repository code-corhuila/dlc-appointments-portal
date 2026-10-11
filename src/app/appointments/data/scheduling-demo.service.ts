import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { toClinicOffsetDateTime } from '../domain/clinic-time';
import { Appointment, CreateAppointmentRequest } from '../model/appointment';
import { DentistAvailability } from '../model/availability';
import { Page } from '../model/page';
import { PatientLookupQuery, PatientView } from '../model/patient';
import { DentistDirectoryItem } from './dentist-directory';
import { DemoAppointmentStore } from './demo-appointment-store';

export interface DemoSpecialty {
  readonly id: string;
  readonly name: string;
  readonly consultations: readonly string[];
}

const PATIENTS: readonly PatientView[] = [
  ['patient-demo-001', 'Ana García'], ['patient-demo-002', 'Carlos López'],
  ['patient-demo-003', 'Laura Martínez'], ['patient-demo-004', 'Sebastián Rojas'],
  ['patient-demo-005', 'Valentina Torres'], ['patient-demo-006', 'Daniel Herrera'],
  ['patient-demo-007', 'Camila Rodríguez'], ['patient-demo-008', 'Andrés Ramírez'],
].map(([id, name], index) => ({ id, name, status: 'ACTIVE', version: 1, documentType: 'DEMO', documentNumber: `D-${String(index + 1).padStart(3, '0')}` }));

const DENTISTS: readonly DentistDirectoryItem[] = [
  { id: 'dentist-demo-001', name: 'Odontóloga A' },
  { id: 'dentist-demo-002', name: 'Odontólogo B' },
  { id: 'dentist-demo-003', name: 'Odontóloga C' },
];

const DENTIST_SPECIALTIES: Readonly<Record<string, readonly string[]>> = {
  'dentist-demo-001': ['general', 'endodontics'],
  'dentist-demo-002': ['general', 'orthodontics'],
  'dentist-demo-003': ['general'],
};

@Injectable({ providedIn: 'root' })
export class SchedulingDemoService {
  readonly specialties: readonly DemoSpecialty[] = [
    { id: 'general', name: 'Odontología general', consultations: ['Consulta de valoración', 'Control preventivo'] },
    { id: 'orthodontics', name: 'Ortodoncia', consultations: ['Valoración ortodóntica'] },
    { id: 'endodontics', name: 'Endodoncia', consultations: ['Consulta de valoración'] },
  ];

  constructor(private readonly appointments: DemoAppointmentStore) {}

  searchPatients(query: PatientLookupQuery = {}): Observable<Page<PatientView>> {
    const search = query.search?.trim().toLocaleLowerCase('es-CO') ?? '';
    const data = PATIENTS.filter((patient) => !search || `${patient.name} ${patient.documentNumber}`.toLocaleLowerCase('es-CO').includes(search));
    return of({ data, meta: { page: 1, limit: data.length, total: data.length, totalPages: 1 } });
  }

  listDentists(): Observable<readonly DentistDirectoryItem[]> { return of(DENTISTS); }

  listDentistsForSpecialty(specialtyId: string): Observable<readonly DentistDirectoryItem[]> {
    return of(DENTISTS.filter((dentist) => DENTIST_SPECIALTIES[dentist.id]?.includes(specialtyId)));
  }

  getDentistAvailability(dentistId: string): Observable<DentistAvailability> {
    const intervals = Array.from({ length: 7 }, (_, day) => ['08:00', '08:30', '09:00', '10:00', '14:00', '15:00'].map((time) => this.interval(day, time))).flat();
    const blockedIntervals = this.appointments.forDentist(dentistId).map(({ startAt, endAt }) => ({ startAt, endAt }));
    return of({ id: `availability-${dentistId}`, dentistId, intervals, blockedIntervals, version: 1 });
  }

  createAppointment(request: CreateAppointmentRequest, _idempotencyKey: string): Observable<Appointment> {
    try { return of(this.appointments.reserve(request, PATIENTS.find((patient) => patient.id === request.patientId)?.name ?? 'Paciente demostrativo')); }
    catch { return throwError(() => ({ error: 'APPOINTMENT_CONFLICT', message: 'Horario reservado en demostración.', traceId: 'demo' })); }
  }

  private interval(dayOffset: number, time: string): { startAt: string; endAt: string } {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((part) => [part.type, part.value]));
    const date = new Date(Date.UTC(Number(parts['year']), Number(parts['month']) - 1, Number(parts['day']) + dayOffset));
    const localDate = date.toISOString().slice(0, 10);
    const [hour, minute] = time.split(':').map(Number);
    const end = `${String(hour + (minute === 30 ? 1 : 0)).padStart(2, '0')}:${minute === 30 ? '00' : '30'}`;
    return { startAt: toClinicOffsetDateTime(`${localDate}T${time}`), endAt: toClinicOffsetDateTime(`${localDate}T${end}`) };
  }
}
