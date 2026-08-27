// The client preview and admin preview intentionally share one local API and
// one local fixture database. Keeping a single implementation prevents their
// behavior from drifting when the Visual folder is copied or moved.
module.exports = require('../Backend/api_handler');
