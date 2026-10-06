import { Routes } from '@angular/router';

import { ForbiddenPageComponent } from './pages/forbidden-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: 'forbidden',
    component: ForbiddenPageComponent,
  },
  {
    path: '**',
    component: NotFoundPageComponent,
  },
];