require('babel-register');
module.exports = function(config) {
    require('./karma.conf')(config);
}
