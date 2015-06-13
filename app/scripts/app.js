(function (document) {
  'use strict';


  var vizData;

 
  

// wrap document so it plays nice with other libraries
// http://www.polymer-project.org/platform/shadow-dom.html#wrappers
$(document).ready(function() {
  $("input[name='interval']").change(function(e) {
    console.log('clicked' , this, this.value);
    var interval = this.value;
    var dateData = mapDateData(vizData, interval);
    update(dateData, '#dates');

  });
  
});
    



function update(data, container) {
 // var data = randomizeData(20, Math.random()*100000);
  
var margin = {top: 0, bottom: 50, left: 0, right: 0},
      width = 600,
      height = 400,
      duration = 500,
      formatNumber = d3.format(',d'),
      brush = d3.svg.brush();

  var numberFormat = d3.format("0,000");


  margin.left = formatNumber(d3.max(data, function(d) { return d.y; })).length * 14;
  var w = width - margin.left - margin.right,
      h = height - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
              .rangeRoundBands([0, w], .1);

  var y = d3.scale.linear()
              .range([h, 0]);

  y.domain([0, d3.max(data, function(d) { return d.y; })]);
  
  x.domain(data.map(function(d) { return d.x; }));

  console.log(x.domain(), d3.min(x.domain()), d3.max(x.domain()), x.range());



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
        prev.push(cur.x);
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
  console.log(chart);

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
                return item.x === xLabel;
              })[0];

              //var yValue = d.y

              tip
                .html(d.hover ? d.hover : '<div class="title">'+xLabel+'</div>'+'<span><label>count: </label>'+d.y+'</span>');
              tip.transition().duration(100)
                .style('left',  x(d.x) + x.rangeBand()*0.83 + 'px')
                .style('bottom', height -  y(d.y) + 20 + 'px')
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
          .attr('x', function(d, i) { return x(d.x); }) // start here for object constancy
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
          .attr('x', function(d, i) { return x(d.x); })
          .attr('y', function(d, i) { return y(d.y); })
          .attr('height', function(d, i) { return h - y(d.y); });

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

        console.log('extent', extent, brush)
    
    data.forEach(function(d) {
      if (extent[0] <= x(d.x) && x(d.x) + x.rangeBand() <= extent[1])
        sum += d.y;
    });
    sumDiv.text('Selected Total: ' + numberFormat(sum));
  }  

  makeSum();
}

  $.getJSON("data/data.json", function(json) {

      vizData = json;

      var countryData = _.map(json.country_data, function(item) {
        return {
          x: item.name,
          y: item.doc_count
        }
      });
      update(countryData, '#coutntries');

      var personData = _.map(json.person_data, function(item) {
        var shortName = item.name.split(';')[0];//item.name.substring(0,item.name.indexOf(';'))

        var firstLast = shortName.split(', ');


        shortName = (firstLast.length>1 ? firstLast[1] : '') + ' ' + firstLast[0];

        return {
          x: shortName,
          hover: '<div class="title">'+shortName+'</div>'+'<img src="' + item.image +'"><span><label>frequency: </label>'+item.doc_count+'</span>',
          y: item.doc_count
        }
      });
      update(personData, '#persons');

       
      
     var interval = document.querySelector('input[name="interval"]:checked').value;
     console.log('interval', interval);

     var dateData = mapDateData(vizData, interval);
     update(dateData, '#dates');


     
/*


*/




      var topicData = _.map(json.topic_data, function(item) {
        var shortName = item.title.replace('{','').split(',')[0] + '...';//item.name.substring(0,item.name.indexOf(';'))

        return {
          x: shortName,
          hover: '<div class="title">'+item.title.replace('{','').replace('}','')+'</div>'+'<span><label>frequency: </label>'+item.doc_count+'</span>',
          y: item.doc_count
        }
      });
      //console.log(data);
      topicData = _.sortBy(topicData, 'y');
      topicData.reverse();
      update(topicData, '#topics');


  });



  function mapDateData(data, interval) {
    if(interval==='month') {
      //montly
      var dateData = _.sortBy(_.map(data.date_data, function(item) {
        return {
          x: item.month,
          y: item.doc_count
        }
      }), 'x');
      return dateData

    }
    else {
      // yearly
      dateData = _.groupBy(data.date_data, function(item) {
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
