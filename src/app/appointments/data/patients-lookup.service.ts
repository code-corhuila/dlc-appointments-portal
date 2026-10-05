import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Page } from '../model/page';
import { PatientLookupQuery, PatientView } from '../model/patient';

@Injectable({
  providedIn: 'root',
})
export class PatientsLookupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/patients';

  searchPatients(
    query: PatientLookupQuery = {},
  ): Observable<Page<PatientView>> {
    let params = new HttpParams();

    if (query.page !== undefined) {
      params = params.set('page', String(query.page));
    }

    if (query.limit !== undefined) {
      params = params.set('limit', String(query.limit));
    }

    if (query.search !== undefined) {
      params = params.set('search', query.search);
    }

    if (query.status !== undefined) {
      params = params.set('status', query.status);
    }

    return this.http.get<Page<PatientView>>(this.baseUrl, {
      params,
    });
  }

  getPatient(id: string): Observable<PatientView> {
    return this.http.get<PatientView>(
      `${this.baseUrl}/${encodeURIComponent(id)}`,
    );
  }
}