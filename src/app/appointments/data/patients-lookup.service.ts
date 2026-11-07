import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Page } from '../model/page';
import { PatientLookupQuery, PatientView } from '../model/patient';
import { ShellHttp } from './shell-http';

/** Patients-owned search and read (Gateway `/api/v1/patients`), sent only through dlc-front `context.http`. */
@Injectable({
  providedIn: 'root',
})
export class PatientsLookupService {
  private readonly http = inject(ShellHttp);
  private readonly baseUrl = '/api/v1/patients';

  searchPatients(
    query: PatientLookupQuery = {},
  ): Observable<Page<PatientView>> {
    return this.http.request<Page<PatientView>>({
      method: 'GET',
      path: this.baseUrl,
      query: ShellHttp.query(query),
    });
  }

  getPatient(id: string): Observable<PatientView> {
    return this.http.request<PatientView>({
      method: 'GET',
      path: `${this.baseUrl}/${encodeURIComponent(id)}`,
    });
  }
}
