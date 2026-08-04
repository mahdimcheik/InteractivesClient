import { GeneratorConfig } from 'ng-openapi';

const config: GeneratorConfig = {
  input: 'http://localhost:5268/swagger/v1/swagger.json',
  output: './src/client',
  options: {
    dateType: 'Date',
    enumStyle: 'enum',
  },
};

export default config;
