$(document).ready(function() {

  var categories = ["Profile", "Economy", "Politics", "Science & Technology", "U.S.", "World"]
  var selectedCategory = "" // Current selected category
  var selectedArticleIndex = -1  // Current selected article index in articles
  var dateFormat = "ddd, DD MMM YYYY HH:mm:ss +0000"

  if (sessionStorage.getItem('DataAvailable')) {

    var articles = JSON.parse(sessionStorage.getItem('articles')) // { Category: [article] }
    var sources = JSON.parse(sessionStorage.getItem('sources'))
    var allArticles = JSON.parse(sessionStorage.getItem('allArticles'))
    var articlesRead = JSON.parse(sessionStorage.getItem('articlesRead'))  // [article]
    var recs = JSON.parse(sessionStorage.getItem('recs'))

  } else {

    sessionStorage.setItem("DataAvailable", "available")  
 
    var articles = {} // { Category: [article] }
    var sources = {}
    var allArticles = []
    var articlesRead = []  // [article]
    var recs = []

    // Fetch data from local json files
    $.ajax({
      url:'files/articles.json',
      dataType: 'json',
      type: 'get',
      cache: 'true',
      success: function(data) {
        $(data.articles).each(function(index, article) {
          allArticles.push(article)
          // Initialize article list
          if (!articles.hasOwnProperty(article.category)) {
            articles[article.category] = [];
          }
          articles[article.category].push(article)
        });
        sessionStorage.setItem("allArticles", JSON.stringify(allArticles))
        sessionStorage.setItem("articles", JSON.stringify(articles))
      }
    }),
  
    $.ajax({
      url:'files/user.json',
      dataType: 'json',
      type: 'get',
      cache: 'true',
      success: function(user) {
        articlesRead = user.articles_read
        sessionStorage.setItem("articlesRead", JSON.stringify(articlesRead))  
      }
    }),
  
    $.ajax({
      url:'files/sources.json',
      dataType: 'json',
      type: 'get',
      cache: 'true',
      success: function(data) {
        sources = data.sources
        sessionStorage.setItem("sources", JSON.stringify(sources))
      }
    })
  }

  $(".category-nav").click(function(event) {

    // Get the category
    selectedCategory = $(event.target).text();

    // Clear any innerHTML inside #articles-container
    $("#fh5co-main").empty();

    // Append category name
    $("#fh5co-main").append('<div class="category-narrow-content"><h2 class="fh5co-heading">' + selectedCategory +  '</h2></div>');

    if (selectedCategory === 'Profile') {
      $("#fh5co-main").append(
        '<div class="fh5co-narrow-content">' +
        '<div class="row row-bottom-padded-md">' +
          '<div class="col-md-6">' +
            '<canvas id="catChart"></canvas>' + 
            '</div>' +
          '<div class="col-md-6">' + 
            '<canvas id="lineChart"></canvas>' + 
            '</div>' + 
            '</div>' +
        '<div class="row row-bottom-padded-md">' +
          '<div class="col-md-6">' +
            '<canvas id="biasChart"></canvas>' +
          '</div>' +
          '<div class="col-md-6" >'+
             '<canvas id="doughChart"></canvas>' +
          '</div>'+
          '</div>' +  
          '</div>'
        )

      allArticles.forEach(function(article) {
        if (article['source'] === 'Fox News' || article['source'] === 'Fox Business' || article['source'] === 'theBlaze') {
          recs.push(article)
          sessionStorage.setItem("recs", JSON.stringify(recs))
        }
      })

      $('#fh5co-main').append('<div class="category-narrow-content"><h2 class="fh5co-heading" data-animate-effect="fadeInLeft">Recommended Articles</h2></div>')

      $.each(recs.slice(0, 8), function(index, article) {
        $("#fh5co-main").append(
          '<a class="article" href="' + article.link + '" target="_blank">' +
            '<div class="col-md-3 col-sm-6 col-padding">' +
              '<div class="blog-entry">' +
              '<div class="blog-img"><img src="' + article.image + '"' + ' class="img-responsive"></div>' +
              '<div class="desc">' +
                  '<h3>' + article.title + '</h3>' +
                  '<span><small>' + article.date.substring(0, 7) + " - " + article.date.substring(8, 17) + '</small></span>' +
                  '<div class="lead">Read More <i class="icon-arrow-right3"></i></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</a>'
        );

      })
      makeGraphs(articlesRead, allArticles, sources)
    } else {

      // Append articles data
      $.each(articles[selectedCategory], function(index, article) {
        $("#fh5co-main").append(
          '<a class="article" href="' + article.link + '" target="_blank">' +
            '<div class="col-md-3 col-sm-6 col-padding">' +
              '<div class="blog-entry">' +
              '<div class="blog-img"><img src="' + article.image + '"' + ' class="img-responsive"></div>' +
              '<div class="desc">' +
                  '<h3>' + article.title + '</h3>' +
                  '<span><small>' + article.date.substring(0, 7) + " - " + article.date.substring(8, 17) + '</small></span>' +
                  '<div class="lead">Read More <i class="icon-arrow-right3"></i></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</a>'
        );
      });
    }
  });

  // Index of clicked article is equivalent to the index of the <a> tag child under #articles-container
  $("#fh5co-main").on("click", "a", function() {
    selectedArticleIndex = $(this).index() - 1 // Array starts at 0
    selectedArticle = articles[selectedCategory][selectedArticleIndex]
    var readArticle = {}
    readArticle["date"] = moment().format(dateFormat);
    readArticle["article"] = selectedArticle
    articlesRead.push(readArticle)
    sessionStorage.setItem("articlesRead", JSON.stringify(articlesRead))
  });

function makeGraphs(articlesRead, allArticles, sources) {
  // constants
  var sides = ['left', 'center', 'right']
  // cat names stolen from NPR site
  var cats = ['U.S.', 'World', 'Politics', 'Economy', 'Science & Technology']
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var padding = 10
  // var leftRightPad = 745
  var labelsColor = 'rgba(80,80,80,1)'
  var dateFormat = "ddd, DD MMM YYYY HH:mm:ss +0000"

  var days = 365
  // all helpers
  function randomDate() {
    return moment().add(-Math.floor((Math.random() * days)), 'days')
  }

  function monthFromDate(date) {
    // console.log(date.month())
    return monthNames[date.month()]
  }

  function monthFromNum(num) {
    return monthNames[num]
  }

  function compareDate(a, b) {
    var dateA = dateToMoment(a['date'])
    var dateB = dateToMoment(b['date'])
    return dateA - dateB
  }

  function xyMap(valueToAdd) {
    return function (e) {
      return {x: e, y: valueToAdd}
    };
  }

  function totalArts() {
    return allSidesArts['left']['count'] + allSidesArts['center']['count'] + allSidesArts['right']['count']
  }

  function appendMap(valueToAdd) {
    return function (e) {
      return [e, valueToAdd]
    };
  }

  function compare(a, b) {
    if (a[0] > b[0]) {
      return 1;
    }
    if (a[0] < b[0]) {
      return -1;
    }
    return 0;
  }

  function getSum(total, num) {
      return total + num;
  }

  function sum(arr) {
    return arr.reduce(getSum)
  }

  function compareCatsDescending(a, b) {
    if (a['total'] < b['total']) {
      return 1
    }
    if (a['total'] > b['total']) {
      return -1
    }
    return 0
  }

  function getSide(article) {
    var source = article['source']
    var rating = sources[source]
    if (rating < -0.5) {
      return 'left'
    } else if (rating > 0.5) {
      return 'right'
    } else {
      return 'center'
    }
  }

  function dateToMoment(date){
    return moment(date, dateFormat)
  }

  // articlesRead
  // articlesRead = articlesRead.sort(compareDate)

  // sorting/organizing articles
  articlesRead = articlesRead.sort(compareDate)

  // var ratiosChron = []
  var allSidesArts = {}

  // setting up main dict structure
  sides.forEach(function(side) {
    allSidesArts[side] = {}
    allSidesArts[side]['count'] = 0
    allSidesArts[side]['articles'] = []
  })

  var artsMonthsCount = {}
  var artsCatCount = {}

  var last5MonthNames = []
  var i = -4
  while (i < 1) {
    var month = monthNames[moment().add(i, 'months').month()]
    last5MonthNames.push(month)
    artsMonthsCount[month] = {}
    artsMonthsCount[month]['total'] = 0
    sides.forEach(function(side) {
      artsMonthsCount[month][side] = 0
    })
    i++;
  }

  categories.forEach(function(cat) {
    artsCatCount[cat] = {}
    artsCatCount[cat]['total'] = 0
    artsCatCount[cat]['name'] = cat
    sides.forEach(function(side) {
      artsCatCount[cat][side] = 0
    })
  })

  function getArticleFromLog(artLog){
    return allArticles[artLog['article index']]
  }

  // filling in dicts
  articlesRead.forEach(function(artLog) {
    var art = artLog['article']
    // var art = getArticleFromLog(artLog)
    var side = getSide(art)
    // console.log(side)
    var date = dateToMoment(artLog['date'])
    var cat = art['category']
    var month = monthFromDate(date)

    allSidesArts[side]['articles'].push(art)
    allSidesArts[side]['count'] += 1

    if (date.isBetween(moment().add(-4, 'months'), moment().add(1, 'days'))) {
      artsMonthsCount[month]['total'] += 1
      artsMonthsCount[month][side] += 1

      artsCatCount[cat][side] += 1
      artsCatCount[cat]['total'] += 1
    }
  })

  var allArtNums = [[], [], []]

  for (i = 0; i < sides.length; i++) {
    var side = sides[i]
    last5MonthNames.forEach(function(month) {
      allArtNums[i].push(artsMonthsCount[month][side])
    })
  }

  var leftNums = allArtNums[0]
  var centerNums = allArtNums[1]
  var rightNums = allArtNums[2]

  var colorDict = {}
  colorDict['left'] = 'rgba(141,173,204,0.8)'
  colorDict['right'] = 'rgba(204,139,139,0.8)'
  colorDict['center'] = 'rgba(154,154,204, 0.8)'

  // colorDict['left'] = 'rgba(84, 140,178,0.8)'
  // colorDict['right'] = 'rgba(201,110,113,0.8)'
  // colorDict['center'] = 'rgba(142,118,148, 0.8)'

  var mostNums = [];
  var mostColors = [];
  var middleNums = [];
  var middleColors = [];
  var leastNums = [];
  var leastColors = [];

  var leftNumsWithBiases = leftNums.map(appendMap('left'));
  var centerNumsWithBiases = centerNums.map(appendMap('center'));
  var rightNumsWithBiases = rightNums.map(appendMap('right'));


  for (i = 0; i < leftNums.length; i++) {
    var oneMonthNums = [leftNums[i], centerNums[i], rightNums[i]]
    var sortedNums = oneMonthNums.sort(function(a, b){return a-b})
    // console.log(sortedNums)
    var oneMonthNumBiases = [leftNumsWithBiases[i], centerNumsWithBiases[i], rightNumsWithBiases[i]];
    var sortedNumsBiases = oneMonthNumBiases.sort(compare)
    var sortedBiases = sortedNumsBiases.map(function(e){return e[1]});

    leastNums.push(sortedNums[0])
    leastColors.push(colorDict[sortedBiases[0]])
    middleNums.push(sortedNums[1])
    middleColors.push(colorDict[sortedBiases[1]])
    mostNums.push(sortedNums[2])
    mostColors.push(colorDict[sortedBiases[2]])
  }

  var ctx = document.getElementById('biasChart').getContext('2d');
  var biasChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last5MonthNames,
      datasets: [   {
        label: 'most',
        data: mostNums,
        backgroundColor: mostColors,
        hoverBackgroundColor: mostColors,
        borderWidth: 1,
      },
      {
        label: 'middle',
        data: middleNums,
        backgroundColor: middleColors,
        hoverBackgroundColor: middleColors,
        borderWidth: 1
      },
      {
        label: 'least',
        data: leastNums,
        backgroundColor: leastColors,
        hoverBackgroundColor: leastColors,
        borderWidth: 1
      }],
    },
    options: {
      layout: {
        padding: {
          left: padding,
          right: padding,
          top: padding,
          bottom: padding,
        }
      },
      title: {
        display: true,
        position: 'top',
        text: 'Reading summary',
        fontColor: 'black'
      },
      tooltips: {
        enabled: false
      },
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true,
            fontColor: labelsColor
          },
          barPercentage: 0.7,
        }],
        yAxes: [{
          display: false,
          stacked: true,
          ticks: {
            beginAtZero: true
          },
        }],
      }
    }
  })


