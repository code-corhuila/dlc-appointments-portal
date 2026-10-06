import { Routes } from '@angular/router';

import { CalendarPageComponent } from './pages/calendar-page.component';
import { ForbiddenPageComponent } from './pages/forbidden-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: 'calendar',
    component: CalendarPageComponent,
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