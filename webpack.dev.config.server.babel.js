import { server } from 'universal-webpack/config';
import settings from './universal-webpack-settings';
import configuration from './webpack.dev.config.babel';

console.log('*** BEFORE ***', JSON.stringify(configuration, null, '  '));

settings.exclude_from_externals = [
  /^(admin|amo|core|disco|locale|ui)/,
];
const universalConfig = server(configuration, settings);

console.log('*** AFTER ***', JSON.stringify(universalConfig, null, '  '));
export default universalConfig;
