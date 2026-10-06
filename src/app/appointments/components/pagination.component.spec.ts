import { TestBed } from '@angular/core/testing';

import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();
  });

  it('shows the current page and total pages', () => {
    const fixture = TestBed.createComponent(PaginationComponent);

    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Página 2 de 5');
  });

  it('disables the previous button on the first page', () => {
    const fixture = TestBed.createComponent(PaginationComponent);

    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const previous = element.querySelector<HTMLButtonElement>(
      '[data-action="previous"]',
    );

    expect(previous?.disabled).toBe(true);
  });

  it('disables the next button on the last page', () => {
    const fixture = TestBed.createComponent(PaginationComponent);

    fixture.componentRef.setInput('page', 5);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const next = element.querySelector<HTMLButtonElement>(
      '[data-action="next"]',
    );

    expect(next?.disabled).toBe(true);
  });

  it('emits the previous page when previous is pressed', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    let requestedPage: number | undefined;

    fixture.componentInstance.pageChange.subscribe((page) => {
      requestedPage = page;
    });

    fixture.componentRef.setInput('page', 3);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const previous = element.querySelector<HTMLButtonElement>(
      '[data-action="previous"]',
    );

    previous?.click();

    expect(requestedPage).toBe(2);
  });

  it('emits the next page when next is pressed', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    let requestedPage: number | undefined;

    fixture.componentInstance.pageChange.subscribe((page) => {
      requestedPage = page;
    });

    fixture.componentRef.setInput('page', 3);
    fixture.componentRef.setInput('totalPages', 5);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const next = element.querySelector<HTMLButtonElement>(
      '[data-action="next"]',
    );

    next?.click();

    expect(requestedPage).toBe(4);
  });
});