import { CalendarPageComponent } from './pages/calendar-page.component';
import { ForbiddenPageComponent } from './pages/forbidden-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';
import { APPOINTMENTS_ROUTES } from './appointments.routes';

describe('APPOINTMENTS_ROUTES', () => {
  it('provides the calendar page route', () => {
    const calendarRoute = APPOINTMENTS_ROUTES.find(
      (route) => route.path === 'calendar',
    );

    expect(calendarRoute).toBeDefined();
    expect(calendarRoute?.component).toBe(CalendarPageComponent);
  });

  it('provides the forbidden page route', () => {
    const forbiddenRoute = APPOINTMENTS_ROUTES.find(
      (route) => route.path === 'forbidden',
    );

    expect(forbiddenRoute).toBeDefined();
    expect(forbiddenRoute?.component).toBe(ForbiddenPageComponent);
  });

  it('uses the not found page for unknown routes', () => {
    const notFoundRoute = APPOINTMENTS_ROUTES.find(
      (route) => route.path === '**',
    );

    expect(notFoundRoute).toBeDefined();
    expect(notFoundRoute?.component).toBe(NotFoundPageComponent);
  });

  it('keeps the wildcard route last', () => {
    const lastRoute =
      APPOINTMENTS_ROUTES[APPOINTMENTS_ROUTES.length - 1];

    expect(lastRoute?.path).toBe('**');
  });
});