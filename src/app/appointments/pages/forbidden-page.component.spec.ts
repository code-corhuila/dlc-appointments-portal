import { TestBed } from '@angular/core/testing';

import { ForbiddenPageComponent } from './forbidden-page.component';

describe('ForbiddenPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenPageComponent],
    }).compileComponents();
  });

  it('renders the forbidden status code', () => {
    const fixture = TestBed.createComponent(ForbiddenPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('403');
  });

  it('explains that the user does not have permission', () => {
    const fixture = TestBed.createComponent(ForbiddenPageComponent);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'No tienes permisos para acceder a esta sección.',
    );
  });
});