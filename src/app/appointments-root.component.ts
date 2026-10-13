import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AvailabilityPageComponent } from './appointments/pages/availability-page.component';
import { CalendarPageComponent } from './appointments/pages/calendar-page.component';
import { ClinicalAssignmentsPageComponent } from './appointments/pages/clinical-assignments-page.component';
import { DentistOwnCalendarComponent } from './appointments/pages/dentist-own-calendar.component';
import { ForbiddenPageComponent } from './appointments/pages/forbidden-page.component';
import { NotFoundPageComponent } from './appointments/pages/not-found-page.component';
import { SchedulingPageComponent } from './appointments/pages/scheduling-page.component';
import { CompositionRouteState } from './composition-route-state';

@Component({
  selector: 'apt-root',
  standalone: true,
  imports: [
    AvailabilityPageComponent,
    CalendarPageComponent,
    ClinicalAssignmentsPageComponent,
    DentistOwnCalendarComponent,
    ForbiddenPageComponent,
    NotFoundPageComponent,
    SchedulingPageComponent,
  ],
  template: `
    @switch (route().localPath) {
      @case ('/calendar') { <app-calendar-page /> }
      @case ('/new') { <app-scheduling-page /> }
      @case ('/availability') { <app-availability-page /> }
      @case ('/my-calendar') { <app-dentist-own-calendar /> }
      @case ('/clinical-assignments') { <app-clinical-assignments-page /> }
      @case ('/forbidden') { <app-forbidden-page /> }
      @default { <app-not-found-page /> }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsRootComponent {
  private readonly routeState = inject(CompositionRouteState);
  readonly route = this.routeState.route;
}
