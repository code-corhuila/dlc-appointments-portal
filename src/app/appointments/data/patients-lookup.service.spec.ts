import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PatientsLookupService } from './patients-lookup.service';

describe('PatientsLookupService', () => {
  let service: PatientsLookupService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PatientsLookupService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PatientsLookupService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('searches patients using relative API routes and query parameters', () => {
    service
      .searchPatients({
        page: 1,
        limit: 20,
        search: 'Daniel',
        status: 'ACTIVE',
      })
      .subscribe();

    const request = httpTesting.expectOne((candidate) => {
      return candidate.url === '/api/v1/patients';
    });

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('search')).toBe('Daniel');
    expect(request.request.params.get('status')).toBe('ACTIVE');

    request.flush({
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it('reads a patient by id using the published Patients route', () => {
    service.getPatient('patient-1').subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/patients/patient-1',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      id: 'patient-1',
      name: 'Daniel Perez',
      status: 'ACTIVE',
      version: 1,
    });
  });
});