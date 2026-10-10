import { Routes } from '@angular/router';

import {
  CALENDAR_SUPPORT_DATA_SOURCE,
  CALENDAR_SUPPORT_FIXTURE_DATA,
} from './data/calendar-support-data-source';
import { AvailabilityPageComponent } from './pages/availability-page.component';
import { CalendarPageComponent } from './pages/calendar-page.component';
import { ClinicalAssignmentsPageComponent } from './pages/clinical-assignments-page.component';
import { DentistOwnCalendarComponent } from './pages/dentist-own-calendar.component';
import { ForbiddenPageComponent } from './pages/forbidden-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';
import { SchedulingPageComponent } from './pages/scheduling-page.component';
import { AppointmentsApiService } from './data/appointments-api.service';
import { DENTIST_DIRECTORY } from './data/dentist-directory';
import { PatientsLookupService } from './data/patients-lookup.service';
import { SchedulingDemoService } from './data/scheduling-demo.service';

export const APPOINTMENTS_ROUTES: Routes = [
  { path: 'clinical-assignments', component: ClinicalAssignmentsPageComponent },
  {
    path: 'calendar',
    component: CalendarPageComponent,
    providers: [
      {
        provide: CALENDAR_SUPPORT_DATA_SOURCE,
        useValue: CALENDAR_SUPPORT_FIXTURE_DATA,
      },
    ],
  },
  {
    path: 'my-calendar',
    component: DentistOwnCalendarComponent,
  },
  {
    path: 'new',
    component: SchedulingPageComponent,
    providers: [
      SchedulingDemoService,
      { provide: AppointmentsApiService, useExisting: SchedulingDemoService },
      { provide: PatientsLookupService, useExisting: SchedulingDemoService },
      { provide: DENTIST_DIRECTORY, useExisting: SchedulingDemoService },
    ],
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
