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
    "moment",
    "cdf/lib/CCC/protovis"
], function(utils, paletteRegistry, visualEvents, moment, pv) {
    /*global cv:true*/

    /*
        visualization constructor
        This takes an HTML DOM element as a parameter
    */
    function Zoom(element) {
        this.debug = false;
        this.element = element;
        this.dataTable = null;
        this.drawSpec = null;
        this.fixedYAxis = "fixed";
        this.labelColor = "#000000";
        this.colors = paletteRegistry.get("twelveDaysViz").colors;
        this.version = "1.0";
        this.contextChartType = 'line';
        this.doResize = false;
        this.minFocusHeight = 100;
        this.nContextLabels = 20;
        this.data = [];
        this.rowsCols = [];
        this.measureCols = [];
        this.monthMap = {
            1:1,
            2:2,
            3:3,
            4:4,
            5:5,
            6:6,
            7:7,
            8:8,
            9:9,
            10:10,
            11:11,
            12:12,
            'Jan':1,
            'Feb':2,
            'Mar':3,
            'Apr':4,
            'May':5,
            'Jun':6,
            'Jul':7,
            'Aug':8,
            'Sep':9,
            'Oct':10,
            'Nov':11,
            'Dec':12,
            'January':1,
            'February':2,
            'March':3,
            'April':4,
            'May':5,
            'June':6,
            'July':7,
            'August':8,
            'September':9,
            'October':10,
            'November':11,
            'December':12
        };

        this.init();
    };

    Zoom.prototype.resize = function() {
        this.doResize = true;
        this.draw(this.dataTable, this.drawSpec);
    };

    /*
        draw()

        dataTable a DataTable object with the data to display
        drawSpec  the options for the visualization
    */
    Zoom.prototype.draw = function(pdataTable, drawSpec) {
        var localThis = this;

        this.dataTable = pdataTable;
        this.drawSpec = drawSpec;

        this.fixedYAxis = "fixed";
        if(this.debug) console.log('Zoom.draw()');

        if(drawSpec.fixedYAxis) this.fixedYAxis = drawSpec.fixedYAxis;

        var contextChartType = drawSpec.contextChartType;
        if(contextChartType) this.contextChartType = contextChartType;

        // handle fonts, background
        utils.handleCommonOptions(this, drawSpec);

        // set up the color ranges
        utils.setupColorRanges(this);

        // apply the background color/gradient
        utils.applyBackground(this.element, drawSpec);

        var isArea = this.contextChartType == 'area';
        var isLine = this.contextChartType == 'line';

        this.data = [];

        this.rowsCols = [];
        this.measureCols = [];

        for(var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
            var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
            if(dataReq) {
                for (var idx=0; idx < dataReq.length; idx++) {
                    if(dataReq[idx].id == 'rows') {
                        this.rowsCols.push(colNo);
                    }
                    else if(dataReq[idx].id == 'measures') {
                        this.measureCols.push(colNo);
                        this.data.push([]);
                    }
                }
            }
        }

        var min = null;
        var max = null;
        for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
            // create the label
            var label = '';
            for(var colNo=0; colNo< this.rowsCols.length; colNo++) {
                if(colNo > 0) label += '~';
                label += this.dataTable.getFormattedValue(rowNo, colNo);
            }

            for(var colNo=0; colNo< this.measureCols.length; colNo++) {
                var item = {
                    x: rowNo,
                    label: label,
                    y: this.dataTable.getValue(rowNo,this.measureCols[colNo]),
                    idx: rowNo,
                    tooltip: label + "<br/>" + this.dataTable.getFormattedValue(rowNo,this.measureCols[colNo])
                };

                this.data[colNo].push(item);
                if(min == null) {
                    min = item.y;
                    max = item.y;
                } else {
                    min = Math.min(min, item.y);
                    max = Math.max(max, item.y);
                }
            }
        }

        this.processData();

        if(this.debug) console.log('Zoom.draw creating scales');

        /* Scales and sizing. */

        var bottomChartHeight = 50;

        this.leftMargin = 100;
        this.rightMargin = 20;
        this.topMargin = 20;
        this.bottomMargin = 100;

        var labelHeight = 50;
        var w = utils.getClientWidth(this);
        var h = utils.getClientHeight(this);

        this.panelW = w-this.leftMargin-this.rightMargin;
        this.panelH = h-this.topMargin-this.bottomMargin;

        var h1 = this.panelH - labelHeight - bottomChartHeight;
        var h2 = bottomChartHeight;
        var contextTop = h1+labelHeight;

        this.x = pv.Scale.linear(0, this.data[0].length-1).range(0, this.panelW);

        var doFocus = h1 > this.minFocusHeight;
        if(!doFocus) {
            h1 = 50;
            h2 = this.panelH;
            contextTop = 0;
        }

        this.y = pv.Scale.linear(this.min, this.max).range(0, h2);

        /* Interaction state. Focus scales will have domain set on-render. */
        if(!this.doResize) {
            if(this.data[0].length < 100) {
                this.i = {x:0, dx: Math.min(this.data[0].length-1, 10)};
            } else {
                this.i = {x:0, dx: Math.max(this.data[0].length/20, 20) };
            }
        }

        this.fx = pv.Scale.linear().range(0, this.panelW);
        this.fy = pv.Scale.linear().range(0, h1);

        /* Root panel. */
        if(this.debug) console.log('Zoom.draw creating root panel');
        var vis = new pv.Panel()
            .width(this.panelW)
            .height(this.panelH)
            .bottom(this.bottomMargin)
            .left(this.leftMargin)
            .right(this.rightMargin)
            .top(this.topMargin)
            .canvas(this.svgDiv)
            .fillStyle("#ffffff");

        vis['viz'] =  this;
        this.pvVis = vis;

        if(this.debug) console.log('Zoom.draw creating focus panel');
        /* Focus panel (zoomed in). */

        if(doFocus) {
            var focus = vis.add(pv.Panel)
                .def("init", function(n) {
                    var measureNo = typeof n == "undefined" ? localThis.data.length-1 : n;
                    var data = localThis.data[measureNo];
                    var d1 = localThis.x.invert(localThis.i.x);
                    var d2 = localThis.x.invert(localThis.i.x + localThis.i.dx);
                    var dd = data.slice(
                            Math.max(0, pv.search.index(data, d1, function(d) { return d.x; }) - 1),
                            pv.search.index(data, d2, function(d) { return d.x; }) + 1);
                    localThis.fx.domain(d1, d2);
                    localThis.fy.domain(
                        localThis.fixedYAxis == 'fixed'
                        ? localThis.y.domain()
                        : [0, pv.max(dd, function(d) { return d.y; })]);

                    return dd;
                  })
                .top(0)
                .width(this.panelW)
                .left(0)
                .height(h1);

            /* X-axis ticks. */
            if(this.debug) console.log('Zoom.draw creating x-axis');
            focus.add(pv.Rule)
                .data(function() {
                    return localThis.fx.ticks(Math.min(localThis.data[0].length-1, localThis.nContextLabels));
                })
                .left(this.fx)
                .strokeStyle("#eee")
                .bottom(0)
                .anchor("bottom")
                .add(pv.Label)
                .text(function(d) {
                    var idx = Math.floor(d);
                    return localThis.getDateLabel(idx);
                })
                .textAlign("right")
                .textAngle(-Math.PI/8)
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            /* Y-axis ticks. */
            if(this.debug) console.log('Zoom.draw creating y-axis');
            focus.add(pv.Rule)
                .data(function() { return localThis.fy.ticks(7); })
                .bottom(this.fy)
                .strokeStyle(function(d) { return d ? "#aaa" : "#000"; })
              .anchor("left").add(pv.Label)
                .text(this.fy.tickFormat)
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            /* Focus area chart. */
            if(this.debug) console.log('Zoom.draw creating focus chart');
            var focusPanel = focus.add(pv.Panel)
                .overflow("hidden");

            if(isArea) {
                this.lines = null;
                focusPanel.add(pv.Area)
                    .data(this.getData(0))
                    .left(function(d) { return localThis.fx(d.x); })
                    .bottom(1)
                    .height(function(d) { return localThis.fy(d.y); })
                    .fillStyle(this.colors[0])
                    .title(function() { return "";}) // Prevent browser tooltip
                  .anchor("top").add(pv.Line)
                    .fillStyle(null)
                    .strokeStyle(this.colors[0])
                    .lineWidth(2);
            } else if(isLine) {
                this.lines = this.measureCols.map(function(col, measureNo) {
                    return focusPanel.add(pv.Line)
                        .data  (this.getData(measureNo))
                        .left  (function(d) { return localThis.fx(d.x); })
                        .bottom(function(d) { return localThis.fy(d.y); })
                        .strokeStyle(this.colors[measureNo])
                        .title(function() { return ""; }); // Prevent browser tooltip
                }, this);
            }
        }

        /* Context panel (zoomed out). */
        if(this.debug) console.log('Zoom.draw creating context panel');
        var context = vis.add(pv.Panel)
            .top(contextTop)
            .width(this.panelW)
            .left(0)
            .height(h2);

        var nTicks = this.x.ticks().length;
        var minIdx = this.x.ticks()[0];
        var maxIdx = this.x.ticks()[nTicks-1];

        // see if we have a date
        var minDateObj = this.parseDate(this.data[0][minIdx].label);
        var maxDateObj = this.parseDate(this.data[0][maxIdx].label);
        this.majorDateFmt = null;
        this.minorDateFmt = null;
        this.firstDateFmt = null;
        this.firstTick = true;
        if(minDateObj != null && maxDateObj != null) {
            var minDate = minDateObj;
            var maxDate = maxDateObj;
            var minMillis = minDate.toDate().getTime();
            var maxMillis = maxDate.toDate().getTime();
            if(""+minMillis != "NaN" && ""+maxMillis != "NaN") {
                var millisDiff = maxMillis - minMillis;
                var daysDiff = millisDiff / (1000 * 60 * 60 * 24);
                if(daysDiff > 3000) {
                    this.firstDateFmt = "MMM YYYY";
                    this.majorDateFmt = "YYYY";
                    this.minorDateFmt = "MMM";
                }
                else if(daysDiff > 300) {
                    this.firstDateFmt = "MMM YYYY";
                    this.majorDateFmt = "MMM";
                    this.minorDateFmt = "MMM";
                }
                else if(daysDiff > 30) {
                    this.firstDateFmt = "MMM Do YYYY";
                    this.majorDateFmt = "MMM Do";
                    this.minorDateFmt = "Do";
                }
                else if(daysDiff > 3) {
                    this.firstDateFmt = "MMM Do YYYY HH:mm";
                    this.majorDateFmt = "Do HH:mm";
                    this.minorDateFmt = "Do HH:mm";
                } else {
                    this.firstDateFmt = "MMM Do YYYY HH:mm";
                    this.majorDateFmt = "HH:mm";
                    this.minorDateFmt = "HH:mm";
                }
                if(!this.firstDateFmt) {
                    this.firstDateFmt = this.majorDateFmt;
                }
            }
        }

        /* X-axis ticks. */
        context.add(pv.Rule)
            .data(this.x.ticks(this.nContextLabels))
            .left(this.x)
            .strokeStyle("#ffffff")
            .bottom(0)
            .anchor("bottom")
            .add(pv.Label)
            .text(function(d) {
                var idx = Math.floor(d);
                return localThis.data[0][idx].label;
             })
            .textAlign("right")
            .textAngle(-Math.PI/8)
            .textStyle(this.labelColor)
            .font(this.labelFontStr);

        /* Y-axis ticks. */
        context.add(pv.Rule)
            .strokeStyle("#0000ff")
            .bottom(0);

        /* Context area chart. */
        if(this.debug) console.log('Zoom.draw creating context chart');

        this.measureCols.forEach(function(col, measureNo) {
            if(isArea) {
                context.add(pv.Area)
                    .data(this.data[measureNo])
                    .left(function(d) { return localThis.x(d.x); })
                    .bottom(0)
                    .height(function(d) { return localThis.y(d.y); })
                    .fillStyle(this.colors[0])
                  .anchor("top").add(pv.Line)
                    .strokeStyle(this.colors[0])
                    .lineWidth(2);

            } else if(isLine) {
                context.add(pv.Line)
                    .data(this.data[measureNo])
                    .left(function(d) { return localThis.x(d.x); })
                    .bottom(function(d) { return localThis.y(d.y); })
                    .strokeStyle(this.colors[measureNo])
                    .title(function() { return ""; }); // Prevent browser tooltip
            }
        }, this);

        /* The selectable, draggable focus region. */
        if(this.debug) console.log('Zoom.draw creating drag region');
        context.add(pv.Panel)
            .data([this.i])
            .cursor("crosshair")
            .events("all")
            .event("mousedown", pv.Behavior.select())
            .event("select", function(d) {
                localThis.drawFocus(d);
            })
          .add(pv.Bar)
            .left(function(d) { return d.x; })
            .width(function(d) { return d.dx; })
            .fillStyle("rgba(255, 128, 128, .4)")
            .cursor("move")
            .event("mousedown", pv.Behavior.drag())
            .event("drag", function(d) {
                localThis.drawFocus(d);
            });

        if(this.debug) console.log('Zoom.draw rendering');
        vis.render();

        if(this.debug) console.log('Zoom.draw() done');

        this.doResize = false;
    };

    Zoom.prototype.processData = function() {

        if(this.debug) console.log('Zoom.processData()');

        this.dateCol = -1;
        this.yearCol = -1;
        this.monthCol = -1;
        this.dayCol = -1;
        this.data = [];
        this.measureCols = [];
        this.min = null;
        this.max = null;
        for(var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
            var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
            if(dataReq) {
                for (var idx=0; idx < dataReq.length; idx++) {
                    if(dataReq[idx].id == 'date') {
                        this.dateCol = colNo;
                    }
                    else if(dataReq[idx].id == 'year') {
                        this.yearCol = colNo;
                    }
                    else if(dataReq[idx].id == 'month') {
                        this.monthCol = colNo;
                    }
                    else if(dataReq[idx].id == 'day') {
                        this.dayCol = colNo;
                    }
                    else if(dataReq[idx].id == 'measures') {
                        this.measureCols.push(colNo);
                        this.data.push([]);
                    }
                }
            }
        }

        for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
            var year, month, day, date, dateObj;
            if(this.dateCol != -1) {
                dateObj = this.parseDate(this.dataTable.getFormattedValue(rowNo, this.dateCol));
                dateObj = dateObj.toDate();
                year = dateObj.getYear();
                month = dateObj.getMonth()+1;
                day = dateObj.getDate();
                date = ""+year+"-"+month+"-"+day;
            } else {
                date = "";
                month = 1;
                day = 1;
                if(this.yearCol != -1) {
                    year = parseInt(this.dataTable.getFormattedValue(rowNo, this.yearCol), 10);
                    date += ""+(year);
                }
                if(this.monthCol != -1) {
                    var str = this.dataTable.getFormattedValue(rowNo, this.monthCol);
                    month = parseInt(str, 10);
                    if(!(month >= 1) || !(month <= 12)) {
                        month = this.monthMap[str];
                    }
                    if(date != "") {
                        date += "-";
                    }
                    date += month;
                }
                if(this.dayCol != -1) {
                    day = parseInt(this.dataTable.getFormattedValue(rowNo, this.dayCol), 10);
                    if(date != "") {
                        date += "-";
                    }
                    date += day;
                } else {
                    day = 1;
                }
                dateObj = new Date(year, month-1, day);
            }
            for(var colNo=0; colNo< this.measureCols.length; colNo++) {
                var value = this.dataTable.getValue(rowNo,this.measureCols[colNo]);
                var item = {
                    x: rowNo,
                    year: year,
                    month: month,
                    day: day,
                    date: date,
                    label: date,
                    rowIdx: rowNo,
                    dateObj: dateObj,
                    y: value
                };
                this.data[colNo].push(item);
                if(this.min == null) {
                    this.min = value;
                    this.max = value;
                } else {
                    this.min = Math.min(this.min, value);
                    this.max = Math.max(this.max, value);
                }
            }

        }

        function compare(a, b) {
            return (a === b) ? 0 : ((a > b) ? 1 : -1);
        }

        function compareMeasures(a, b) {
            return compare(+a.dateObj, +b.dateObj) ||
                   compare(a.x,        b.x     );
        }

        function fixMeasureIndexes(item, index) {
            item.x = index;
        }

        for(var colNo=0; colNo< this.measureCols.length; colNo++) {
            this.data[colNo].sort(compareMeasures);
            this.data[colNo].forEach(fixMeasureIndexes);
        }

        if(this.debug) console.log("data", this.data);
    };

    Zoom.prototype.getDateLabel = function(idx) {

        var label = this.data[0][idx].label;
        if(!this.firstDateFmt) {
            return label;
        }
        var date = this.parseDate(label);
        var dateStr;
        if(this.firstTick) {
            dateStr = date.format(this.firstDateFmt);
        } else {
            dateStr = date.format(this.majorDateFmt);
        }
        this.firstTick = false;
        return dateStr;
    };

    Zoom.prototype.drawFocus = function(d) {
        if(this.debug) console.log('Zoom.drawFocus()',d);
        this.firstTick = true;
        for(var idx=0; idx< this.measureCols.length; idx++) {
            this.i = d;
            var data = this.getData(idx);
            if(this.debug) console.log('data',data);
            if(this.lines && this.lines.length) {
                this.lines[idx].data(data);
            }
        }
        this.pvVis.render();
        this.sendSelections();
    };

    Zoom.prototype.sendSelections = function() {

        // FIXME (dleao): Added this check cause the function was throwing
        // due to not existing any rowsCols.
        if(!this.rowsCols.length) return;

        // add a selection for each time period
        var selections = [];
        for(var rowIdx = this.startRow; rowIdx < this.endRow; rowIdx++) {
            var rowItem = this.dataTable.getValue(rowIdx, this.rowsCols[0]);
          selections.push({
            rowId:   [this.dataTable.getColumnId(this.rowsCols[0])],
            rowIdx:  rowIdx,
            rowItem: [rowItem],
            colItem: [],
            colId:   [],
            type:    'row'
          });
        }

        var args = {
          source: this,
          selections: selections,
          selectionMode: "APPEND"
        };

        visualEvents.trigger(this, "select", args);
    };

    Zoom.prototype.getData = function(measureNo) {
        if(this.debug) console.log('getData',measureNo);
        var data = this.data[measureNo];
        var d1 = this.x.invert(this.i.x);
        var d2 = this.x.invert(this.i.x + this.i.dx);
        this.startRow = Math.floor(d1);
        this.endRow   = Math.floor(d2);
        var dd = data.slice(
                Math.max(0,
                    pv.search.index(data, d1, function(d) { return d.x; }) - 1),
                    pv.search.index(data, d2, function(d) { return d.x; }) + 1);
        this.fx.domain(d1, d2);
        this.fy.domain(this.fixedYAxis == 'fixed' ? this.y.domain() : [0, pv.max(dd, function(d) { return d.y; })]);
        return dd;
    };

    Zoom.prototype.convertToDate = function(dateObj) {
        var date = new Date();
        date.setYear(dateObj.year);
        date.setMonth(dateObj.month-1);
        date.setDate(dateObj.day);
        date.setHours(dateObj.hours ? dateObj.hours : 0);
        date.setMinutes(dateObj.minutes ? dateObj.minutes : 0);
        date.setSeconds(dateObj.seconds ? dateObj.seconds : 0);
        return date;
    };

    Zoom.prototype.parseDate = function(dateStr) {
        return moment(dateStr);
    };

    Zoom.prototype.init = function() {
        if(this.debug) console.log('Zoom.init()');
        this.svgDiv = document.createElement('DIV');
        this.element.appendChild(this.svgDiv);
        this.svgDiv.id = "svgDiv";
        this.svgDiv.style.position="absolute";
        this.svgDiv.style.top="0px";
        this.svgDiv.style.left="0px";
        this.svgDiv.style.width="100%";
        this.svgDiv.style.height="100%";
        this.svgDiv.style.overflow="hidden";
        this.svgDiv.style.textAlign="center";
    };

    return Zoom;
});
