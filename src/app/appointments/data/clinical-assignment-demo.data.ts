import { InjectionToken } from '@angular/core';

export type ClinicalAssignmentDemoStatus = 'ACTIVE' | 'ENDED';

export interface ClinicalAssignmentDemoSource {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
}

export interface ClinicalAssignmentDemo {
  readonly id: string;
  readonly patient: string;
  readonly dentist: string;
  readonly status: ClinicalAssignmentDemoStatus;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly sources: readonly ClinicalAssignmentDemoSource[];
}

export const CLINICAL_ASSIGNMENT_DEMO_DATA = new InjectionToken<
  readonly ClinicalAssignmentDemo[]
>('CLINICAL_ASSIGNMENT_DEMO_DATA', {
  providedIn: 'root',
  factory: () => CLINICAL_ASSIGNMENT_DEMO_FIXTURES,
});

export const CLINICAL_ASSIGNMENT_DEMO_FIXTURES: readonly ClinicalAssignmentDemo[] = [
  { id: 'ca-demo-001', patient: 'Ana García', dentist: 'Odontóloga A', status: 'ACTIVE', startedAt: '2026-10-01', sources: [{ id: 'source-a', label: 'Fuente demostrativa A', active: true }, { id: 'source-b', label: 'Fuente demostrativa B', active: true }] },
  { id: 'ca-demo-002', patient: 'Carlos López', dentist: 'Odontólogo B', status: 'ACTIVE', startedAt: '2026-10-02', sources: [{ id: 'source-a', label: 'Fuente demostrativa A', active: true }] },
  { id: 'ca-demo-003', patient: 'Laura Martínez', dentist: 'Odontóloga A', status: 'ENDED', startedAt: '2026-09-01', endedAt: '2026-09-30', sources: [{ id: 'source-a', label: 'Fuente demostrativa A', active: false }] },
  { id: 'ca-demo-004', patient: 'Sebastián Rojas', dentist: 'Odontólogo B', status: 'ACTIVE', startedAt: '2026-10-03', sources: [{ id: 'source-b', label: 'Fuente demostrativa B', active: true }] },
  { id: 'ca-demo-005', patient: 'Valentina Torres', dentist: 'Odontóloga A', status: 'ACTIVE', startedAt: '2026-10-04', sources: [{ id: 'source-a', label: 'Fuente demostrativa A', active: true }] },
  { id: 'ca-demo-006', patient: 'Daniel Herrera', dentist: 'Odontólogo B', status: 'ENDED', startedAt: '2026-08-20', endedAt: '2026-09-20', sources: [{ id: 'source-b', label: 'Fuente demostrativa B', active: false }] },
  { id: 'ca-demo-007', patient: 'Camila Rodríguez', dentist: 'Odontóloga A', status: 'ACTIVE', startedAt: '2026-10-05', sources: [{ id: 'source-a', label: 'Fuente demostrativa A', active: true }] },
  { id: 'ca-demo-008', patient: 'Andrés Ramírez', dentist: 'Odontólogo B', status: 'ACTIVE', startedAt: '2026-10-06', sources: [{ id: 'source-b', label: 'Fuente demostrativa B', active: true }] },
];
