import { client } from 'universal-webpack/config';
import settings from './universal-webpack-settings';
import configuration from './webpack.dev.config.babel';

export default client(configuration, settings);