function calculateBiasAverage(articlesRead, sources, date) {
  var sum = 0;
  var count = 0;

  if (articlesRead.length > 0) {
    articlesRead.forEach(function(artLog, index) {
      var articleTimestamp = dateToMoment(artLog['date'])
      var article = artLog['article']
      if (articleTimestamp <= date) {
        var article = artLog['article']
        // console.log(article['source'], sources[article['source']])
        sum += sources[article['source']]
        count++;
      }
    });
    return sum / count;
  }

  return sum
}


function sameDay(d1, d2) {
  return d1.year() === d2.year() &&
    d1.month() === d2.month() &&
    d1.day() === d2.day();
}

var dateLabels = []
var biasAverages = []

articlesRead.forEach(function(artLog) {
  var art = artLog['article']
  var date = dateToMoment(artLog['date'])
  // console.log(date)
  var newBias = calculateBiasAverage(articlesRead, sources, date)
  // console.log(newBias)
  biasAverages.push(newBias)
  dateLabels.push(date)

  // if (dateLabels.length != 0) {
  //   if (sameDay(dateLabels[dateLabels.length - 1], moment())) {
  //     biasAverages[dateLabels.length - 1] = newBias
  //   } else {
  //     biasAverages.push(newBias)
  //     dateLabels.push(date)
  //   }
  // } else {
  //     biasAverages.push(newBias)
  //     dateLabels.push(date)
  // }
})

