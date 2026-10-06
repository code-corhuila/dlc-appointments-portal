import { TestBed } from '@angular/core/testing';

import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();
  });

  it.each([
    ['PROGRAMADA', 'Programada'],
    ['CONFIRMADA', 'Confirmada'],
    ['EN_ATENCION', 'En atención'],
    ['FINALIZADA', 'Finalizada'],
    ['CANCELADA', 'Cancelada'],
    ['NO_ASISTIO', 'No asistió'],
  ] as const)(
    'renders %s as "%s"',
    (status, expectedLabel) => {
      const fixture = TestBed.createComponent(StatusBadgeComponent);

      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;

      expect(element.textContent?.trim()).toBe(expectedLabel);
    },
  );

  it('exposes the appointment status as accessible text', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);

    fixture.componentRef.setInput('status', 'CONFIRMADA');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('[data-status]');

    expect(badge).not.toBeNull();
    expect(badge?.getAttribute('data-status')).toBe('CONFIRMADA');
  });
});