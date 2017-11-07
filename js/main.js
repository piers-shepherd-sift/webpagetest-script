$(document).ready(function() {

  var pathLocation = window.location.pathname;
  var site = (pathLocation === '/') ? 'awuk' : pathLocation.substring(1);
  var siteTitle = {
    'awuk': 'AccountingWEB UK - WebPageTest Results',
    'awus': 'AccountingWEB US - WebPageTest Results',
    'bzone': 'BusinessZone - WebPageTest Results',
    'hrzone': 'HRZone - WebPageTest Results',
    'myc': 'MyCustomer - WebPageTest Results',
    'trzone': 'TrainingZone - WebPageTest Results',
  };

  $('#site-name')[0].innerHTML = siteTitle[site];
  $('.' + site + '-tab').attr('class', 'active');

  /**
   * Define function for cloning objects
   * Taken from: http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
   */
  function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  }


  function processData(data) {

    var dataProcessed = {};
    // Measures property names.
    var pageName, measuredParameterView, measuredParameterViewAcc;
    // Point indexes.
    var currentItem, lastItem;
    // Store measure values.
    var measureValue, averageValue;
    // Helpers.
    var averageItems;

    for (var i = 0; i < data.length; i++) {
      pageName = data[i]['sparkPageType'];

      // @todo: We've colleted dates with undefined values.
      // @todo: This avoid parseDates to throw an error.
      // @todo: but we should know why is really happening.
      if (data[i].date === undefined) {
        continue;
      }

      if (dataProcessed[pageName] === undefined) {
        dataProcessed[pageName] = [];
      }
      currentItem = dataProcessed[pageName].length;
      lastItem = currentItem - 1;

      dataProcessed[pageName][currentItem] = {};
      dataProcessed[pageName][currentItem].date = convertUnixtoDate(data[i].date);

      // Process data for both views: firstView and repeatView.
      ['firstView', 'repeatView'].forEach(function (view) {

        for (var measuredParameter in data[i][view]) {
          if (data[i][view].hasOwnProperty(measuredParameter)) {

            // Set the property names where the measured parameter and its accumulator for this view will be stored.
            measuredParameterView = view + '.' + measuredParameter;
            measuredParameterViewAcc = view + '.' + measuredParameter + '.acc';

            // Converts Bytes to MB and ms to s.
            measureValue = data[i][view][measuredParameter];
            measureValue = (measuredParameter === 'totalRequests') ? measureValue : (measuredParameter === 'pageSize' ? measureValue / (1024 * 1024) : measureValue / 1000);

            // Store the measure accumulator to compute the
            // average afterwards.
            dataProcessed[pageName][currentItem][measuredParameterViewAcc] = (currentItem === 0) ? measureValue : dataProcessed[pageName][lastItem][measuredParameterViewAcc] + measureValue;

            // @todo: there are some measures without value. This creates a fake
            // @todo: value for the accumulated variable to not cut suddenly the graph.
            if (isNaN(dataProcessed[pageName][currentItem][measuredParameterViewAcc])) {
              dataProcessed[pageName][currentItem][measuredParameterViewAcc] = measureValue * (currentItem + 1);
            }

            // Compute the current point value as the AVERAGE of the last 'averageItems'
            // measures to avoid pronounced peaks. IMPORTANT: the lower this value is the
            // more sensitive to changes the graph will be (good to find out performance
            // changes easier - bad to the graph understanding).
            averageItems = 30;
            if (currentItem - averageItems >= 0) {
              averageValue = (dataProcessed[pageName][currentItem][measuredParameterViewAcc] - dataProcessed[pageName][currentItem - averageItems][measuredParameterViewAcc]) / averageItems;
            }
            else {
              averageValue = dataProcessed[pageName][currentItem][measuredParameterViewAcc] / (currentItem + 1);
            }
            // Round to two decimals.
            dataProcessed[pageName][currentItem][measuredParameterView] = Math.round(averageValue * 100) / 100;
          }
        }
      });
    }
    //dataProcessed.sort(compare);
    return dataProcessed;
  }

  function processData2(data) {

    for (var i = 0; i < data.length; i++) {
      data[i].date = convertUnixtoDate(data[i].date);
    }

    data.sort(compare);
    return data;
  }

  function compare(a,b) {
    if (a.date < b.date)
      return -1;
    if (a.date > b.date)
      return 1;
    return 0;
  }

  function convertUnixtoDate(unix) {
    // Create a new JavaScript Date object based on the timestamp
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date(unix*1000);
    return date;
  }

  var chartSettings = {
    "type": "serial",
    "theme": "light",
    "legend": {
      "useGraphSettings": true
    },
    "synchronizeGrid":true,
    "valueAxes": [{
      "id":"v1",
      "axisColor": "#FF6600",
      "axisThickness": 2,
      "axisAlpha": 1,
      "position": "left"
    }, {
      "id":"loadtimes",
      "axisColor": "#FCD202",
      "axisThickness": 2,
      "axisAlpha": 1,
      "offset": 20,
      "position": "left"
    }, {
      "id":"pagesize",
      "axisColor": "#B0DE09",
      "axisThickness": 2,
      "gridAlpha": 0,
      "axisAlpha": 1,
      "position": "right"
    }, {
      "id":"requests",
      "axisColor": "#563d7c",
      "axisThickness": 2,
      "gridAlpha": 0,
      "offset": 40,
      "axisAlpha": 1,
      "position": "right"
    }],
    "graphs": [
    // First view.
    {
      "valueAxis": "loadtimes",
      "lineColor": "#FF6600",
      'lineThickness': 3,
      "bullet": "round",
      "bulletBorderThickness": 1,
      "hideBulletsCount": 30,
      "title": "First view. First Byte Time (s)",
      "type": "smoothedLine",
      "valueField": "firstView.firstTimeByte",
      "balloonText": "[[value]] s",
      "fillAlphas": 0
    }, {
      "valueAxis": "loadtimes",
      "lineColor": "#FC0000",
      "bullet": "square",
      "bulletBorderThickness": 1,
      'lineThickness': 3,
      "hideBulletsCount": 30,
      "title": "FV. Full load time (s)",
      "type": "smoothedLine",
      "valueField": "firstView.fullLoadTime",
      "balloonText": "[[value]] s",
      "fillAlphas": 0
    }, {
      "valueAxis": "loadtimes",
      "lineColor": "#FCD202",
      "bullet": "triangleUp",
      "bulletBorderThickness": 1,
      'lineThickness': 3,
      "hideBulletsCount": 30,
      "title": "FV. Load time (s)",
      "type": "smoothedLine",
      "valueField": "firstView.loadTime",
      "balloonText": "[[value]] s",
      "fillAlphas": 0
    }, {
      "valueAxis": "pagesize",
      "lineColor": "#B0DE09",
      'lineThickness': 3,
      "bullet": "triangleUp",
      "bulletBorderThickness": 1,
      "hideBulletsCount": 30,
      "title": "FV. Page size (MB)",
      "type": "smoothedLine",
      "valueField": "firstView.pageSize",
      "balloonText": "[[value]] MB",
      "fillAlphas": 0
    }, {
      "valueAxis": "requests",
      "lineColor": "#563d7c",
      'lineThickness': 3,
      "bullet": "triangleUp",
      "bulletBorderThickness": 1,
      "hideBulletsCount": 30,
      "title": "FV. Total Requests (n)",
      "type": "smoothedLine",
      "valueField": "firstView.totalRequests",
      "balloonText": "[[value]]",
      "fillAlphas": 0
    },
    // Repeat view.
    {
      "valueAxis": "loadtimes",
      "lineColor": "#FF6600",
      'lineThickness': 3,
      "bullet": "round",
      "bulletBorderThickness": 1,
      "hideBulletsCount": 30,
      "title": "Repeat view. First Byte Time (s)",
      "type": "smoothedLine",
      'dashLength': 3,
      "valueField": "repeatView.firstTimeByte",
      "balloonText": "[[value]] s",
      "fillAlphas": 0
      }, {
        "valueAxis": "loadtimes",
        "lineColor": "#FC0000",
        'lineThickness': 3,
        'dashLength': 3,
        "bullet": "square",
        "bulletBorderThickness": 1,
        "hideBulletsCount": 30,
        "title": "RV. Full load time (s)",
        "type": "smoothedLine",
        "valueField": "repeatView.fullLoadTime",
        "balloonText": "[[value]] s",
        "fillAlphas": 0
      }, {
        "valueAxis": "loadtimes",
        "lineColor": "#FCD202",
        'lineThickness': 3,
        'dashLength': 3,
        "bullet": "triangleUp",
        "bulletBorderThickness": 1,
        "hideBulletsCount": 30,
        "title": "RV. Load time (s)",
        "type": "smoothedLine",
        "valueField": "repeatView.loadTime",
        "balloonText": "[[value]] s",
        "fillAlphas": 0
      }, {
        "valueAxis": "pagesize",
        "lineColor": "#B0DE09",
        'lineThickness': 3,
        'dashLength': 3,
        "bullet": "triangleUp",
        "bulletBorderThickness": 1,
        "hideBulletsCount": 30,
        "title": "RV. Page size (MB)",
        "type": "smoothedLine",
        "valueField": "repeatView.pageSize",
        "balloonText": "[[value]] MB",
        "fillAlphas": 0
      }, {
        "valueAxis": "requests",
        "lineColor": "#563d7c",
        'lineThickness': 3,
        'dashLength': 3,
        "bullet": "triangleUp",
        "bulletBorderThickness": 1,
        "hideBulletsCount": 30,
        "title": "RV. Total Requests (n)",
        "type": "smoothedLine",
        "valueField": "repeatView.totalRequests",
        "balloonText": "[[value]]",
        "fillAlphas": 0
      }
    ],
    "chartScrollbar": {},
    "chartCursor": {
      "cursorPosition": "mouse",
      "categoryBalloonEnabled": false
    },
    "categoryField": "date",
    "categoryAxis": {
      "parseDates": true,
      "equalSpacing": true,
      "dateFormats": [
        {"period":"DD","format":"DD MMM"},
        {"period":"WW","format":"DD MMM"},
        {"period":"MM","format":"MMM"},
        {"period":"YYYY","format":"YYYY"}
      ],
      "axisColor": "#DADADA",
      "autoGridCount": true,
    },
    "export": {
      "enabled": true,
      "position": "bottom-right"
    }
  };

  $.getJSON('multidata/' + site + '.json', function(data) {

    //console.log(data);
    data = processData(data);
    //console.log(data);
    var sections = [
      'homepage',
      'login',
      'register',
      'profile',
      'anyanswers_overview',
      'topic_page',
      'anyanswers_post',
      'article_post'
    ];

    // Create the charts.
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      if (data == null || data == []) {
        $('#chart-' + section).after('<p>No data was found!</p>');
      }
      var sectionSettings = clone(chartSettings);
      sectionSettings.dataProvider = data[section];
      var chart = AmCharts.makeChart("chart-" + section, sectionSettings);
    }
  });

});