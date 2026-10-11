import { DemoAppointmentStore } from './demo-appointment-store';

describe('DemoAppointmentStore', () => {
  it('keeps one shared reservation and filters it by dentist', () => {
    const store = new DemoAppointmentStore();
    const appointment = store.reserve({ patientId: 'patient-demo-001', dentistId: 'dentist-demo-001', startAt: '2026-10-15T09:00:00-05:00', endAt: '2026-10-15T09:30:00-05:00', reason: 'Valoración' }, 'Ana García');

    expect(store.appointments()).toEqual([appointment]);
    expect(store.forDentist('dentist-demo-001')).toEqual([appointment]);
    expect(store.forDentist('dentist-demo-002')).toEqual([]);
  });
});
