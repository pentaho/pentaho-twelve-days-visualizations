/*
 * This program is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License, version 2.1 as published by the Free Software
 * Foundation.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this
 * program; if not, you can obtain a copy at http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * or from the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * Copyright (c) 2012 Pentaho Corporation..  All rights reserved.
 */
define([
    '../util',
    'd3',
    'crossfilter', "dojo/_base/lang"
], function(vizUtil, d3, crossfilter, lang) {

    var chart;
    var list;
    var formatNumber;
    var all;
    var dimensions = [];
    var dataTable;
    // var crossFilterWrapper; MUST be global or "onclick" markup code below doesn't work.

    /*
        Constructor
        This takes an HTML DOM element as a parameter
    */
    pentaho.viz.CrossFilter = function( element ) {
        this.debug = false;
        this.element = element;
        this.elementName = element.id;
        this.cdaTable = null;
        this.dataTable = null;
        this.vizOptions = null;
        this.series = [];
        this.selections = [];
        this.dimensionFunctions = [];
        this.crossf = null; // the crossfilter
        this.dimensions = [];
        this.dimGroups = [];
        this.ranges = [];
        this.charts = [];
        this.sortIdx = 0;
        this.selectionRowMap = {};
        this.selectionList = [];
        this.showTable = true;
        this.barColor = pentaho.palettes[0].colors[0];

        crossFilterWrapper = this;
    }

    // return the state of this visualization for persistance/back-one etc
    pentaho.viz.CrossFilter.prototype.getState = function() {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.getState()');
        var state = {
            showTable: this.showTable
        };
        return state;
    };

    // sets the state of the visualization - called when a visualization is loaded
    pentaho.viz.CrossFilter.prototype.setState = function(state) {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.setState()');
        this.showTable = state.showTable;
    };

    pentaho.viz.CrossFilter.prototype.showTableChanged = function( value ) {
        // TODO (dleao): crossfilter filters are being lost this way.
        this.vizOptions.showTable = value;
        this.draw( this.dataTable, this.vizOptions);
        return true;
    }

    pentaho.viz.CrossFilter.prototype.resize = function() {
        this.draw(this.dataTable, this.vizOptions);
    }

    /*
    TODO (dleao): This requires the missing class CrossFilterColorDialog

    pentaho.viz.CrossFilter.prototype.colorsChanged = function() {

        //console.log('99')
        //console.log(this)
        if( this.debug ) console.log('pentaho.viz.CrossFilter.colorsChanged()');
        var color = colorDialog.color;
        if( color != null && color != this.barColor ) {
            this.barColor = colorDialog.color;
            for( var idx=0; idx< this.bars.length; idx++ ) {
                this.bars[idx].style("fill",this.barColor);
            }
        }

    }

    pentaho.viz.CrossFilter.prototype.colorsBtnClicked = function() {

        if( this.debug ) console.log('pentaho.viz.CrossFilter.colorsBtnClicked()');
        // open a dialog
        if( !this.colorDialog ) {
            this.colorDialog = new pentaho.CrossFilterColorDialog();
            var func = dojo.hitch( this, function() { this.colorsChanged() } );
            colorDialog.registerOnSuccessCallback( func );
        }
        colorDialog.show();
        return true;
    }
    */

    /*
        draw()

        dataTable   a pentaho.DataTable object with the data to display
        vizOptions  the options for the visualization
    */
    pentaho.viz.CrossFilter.prototype.draw = function( pdataTable, vizOptions ) {

        if( this.debug ) console.log('pentaho.viz.CrossFilter.draw()');

        // detect IE
        var browserName=navigator.appName;
        if (browserName=="Microsoft Internet Explorer") {
            this.element.innerHTML = pentaho.common.Messages.getString('noIE');
            return;
        }

        vizUtil.handleCommonOptions( this, vizOptions );

        vizUtil.applyBackground(this.element, vizOptions);

        if( vizOptions ) {
            if( typeof vizOptions.showTable != 'undefined') {
                this.showTable = vizOptions.showTable;
            }
        }

        // check the controller current visualizations arguments (set by the properties panel)
        if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
            if( typeof this.controller.currentViz.args.showTable != 'undefined' ) {
                this.showTable = this.controller.currentViz.args.showTable;
                vizOptions.showTable = this.showTable;
            }
        }

        this.dimensions = [];
        dimensions = [];
        this.dimGroups = [];
        this.ranges = [];
        this.charts = [];
        this.sortIdx = 0;
        this.crossf = null; // the crossfilter

        this.dimensionFunctions = [];
        this.dimensionFunctions[0] = function(d) { return d["measure0"] };
        this.dimensionFunctions[1] = function(d) { return d["measure1"] };
        this.dimensionFunctions[2] = function(d) { return d["measure2"] };
        this.dimensionFunctions[3] = function(d) { return d["measure3"] };
        this.dimensionFunctions[4] = function(d) { return d["measure4"] };
        this.dimensionFunctions[5] = function(d) { return d["measure5"] };
        this.dimensionFunctions[6] = function(d) { return d["measure6"] };
        this.dimensionFunctions[7] = function(d) { return d["measure7"] };

        // store the incoming parameters for later use
        this.vizOptions = vizOptions;
        this.dataTable = pdataTable;
        dataTable = pdataTable;

        // store the current highlighted selections
        this.selections = vizOptions.selections;

        // local variables
        var metadata = [];
        var measures = [];
        var strings = [];
        var resultset = [];
        var colors = null;
        var columnMap = {};
        this.rowsCols = [];
        this.measuresCols = [];

        var title = '';
        measureNo = 0;
        for( var colNo=0; colNo<dataTable.getNumberOfColumns(); colNo++) {
            if( dataTable.getColumnType(colNo).toUpperCase() == 'NUMBER' ) {
            }
            else {
            }
        }

        for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
            var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
            if(dataReq) {
                for (var idx=0; idx < dataReq.length; idx++) {
                    if( dataReq[idx].id == 'rows' ) {
                        this.rowsCols.push( colNo );
                        title = dataTable.getColumnLabel(colNo);
                        columnMap[ colNo ] = [title];
                        strings.push(colNo);
                    }
                    else if( dataReq[idx].id == 'measures' ) {
                        this.measuresCols.push( colNo );
                        measures.push(colNo);
                        title = dataTable.getColumnLabel(colNo);
                        columnMap[ colNo ] = [title,'measure'+measureNo];
                        measureNo++;
                    }
                }
            }
        }

        var rows = [];

        for( var rowNo=0; rowNo<dataTable.getNumberOfRows(); rowNo++ ) {
            var row = {};
            for( var colNo=0; colNo<dataTable.getNumberOfColumns(); colNo++ ) {
                var mapping = columnMap[colNo];
                for( mapNo=0; mapNo<mapping.length; mapNo++) {
                    row[ mapping[mapNo] ] = dataTable.getValue(rowNo, colNo);
                    row[ 'formatted_'+mapping[mapNo] ] = dataTable.getFormattedValue(rowNo, colNo);
                }
            }
            row['rowIdx'] = rowNo;
            rows.push( row );
        }

        if( this.crossf ) {
        // this.crossf.reset();
            this.crossf = new crossfilter( rows );

        } else {
            this.crossf = new crossfilter( rows );
        }
        // create dimensions

        for( var idx=0; idx<measures.length; idx++ ) {
            var measureId = dataTable.getColumnId(measures[idx]);

            var func = this.dimensionFunctions[idx];
            var dimension = this.crossf.dimension(func);
            this.dimensions.push( dimension );
            dimensions.push( dimension );
            this.ranges.push( dataTable.getColumnRange(measures[idx]) );
        }

        all = this.crossf.groupAll();
        for( var idx=0; idx<this.dimensions.length; idx++ ) {
            var range = this.ranges[idx].max - this.ranges[idx].min;
            var bucket = range/100;
            // adjust bucket to nearest 1,2,5,10,20,50 etc
            var group = this.dimensions[idx].group(function(value) { return Math.floor(value / bucket)*bucket; });
            this.dimGroups.push( group );
        }

        while(this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }

        var chartsPerRow = Math.floor(vizUtil.getClientWidth(this) / 350);

        var center = document.createElement('CENTER');
        this.element.appendChild(center);

        var table = document.createElement('TABLE');
        table.id = 'charttable';
        center.appendChild(table);
        var row;

        for(idx=0; idx<this.dimensions.length; idx++) {
            if( idx % chartsPerRow == 0 ) {
                row = table.insertRow(-1);
            }
            var cell = row.insertCell(-1);
            var span = document.createElement('SPAN');
            span.className = 'chartTitle';
            span.style.font = this.labelFontStr;
            span.style.color = this.labelColor;
            span.innerHTML = dataTable.getColumnLabel(measures[idx]);
            cell.appendChild(span);
            var span = document.createElement('SPAN');
            span.className = 'chartOp';
            span.style.font = this.labelFontStr;
            span.style.color = this.labelColor;
            span.innerHTML = ' <span onclick="crossFilterWrapper.reset ('+idx+')">[show all]</span>';
            cell.appendChild(span);
            var br = document.createElement('BR');
            cell.appendChild(br);
            var div = document.createElement('DIV');
            div.className = 'chart';
            cell.appendChild(div);
        }

        var table = document.createElement('TABLE');
        center.appendChild(table);
        if( this.showTable ) {
            vizUtil.createSelectionTable( table, dataTable, this.labelFontStr, this.labelColor);
        }

        formatNumber = d3.format(",d");

        this.charts = [];
        this.bars = [];

        if( this.dataTable.getNumberOfRows() > 1 ) {

            for( var idx=0; idx<this.dimensions.length; idx++ ) {
                if( idx < this.charts.length ) {
                    this.charts[idx].reset();
                    this.charts[idx].dimension(this.dimensions[idx])
                        .group(this.dimGroups[idx])
                        .x(d3.scale.linear()
                        .domain([this.ranges[idx].min*0.9, this.ranges[idx].max*1.1])
                        .rangeRound([0, 300]));
                } else {
                    this.charts[idx] = this.barChart(idx, this);
                    this.charts[idx]
                        .dimension(this.dimensions[idx])
                        .group(this.dimGroups[idx])
                        .x(d3.scale.linear()
                        .domain([this.ranges[idx].min*0.9, this.ranges[idx].max*1.1])
                        .rangeRound([0, 300]));
                }
            }

            chart = d3.selectAll(".chart")
                .data(this.charts)
                .each(function(chart) { chart.on("brush", crossFilterWrapper.renderAll).on("brushend", crossFilterWrapper.renderAll); });
        }
        list = d3.selectAll(".datatable")
          .data([lang.hitch(this,this.updateTable)]);

        this.renderAll();

        if( this.debug ) console.log('pentaho.viz.CrossFilter.draw() done');
    }

    pentaho.viz.CrossFilter.prototype.barChart = function(id, vis) {

        var margin = {top: 10, right: 10, bottom: 20, left: 10},
            x,
            y = d3.scale.linear().range([100, 0]),
            axis = d3.svg.axis()
                .orient("bottom")
                .ticks(5);

        var parent = vis;
        var brush = d3.svg.brush(),
            brushDirty,
            dimension,
            group,
            round;
        var bars;

        function getBars() {
            return bars;
        }

        function reset() {
            x = null;
            y = d3.scale.linear().range([100, 0]);
            axis = d3.svg.axis().orient("bottom");
            brush = d3.svg.brush();
            brushDirty = false;
            dimension = null;
            group = null;
            round = null;
        }

        function chart(div) {

          // console.log("charting");

          var width = x.range()[1],
              height = y.range()[0];

          y.domain([0, group.top(1)[0].value]);

          div.each(function() {
            var div = d3.select(this),
                g = div.select("g");

            // Create the skeletal chart.
            if (g.empty()) {
              div.select(".title").append("a")
                  .attr("href", "javascript:reset(" + id + ")")
                  .attr("class", "reset")
                  .text("reset")
                  .style("display", "none");

              g = div.append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              g.append("clipPath")
                  .attr("id", "clip-" + id)
                .append("rect")
                  .attr("width", width)
                  .attr("height", height);

              g.selectAll(".bar")
                  .data(["background", "foreground"])
                .enter().append("path")
                  .attr("class", function(d) { return d + " bar"; })
                  .datum(group.all());

              vis.bars[id] = g.selectAll(".foreground.bar");
              vis.bars[id]
                  .attr("clip-path", "url(#clip-" + id + ")")
                  .style("fill",parent.barColor);

              g.append("g")
                  .attr("class", "axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(axis)
                  ;

              // Initialize the brush component with pretty resize handles.
              var gBrush = g.append("g").attr("class", "brush").call(brush);
              gBrush.selectAll("rect").attr("height", height);
              gBrush.selectAll(".resize").append("path").attr("d", resizePath);
            }

            // Only redraw the brush if set externally.
            if (brushDirty) {
              brushDirty = false;
              g.selectAll(".brush").call(brush);
              div.select(".title a").style("display", brush.empty() ? "none" : null);
              if (brush.empty()) {
                g.selectAll("#clip-" + id + " rect")
                    .attr("x", 0)
                    .attr("width", width);
              } else {
                var extent = brush.extent();
                g.selectAll("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));
              }
            }

            g.selectAll(".bar").attr("d", barPath);
          });

          function barPath(groups) {
            var path = [],
                i = -1,
                n = groups.length,
                d;
            while (++i < n) {
              d = groups[i];
              path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
            }
            return path.join("");
          }

          function resizePath(d) {
            var e = +(d == "e"),
                x = e ? 1 : -1,
                y = height / 3;
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
        }

        brush.on("brushstart.chart", function() {
          var div = d3.select(this.parentNode.parentNode.parentNode);
          div.select(".title a").style("display", null);
        });

        brush.on("brush.chart", function() {
          var g = d3.select(this.parentNode),
              extent = brush.extent();
          if (round) g.select(".brush")
              .call(brush.extent(extent = extent.map(round)))
            .selectAll(".resize")
              .style("display", null);
          g.select("#clip-" + id + " rect")
              .attr("x", x(extent[0]))
              .attr("width", x(extent[1]) - x(extent[0]));
          dimension.filterRange(extent);
        });

        brush.on("brushend.chart", function() {
          if (brush.empty()) {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title a").style("display", "none");
            div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
            dimension.filterAll();
          }
        });

        chart.margin = function(_) {
          if (!arguments.length) return margin;
          margin = _;
          return chart;
        };

        chart.x = function(_) {
          if (!arguments.length) return x;
          x = _;
          axis.scale(x);
          brush.x(x);
          return chart;
        };

        chart.y = function(_) {
          if (!arguments.length) return y;
          y = _;
          return chart;
        };

        chart.dimension = function(_) {
          if (!arguments.length) return dimension;
          dimension = _;
          return chart;
        };

        chart.filter = function(_) {
          if (_) {
            brush.extent(_);
            dimension.filterRange(_);
          } else {
            brush.clear();
            dimension.filterAll();
          }
          brushDirty = true;
          return chart;
        };

        chart.group = function(_) {
          if (!arguments.length) return group;
          group = _;
          return chart;
        };

        chart.round = function(_) {
          if (!arguments.length) return round;
          round = _;
          return chart;
        };

        return d3.rebind(chart, brush, "on");
      }

      // Renders the specified chart or list.
      function render(method) {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.render()');
        d3.select(this).call(method);
        if( this.debug ) console.log('pentaho.viz.CrossFilter.render() done');
      }

      // Whenever the brush moves, re-rendering everything.
      pentaho.viz.CrossFilter.prototype.renderAll = function() {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.renderAll()');
        chart.each(render);
        list.each(render);
        d3.select("#active").text(formatNumber(all.value()));
        if( this.debug ) console.log('pentaho.viz.CrossFilter.renderAll() done');
      }

      window.filter = function(filters) {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.filter()');
        filters.forEach(function(d, i) { charts[i].filter(d); });
        crossFilterWrapper.renderAll();
        if( this.debug ) console.log('pentaho.viz.CrossFilter.filter() done');
      };

      pentaho.viz.CrossFilter.prototype.reset = function(i) {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.reset()');
        this.charts[i].filter(null);
        this.renderAll();
        if( this.debug ) console.log('pentaho.viz.CrossFilter.reset() done');
      };

      pentaho.viz.CrossFilter.prototype.setSort = function( idx ) {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.setSort()');
        this.sortIdx = idx;
        this.renderAll();
        if( this.debug ) console.log('pentaho.viz.CrossFilter.setSort() done');
      }

      pentaho.viz.CrossFilter.prototype.updateTable = function(div) {
        if( this.debug ) console.log('pentaho.viz.CrossFilter.updateTable()');

        var data = dimensions[crossFilterWrapper.sortIdx].top(50);

        var allSelected = dimensions[crossFilterWrapper.sortIdx].top(10000);

        if( allSelected.length == this.dataTable.getNumberOfRows() || allSelected.length == 0 ) {
            // every thing is selected - so nothing is selected
            // toggle the last set of selections
            vizUtil.clearSelections();
            this.selectionList = [];
        } else {
            this.selectionList = [];
            for( var idx=0; idx<allSelected.length; idx++ ) {
                var rowIdx = allSelected[idx].rowIdx;
                this.selectionRowMap[ rowIdx ] = true;
                // create the selections

                var selection = {
                    rowId: [],
                    rowIdx: rowIdx,
                    rowItem: [],
                    colItem: new Array(),
                    colId: new Array(),
                    type: 'row'
                };

                for( var colNo=0; colNo<this.rowsCols.length; colNo++ ) {
                    selection.rowId.push( this.dataTable.getColumnId(this.rowsCols[colNo]) );
                    selection.rowItem.push( this.dataTable.getValue(rowIdx,this.rowsCols[colNo]) )
                }
                this.selectionList.push(selection);
            }
            var args = {
                mode: "REPLACE",
                type: 'row',
                source: this,
                selections: this.selectionList

            };
            pentaho.events.trigger( this, "select", args );
        }

        var table = document.getElementById('datalist');

        if( this.showTable ) {
            vizUtil.updateSelectionTable( table, this.dataTable, data, this.labelFontStr, this.labelColor );
        }

        return;
    }

    return pentaho.viz.CrossFilter;
});
