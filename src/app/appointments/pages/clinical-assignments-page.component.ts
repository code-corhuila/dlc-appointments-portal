import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, expand, map, reduce } from 'rxjs';

import { ApiErrorAlertComponent } from '../components/api-error-alert.component';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { DENTIST_DIRECTORY, DentistDirectoryItem } from '../data/dentist-directory';
import { PatientsLookupService } from '../data/patients-lookup.service';
import { toClinicLocalDateTime } from '../domain/clinic-time';
import { ApiError } from '../model/api-error';
import { ClinicalAssignment } from '../model/clinical-assignment';
import { toApiError } from '../model/to-api-error';
import { PatientView } from '../model/patient';
import { SHELL_CONTEXT } from '../../shell-contract';

const MANAGING_ROLES = ['ADMINISTRATOR', 'SECRETARY_ASSISTANT'];
const PAGE_SIZE = 100;

/** Ongoing clinical assignments (HU-APT-004) from the Appointments API; eligible for Administrator and Secretary/Assistant. */
@Component({
  selector: 'app-clinical-assignments-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApiErrorAlertComponent],
  template: `
    <main class="assignments-page">
      <header>
        <div><h1>Asignaciones clínicas</h1><p>Gestiona las asignaciones entre pacientes y odontólogos.</p></div>
        @if (canManage()) { <div class="tools"><button data-new-assignment (click)="openForm()">Nueva asignación</button></div> }
      </header>
      @if (!canManage()) {
        <p class="message" data-assignments-forbidden>Tu rol no gestiona asignaciones clínicas.</p>
      } @else {
        <p class="count">{{ activeCount() }} activas</p>
        @if (loadError(); as error) { <app-api-error-alert [error]="error" /> }
        @if (creating()) {
          <section class="form" data-assignment-form><h2>Nueva asignación</h2>
            <label>Paciente <input data-assignment-patient-search placeholder="Buscar paciente activo" (input)="searchPatient($any($event.target).value)" /></label>
            @if (patient(); as selected) { <p>Paciente: <strong>{{ selected.name }}</strong></p> }
            @if (patientResults().length) { <div class="options">@for (option of patientResults(); track option.id) { <button type="button" [attr.data-assignment-patient-option]="option.id" (click)="choosePatient(option)">{{ option.name }}</button> }</div> }
            <label>Odontólogo <select data-assignment-dentist (change)="dentistId.set($any($event.target).value)"><option value="">Selecciona</option>@for (dentist of dentists(); track dentist.id) { <option [value]="dentist.id">{{ dentist.name }}</option> }</select></label>
            <label>Motivo <input data-assignment-reason maxlength="1000" (input)="reason.set($any($event.target).value)" /></label>
            <button data-create-assignment [disabled]="busy()" (click)="create()">Crear asignación</button><button class="secondary" (click)="creating.set(false)">Cancelar</button>
            @if (formError()) { <p class="message" role="alert">{{ formError() }}</p> }
          </section>
        }
        @if (feedback()) { <p class="message success" role="status">{{ feedback() }}</p> }
        @if (assignments().length) {
          <section class="assignment-list" aria-label="Listado de asignaciones clínicas">
            @for (assignment of assignments(); track assignment.id) {
              <article data-clinical-assignment>
                <div class="assignment-heading"><span class="reference">{{ assignment.id }}</span><span [class.ended]="assignment.status === 'ENDED'" class="status">{{ assignment.status === 'ACTIVE' ? 'Activa' : 'Finalizada' }}</span></div>
                <h2>{{ patientName(assignment.patientId) }}</h2><p>{{ dentistName(assignment.dentistId) }}</p>
                <dl><div><dt>Inicio</dt><dd>{{ day(assignment.startedAt) }}</dd></div>@if (assignment.endedAt) { <div><dt>Finalización</dt><dd>{{ day(assignment.endedAt) }}</dd></div> }<div><dt>Motivo</dt><dd>{{ assignment.reason }}</dd></div></dl>
                @if (assignment.status === 'ACTIVE') { <button class="secondary end" [attr.data-end-assignment]="assignment.id" (click)="startEnding(assignment)">Finalizar asignación</button> }
              </article>
            }
          </section>
        } @else if (!loadError()) { <p class="empty">No hay asignaciones clínicas registradas.</p> }
        @if (ending(); as selected) {
          <section class="confirmation"><h2>Finalizar asignación</h2><p>{{ patientName(selected.patientId) }} · {{ dentistName(selected.dentistId) }}</p>
            <label>Motivo <input data-ending-reason maxlength="1000" (input)="endingReason.set($any($event.target).value)" /></label>
            <button data-confirm-ending [disabled]="busy()" (click)="end(selected)">Confirmar finalización</button><button class="secondary" (click)="ending.set(null)">Volver</button>
          </section>
        }
      }
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100%; background: #f7f9fa; color: #1f2933; font-family: Inter, system-ui, sans-serif; }
    .assignments-page { max-width: 1180px; margin: 0 auto; padding: 24px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 12px; }
    h1 { margin: 0 0 6px; color: #168e82; font-size: 24px; line-height: 1.25; }
    header p { margin: 0; color: #66737a; } .eyebrow { margin-bottom: 6px; color: #168e82; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .tools { display: flex; align-items: flex-end; gap: 12px; } .tools label { display: grid; gap: 6px; color: #1f2933; font-size: 14px; font-weight: 700; }
    button { min-height: 42px; border: 0; border-radius: 8px; padding: 8px 12px; background: #168e82; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    button:hover:not(:disabled) { background: #0f766e; } .secondary { border: 1px solid #168e82; background: #fff; color: #0f766e; } .secondary:hover:not(:disabled) { background: #e7f6f4; }
    .options { display: grid; gap: 6px; flex-basis: 100%; } .options button { background: #fff; color: #0f766e; border: 1px solid #d6dee2; text-align: left; }
    input { box-sizing: border-box; min-height: 42px; padding: 8px 10px; border: 1px solid #d6dee2; border-radius: 8px; font: inherit; }
    button:focus-visible, select:focus-visible { outline: 3px solid rgba(21, 84, 163, .22); outline-offset: 2px; } button:disabled { opacity: .55; cursor: not-allowed; }
    select { box-sizing: border-box; min-height: 42px; padding: 8px 10px; border: 1px solid #d6dee2; border-radius: 8px; background: #fff; color: #1f2933; font: inherit; }
    .count { width: max-content; margin: 0 0 20px; padding: 6px 8px; border-radius: 7px; background: #cbefeb; color: #0f766e; font-size: 13px; font-weight: 700; }
    .form, .confirmation { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; margin: 0 0 20px; padding: 18px 20px; border: 1px solid #d6dee2; border-radius: 12px; background: #fff; }
    .form h2, .confirmation h2 { flex-basis: 100%; margin: 0; color: #168e82; font-size: 18px; } .form label { display: grid; gap: 6px; color: #1f2933; font-size: 14px; font-weight: 600; }
    .message { margin: 0 0 16px; padding: 12px; border: 1px solid #d6dee2; border-radius: 8px; background: #fff; color: #66737a; } .success { border-color: #c4e5df; background: #e7f6f4; color: #0f766e; }
    .assignment-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(245px, 1fr)); gap: 20px; } article { padding: 20px; border: 1px solid #d6dee2; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px #1231; }
    .assignment-heading { display: flex; justify-content: space-between; gap: 8px; } .reference, dt { color: #66737a; font-size: 12px; } .status { border-radius: 7px; padding: 6px 8px; background: #cbefeb; color: #0f766e; font-size: 13px; font-weight: 700; } .status.ended, .inactive { background: #f2f4f5; color: #69747a; }
    h2 { margin: 14px 0 3px; font-size: 18px; } article > p { margin: 0; color: #66737a; } dl { display: flex; gap: 18px; margin: 15px 0; } dd { margin: 3px 0 0; font-size: 13px; }
    .end { width: max-content; min-height: 34px; padding: 5px 8px; font-size: 12px; }
    .empty { padding: 26px; border: 1px dashed #d6dee2; border-radius: 8px; color: #66737a; text-align: center; }
    @media (max-width: 600px) { .assignments-page { padding: 16px; } header { flex-direction: column; } .tools, .tools label, .tools button, .form label, .form button { width: 100%; } .tools { align-items: stretch; } }
  `],
})
export class ClinicalAssignmentsPageComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly patients = inject(PatientsLookupService);
  private readonly directory = inject(DENTIST_DIRECTORY);
  private readonly destroyRef = inject(DestroyRef);
  private readonly roles = inject(SHELL_CONTEXT, { optional: true })?.session.getSnapshot().user?.roles ?? [];
  private readonly patientNames = signal<Readonly<Record<string, string>>>({});
  private intentKey = '';
  readonly canManage = signal(this.roles.some((role) => MANAGING_ROLES.includes(role)));
  readonly assignments = signal<readonly ClinicalAssignment[]>([]);
  readonly dentists = signal<readonly DentistDirectoryItem[]>([]);
  readonly loadError = signal<ApiError | null>(null);
  readonly activeCount = computed(() => this.assignments().filter(({ status }) => status === 'ACTIVE').length);
  readonly creating = signal(false);
  readonly busy = signal(false);
  readonly patientResults = signal<readonly PatientView[]>([]);
  readonly patient = signal<PatientView | null>(null);
  readonly dentistId = signal('');
  readonly reason = signal('');
  readonly formError = signal('');
  readonly feedback = signal('');
  readonly ending = signal<ClinicalAssignment | null>(null);
  readonly endingReason = signal('');

  constructor() {
    if (!this.canManage()) return;
    this.directory.listDentists().pipe(takeUntilDestroyed()).subscribe({ next: (items) => this.dentists.set(items), error: () => this.dentists.set([]) });
    this.load();
  }

  patientName(id: string): string { return this.patientNames()[id] ?? 'Paciente'; }
  dentistName(id: string): string { return this.dentists().find((dentist) => dentist.id === id)?.name ?? 'Odontólogo'; }
  day(instant: string): string { const [year, month, date] = toClinicLocalDateTime(instant).slice(0, 10).split('-'); return `${date}/${month}/${year}`; }

  openForm(): void { this.creating.set(true); this.formError.set(''); this.intentKey = crypto.randomUUID(); }

  searchPatient(term: string): void {
    if (term.trim().length < 2) { this.patientResults.set([]); return; }
    this.patients.searchPatients({ search: term.trim(), status: 'ACTIVE', limit: 20 }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (page) => this.patientResults.set(page.data), error: () => this.patientResults.set([]) });
  }

  choosePatient(patient: PatientView): void { this.patient.set(patient); this.patientResults.set([]); }

  create(): void {
    const patient = this.patient();
    if (!patient || !this.dentistId() || !this.reason().trim()) { this.formError.set('Completa paciente, odontólogo y motivo.'); return; }
    this.busy.set(true);
    this.api.createClinicalAssignment({ patientId: patient.id, dentistId: this.dentistId(), reason: this.reason().trim() }, this.intentKey)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.busy.set(false); this.creating.set(false); this.patient.set(null); this.feedback.set('Asignación clínica creada.'); this.load(); },
        error: (error: unknown) => { this.busy.set(false); this.formError.set(this.message(toApiError(error))); },
      });
  }

  startEnding(assignment: ClinicalAssignment): void { this.ending.set(assignment); this.endingReason.set(''); this.intentKey = crypto.randomUUID(); }

  end(assignment: ClinicalAssignment): void {
    if (!this.endingReason().trim()) return;
    this.busy.set(true);
    this.api.endClinicalAssignment(assignment.id, { reason: this.endingReason().trim(), expectedVersion: assignment.version }, this.intentKey)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.busy.set(false); this.ending.set(null); this.feedback.set('Asignación clínica finalizada.'); this.load(); },
        error: (error: unknown) => { this.busy.set(false); this.ending.set(null); this.feedback.set(this.message(toApiError(error))); },
      });
  }

  private message(error: ApiError): string {
    switch (error.error) {
      case 'APPOINTMENT_CONFLICT': return 'El paciente ya tiene una asignación activa con ese odontólogo.';
      case 'STALE_VERSION': return 'La asignación cambió mientras la editabas. Actualiza e intenta de nuevo.';
      case 'VALIDATION_ERROR': return 'Revisa los datos de la asignación.';
      default: return error.message || 'No fue posible completar la operación.';
    }
  }

  private load(): void {
    const read = (page: number) => this.api.listClinicalAssignments({ page, limit: PAGE_SIZE });
    read(1).pipe(
      expand((page) => (page.meta.page < page.meta.totalPages ? read(page.meta.page + 1) : EMPTY)),
      map((page) => page.data),
      reduce((all, items) => [...all, ...items], [] as ClinicalAssignment[]),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (items) => { this.loadError.set(null); this.assignments.set(items); this.resolvePatients(); },
      error: (error: unknown) => { this.assignments.set([]); this.loadError.set(toApiError(error)); },
    });
  }

  private resolvePatients(): void {
    const known = this.patientNames();
    for (const id of new Set(this.assignments().map((item) => item.patientId))) {
      if (id in known) continue;
      this.patients.getPatient(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (patient) => this.patientNames.update((names) => ({ ...names, [id]: patient.name })),
        error: () => this.patientNames.update((names) => ({ ...names, [id]: 'Paciente sin acceso' })),
      });
    }
  }
}
