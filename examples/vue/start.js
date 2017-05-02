const path = require('path');
const exec = require('child_process').exec;
const express = require('express');
var bodyParser = require('body-parser');
const forward = require('express-forward-html');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackConfig = require('./webpack.config.js');
const openUrl = (url) => {
    const execStr = process.platform === 'win32' ? 'start' : 'open';
    exec(`${execStr} ${url}`);
};
const port = 7777;
const app = express();
app.use(bodyParser.json({limit: '50mb'}));
//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false
}));
forward({prefix: '/api/page'})(app);
const compiler = webpack(webpackConfig);
const devMiddleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: {
        colors: true,
        chunks: false
    }
});
devMiddleware.waitUntilValid(() => {
    openUrl('http://localhost:' + port);
});
const hotMiddleware = webpackHotMiddleware(compiler);
compiler.plugin('compilation', (compilation) => {
    compilation.plugin('html-webpack-plugin-after-emit', (data, cb) => {
        hotMiddleware.publish({ action: 'reload' });
        cb();
    });
});
app.use(devMiddleware);
app.use(hotMiddleware);
app.use('/mock', express.static('./mock'));
app.listen(port, (err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Listening at http://localhost:' + port + '\n');
});
