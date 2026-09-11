import { defineConfig } from 'orval';
import { descriptionEnumsTransformer } from './orval/description-enums';

export default defineConfig({
  'bb-loans-api': {
    output: {
      target: 'src/api/generated/api.ts',
      client: 'fetch',
      mode: 'single',
    },
    input: {
      target:
        'https://nexus.maib.md/repository/raw-maib/swagger-ui/definitions/bb-loans-bff/bb-loans-bff.yml',
      override: {
        transformer: descriptionEnumsTransformer,
      },
    },
  },
});
