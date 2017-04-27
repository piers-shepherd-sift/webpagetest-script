// LOAD REQUIRED VARIABLES.
var fs = require('fs');
var jsonfile = require('jsonfile');
var request = require('request');
var WebPageTest = require('webpagetest');
var async = require('async');

// INIT VARIABLES.
//var wpt = new WebPageTest('www.webpagetest.org', 'A.3ad46027b206962f8077da9392a77a7f');
//var wpt = new WebPageTest('www.webpagetest.org', 'A.1783f82bf0de8612caed1fc80906a26b');
var wpt = new WebPageTest('www.webpagetest.org', 'A.5f7b372fcec2b4c46b17ab609d1c93af'); 

var dataFolder = 'multidata';
// @todo: move this to a config file?
var tests = {
  awuk: {
    url: 'http://www.accountingweb.co.uk',
    pages: {
      homepage: '/',
      login: '/user/login',
      register: '/user/register',
      profile: '/profile/admin',
      anyanswers_overview: '/any-answers',
      topic_page: '/tax',
      anyanswers_post: '/any-answers/what-the-actual',
      article_post: '/tax/hmrc-policy/mtd-law-shelved-in-wash-up'
    }
  },
  awus: {
    url: 'http://www.accountingweb.com',
    pages: {
      homepage: '/',
      login: '/user/login',
      register: '/user/register',
      profile: '/profile/admin',
      anyanswers_overview: '/community/any-answers',
      topic_page: '/technology',
      anyanswers_post: '/community/any-answers/accounting-software-advice-needed',
      article_post: '/tax/irs/the-tale-of-the-misclassified-worker'
    }
  },
  bzone: {
    url: 'http://www.businesszone.co.uk',
    pages: {
      homepage: '/',
      login: '/user/login',
      register: '/user/register',
      profile: '/profile/admin',
      anyanswers_overview: '/community-voice/discuss',
      topic_page: '/do',
      anyanswers_post: '/community/discuss/what-social-media-platforms-should-i-use-for-my-business',
      article_post: '/deep-dive/growth/fairphone-the-myth-busting-social-startup-building-a-new-phone',
    }
  },
  hrzone: {
    url: 'http://www.hrzone.com',
    pages: {
      homepage: '/',
      login: '/user/login',
      register: '/user/register',
      profile: '/profile/admin',
      anyanswers_overview: '/community-voice/discuss',
      topic_page: '/lead',
      anyanswers_post: '/community/discuss/payroll',
      article_post: 'talent/acquisition/avoiding-game-over-incorporating-gamification-successfully-into-recruitment-and',
    }
  },
  trzone: {
    url: 'http://www.trainingzone.co.uk',
    pages: {
      homepage: '/',
      login: '/user/login',
      register: '/user/register',
      profile: '/profile/admin',
      anyanswers_overview: '/community-voice/discuss',
      topic_page: '/lead',
      anyanswers_post: '/community/discuss/training-administration-software-0',
      article_post: '/develop/business/ld-has-a-bad-rep-and-it-needs-to-fix-it',
    }
  },
  myc: {
    url: 'http://www.mycustomer.com',
    pages: {
      homepage: '/',
      login: '/user/login',
      register: '/user/register',
      profile: '/profile/admin',
      anyanswers_overview: '/community-voice/discuss',
      topic_page: '/marketing',
      anyanswers_post: '/discuss/what-does-omnichannel-mean',
      article_post: '/marketing/strategy/are-these-the-most-ill-conceived-ads-of-all-time',
    }
  }
};

// Manage the test log.
var testLog = {

  // Only allow 1 event to access to the log file at the same time to avoid overriding.
  queue: async.queue(function (logData, callback) {
    updateJson(logData.logFile, logData.logMessage, 'event');
    callback();
  }, 1),

  /**
   * Register an event in the log file.
   *
   * @param event
   *  The event message.
   */
  logEvent: function (event) {

    var logFile = __dirname  + '/logs/events.json';
    var logMessage = {
      date: new Date(),
      event: event
    };
    var logData = {
      logMessage: logMessage,
      logFile: logFile
    };
    console.log(event);
    this.queue.push(logData);
  }
};