console.log(dateLabels)
console.log(biasAverages)

var labels = []
var ys = []

for (i = 0; i < dateLabels.length; i++) {
  var date = dateLabels[i]
  if (date.isBetween(moment().add(-4, 'months'), moment().add(1, 'days'))) {
    labels.push(date)
    ys.push(biasAverages[i])
  }
}

console.log(labels)
console.log(ys)


  // generating bias line graph
  // for (i = 0; i < ratiosChron.length; i+=7) {
  //   // console.log(ratiosChron[i])
  //   if (!isNaN(ratiosChron[i].x)) {
  //     labels.push(ratiosChron[i].x)
  //     ys.push(ratiosChron[i].y)
  //   }
  // }

  var lowestY = Math.min.apply(Math, ys)
  var highestY = Math.max.apply(Math, ys)
  var graphMin = lowestY
  var  graphMax = highestY

  if (graphMin >= 0) {
    graphMin = -0.25
  } 
  if (graphMax <= 0) {
    graphMax = 0.25
  }


  if (Math.abs(graphMin) != Math.abs(graphMax)) {
    graphMin = -Math.max(Math.abs(graphMin), Math.abs(graphMax))
    graphMax = Math.max(Math.abs(graphMin), Math.abs(graphMax))
  }

  var graphRange = Math.abs(graphMax) + Math.abs(graphMin)
  if (graphRange < 0.5) {
    console.log(graphRange)
    var rangeDiff = 0.5 - graphRange
    console.log(rangeDiff)
    graphRange = 0.5
    graphMax += rangeDiff / 2
    graphMin -= rangeDiff / 2
  }

  if (Math.abs(lowestY - graphMin) < .1 || Math.abs(highestY - graphMax) < .1) {
    graphMin -= 0.1
    graphRange += 0.2
    graphMax += 0.1
  }

  // background color blocks
  var sameNeg = labels.map(xyMap(-graphRange / 3))
  var sameMidNeg = labels.map(xyMap(-graphRange / 6))
  var sameMidPos = labels.map(xyMap(graphRange / 6))
  var samePos = labels.map(xyMap(graphRange / 3))

  var linectx = document.getElementById('lineChart').getContext('2d');
  var lineChart = new Chart(linectx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
      {
        data: ys,
        type: 'line',
        pointBackgroundColor: 'rgba(255,255,255, 1)',
        borderColor: 'rgba(0,0,0, 1)',
        pointBorderWidth: 0,
        fill: false,
        pointRadius: 0,
        borderWidth: 1,
        pointHoverBackgroundColor: 'rgba(0,0,0, 1)',
        pointHoverBorderWidth: 0,
        pointHoverRadius: 0.5,
        lineTension: 0.5

      },
      {
        data: sameMidNeg,
        backgroundColor: 'rgba(154,154,204, 0.5)',
        hoverBackgroundColor: 'rgba(154,154,204, 0.5)',
      },
      {
        data: sameNeg,
        backgroundColor: 'rgba(141,173,204,0.5)',
        hoverBackgroundColor: 'rgba(141,173,204,0.5)'
      },
      {
        data: sameMidPos,
        backgroundColor: 'rgba(154,154,204, 0.5)',
        hoverBackgroundColor: 'rgba(154,154,204, 0.5)',
      },
      {
        data: samePos,
        backgroundColor: 'rgba(204,139,139,0.5)',
        hoverBackgroundColor: 'rgba(204,139,139,0.5)',
      }],
    },
    options: {
      layout: {
        padding: {
          left: padding,
          right: padding,
          top: padding,
          bottom: padding,
        }
      },
      title: {
        display: true,
        position: 'top',
        text: 'Bias trend',
        fontColor: 'black'
      },
      tooltips: {
        enabled: false
      },
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            displayFormats: {
              'day': 'MMM'
            },
            units: 'month'
          },
          stacked: true,
          ticks: {
            fontColor: labelsColor,
            beginAtZero: true
          },
          distribution: 'series',
          barPercentage: 1,
          categoryPercentage: 1,
        }],
        yAxes: [{
          display: false,
          stacked: true,
          ticks: {
            beginAtZero: true,
            min: graphMin,
            max: graphMax
          },
        }],
      }
    }
  })


  // generating category graphs
  var allCatStats = []

  for (key in artsCatCount) {
    allCatStats.push(artsCatCount[key])
  }

  var catsSorted = allCatStats.sort(compareCatsDescending)
  var top5Cats = catsSorted.slice(0, 5)

  var top5CatNames = top5Cats.map(function(e) {return e['name']})
  var top5left = top5Cats.map(function(e) {return e['left']})
  var top5center = top5Cats.map(function(e) {return e['center']})
  var top5right = top5Cats.map(function(e) {return e['right']})


  var catctx = document.getElementById('catChart').getContext('2d');
  var catChart = new Chart(catctx, {
    type: 'horizontalBar',
    data: {
      labels: top5CatNames,
      datasets: [
      { 
        label: 'Right   ',
        data: top5right,
        backgroundColor: colorDict['right'],
        hoverBackgroundColor: colorDict['right']
      },
      {
        label: 'Center   ',
        data: top5center,
        backgroundColor: colorDict['center'],
        hoverBackgroundColor: colorDict['center']
      },
      {
        label: 'Left   ',
        data: top5left,
        backgroundColor: colorDict['left'],
        hoverBackgroundColor: colorDict['left']
      },]
    },
    options: {
      layout: {
        padding: {
          left: 0,
          right: padding,
          top: padding,
          bottom: padding,
        }
      },
      title: {
        display: true,
        position: 'top',
        text: 'Your 5 most-read topics',
        fontColor: 'black'
      },
      tooltips: {
        enabled: false
      },
      legend: {
        display: true,
        position: 'left',
        labels: {
          fontSize: 16,
          boxWidth: 20,
          fontStyle: 'bold',
          // fontColor: 'black'
          // boxHeight: 10
        },
        reverse: true
      },
      scales: {
        xAxes: [{
          display: false,
          stacked: true,
          ticks: {
            beginAtZero: true
          },
        }],
        yAxes: [{
          display: true,
          stacked: true,
          ticks: {
            fontColor: labelsColor,
            beginAtZero: true
          },
          // categoryPercentage: 0.5,
          barPercentage: 0.7
        }],
      }
    }
  })

  // generating dough graph
  var allCatPer = allCatStats.map(function (e) {return e['total']})
  var labels = allCatStats.map(function (e) {return e['name']})

  var doughColors = ['rgba(125,191,161,0.8)', 'rgb(141,199,173, 0.8)'
  ,'rgba(158,207,185,0.8)','rgba(174,215,196, 0.8)',
  'rgba(190,223,208,0.8)','rgba(206,231,220,0.8)',
  'rgba(223,239,232,0.8)','rgba(239,247,243,0.8)'].slice(0, cats.length)

  var doughctx = document.getElementById('doughChart').getContext('2d')
  var myDoughnutChart = new Chart(doughctx, {
      type: 'doughnut',
      options: {
        layout: {
        padding: {
          left: padding,
          right: padding,
          top: padding,
          bottom: padding,
        }
      },
        title: {
          display: true,
          position: 'top',
          text: 'All topics',
          fontColor: 'black'
        },
        tooltips: {
          enabled: true,
          callbacks: {
          title: function(tooltipItems, data) {
              return '';
          },
          label: function(tooltipItem, data) {
            var datasetLabel = '';
            var label = data.labels[tooltipItem.index];
            return ' ' + data.labels[tooltipItem.index]
          }
        }
        },
        legend: {
          display: false
        }
      },
      data: {
        labels: labels,
        datasets: [{
          data: allCatPer,
          backgroundColor: doughColors
        }]
      },
  });
}

});




