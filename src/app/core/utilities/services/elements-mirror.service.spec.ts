import { TestBed } from '@angular/core/testing';
import { ElementDetails, ElementsService } from '@client';
import { Subject, firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ElementsMirrorService } from './elements-mirror.service';
import { Store } from './store';

describe('ElementsMirrorService.patch', () => {
  const element: ElementDetails = {
    id: 'el-1',
    slideId: 'slide-1',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    zIndex: 0,
    visible: true,
    locked: false,
    configuration: '{"content":"Avant"}',
  };
  let responses: Subject<{ data?: ElementDetails }>[];
  const put = vi.fn();
  let store: Store;
  let mirror: ElementsMirrorService;

  const cached = () =>
    store
      .presentationDetails()
      .get('pres-1')
      ?.slides?.[0]?.elements?.find((e) => e.id === 'el-1');

  beforeEach(() => {
    responses = [];
    put.mockReset().mockImplementation(() => {
      const response = new Subject<{ data?: ElementDetails }>();
      responses.push(response);
      return response;
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ElementsService,
          useValue: { presentationsPresentationIdSlidesSlideIdElementsElementIdPut: put },
        },
      ],
    });
    store = TestBed.inject(Store);
    mirror = TestBed.inject(ElementsMirrorService);
    store.upsertPresentationDetails({
      id: 'pres-1',
      slides: [{ id: 'slide-1', elements: [element] }],
    });
  });

  it('applique la modification avant la réponse et envoie l’élément complet', () => {
    mirror.patch('pres-1', 'slide-1', 'el-1', { x: 300 }).subscribe();

    expect(cached()?.x).toBe(300);
    expect(put).toHaveBeenCalledWith(
      'pres-1',
      'slide-1',
      'el-1',
      expect.objectContaining({ x: 300, y: 20, configuration: '{"content":"Avant"}' }),
    );
  });

  it('part de la dernière version : une position puis une configuration ne s’écrasent pas', () => {
    mirror.patch('pres-1', 'slide-1', 'el-1', { configuration: '{"content":"Après"}' }).subscribe();
    mirror.patch('pres-1', 'slide-1', 'el-1', { x: 300 }).subscribe();

    expect(put.mock.calls[1][3]).toEqual(
      expect.objectContaining({ x: 300, configuration: '{"content":"Après"}' }),
    );
  });

  it('en cas d’échec, ne rétablit que les champs modifiés', async () => {
    const failing = firstValueFrom(mirror.patch('pres-1', 'slide-1', 'el-1', { x: 300 }));
    mirror.patch('pres-1', 'slide-1', 'el-1', { configuration: '{"content":"Après"}' }).subscribe();

    responses[0].error(new Error('500'));
    await expect(failing).rejects.toThrow('500');

    expect(cached()?.x).toBe(10);
    expect(cached()?.configuration).toBe('{"content":"Après"}');
  });
});
