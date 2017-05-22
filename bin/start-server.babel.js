const babelRegister = require('babel-register')
// Enable ES6.
// Ignore all `dist` and `node_modules` folders for speed-up.
babelRegister({ ignore: /\/(dist|node_modules)\// });

require('./start-server.js');
