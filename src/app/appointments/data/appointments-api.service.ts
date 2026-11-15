import type {
  AppointmentType,
  CreateWaitingListEntryRequest,
  ResolveWaitingListEntryRequest,
  WaitingListEntry,
  WaitingListStatus,
} from '../model/waiting-list';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Appointment, CreateAppointmentRequest } from '../model/appointment';
import {
  AppointmentListQuery,
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  EndClinicalAssignmentRequest,
  ExpectedVersionRequest,
  NoShowAppointmentRequest,
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
import { ShellHttp } from './shell-http';

/** Appointments operations of the Gateway-facing contract, sent only through dlc-front `context.http`. */
@Injectable({
  providedIn: 'root',
})
export class AppointmentsApiService {
  private readonly http = inject(ShellHttp);
  private readonly baseUrl = '/api/v1';

  listAppointments(
    query: AppointmentListQuery = {},
  ): Observable<Page<Appointment>> {
    return this.get<Page<Appointment>>('/appointments', query);
  }

  /** HU-APT-006: active appointment types, in catalog order. */
  listAppointmentTypes(): Observable<{ readonly data: readonly AppointmentType[] }> {
    return this.get('/appointment-types');
  }

  /** HU-APT-005: waiting-list entries, oldest first. */
  listWaitingList(status: WaitingListStatus = 'WAITING'): Observable<Page<WaitingListEntry>> {
    return this.get<Page<WaitingListEntry>>('/waiting-list-entries', { status, limit: 100 });
  }

  createWaitingListEntry(request: CreateWaitingListEntryRequest, idempotencyKey: string): Observable<WaitingListEntry> {
    return this.postWithIdempotency('/waiting-list-entries', request, idempotencyKey);
  }

  resolveWaitingListEntry(
    id: string,
    request: ResolveWaitingListEntryRequest,
    idempotencyKey: string,
  ): Observable<WaitingListEntry> {
    return this.postWithIdempotency(
      `/waiting-list-entries/${encodeURIComponent(id)}/resolutions`,
      request,
      idempotencyKey,
    );
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.get<Appointment>(this.appointmentPath(id));
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


  getDentistAvailability(id: string): Observable<DentistAvailability> {
    return this.get<DentistAvailability>(this.availabilityPath(id));
  }

  updateDentistAvailability(
    id: string,
    request: UpdateDentistAvailabilityRequest,
  ): Observable<DentistAvailability> {
    return this.http.request<DentistAvailability>({
      method: 'PUT',
      path: `${this.baseUrl}${this.availabilityPath(id)}`,
      body: request,
    });
  }

  listClinicalAssignments(
    query: ClinicalAssignmentListQuery = {},
  ): Observable<Page<ClinicalAssignment>> {
    return this.get<Page<ClinicalAssignment>>('/clinical-assignments', query);
  }

  getClinicalAssignment(id: string): Observable<ClinicalAssignment> {
    return this.get<ClinicalAssignment>(`/clinical-assignments/${encodeURIComponent(id)}`);
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

  private availabilityPath(id: string): string {
    return `/dentists/${encodeURIComponent(id)}/availability`;
  }

  private appointmentPath(id: string): string {
    return `/appointments/${encodeURIComponent(id)}`;
  }

  private postWithIdempotency<T>(
    path: string,
    body: unknown,
    idempotencyKey: string,
  ): Observable<T> {
    return this.http.request<T>({
      method: 'POST',
      path: `${this.baseUrl}${path}`,
      body,
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
  }

  private get<T>(path: string, query: object = {}): Observable<T> {
    return this.http.request<T>({
      method: 'GET',
      path: `${this.baseUrl}${path}`,
      query: ShellHttp.query(query),
    });
  }
}