(function (document) {
  'use strict';


  var vizData;
  var formatNumber = d3.format(',d');


 
  

// wrap document so it plays nice with other libraries
// http://www.polymer-project.org/platform/shadow-dom.html#wrappers
$(document).ready(function() {
  $("input[name='interval']").change(function(e) {
    console.log('clicked' , this, this.value);
    var interval = this.value;
    var dateData = mapDateData(vizData, interval);
    HistChart(dateData, '#dates');

  });
  
});

function CollectionList(data, container) {

  console.log('data', data);

  var margin = {top: 0, bottom: 50, left: 0, right: 40},
        width = 700,
        height = 400;
  var containerEl = d3.select(container).select('.chartdiv');
  containerEl.selectAll('.collection').data(data)
            .enter().append('div')
            .attr('class', 'collection')
            .on('click', function(d) {
              this.classList.toggle('selected');
              d.selected = !d.selected;
            })
              .append('h3')
              .text(function(d) {return d.toUpperCase()});

}


function TreeChart(data, container) {


  var margin = {top: 0, bottom: 50, left: 0, right: 40},
        width = 700,
        height = 400;

  //var color = d3.scale.category20c();
  console.log('chartdata', data);

  var treemap = d3.layout.treemap()
      .size([width, height])
      .sort(function(a, b) {
        return a.freq - b.freq;
      })
      //.sticky(true)
      .ratio(3/2)
      .value(function(d) { return d.freq; });
  var containerEl = d3.select(container);

  var div = containerEl.append('div')
      .attr('class', 'treemap')
      .style('position', 'relative')
      .style('width', (width + margin.left + margin.right) + 'px')
      .style('height', (height + margin.top + margin.bottom) + 'px')
      .style('left', margin.left + 'px')
      .style('top', margin.top + 'px');

    var node = div.datum(data).selectAll('.node')
      .data(treemap.nodes)
    .enter().append('div')
      .attr('class', function(d) {
          if(d.name) {
            return 'node '+ d.name.replace(/\s+/g,'_').toLowerCase();
          }
          else {
            return 'node';
          }
      })
      .call(position)
      .style('height', function(d) { return Math.max(0, d.dy - 1) + 'px'; })
      .on('click', function(d) {
        this.classList.toggle('selected');
        d.selected = !d.selected;
        makeSum();

      });
      //.style('background', function(d) { return '#FFF' })
      
      node.append('div').attr('class', 'info').html(function(d) { 
        return d.name ? '<div class="name">'+ d.name + 
                        '</div><div class="freq">'+ formatNumber(d.freq) + ' docs</div>' : ''; 
      })
      
      node.append('div')
        .attr('class', function(d) {
          //  background-size: 100% auto;
          console.log(d ,(d.dx> d.dy));
          return (d.dx> d.dy) ? 'image horizontal' : 'image vertical';
        })
        .style('background-image', function(d) { return 'url(' + d.image + ')'; });




    function position() {
      this.style("left", function(d) { return d.x + "px"; })
          .style("top", function(d) { return d.y + "px"; })
          .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
          .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
    }

  function makeSum() {
    var sumDiv = containerEl.select('.sum'),
        sum = 0;

    console.log(data, data.children)
    data.children.forEach(function(d) {
      if (d.selected)
        sum += d.freq;
    });
    sumDiv.text('Selected Total: ' + formatNumber(sum));
  }  

  makeSum();

}
    



function HistChart(data, container) {
 // var data = randomizeData(20, Math.random()*100000);
  
var margin = {top: 0, bottom: 50, left: 0, right: 40},
      width = 700,
      height = 400,
      duration = 500,
      brush = d3.svg.brush();

  //var formatNumber = d3.format("0,000");

  var yData = function(d) { return d.y; }
  var xData = function(d) { return d.x; }


  margin.left = formatNumber(d3.max(data, yData)).length * 14;
  var w = width - margin.left - margin.right,
      h = height - margin.top - margin.bottom;


  var x = d3.scale.ordinal()
              .rangeRoundBands([0, w], .1);

  var y = d3.scale.linear()
              .range([h, 0]);

  y.domain([0, d3.max(data, yData)]);

  console.log(data.map(xData));
  
  x.domain(data.map(xData));

  //console.log(x.domain(), d3.min(x.domain()), d3.max(x.domain()), x.range());


  var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom'),
      yAxis = d3.svg.axis()
                .scale(y)
                .orient('left');

  //display 15 chart labels at most.
  if(data.length>15) {
    var ratio = Math.ceil(data.length/15);
    var ticks = data.reduce(function(prev, cur, i) {
      if(i%ratio ===0) {
        prev.push(xData(cur));
      }
      return prev;

    },[]);
    xAxis.tickValues(ticks);

  }
  
  var brush = d3.svg.brush()
                      .x(x)
                      //.y(y)
                      //.extent([0,width], [0, height])
                      .on('brushstart', brushstart)
                      .on('brush', brushmove)
                      .on('brushend', brushend);

  var containerEl = d3.select(container);                   

  containerEl.select('.chartdiv').selectAll('svg').remove();

  //data([data]) needed for records in brush mouseover.
  var svgData = containerEl.select('.chartdiv').selectAll('svg').data([data]);


  var svg = svgData.enter().append('svg')
        .attr('width', width)
        .attr('height', height);
  var chart = svg.append('g')
        .attr('width', w)
        .attr('height', h)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .classed('chart', true);

  //var chart = containerEl.select('.chart');
  console.log('CHART', chart);

  chart.append('g')
            .classed('x axis', true)
            .attr('transform', 'translate(' + 0 + ',' + h + ')');
  chart.append('g')
            .classed('y axis', true);

  chart.append('g').classed('barGroup', true);
  chart.selectAll('.brush').remove();
  chart.selectAll('.selected').classed('selected', false);
  

  chart.append('g')
            .classed('brush', true)
            //.attr('pointer-events', 'auto')
            .call(brush)
            .on('mousemove', function(records) {
              var mouse = d3.mouse(this);
              var domain = x.domain(),
                  range = x.range();
              var xLabel = domain[d3.bisect(range, mouse[0]) - 1];
              
              var d = records.filter(function(item) {
                return xData(item) === xLabel;
              })[0];

              //var yValue = d.y

              tip
                .html(d.hover ? d.hover : '<div class="title">'+xLabel+'</div>'+'<span><label>frequency: </label>'+formatNumber(d.y)+'</span>');
              tip.transition().duration(100)
                .style('left',  x(xData(d)) + x.rangeBand()*0.83 + 'px')
                .style('bottom', height -  y(yData(d)) + 20 + 'px')
                .style('opacity', 0.9);


              
            })
            .on('mouseout', function(d) {
              tip.transition().duration(100)
                .style('opacity', 0);
            })
          .selectAll('rect')
            .attr('height', h);

  d3.selectAll(".brush .resize").append("path").attr("d", resizePath);

  
 
  //chart.call(brush);

  //brush.extent([0,width], [0, height]);


  var tip =  containerEl.append('div').attr('class','tip');

  var bars = chart.select('.barGroup').selectAll('.bar').data(data);

  //console.log('BAR', bars);

  bars.enter()
        .append('rect')
          .classed('bar', true)
          .attr('x', function(d, i) { return x(xData(d)); }) // start here for object constancy
          .attr('width', x.rangeBand())
          .attr('y', h)
          .attr('height', 0)
          .attr("pointer-events", "all")
          .on('mouseover', function(d, i) {
            //doesn't work with brush
            /*
            console.log('on ', d, i, x(i));
            tip
              .style('left',  x(d.x) + x.rangeBand()*0.83 + 'px')
              .style('bottom', height -  y(d.y) + 20 + 'px')
              //.style('width', x.rangeBand() + 'px')
              .html(d.hover ? d.hover : '<div class="title">'+d.x+'</div>'+'<span><label>count: </label>'+d.y+'</span>');
            tip.transition().duration(300).style('opacity', 0.9);
            */
          })
          .on('mouseout', function(d) {
            tip.html('');
            tip.style('opacity', 0);

          });

  bars.transition()
        .duration(duration)
          .attr('width', x.rangeBand())
          .attr('x', function(d, i) { return x(xData(d)); })
          .attr('y', function(d, i) { return y(yData(d)); })
          .attr('height', function(d, i) { return h - y(yData(d)); });

  bars.exit()
        .transition()
            .duration(duration)
                .style('opacity', 0)
                .remove();

  chart.select('.x.axis')
        .transition()
            .duration(duration)
              .call(xAxis);
  chart.select('.y.axis')
        .transition()
            .duration(duration)
              .call(yAxis);
  chart.selectAll('.x .tick text')
                //.attr('transform', 'translate(0,5) rotate(90)')
                .attr('transform', 'translate(0,0) rotate(20)')
                .style('text-anchor', 'start');



  function brushstart() {
    chart.classed("selecting", true);
  }

  function brushmove() {
    var extent = d3.event.target.extent();
    bars.classed("selected", function(d) { return extent[0] <= x(d.x) && x(d.x) + x.rangeBand() <= extent[1]; });
    makeSum();
  }

  function brushend() {
    chart.classed("selecting", !d3.event.target.empty());
  }    

  function makeSum() {
    var sumDiv = containerEl.select('.sum'),
        extent = brush.extent(),
        sum = 0;

        //console.log('extent', extent, brush)
    
    data.forEach(function(d) {
      if (extent[0] <= x(d.x) && x(d.x) + x.rangeBand() <= extent[1])
        sum += d.y;
    });
    sumDiv.text('Selected Total: ' + formatNumber(sum));
  }  

  makeSum();
}




function StackedHistChart(data, datapointKeys, container) {
 // var data = randomizeData(20, Math.random()*100000);

console.log('STACKHIST');
  
var margin = {top: 0, bottom: 50, left: 0, right: 40},
      width = 900,
      height = 300,
      duration = 500,
      brush = d3.svg.brush();

  //var formatNumber = d3.format("0,000");
  
  //TODO to be replaced by total.
  var yData = function(d) { return d.total ? d.total : 0; };

  var yDatas = [function(d) { return d.frus ? d.frus : 0; },
   function(d) { return d.ddrs ? d.ddrs : 0; },
   function(d) { return d.kissinger ? d.kissinger : 0; }
   ];
  var xData = function(d) { return d.month; };



  margin.left = formatNumber(d3.max(data, yData)).length * 14;
  var w = width - margin.left - margin.right,
      h = height - margin.top - margin.bottom;


  var x = d3.scale.ordinal()
              .rangeRoundBands([0, w], .1);

  var y = d3.scale.linear()
              .range([h, 0]);

  x.domain(data.map(xData));


  var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom'),
      yAxis = d3.svg.axis()
                .scale(y)
                .orient('left');


  var color = d3.scale.ordinal()
        .range(['rgb(237,248,177)','rgb(127,205,187)','rgb(44,127,184)'].reverse());

  color.domain(datapointKeys.filter(function(key) { return key !== "month"; }));

  data.forEach(function(d) {
        var y0 = 0;
        d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
        d.total = d.ages[d.ages.length - 1].y1;
  });
  console.log(data[0]);

  y.domain([0, d3.max(data, function(d) { return d.total;})]);

  //display 15 chart labels at most.
  if(data.length>15) {
    var ratio = Math.ceil(data.length/15);
    var ticks = data.reduce(function(prev, cur, i) {
      if(i%ratio ===0) {
        prev.push(xData(cur));
      }
      return prev;

    },[]);
    xAxis.tickValues(ticks);

  }
  
  var brush = d3.svg.brush()
                      .x(x)
                      //.y(y)
                      //.extent([0,width], [0, height])
                      .on('brushstart', brushstart)
                      .on('brush', brushmove)
                      .on('brushend', brushend);

  var containerEl = d3.select(container);                   

  containerEl.select('.chartdiv').selectAll('svg').remove();

  //data([data]) needed for records in brush mouseover.
  var svgData = containerEl.select('.chartdiv').selectAll('svg').data([data]);


  var svg = svgData.enter().append('svg')
        .attr('width', width)
        .attr('height', height);
  var chart = svg.append('g')
        .attr('width', w)
        .attr('height', h)
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .classed('chart', true);

  //var chart = containerEl.select('.chart');
  console.log('CHART', chart);

  chart.append('g')
            .classed('x axis', true)
            .attr('transform', 'translate(' + 0 + ',' + h + ')');
  chart.append('g')
            .classed('y axis', true);

  chart.append('g').classed('barGroup', true);
  chart.selectAll('.brush').remove();
  chart.selectAll('.selected').classed('selected', false);
  

  chart.append('g')
            .classed('brush', true)
            //.attr('pointer-events', 'auto')
            .call(brush)
            .on('mousemove', function(records) {
              var mouse = d3.mouse(this);
              var domain = x.domain(),
                  range = x.range();
              var xLabel = domain[d3.bisect(range, mouse[0]) - 1];
              
              var d = records.filter(function(item) {
                return xData(item) === xLabel;
              })[0];

              //var yValue = d.y

              var itemsHTML = '';
              color.domain().forEach(function(key) {
                itemsHTML += '<div><label>'+key.toUpperCase()+':</label> '+formatNumber(d[key])+'</div>';  
              });
              
              var tipHTML = d.hover ? d.hover : '<div class="title">'+xLabel+'</div>'+'<span>'+itemsHTML+'</span>';

              tip
                .html(tipHTML);
              tip.transition().duration(100)
                .style('left',  x(xData(d)) + x.rangeBand()*0.83 + 'px')
                .style('bottom', height -  y(yData(d)) + 20 + 'px')
                .style('opacity', 0.9);


              
            })
            .on('mouseout', function(d) {
              tip.transition().duration(100)
                .style('opacity', 0);
            })
          .selectAll('rect')
            .attr('height', h);

  d3.selectAll(".brush .resize").append("path").attr("d", resizePath);

  
 
  //chart.call(brush);

  //brush.extent([0,width], [0, height]);


  var tip =  containerEl.append('div').attr('class','tip');

  var bars = chart.select('.barGroup').selectAll('.bar').data(data);

  //console.log('BAR', bars);

  var bargs = bars.enter()
        .append('g')
          .classed('bar', true)
          .attr('transform', function(d, i) { return 'translate('+x(xData(d))+', 0)'; }) // start here for object constancy
          .attr('width', x.rangeBand())
          .attr('y', 0)
          .attr('height', h)

bargs.selectAll("rect")
      .data(function(d) { return d.ages; })
    .enter().append("rect")
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.y1); })
      .attr("height", function(d) { return y(d.y0) - y(d.y1); })
      .style("fill", function(d) { return color(d.name); });
