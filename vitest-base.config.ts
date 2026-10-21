import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: {
        // Syncfusion publie un « main » UMD : sans inlining, Node le charge en CommonJS et les
        // imports nommés échouent.
        inline: [/@syncfusion\//],
      },
    },
  },
});
