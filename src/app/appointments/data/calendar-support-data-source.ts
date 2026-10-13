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
  readonly id: string;
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
    ['001', 'Ana García', 'Cirugía', 'surgery', 'Mañana'],
    ['002', 'Carlos López', 'Limpieza', 'cleaning', 'Cualquier horario'],
    ['003', 'Laura Martínez', 'Ortodoncia', 'orthodontics', 'Tarde'],
    ['004', 'Sebastián Rojas', 'Limpieza', 'cleaning', 'Mañana'],
    ['005', 'Valentina Torres', 'Cirugía', 'surgery', 'Tarde'],
    ['006', 'Daniel Herrera', 'Ortodoncia', 'orthodontics', 'Mañana'],
    ['007', 'Camila Rodríguez', 'Limpieza', 'cleaning', 'Cualquier horario'],
    ['008', 'Andrés Ramírez', 'Ortodoncia', 'orthodontics', 'Tarde'],
  ].map(([id, name, treatment, treatmentKey, preference]) => ({
    id: `waiting-demo-${id}`, name, treatment,
    treatmentKey: treatmentKey as TreatmentKey, preference,
  })),
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
    ...Array.from({ length: 20 }, (_, index): Appointment => {
      const day = String((index * 3) % 28 + 1).padStart(2, '0');
      const hour = String(8 + (index % 8)).padStart(2, '0');
      const status = ['PROGRAMADA', 'CONFIRMADA', 'EN_ATENCION', 'FINALIZADA', 'CANCELADA', 'NO_ASISTIO'][index % 6] as Appointment['status'];
      return {
        id: `appointment-demo-${String(index + 10).padStart(3, '0')}`,
        patientId: `patient-demo-${String(index + 10).padStart(3, '0')}`,
        dentistId: `dentist-demo-${index % 3 + 1}`,
        startAt: `2026-10-${day}T${hour}:00:00-05:00`,
        endAt: `2026-10-${day}T${hour}:30:00-05:00`,
        reason: ['Limpieza', 'Cirugía', 'Ortodoncia'][index % 3],
        status, confirmationStatus: status === 'CONFIRMADA' ? 'CONFIRMED' : 'PENDING', version: 1,
      };
    }),
  ],
};
