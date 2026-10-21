import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { environment } from '@env/environment';
import { environment as production } from '@env/environment.production';
import { describe, expect, it } from 'vitest';

describe('clé de thème', () => {
  it("est lue par le script avant première peinture d'index.html", () => {
    const indexHtml = readFileSync(resolve(process.cwd(), 'src/index.html'), 'utf8');

    expect(indexHtml).toContain(`localStorage.getItem('${environment.storagePrefix}theme')`);
  });

  it('a le même préfixe en développement et en production', () => {
    expect(production.storagePrefix).toBe(environment.storagePrefix);
  });
});
