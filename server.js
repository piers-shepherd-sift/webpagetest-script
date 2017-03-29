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


app.use('/data', express.static('data'));
app.use('/errors', express.static('errors'));
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/app/results.html'));
})


/**
 * Start server
 * ====================================
 */
app.listen(config.port);
console.log('Serving on port ' + config.port);
