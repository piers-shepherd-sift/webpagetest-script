var jsonfile = require('jsonfile');
var request = require('request');
var WebPageTest = require('webpagetest');
var wpt = new WebPageTest('www.webpagetest.org', 'A.7317d98c2e4b533130d3d7166eac3304');
var cron = require('node-cron');

var dataFile = 'data/accountingwebuk.json';
var url = 'http://www.accountingweb.co.uk';

var params = {
    location: 'ec2-eu-west-1',
    connectivity: 'DSL',
    firstViewOnly: true,
    pollResults: 30,
    timeout: 600
}

cron.schedule('* * 0,6,12,18 * * *', function(){
    console.log('Running WebPageTest against ' + url);

    wpt.runTest(url, params, function(err, data) {
        if (data && data.hasOwnProperty('data')) {
            var testId = data.data.id;
            var options = {
                url: 'https://www.webpagetest.org/jsonResult.php?test=' + testId,
                json: true,
                method: 'get'
            };

            request(options, function (error, response, body) {
                if (error) logError(error);
                if (!error && response.statusCode == 200) {
                    var data = body.data.runs['1'].firstView;
                    //console.log(data);
                    collectResults(data, updateJson);
                }
            });
        }
        if (err) {
            console.log('Test Error: ', err);
        }
    });
});


function collectResults(result, callback) {
    var data = {};

    data.date = result.date; // The date the test was run on.
    data.firstTimeByte = result.TTFB; // The time to first byte.
    data.fullLoadTime = result.fullyLoaded; // The time its taken to fully load the page.
    data.loadTime = result.loadTime; // The time its taken to load the page (excluding ads etc).
    data.totalRequests = result.requestsFull; // Number of requests.
    data.pageSize = result.bytesInDoc; // The total page size.

    var err = false;
    return callback(err, data);
}


function logError(error) {
    jsonfile.readFile('errors/errors.cron.json', function(err, obj) {
        if (err) {
            console.log('Log Error:', err);
        } else {
            obj.unshift(error);
            jsonfile.writeFile('errors/errors.cron.json', obj, function (err) {
                if (err) console.error('Log Error/ Write', err);
            });
        }
    });
}