import startServer from 'universal-webpack/server';
import settings from '../universal-webpack-settings';
// `configuration.context` and `configuration.output.path` are used
import configuration from '../webpack.dev.config.babel';

console.log('*** About to start the universal-webpack server ****');
startServer(configuration, settings);
