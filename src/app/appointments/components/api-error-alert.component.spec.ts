import { TestBed } from '@angular/core/testing';

import { ApiError } from '../model/api-error';
import { ApiErrorAlertComponent } from './api-error-alert.component';

describe('ApiErrorAlertComponent', () => {
  const error: ApiError = {
    error: 'SERVICE_UNAVAILABLE',
    message: 'El servicio no está disponible temporalmente.',
    traceId: 'trace-123',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiErrorAlertComponent],
    }).compileComponents();
  });

  it('renders the API error message', () => {
    const fixture = TestBed.createComponent(ApiErrorAlertComponent);

    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'El servicio no está disponible temporalmente.',
    );
  });

  it('renders the trace identifier as a support reference', () => {
    const fixture = TestBed.createComponent(ApiErrorAlertComponent);

    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const trace = element.querySelector('[data-trace-id]');

    expect(trace).not.toBeNull();
    expect(trace?.textContent).toContain('trace-123');
  });

  it('uses an alert role for accessible error feedback', () => {
    const fixture = TestBed.createComponent(ApiErrorAlertComponent);

    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
  });
});