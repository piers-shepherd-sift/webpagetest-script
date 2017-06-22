/**
 * Call packages
 * ------------------------------------
 */
var express     = require('express'),
    app         = express(),
    path    = require('path');

/**
 * Config
 */
var config = {
    port: '56789'
};


/**
 * App configuration
 * ====================================
 */


// Configure app to handle CORS requests
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POSTS, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, \ Authorization');
    next();
});

app.use('/multidata', express.static('multidata'));
app.use('/js', express.static('js'));
app.use('/errors', express.static('errors'));
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));

var routes = [
    '/',
    '/awuk',
    '/awus',
    '/trzone',
    '/hrzone',
    '/bzone',
    '/myc'
];

for (var i = 0; i < routes.length; i++) {
    app.get(routes[i], function (req, res) {
        res.sendFile(path.join(__dirname + '/app/multiresults.html'));
    });
}

/**
 * Start server
 * ====================================
 */
app.listen(config.port);
console.log('Serving on port ' + config.port);
