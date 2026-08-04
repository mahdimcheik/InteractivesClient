import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  BooleanResponse,
  MediasService as GeneratedMediasService,
  ObjectResponse,
  StorageProviderEnum,
  StorageVisibilityEnum,
  StoredFileResponse,
  StringResponse,
} from '@client';
import { Store } from './store';

export interface UploadOptions {
  folder?: string;
  visibility?: StorageVisibilityEnum;
  provider?: StorageProviderEnum;
}

export interface SignedUrlOptions {
  provider?: StorageProviderEnum;
  /** Durée de validité demandée à l'API ; sert aussi de durée de vie du cache. */
  minutes?: number;
  refresh?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MediasMirrorService {
  private readonly api = inject(GeneratedMediasService);
  private readonly store = inject(Store);

  upload(file: Blob, options?: UploadOptions): Observable<StoredFileResponse> {
    return this.api.mediasPost(file, options?.folder, options?.visibility, options?.provider);
  }

  remove(key: string, provider?: StorageProviderEnum): Observable<ObjectResponse> {
    return this.api.mediasDelete(key, provider);
  }

  signedUrl(key: string, options?: SignedUrlOptions): Observable<StringResponse> {
    return this.api.mediasUrlGet(key, options?.provider, options?.minutes);
  }

  exists(key: string, provider?: StorageProviderEnum): Observable<BooleanResponse> {
    return this.api.mediasExistsGet(key, provider);
  }

  download(key: string, provider?: StorageProviderEnum): Observable<Blob> {
    return this.api.mediasDownloadGet(key, provider) as Observable<Blob>;
  }

  file(
    key: string,
    options?: { exp?: number; sig?: string; provider?: StorageProviderEnum },
  ): Observable<Blob> {
    return this.api.mediasFileKeyGet(
      key,
      options?.exp,
      options?.sig,
      options?.provider,
    ) as Observable<Blob>;
  }
}
