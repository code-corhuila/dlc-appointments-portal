import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CompositionNavigationService } from '../../composition-navigation.service';
import { SHELL_CONTEXT } from '../../shell-contract';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
    }).compileComponents();
  });

  it('renders the not found status code', () => {
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('404');
  });

  it('explains that the requested page was not found', () => {
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'No encontramos la página que buscas.',
    );
  });

  it('provides an action to go back', () => {
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-action="back"]'),
    ).not.toBeNull();
  });

  it('keeps browser back navigation in independent mode', () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {});
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    fixture.componentInstance.goBack();

    expect(back).toHaveBeenCalledOnce();
  });

  it('requests the calendar through the shell in composition mode', async () => {
    TestBed.resetTestingModule();
    const request = vi.fn();
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [
        CompositionNavigationService,
        { provide: SHELL_CONTEXT, useValue: { navigation: { request } } },
      ],
    }).compileComponents();
    const back = vi.spyOn(history, 'back').mockImplementation(() => {});
    back.mockClear();
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    fixture.detectChanges();
    fixture.componentInstance.goBack();

    expect(fixture.nativeElement.textContent).toContain('Ir al calendario');
    expect(request).toHaveBeenCalledWith({ path: '/app/appointments/calendar' });
    expect(back).not.toHaveBeenCalled();
  });
});
