import { Routes } from '@angular/router';

import { CalendarPageComponent } from './pages/calendar-page.component';
import { ForbiddenPageComponent } from './pages/forbidden-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';
import { SchedulingPageComponent } from './pages/scheduling-page.component';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: 'calendar',
    component: CalendarPageComponent,
  },
  {
    path: 'appointments/new',
    component: SchedulingPageComponent,
  },
  {
    path: 'forbidden',
    component: ForbiddenPageComponent,
  },
  {
    path: '**',
    component: NotFoundPageComponent,
  },
];