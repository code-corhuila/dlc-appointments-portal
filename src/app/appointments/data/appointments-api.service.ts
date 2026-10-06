import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Appointment, CreateAppointmentRequest } from '../model/appointment';
import {
  AppointmentListQuery,
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  ConfirmationReceipt,
  EndClinicalAssignmentRequest,
  ExpectedVersionRequest,
  NoShowAppointmentRequest,
  PublicConfirmationRequest,
  RescheduleAppointmentRequest,
} from '../model/appointment-operations';
import {
  DentistAvailability,
  UpdateDentistAvailabilityRequest,
} from '../model/availability';
import {
  ClinicalAssignment,
  ClinicalAssignmentListQuery,
  CreateClinicalAssignmentRequest,
} from '../model/clinical-assignment';
import { Page } from '../model/page';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  listAppointments(
    query: AppointmentListQuery = {},
  ): Observable<Page<Appointment>> {
    return this.http.get<Page<Appointment>>(`${this.baseUrl}/appointments`, {
      params: this.toParams(query),
    });
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(
      `${this.baseUrl}${this.appointmentPath(id)}`,
    );
  }

  createAppointment(
    request: CreateAppointmentRequest,
    idempotencyKey: string,
  ): Observable<Appointment> {
    return this.postWithIdempotency(
      '/appointments',
      request,
      idempotencyKey,
    );
  }

  confirmAppointment(
    id: string,
    request: ConfirmAppointmentRequest,
    idempotencyKey: string,
  ): Observable<Appointment> {
    return this.postWithIdempotency(
      `${this.appointmentPath(id)}/confirmations`,
      request,
      idempotencyKey,
    );
  }

  cancelAppointment(
    id: string,
    request: CancelAppointmentRequest,
    idempotencyKey: string,
  ): Observable<Appointment> {
    return this.postWithIdempotency(
      `${this.appointmentPath(id)}/cancellations`,
      request,
      idempotencyKey,
    );
  }

  rescheduleAppointment(
    id: string,
    request: RescheduleAppointmentRequest,
    idempotencyKey: string,
  ): Observable<Appointment> {
    return this.postWithIdempotency(
      `${this.appointmentPath(id)}/reschedulings`,
      request,
      idempotencyKey,
    );
  }

  startAttention(
    id: string,
    request: ExpectedVersionRequest,
    idempotencyKey: string,
  ): Observable<Appointment> {
    return this.postWithIdempotency(
      `${this.appointmentPath(id)}/attention-starts`,
      request,
      idempotencyKey,
    );
  }

  markNoShow(
    id: string,
    request: NoShowAppointmentRequest,
    idempotencyKey: string,
  ): Observable<Appointment> {
    return this.postWithIdempotency(
      `${this.appointmentPath(id)}/no-shows`,
      request,
      idempotencyKey,
    );
  }

  completeAppointment(
    id: string,
    request: ExpectedVersionRequest,
    idempotencyKey: string,
  ): Observable<Appointment> {
    return this.postWithIdempotency(
      `${this.appointmentPath(id)}/completions`,
      request,
      idempotencyKey,
    );
  }

  confirmPublicAppointment(
    request: PublicConfirmationRequest,
  ): Observable<ConfirmationReceipt> {
    return this.http.post<ConfirmationReceipt>(
      `${this.baseUrl}/appointment-confirmations`,
      request,
    );
  }

  getDentistAvailability(id: string): Observable<DentistAvailability> {
    return this.http.get<DentistAvailability>(
      `${this.baseUrl}/dentists/${encodeURIComponent(id)}/availability`,
    );
  }

  updateDentistAvailability(
    id: string,
    request: UpdateDentistAvailabilityRequest,
  ): Observable<DentistAvailability> {
    return this.http.put<DentistAvailability>(
      `${this.baseUrl}/dentists/${encodeURIComponent(id)}/availability`,
      request,
    );
  }

  listClinicalAssignments(
    query: ClinicalAssignmentListQuery = {},
  ): Observable<Page<ClinicalAssignment>> {
    return this.http.get<Page<ClinicalAssignment>>(
      `${this.baseUrl}/clinical-assignments`,
      {
        params: this.toParams(query),
      },
    );
  }

  getClinicalAssignment(id: string): Observable<ClinicalAssignment> {
    return this.http.get<ClinicalAssignment>(
      `${this.baseUrl}/clinical-assignments/${encodeURIComponent(id)}`,
    );
  }

  createClinicalAssignment(
    request: CreateClinicalAssignmentRequest,
    idempotencyKey: string,
  ): Observable<ClinicalAssignment> {
    return this.postWithIdempotency(
      '/clinical-assignments',
      request,
      idempotencyKey,
    );
  }

  endClinicalAssignment(
    id: string,
    request: EndClinicalAssignmentRequest,
    idempotencyKey: string,
  ): Observable<ClinicalAssignment> {
    return this.postWithIdempotency(
      `/clinical-assignments/${encodeURIComponent(id)}/endings`,
      request,
      idempotencyKey,
    );
  }

  private appointmentPath(id: string): string {
    return `/appointments/${encodeURIComponent(id)}`;
  }

  private postWithIdempotency<T>(
    path: string,
    body: unknown,
    idempotencyKey: string,
  ): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
  }

  private toParams(values: object): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }

    return params;
  }
}