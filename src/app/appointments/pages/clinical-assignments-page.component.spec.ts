import { TestBed } from '@angular/core/testing';

import { ClinicalAssignmentsPageComponent } from './clinical-assignments-page.component';
import { CLINICAL_ASSIGNMENT_DEMO_DATA } from '../data/clinical-assignment-demo.data';

describe('ClinicalAssignmentsPageComponent', () => {
  it('renders demonstrable assignments and their active sources', async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalAssignmentsPageComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ClinicalAssignmentsPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Asignaciones clínicas');
    expect(element.textContent).toContain('Datos demostrativos');
    expect(element.querySelectorAll('[data-clinical-assignment]')).toHaveLength(8);
    expect(element.textContent).toContain('Fuente demostrativa A');
  });

  it('shows the empty state when the demonstrable fixture has no assignments', async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalAssignmentsPageComponent],
      providers: [{ provide: CLINICAL_ASSIGNMENT_DEMO_DATA, useValue: [] }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ClinicalAssignmentsPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay asignaciones clínicas registradas.');
  });

  it('creates an assignment only from an authorized demonstrable profile', async () => {
    await TestBed.configureTestingModule({ imports: [ClinicalAssignmentsPageComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ClinicalAssignmentsPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('[data-new-assignment]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Nueva asignación');
    select(element, '[data-assignment-patient]', 'Ana García');
    select(element, '[data-assignment-dentist]', 'Odontólogo B');
    select(element, '[data-assignment-source]', 'Fuente demostrativa A');
    fixture.detectChanges();
    (element.querySelector('[data-create-assignment]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('[data-clinical-assignment]')).toHaveLength(9);
    expect(element.textContent).toContain('Asignación demostrativa creada.');
  });

  it('ends only the selected active source and preserves an independent source', async () => {
    await TestBed.configureTestingModule({ imports: [ClinicalAssignmentsPageComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ClinicalAssignmentsPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('[data-end-source="ca-demo-001-source-a"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Confirmar finalización');
    (element.querySelector('[data-confirm-ending]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const firstAssignment = element.querySelector('[data-clinical-assignment]') as HTMLElement;
    expect(firstAssignment.textContent).toContain('Fuente demostrativa A · Finalizada');
    expect(firstAssignment.textContent).toContain('Fuente demostrativa B · Vigente');
    expect(firstAssignment.textContent).toContain('Activa');
  });

  it('does not expose management controls to the dentist demonstration profile', async () => {
    await TestBed.configureTestingModule({ imports: [ClinicalAssignmentsPageComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ClinicalAssignmentsPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    select(element, '[data-demo-profile]', 'DENTIST');
    fixture.detectChanges();
    expect(element.querySelector('[data-new-assignment]')).toBeNull();
    expect(element.querySelector('[data-end-source]')).toBeNull();
    expect(element.textContent).toContain('no puede crear ni finalizar');
  });

  function select(element: HTMLElement, selector: string, value: string): void {
    const input = element.querySelector<HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('change'));
  }
});
