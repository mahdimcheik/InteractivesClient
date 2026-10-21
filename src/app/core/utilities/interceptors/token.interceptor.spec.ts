import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { beforeEach, describe, expect, it } from 'vitest';

import { Store } from '../services/store';
import { TokenInterceptor } from './token.interceptor';

describe('TokenInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([TokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(Store).token.set('jeton-test');
  });

  it("ajoute le jeton aux requêtes vers l'API", () => {
    http.get(`${environment.apiUrl}/presentations`).subscribe();

    const req = backend.expectOne(`${environment.apiUrl}/presentations`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jeton-test');
  });

  it("n'envoie jamais le jeton à un service tiers", () => {
    http.get('https://api-adresse.data.gouv.fr/search/?q=paris').subscribe();

    const req = backend.expectOne('https://api-adresse.data.gouv.fr/search/?q=paris');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });
});
