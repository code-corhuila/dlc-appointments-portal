import { firstValueFrom } from 'rxjs';

import { SchedulingDemoService } from './scheduling-demo.service';
import { DemoAppointmentStore } from './demo-appointment-store';

describe('SchedulingDemoService', () => {
  it('searches synthetic patients and prevents duplicate reservations', async () => {
    const service = new SchedulingDemoService(new DemoAppointmentStore());
    const patients = await firstValueFrom(
      service.searchPatients({ search: 'Ana', status: 'ACTIVE' }),
    );

    expect(patients.data[0]?.name).toBe('Ana García');

    expect(await firstValueFrom(service.listDentistsForSpecialty('orthodontics')))
      .toEqual([{ id: 'dentist-demo-002', name: 'Odontólogo B' }]);

    const availability = await firstValueFrom(
      service.getDentistAvailability('dentist-demo-001'),
    );
    const slot = availability.intervals[0];

    expect(slot).toBeDefined();

    const request = {
      patientId: patients.data[0]!.id,
      dentistId: 'dentist-demo-001',
      startAt: slot!.startAt,
      endAt: slot!.endAt,
      reason: 'Consulta demostrativa',
    };

    const appointment = await firstValueFrom(
      service.createAppointment(request, 'demo-key-1'),
    );

    expect(appointment.status).toBe('PROGRAMADA');
    expect(appointment.id).toMatch(/^appointment-demo-/);

    await expect(
      firstValueFrom(service.createAppointment(request, 'demo-key-2')),
    ).rejects.toMatchObject({ error: 'APPOINTMENT_CONFLICT' });
  });
});
