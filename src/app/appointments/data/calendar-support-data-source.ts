import {
  InjectionToken,
} from '@angular/core';

import { Appointment } from '../model/appointment';

export type TreatmentKey =
  | 'cleaning'
  | 'surgery'
  | 'orthodontics';

export interface TreatmentLegendItem {
  readonly key: TreatmentKey;
  readonly name: string;
}

export interface WaitingListItem {
  readonly name: string;
  readonly treatment: string;
  readonly treatmentKey: TreatmentKey;
  readonly preference: string;
}

export interface CalendarSupportDataSource {
  readonly treatmentLegend: readonly TreatmentLegendItem[];
  readonly waitingList: readonly WaitingListItem[];
  readonly appointments: readonly Appointment[];
}

export const CALENDAR_SUPPORT_DATA_SOURCE =
  new InjectionToken<CalendarSupportDataSource>(
    'CALENDAR_SUPPORT_DATA_SOURCE',
  );

export const CALENDAR_SUPPORT_FIXTURE_DATA: CalendarSupportDataSource = {
  treatmentLegend: [
    {
      key: 'cleaning',
      name: 'Limpieza',
    },
    {
      key: 'surgery',
      name: 'Cirugía',
    },
    {
      key: 'orthodontics',
      name: 'Ortodoncia',
    },
  ],
  waitingList: [
    {
      name: 'Ana García',
      treatment: 'Cirugía',
      treatmentKey: 'surgery',
      preference: 'Prefiere: Mañanas (9am – 12pm)',
    },
    {
      name: 'Carlos López',
      treatment: 'Limpieza',
      treatmentKey: 'cleaning',
      preference: 'Cualquier horario disponible.',
    },
  ],
  appointments: [
    {
      id: 'appointment-demo-completion-001',
      patientId: 'patient-demo-003',
      dentistId: 'dentist-demo-001',
      startAt: '2026-10-16T14:00:00-05:00',
      endAt: '2026-10-16T14:30:00-05:00',
      reason: 'Control preventivo',
      status: 'EN_ATENCION',
      confirmationStatus: 'CONFIRMED',
      version: 1,
    },
    {
      id: 'appointment-demo-completion-rejected-001',
      patientId: 'patient-demo-004',
      dentistId: 'dentist-demo-001',
      startAt: '2026-10-17T14:00:00-05:00',
      endAt: '2026-10-17T14:30:00-05:00',
      reason: 'Control preventivo',
      status: 'EN_ATENCION',
      confirmationStatus: 'CONFIRMED',
      version: 1,
    },
    {
      id: 'appointment-demo-no-show-001',
      patientId: 'patient-demo-002',
      dentistId: 'dentist-demo-001',
      startAt: '2026-10-08T14:00:00-05:00',
      endAt: '2026-10-08T14:30:00-05:00',
      reason: 'Control preventivo',
      status: 'PROGRAMADA',
      confirmationStatus: 'PENDING',
      version: 1,
    },
    {
      id: 'appointment-demo-001',
      patientId: 'patient-demo-001',
      dentistId: 'dentist-demo-001',
      startAt: '2026-10-15T14:00:00-05:00',
      endAt: '2026-10-15T14:30:00-05:00',
      reason: 'Control preventivo',
      status: 'PROGRAMADA',
      confirmationStatus: 'PENDING',
      version: 1,
    },
  ],
};
