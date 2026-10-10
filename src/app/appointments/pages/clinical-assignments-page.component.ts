import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import {
  CLINICAL_ASSIGNMENT_DEMO_DATA,
  ClinicalAssignmentDemo,
} from '../data/clinical-assignment-demo.data';

@Component({
  selector: 'app-clinical-assignments-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="assignments-page">
      <header>
        <div><p class="eyebrow">Datos demostrativos</p><h1>Asignaciones clínicas</h1><p>Gestiona las asignaciones entre pacientes y odontólogos.</p></div>
        <div class="tools"><label>Perfil demostrativo <select data-demo-profile (change)="profile.set($any($event.target).value)"><option value="SECRETARY">Secretario/Asistente</option><option value="ADMIN">Administrador</option><option value="DENTIST">Odontólogo</option></select></label>@if (canManage()) { <button data-new-assignment (click)="creating.set(true)">Nueva asignación</button> }</div>
      </header>
      <p class="count">{{ activeCount() }} activas</p>
      @if (creating()) { <section class="form" data-assignment-form><h2>Nueva asignación</h2><label>Paciente <select data-assignment-patient (change)="patient.set($any($event.target).value)"><option value="">Selecciona</option>@for (name of patients; track name) { <option [value]="name">{{ name }}</option> }</select></label><label>Odontólogo <select data-assignment-dentist (change)="dentist.set($any($event.target).value)"><option value="">Selecciona</option>@for (name of dentists; track name) { <option [value]="name">{{ name }}</option> }</select></label><label>Fuente <select data-assignment-source (change)="source.set($any($event.target).value)"><option value="">Selecciona</option><option value="Fuente demostrativa A">Fuente demostrativa A</option><option value="Fuente demostrativa B">Fuente demostrativa B</option></select></label><button data-create-assignment [disabled]="!canCreate()" (click)="create()">Crear asignación</button><button class="secondary" (click)="creating.set(false)">Cancelar</button>@if (formError()) { <p class="message" role="alert">{{ formError() }}</p> }</section> }
      @if (!canManage()) { <p class="message">Este perfil demostrativo no puede crear ni finalizar asignaciones.</p> }
      @if (feedback()) { <p class="message success" role="status">{{ feedback() }}</p> }
      @if (assignments().length) {
        <section class="assignment-list" aria-label="Listado de asignaciones clínicas">
          @for (assignment of assignments(); track assignment.id) {
            <article data-clinical-assignment>
              <div class="assignment-heading"><span class="reference">{{ assignment.id }}</span><span [class.ended]="assignment.status === 'ENDED'" class="status">{{ statusLabel(assignment.status) }}</span></div>
              <h2>{{ assignment.patient }}</h2><p>{{ assignment.dentist }}</p>
              <dl><div><dt>Inicio</dt><dd>{{ assignment.startedAt }}</dd></div>@if (assignment.endedAt) { <div><dt>Finalización</dt><dd>{{ assignment.endedAt }}</dd></div> }</dl>
              <p class="sources"><strong>Fuentes actuales</strong>@for (source of assignment.sources; track source.id) { <span [class.inactive]="!source.active">{{ source.label }} · {{ source.active ? 'Vigente' : 'Finalizada' }}</span>@if (source.active && canManage()) { <button class="secondary end" [attr.data-end-source]="assignment.id + '-' + source.id" (click)="ending.set({ assignmentId: assignment.id, sourceId: source.id })">Finalizar fuente</button> } }</p>
            </article>
          }
        </section>
      } @else { <p class="empty">No hay asignaciones clínicas registradas.</p> }
      @if (ending(); as selection) { <section class="confirmation"><h2>Finalizar asignación</h2><p>Finalizarás únicamente la fuente seleccionada; las fuentes independientes vigentes se conservan.</p><button data-confirm-ending (click)="end(selection.assignmentId, selection.sourceId)">Confirmar finalización</button><button class="secondary" (click)="ending.set(null)">Volver</button></section> }
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
    button:focus-visible, select:focus-visible { outline: 3px solid rgba(21, 84, 163, .22); outline-offset: 2px; } button:disabled { opacity: .55; cursor: not-allowed; }
    select { box-sizing: border-box; min-height: 42px; padding: 8px 10px; border: 1px solid #d6dee2; border-radius: 8px; background: #fff; color: #1f2933; font: inherit; }
    .count { width: max-content; margin: 0 0 20px; padding: 6px 8px; border-radius: 7px; background: #cbefeb; color: #0f766e; font-size: 13px; font-weight: 700; }
    .form, .confirmation { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; margin: 0 0 20px; padding: 18px 20px; border: 1px solid #d6dee2; border-radius: 12px; background: #fff; }
    .form h2, .confirmation h2 { flex-basis: 100%; margin: 0; color: #168e82; font-size: 18px; } .form label { display: grid; gap: 6px; color: #1f2933; font-size: 14px; font-weight: 600; }
    .message { margin: 0 0 16px; padding: 12px; border: 1px solid #d6dee2; border-radius: 8px; background: #fff; color: #66737a; } .success { border-color: #c4e5df; background: #e7f6f4; color: #0f766e; }
    .assignment-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(245px, 1fr)); gap: 20px; } article { padding: 20px; border: 1px solid #d6dee2; border-radius: 12px; background: #fff; box-shadow: 0 4px 12px #1231; }
    .assignment-heading { display: flex; justify-content: space-between; gap: 8px; } .reference, dt { color: #66737a; font-size: 12px; } .status { border-radius: 7px; padding: 6px 8px; background: #cbefeb; color: #0f766e; font-size: 13px; font-weight: 700; } .status.ended, .inactive { background: #f2f4f5; color: #69747a; }
    h2 { margin: 14px 0 3px; font-size: 18px; } article > p { margin: 0; color: #66737a; } dl { display: flex; gap: 18px; margin: 15px 0; } dd { margin: 3px 0 0; font-size: 13px; }
    .sources { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid #eef2f4; font-size: 13px; } .sources span { width: max-content; max-width: 100%; padding: 5px 8px; border-radius: 7px; background: #e7f6f4; color: #0f766e; } .end { width: max-content; min-height: 34px; padding: 5px 8px; font-size: 12px; }
    .empty { padding: 26px; border: 1px dashed #d6dee2; border-radius: 8px; color: #66737a; text-align: center; }
    @media (max-width: 600px) { .assignments-page { padding: 16px; } header { flex-direction: column; } .tools, .tools label, .tools button, .form label, .form button { width: 100%; } .tools { align-items: stretch; } }
  `],
})
export class ClinicalAssignmentsPageComponent {
  readonly assignments = signal(inject(CLINICAL_ASSIGNMENT_DEMO_DATA));
  readonly activeCount = computed(() => this.assignments().filter(({ status }) => status === 'ACTIVE').length);
  readonly profile = signal('SECRETARY');
  readonly creating = signal(false);
  readonly patient = signal('');
  readonly dentist = signal('');
  readonly source = signal('');
  readonly formError = signal('');
  readonly feedback = signal('');
  readonly ending = signal<{ assignmentId: string; sourceId: string } | null>(null);
  readonly patients = ['Ana García', 'Carlos López', 'Laura Martínez', 'Sebastián Rojas'];
  readonly dentists = ['Odontóloga A', 'Odontólogo B'];
  readonly canManage = computed(() => this.profile() !== 'DENTIST');
  readonly canCreate = computed(() => this.canManage() && !!this.patient() && !!this.dentist() && !!this.source());

  statusLabel(status: ClinicalAssignmentDemo['status']): string {
    return status === 'ACTIVE' ? 'Activa' : 'Finalizada';
  }

  create(): void {
    if (!this.canCreate()) { this.formError.set('Completa los campos requeridos.'); return; }
    const id = `ca-demo-${String(this.assignments().length + 1).padStart(3, '0')}`;
    this.assignments.update((items) => [...items, { id, patient: this.patient(), dentist: this.dentist(), status: 'ACTIVE', startedAt: '2026-10-10', sources: [{ id: 'source-created', label: this.source(), active: true }] }]);
    this.creating.set(false); this.feedback.set('Asignación demostrativa creada.'); this.formError.set('');
  }

  end(assignmentId: string, sourceId: string): void {
    this.assignments.update((items) => items.map((item) => {
      if (item.id !== assignmentId) return item;
      const sources = item.sources.map((source) => source.id === sourceId ? { ...source, active: false } : source);
      return { ...item, sources, status: sources.some((source) => source.active) ? 'ACTIVE' : 'ENDED', endedAt: sources.some((source) => source.active) ? undefined : '2026-10-10' };
    }));
    this.ending.set(null); this.feedback.set('Fuente demostrativa finalizada.');
  }
}