// Manage the test errors.
var testError = {

  // Only allow 1 event to access to the log file at the same time to avoid overriding.
  queue: async.queue(function (logData, callback) {
    updateJson(logData.logFile, logData.logMessage, 'error');
    callback();
  }, 1),

  /**
   * Register an error in log files.
   *
   * @param error
   *  The error message.
   */
  logError: function (error, type) {

    var errorFile = __dirname + '/logs/errors.' + type + '.json';
    var errorMessage = {
      date: new Date(),
      error: error
    };
    var errorData = {
      logMessage: errorMessage,
      logFile: errorFile
    };
    console.error('ERROR of type: ' + type + '. See logs for further information.');
    this.queue.push(errorData);
  }
};

for (var site in tests) {
  if (tests.hasOwnProperty(site)) {

    for (var page in tests[site].pages) {
      if (tests[site].pages.hasOwnProperty(page)) {

        var pageUrl = tests[site].pages[page];
        var pageType = page;
        var url = tests[site].url + pageUrl;
        var params = {
          location: 'Manchester',
          connectivity: 'DSL',
          pollResults: 30,
          timeout: 5000
        };
        testLog.logEvent(site.toUpperCase() + ' - Running WebPageTest against ' + pageType + ':' + url);

        // Run the test.
        wpt.runTest(url, params, (function () {

          var siteName = site;
          var pageType = page;

          // This code structure is followed to freeze the value of the variable site:
          // https://www.pluralsight.com/guides/front-end-javascript/javascript-callbacks-variable-scope-problem
          return function (err, data) {

            if (data && data.hasOwnProperty('data')) {

              var testId = data.data.id;
              var url = data.data.url;
              var dataFile = dataFolder + '/' + siteName + '.json';

              wpt.getTestResults(testId, function (err, data) {
                data.sparkPageType = pageType;
                collectResults(data, dataFile, updateJson);
              });
              testLog.logEvent(siteName.toUpperCase() + ' - Completed test: ' + testId + ' against: ' + url);
            }
            if (err) {
              testError.logError(err, 'test');
            }
          }
        })());
      }
    }
  }
}


// HELP FUNCTIONS.
/**
 * Collect the data parameters we are interested in from the test.
 *
 * @param result string
 *  Test result (JSON).
 * @param dataFile string
 *  Name (and path) to the data file.
 * @param callback function
 *  Callback function
 *
 * @returns {*}
 */
function collectResults(result, dataFile, callback) {

  var date;
  var data = {};
  var firstRun = result.data.runs['1'];

  // The id of the test.
  data.id = result.data.id;
  // The url tested.
  data.url = result.data.url;
  // Anonymous/authenticated user.
  data.user = 'anonymous';
  // Type of tested page.
  data.sparkPageType = result.sparkPageType;

  // Save data for first and repeat view.
  ['firstView', 'repeatView'].map(function (view) {
    data[view] = {};
    // The time to first byte.
    data[view].firstTimeByte = firstRun[view].TTFB;
    // Start render time. The page has been completely sent and start being rendered.
    data[view].start_render = firstRun[view].render;
    // The time its taken to load the page (excluding ads etc).
    data[view].loadTime = firstRun[view].loadTime;
    // The time its taken to fully load the page.
    data[view].fullLoadTime = firstRun[view].fullyLoaded;
    // Number of requests.
    data[view].totalRequests = firstRun[view].requestsFull;
    // The total page size.
    data[view].pageSize = firstRun[view].bytesInDoc;

    date = firstRun[view].date;
  });
  // The date the test was run on.
  data.date = date;

  return callback(dataFile, data);
}

/**
 * Update the Json file.
 *
 * @param dataFile
 *  Name (and path) to the data file.
 * @param data
 *  Performance data.
 *
 * @returns {*}
 */
function updateJson(dataFile, data, type) {

  try {
    // Creates the data JSON file if it doesn't exist.
    initJsonFile(dataFile);

    // Update the Json file.
    var objectJson = jsonfile.readFileSync(dataFile);
    objectJson.push(data);
    jsonfile.writeFileSync(dataFile, objectJson);
  } catch (err) {

    if (type === 'event') {
      testError.logError(err, 'file');
    }
    else {
      console.error('Log Error/ Write', err);
    }
  }
}

/**
 * Initializing a file with an empty Json.
 *
 * @param dataFile
 *  Name (and path) of the file.
 */
function initJsonFile(dataFile) {

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", 'utf8');
  }
}
