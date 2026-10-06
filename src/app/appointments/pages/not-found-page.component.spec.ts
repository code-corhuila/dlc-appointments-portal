import { TestBed } from '@angular/core/testing';

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
});