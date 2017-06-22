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
    //var divisor;

    for (var i = 0; i < data.length; i++) {
      pageName = data[i]['sparkPageType'];

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
            measureValue = measuredParameter === 'totalRequests' ? measureValue : (measuredParameter === 'pageSize' ? measureValue / (1024 * 1024) : measureValue / 1000);
            // Compute the current point value as the AVERAGE of the measures so far to avoid pronounced peaks.
            dataProcessed[pageName][currentItem][measuredParameterViewAcc] = currentItem === 0 ? measureValue : dataProcessed[pageName][lastItem][measuredParameterViewAcc] + measureValue;
            averageValue = dataProcessed[pageName][currentItem][measuredParameterViewAcc] / (currentItem + 1);

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
      "title": "First Byte Time (s)",
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
      "title": "Full load time (s)",
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
      "title": "Load time (s)",
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
      "title": "Page size (MB)",
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
      "title": "Total Requests (n)",
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
      "title": "First Byte Time (s)",
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
        "title": "Full load time (s)",
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
        "title": "Load time (s)",
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
        "title": "Page size (MB)",
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
        "title": "Total Requests (n)",
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
      "parseDates": false,
      "axisColor": "#DADADA",
      "minorGridEnabled": true,
      "labelFunction": function(valueText, date, categoryAxis) {
        var date = new Date(valueText);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        return day + '/' + month /*+ '/' + year + '<br>' + minutes + ':' + seconds*/;
      }
    },
    "export": {
      "enabled": true,
      "position": "bottom-right"
    }
  };

  $.getJSON('multidata/' + site + '.json', function(data) {

    data = processData(data);
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
      var homepageSettings = clone(chartSettings);
      homepageSettings.dataProvider = data[section];
      var chart = AmCharts.makeChart("chart-" + section, homepageSettings);
    }
  });

});