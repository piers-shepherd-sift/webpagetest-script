var jsonfile = require('jsonfile');
var request = require('request');
var WebPageTest = require('webpagetest');
var wpt = new WebPageTest('www.webpagetest.org', 'A.1783f82bf0de8612caed1fc80906a26b');
var cron = require('node-cron');

var dataFile = 'data/accountingwebuk.json';
var url = 'http://www.accountingweb.co.uk';

var params = {
    location: 'ec2-eu-west-1',
    connectivity: 'DSL',
    firstViewOnly: true,
    pollResults: 30,
    timeout: 5000
}


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




function updateJson(err, data) {
    if (err) {
        logError(err);
        return err;
    } else {
        jsonfile.readFile(dataFile, function(err, obj) {
            if (err) {
                logError(err);
            } else {
		        obj.push(data);
		        jsonfile.writeFile(dataFile, obj, function (err) {
                    if (err) logError(err);
		        });
	        }
        });
    }
}


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
