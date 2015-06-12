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
    "../visualUtils",
    "pentaho/visual/color/paletteRegistry",
    "pentaho/visual/events",
    "d3",
    "crossfilter",
    "dojo/_base/lang",
    "pentaho/common/Messages",
    "css!./crossFilter",
    "css!../table"
], function(utils, paletteRegistry, visualEvents, d3, D3CrossFilter, lang, Messages) {

    var formatNumber = d3.format(",d");

    /*
        Constructor
        This takes an HTML DOM element as a parameter
    */
    function CrossFilter(element) {
        this.debug = false;
        this.element = element;
        this.dataTable = null;
        this.drawSpec = null;
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
        this.barColor = paletteRegistry.get("twelveDaysViz").colors[0];
    }

    CrossFilter.prototype.resize = function() {
      console.log("resize()");
        this.draw(this.dataTable, this.drawSpec);
      console.log("resize() end");
    };

    /*
    TODO (dleao): This requires the missing class CrossFilterColorDialog

    CrossFilter.prototype.colorsChanged = function() {
        if(this.debug) console.log('CrossFilter.colorsChanged()');
        var color = colorDialog.color;
        if(color != null && color != this.barColor) {
            this.barColor = colorDialog.color;
            for(var idx=0; idx< this.bars.length; idx++) {
                this.bars[idx].style("fill",this.barColor);
            }
        }
    };

    CrossFilter.prototype.colorsBtnClicked = function() {
        if(this.debug) console.log('CrossFilter.colorsBtnClicked()');
        // open a dialog
        if(!this.colorDialog) {
            this.colorDialog = new pentaho.CrossFilterColorDialog();
            var func = dojo.hitch(this, function() { this.colorsChanged() });
            colorDialog.registerOnSuccessCallback(func);
        }
        colorDialog.show();
        return true;
    };
    */

    /*
        draw()

        dataTable   a DataTable object with the data to display
        drawSpec  the options for the visualization
    */
    CrossFilter.prototype.draw = function(pdataTable, drawSpec) {

        if(this.debug) console.log('CrossFilter.draw()');

        if(drawSpec.action === "setHighlights") {
          // TODO: Consider only selecting after brushend.
          // Ignore cause otherwise brushing stops.
          return;
        }

        // detect IE
        var browserName=navigator.appName;
        if(browserName == "Microsoft Internet Explorer") {
            this.element.innerHTML = Messages.getString('noIE');
            return;
        }

        var localThis = this;

        utils.handleCommonOptions(this, drawSpec);

        utils.applyBackground(this.element, drawSpec);

        if(drawSpec.showTable != null) {
          this.showTable = !!drawSpec.showTable;
        }

        this.dimensions = [];
        this.dimGroups = [];
        this.ranges = [];
        this.charts = [];
        this.sortIdx = 0;
        this.crossf = null; // the crossfilter

        this.dimensionFunctions = [
                function(d) { return d["measure0"]; },
                function(d) { return d["measure1"]; },
                function(d) { return d["measure2"]; },
                function(d) { return d["measure3"]; },
                function(d) { return d["measure4"]; },
                function(d) { return d["measure5"]; },
                function(d) { return d["measure6"]; },
                function(d) { return d["measure7"]; }
            ];

        // store the incoming parameters for later use
        this.drawSpec = drawSpec;
        this.dataTable = pdataTable;

        // store the current highlighted selections
        this.selections = drawSpec.highlights;

        // local variables
        var measures = [];
        var strings = [];
        var idx;
        var columnMap = {};
        this.rowsCols = [];
        this.measuresCols = [];

        var title = '';
        var measureNo = 0;
        for(var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
            var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
            if(dataReq) {
                for(idx=0; idx < dataReq.length; idx++) {
                    if(dataReq[idx].id == 'rows') {
                        this.rowsCols.push(colNo);
                        title = this.dataTable.getColumnLabel(colNo);
                        columnMap[colNo] = [title];
                        strings.push(colNo);
                    } else if(dataReq[idx].id == 'measures') {
                        this.measuresCols.push(colNo);
                        measures.push(colNo);
                        title = this.dataTable.getColumnLabel(colNo);
                        columnMap[colNo] = [title,'measure'+measureNo];
                        measureNo++;
                    }
                }
            }
        }

        var rows = [], row;
        for(var rowNo=0; rowNo < this.dataTable.getNumberOfRows(); rowNo++) {
            row = {};
            for(var colNo = 0; colNo < this.dataTable.getNumberOfColumns(); colNo++) {
                var mapping = columnMap[colNo];
                for(var mapNo = 0; mapNo < mapping.length; mapNo++) {
                    row[mapping[mapNo]] = this.dataTable.getValue(rowNo, colNo);
                    row['formatted_'+mapping[mapNo]] = this.dataTable.getFormattedValue(rowNo, colNo);
                }
            }
            row['rowIdx'] = rowNo;
            rows.push(row);
        }

        if(this.crossf) {
            // this.crossf.reset();
            this.crossf = new D3CrossFilter(rows);
        } else {
            this.crossf = new D3CrossFilter(rows);
        }

        // create dimensions
        for(idx=0; idx<measures.length; idx++) {
            var func = this.dimensionFunctions[idx];
            var dimension = this.crossf.dimension(func);
            this.dimensions.push(dimension);
            this.ranges.push(this.dataTable.getColumnRange(measures[idx]));
        }

        this._all = this.crossf.groupAll();

        var createGroupFun = function(bucket) {
            return function(value) {
                return Math.floor(value / bucket) * bucket;
            };
        };

        for(idx=0; idx<this.dimensions.length; idx++) {
            var range = this.ranges[idx].max - this.ranges[idx].min;
            var bucket = range/100;
            // adjust bucket to nearest 1,2,5,10,20,50 etc
            var group = this.dimensions[idx].group(createGroupFun(bucket));
            this.dimGroups.push(group);
        }

        while(this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }

        var chartsPerRow = Math.floor(utils.getClientWidth(this) / 350);

        var center = document.createElement('CENTER');
        this.element.appendChild(center);

        var table = document.createElement('TABLE');
        table.id = 'charttable';
        center.appendChild(table);

        row = null;

        var createClickHandler = function(idx) {
            return function() { localThis.reset(idx); };
        };

        for(idx=0; idx<this.dimensions.length; idx++) {
            if(idx % chartsPerRow == 0) row = table.insertRow(-1);

            var cell = row.insertCell(-1);

            var span = document.createElement('SPAN');
            span.className = 'chartTitle';
            span.style.font = this.labelFontStr;
            span.style.color = this.labelColor;
            span.innerHTML = this.dataTable.getColumnLabel(measures[idx]);
            cell.appendChild(span);

            span = document.createElement('SPAN');
            span.className = 'chartOp';
            span.style.font  = this.labelFontStr;
            span.style.color = this.labelColor;
            span.innerHTML = '<span>[show all]</span>';
            span.firstChild.onclick = createClickHandler(idx);
            cell.appendChild(span);

            var br = document.createElement('BR');
            cell.appendChild(br);

            var div = document.createElement('DIV');
            div.className = 'chart';
            cell.appendChild(div);
        }

        table = document.createElement('TABLE');
        center.appendChild(table);
        if(this.showTable) {
            utils.createSelectionTable(table, this.dataTable, this.labelFontStr, this.labelColor, lang.hitch(this, this.setSort));
        }

        this.charts = [];
        this.bars = [];

        if(this.dataTable.getNumberOfRows() > 1) {

            for(idx=0; idx<this.dimensions.length; idx++) {
                if(idx < this.charts.length) {
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

            this._chart = d3.selectAll(".chart")
                .data(this.charts)
                .each(function(chart) {
                    chart.on("brush",    lang.hitch(localThis, localThis.renderAll))
                         .on("brushend", lang.hitch(localThis, localThis.renderAll));
                });
        }

        this._list = d3.selectAll(".datatable")
          .data([lang.hitch(this, this.updateTable)]);

        this.renderAll();

        if(this.debug) console.log('CrossFilter.draw() done');
    };

    CrossFilter.prototype.barChart = function(id, vis) {
        var margin = {top: 10, right: 10, bottom: 20, left: 10},
            x,
            y = d3.scale.linear().range([100, 0]),
            axis = d3.svg.axis()
                .orient("bottom")
                .ticks(5),
            parent = vis,
            brush = d3.svg.brush(),
            brushDirty,
            dimension,
            group,
            round;

        function chartStamp(div) {
          // console.log("charting");

          var width = x.range()[1],
              height = y.range()[0];

          y.domain([0, group.top(1)[0].value]);

          div.each(function() {
            var div = d3.select(this),
                g = div.select("g");

            // Create the skeletal chart.
            if(g.empty()) {
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
                  .call(axis);

              // Initialize the brush component with pretty resize handles.
              var gBrush = g.append("g").attr("class", "brush").call(brush);
              gBrush.selectAll("rect").attr("height", height);
              gBrush.selectAll(".resize").append("path").attr("d", resizePath);
            }

            // Only redraw the brush if set externally.
            if(brushDirty) {
              brushDirty = false;
              g.selectAll(".brush").call(brush);
              div.select(".title a").style("display", brush.empty() ? "none" : null);
              if(brush.empty()) {
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
            while(++i < n) {
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
        } // end chart

        brush.on("brushstart.chart", function() {
          var div = d3.select(this.parentNode.parentNode.parentNode);
          div.select(".title a").style("display", null);
        });

        brush.on("brush.chart", function() {
          var g = d3.select(this.parentNode),
              extent = brush.extent();

          if(round)
            g.select(".brush")
              .call(brush.extent(extent = extent.map(round)))
            .selectAll(".resize")
              .style("display", null);

          g.select("#clip-" + id + " rect")
              .attr("x",     x(extent[0]))
              .attr("width", x(extent[1]) - x(extent[0]));

          console.log(extent);
          dimension.filterRange(extent);
        });

        brush.on("brushend.chart", function() {
          if(brush.empty()) {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title a").style("display", "none");
            div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
            dimension.filterAll();
          }
        });

        chartStamp.margin = function(_) {
          if(!arguments.length) return margin;
          margin = _;
          return chartStamp;
        };

        chartStamp.x = function(_) {
          if(!arguments.length) return x;
          x = _;
          axis.scale(x);
          brush.x(x);
          return chartStamp;
        };

        chartStamp.y = function(_) {
          if(!arguments.length) return y;
          y = _;
          return chartStamp;
        };

        chartStamp.dimension = function(_) {
          if(!arguments.length) return dimension;
          dimension = _;
          return chartStamp;
        };

        chartStamp.filter = function(_) {
          if(_) {
            brush.extent(_);
            dimension.filterRange(_);
          } else {
            brush.clear();
            dimension.filterAll();
          }
          brushDirty = true;
          return chartStamp;
        };

        chartStamp.group = function(_) {
          if(!arguments.length) return group;
          group = _;
          return chartStamp;
        };

        chartStamp.round = function(_) {
          if(!arguments.length) return round;
          round = _;
          return chartStamp;
        };

        return d3.rebind(chartStamp, brush, "on");
      }; // end barChart

      // Renders the specified chart or list.
      function render(method) {
        if(this.debug) console.log('CrossFilter.render()');
        d3.select(this).call(method);
        if(this.debug) console.log('CrossFilter.render() done');
      }

      // Whenever the brush moves, re-rendering everything.
      CrossFilter.prototype.renderAll = function() {
        if(this.debug) console.log('CrossFilter.renderAll()');
        this._chart.each(render);
        this._list .each(render);
        d3.select("#active").text(formatNumber(this._all.value()));
        if(this.debug) console.log('CrossFilter.renderAll() done');
      };

      CrossFilter.prototype.filter = function(filters) {
        if(this.debug) console.log('CrossFilter.filter()');
        filters.forEach(function(d, i) { this.charts[i].filter(d); }, this);
        this.renderAll();
        if(this.debug) console.log('CrossFilter.filter() done');
      };

      CrossFilter.prototype.reset = function(i) {
        if(this.debug) console.log('CrossFilter.reset()');
        this.charts[i].filter(null);
        this.renderAll();
        if(this.debug) console.log('CrossFilter.reset() done');
      };

      CrossFilter.prototype.setSort = function(idx) {
        if(this.debug) console.log('CrossFilter.setSort()');
        this.sortIdx = idx;
        this.renderAll();
        if(this.debug) console.log('CrossFilter.setSort() done');
      };

      CrossFilter.prototype.updateTable = function(div) {
        if(this.debug) console.log('CrossFilter.updateTable()');

        var data = this.dimensions[this.sortIdx].top(50);

        var allSelected = this.dimensions[this.sortIdx].top(10000);

        if(allSelected.length == this.dataTable.getNumberOfRows() || allSelected.length == 0) {
            // every thing is selected - so nothing is selected
            // toggle the last set of selections
            utils.clearSelections();
            this.selectionList = [];
        } else {
            this.selectionList = [];
            for(var idx=0; idx<allSelected.length; idx++) {
                var rowIdx = allSelected[idx].rowIdx;
                this.selectionRowMap[rowIdx] = true;
                // create the selections

                var selection = {
                    rowId:   [],
                    rowIdx:  rowIdx,
                    rowItem: [],
                    colItem: [],
                    colId:   [],
                    type:    'row'
                };

                for(var colNo=0; colNo<this.rowsCols.length; colNo++) {
                    selection.rowId.push(this.dataTable.getColumnId(this.rowsCols[colNo]));
                    selection.rowItem.push(this.dataTable.getValue(rowIdx,this.rowsCols[colNo]));
                }

                this.selectionList.push(selection);
            }

            var args = {
                    mode:   "REPLACE",
                    type:   "row",
                    source: this,
                    selections: this.selectionList
                };

            visualEvents.trigger(this, "select", args);
        }

        if(this.showTable) {
            var table = document.getElementById('datalist');
            utils.updateSelectionTable(table, this.dataTable, data, this.labelFontStr, this.labelColor);
        }
    };

    return CrossFilter;
});
