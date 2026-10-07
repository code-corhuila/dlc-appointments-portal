import { Routes } from '@angular/router';

import { AvailabilityPageComponent } from './pages/availability-page.component';
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
    path: 'new',
    component: SchedulingPageComponent,
  },
  {
    path: 'availability',
    component: AvailabilityPageComponent,
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