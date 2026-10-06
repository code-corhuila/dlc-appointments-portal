import { TestBed } from '@angular/core/testing';

import { ViewStateComponent } from './view-state.component';

describe('ViewStateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewStateComponent],
    }).compileComponents();
  });

  it('renders the loading state accessibly', () => {
    const fixture = TestBed.createComponent(ViewStateComponent);

    fixture.componentRef.setInput('state', 'loading');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const loading = element.querySelector('[data-view-state="loading"]');

    expect(loading).not.toBeNull();
    expect(loading?.getAttribute('aria-busy')).toBe('true');
    expect(element.textContent).toContain('Cargando');
  });

  it('renders an error message and retry action', () => {
    const fixture = TestBed.createComponent(ViewStateComponent);

    fixture.componentRef.setInput('state', 'error');
    fixture.componentRef.setInput(
      'errorMessage',
      'No fue posible cargar la información.',
    );
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'No fue posible cargar la información.',
    );
    expect(
      element.querySelector('[data-action="retry"]'),
    ).not.toBeNull();
  });

  it('emits retry when the retry button is pressed', () => {
    const fixture = TestBed.createComponent(ViewStateComponent);
    let retried = false;

    fixture.componentInstance.retry.subscribe(() => {
      retried = true;
    });

    fixture.componentRef.setInput('state', 'error');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

const button = element.querySelector<HTMLButtonElement>(
  '[data-action="retry"]',
);

    button?.click();

    expect(retried).toBe(true);
  });

  it('renders the empty state with an explanation', () => {
    const fixture = TestBed.createComponent(ViewStateComponent);

    fixture.componentRef.setInput('state', 'empty');
    fixture.componentRef.setInput(
      'emptyMessage',
      'No hay información disponible.',
    );
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-view-state="empty"]'),
    ).not.toBeNull();
    expect(element.textContent).toContain(
      'No hay información disponible.',
    );
  });

  it('renders the data state container', () => {
    const fixture = TestBed.createComponent(ViewStateComponent);

    fixture.componentRef.setInput('state', 'data');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-view-state="data"]'),
    ).not.toBeNull();
  });
});