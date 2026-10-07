import {
  InjectionToken,
} from '@angular/core';

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
};