/*
    var bars0 = bargs.append('rect')
          .classed('data0', true)
          .attr('width', x.rangeBand())

    var bars1 = bargs.append('rect')
          .classed('data1', true)
          .attr('width', x.rangeBand())

    var bars2 = bargs.append('rect')
          .classed('data1', true)
          .attr('width', x.rangeBand())

  bars0.transition()
        .duration(duration)
          //.attr('x', function(d, i) { return x(xData(d)); })
          .attr('y', function(d, i) { return y(yDatas[0](d)); })
          .attr('height', function(d, i) { return h - y(yDatas[0](d)); });

  bars1.transition()
        .duration(duration)
          //.attr('x', function(d, i) { return x(xData(d)); })
          .attr('y', function(d, i) { return y(yDatas[1](d))  })
          .attr('height', function(d, i) { return Math.abs(y(yDatas[0](d)) - y(yDatas[1](d))) ; });


  bars2.transition()
        .duration(duration)
          //.attr('x', function(d, i) { return x(xData(d)); })
          .attr('y', function(d, i) { return y(yDatas[2](d))  })
          .attr('height', function(d, i) { return y(yDatas[1](d)) - y(yDatas[2](d)) ; });
*/
  bars.exit()
        .transition()
            .duration(duration)
                .style('opacity', 0)
                .remove();

  chart.select('.x.axis')
        .transition()
            .duration(duration)
              .call(xAxis);
  chart.select('.y.axis')
        .transition()
            .duration(duration)
              .call(yAxis);
  chart.selectAll('.x .tick text')
                //.attr('transform', 'translate(0,5) rotate(90)')
                .attr('transform', 'translate(0,0) rotate(20)')
                .style('text-anchor', 'start');



  function brushstart() {
    chart.classed("selecting", true);
  }

  function brushmove() {
    var extent = d3.event.target.extent();
    bars.classed("selected", function(d) { return extent[0] <= x(d.x) && x(d.x) + x.rangeBand() <= extent[1]; });
    makeSum();
  }

  function brushend() {
    chart.classed("selecting", !d3.event.target.empty());
  }    

  function makeSum() {
    var sumDiv = containerEl.select('.sum'),
        extent = brush.extent(),
        sum = 0;

        //console.log('extent', extent, brush)
    
    data.forEach(function(d) {
      if (extent[0] <= x(d.x) && x(d.x) + x.rangeBand() <= extent[1])
        sum += yData(d);
    });
    sumDiv.text('Selected Total: ' + formatNumber(sum));
  }  

  makeSum();
}

  $.getJSON("data/dataAll.json", function(json) {

      vizData = json.frus;

      CollectionList(Object.keys(json), '#collections')

      console.log('vizData', vizData);

      var countryData = _.map(vizData.country_data, function(item) {
        return {
          x: item.name,
          y: item.doc_count
        }
      });
      HistChart(countryData, '#coutntries');

      var personData = _.map(vizData.person_data, function(item) {
        var shortName = item.name.split(';')[0];//item.name.substring(0,item.name.indexOf(';'))

        var firstLast = shortName.split(', ');

        item.image = item.image || 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Henry_Kissinger.jpg/395px-Henry_Kissinger.jpg';


        shortName = (firstLast.length>1 ? firstLast[1] : '') + ' ' + firstLast[0];

        return {
          x: shortName,
          hover: '<div class="title">'+shortName+'</div>'+'<img src="' + item.image +'"><span><label>frequency: </label>'+formatNumber(item.doc_count)+'</span>',
          y: item.doc_count,
          image: item.image
        }
      });
      //HistChart(personData, '#persons');
      console.log(personData);

      var treePersonData = _.map(personData, function(item) {
        return {
          name: item.x,
          freq: item.y,
          image: item.image
        }
      })

      TreeChart({children: treePersonData}, '#persons');

       
      
     var interval = document.querySelector('input[name="interval"]:checked').value;
     console.log('interval', interval);

     var dateData = mapDateData(vizData, interval);
     HistChart(dateData, '#dates');


     var collDates = [];

     var emptyMonth  = {};
     Object.keys(json).forEach(function(key) {
      emptyMonth[key] = 0;
     });

     for(var key in json) {
      //console.log('KEY',key);
       //_.merge(collDates, json[key].date_data);

       // _.merge(collDates, json[key].date_data, function(objectValue, sourceValue, key, object, source) {
       //    //console.log(d);
       //    var merged = {};
       //    if() {

       //    }
       // })
      
      var newDates = json[key].date_data;
      newDates.forEach(function(d) {
        if(!d.month) {
          return;
        }
        var thisMonth = _.filter(collDates, function(dd) { return dd.month===d.month} )[0];
        //console.log(d.month, thisMonth);
        if(!thisMonth) {
          thisMonth = _.clone(emptyMonth);
          
          thisMonth.month = d.month,
          //console.log('thisM', thisMonth);
          collDates.push(thisMonth);
        }
        //thisMonth.total = thisMonth.total + d.doc_count;
        thisMonth[key] = d.doc_count;
      });

      //collDates = collDates.reverse();

      //console.log('collDates', collDates.length, collDates);

     } 
     collDates = collDates.sort(function(a,b) {
        return new Date(a.month) - new Date(b.month);
      });
      
      


     StackedHistChart(collDates, Object.keys(json), '#colldates');
     




      var topicData = _.map(vizData.topic_data, function(item) {
        var shortName = item.title.replace('{','').split(',')[0] + '...';//item.name.substring(0,item.name.indexOf(';'))

        return {
          x: shortName,
          hover: '<div class="title">'+item.title.replace('{','').replace('}','')+'</div>'+'<span><label>frequency: </label>'+formatNumber(item.doc_count)+'</span>',
          y: item.doc_count
        }
      });
      //console.log(data);
      topicData = _.sortBy(topicData, 'y');
      topicData.reverse();
    //  HistChart(topicData, '#topics');


  });



  function mapDateData(data, interval) {
    var allDates = data.date_data.filter(function(d) {return d.month});
    if(interval==='month') {
      //montly
      var dateData = _.sortBy(_.map(allDates, function(item) {
        return {
          x: item.month,
          y: item.doc_count
        }
      }), 'x');
      return dateData

    }
    else {
      // yearly
      dateData = _.groupBy(allDates, function(item) {
        var year = item.month.split('-')[0];
        return year;
      });

      dateData = _.mapValues(dateData, function(value) {

      
        var sum = _.reduce(value, function(m, x) {
          return m + x.doc_count;
        },0);
        return sum;
      });

      var newDateData = [];
      Object.keys(dateData).forEach(function(key) {
        newDateData.push({x: key, y: dateData[key]})
      });

      return newDateData;
    }
  }

  function resizePath(d) {
                var e = +(d == "e"),
                    x = e ? 1 : -1,
                    y = 40;
                return "M" + (.5 * x) + "," + y
                    + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                    + "V" + (2 * y - 6)
                    + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                    + "Z"
                    + "M" + (2.5 * x) + "," + (y + 8)
                    + "V" + (2 * y - 8)
                    + "M" + (4.5 * x) + "," + (y + 8)
                    + "V" + (2 * y - 8);
              }


 

})(wrap(document));
