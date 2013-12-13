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
pen.define([
    '../util',
    'moment',
    'cdf/lib/CCC/protovis',
    'cdf/lib/CCC/protovis-msie'
], function(vizUtil, moment, pv) {

    /*
        visualization constructor
        This takes an HTML DOM element as a parameter
    */
    pentaho.viz.Zoom = function( element ) {
        this.debug = false;
        this.element = element;
        this.elementName = element.id;
        this.cdaTable = null;
        this.dataTable = null;
        this.vizOptions = null;
        this.fixedyaxis = "fixed";
        this.labelColor = "#000000";
        this.paletteNo = 0;
        this.version = "1.0";
        this.chartType = 'line';
        this.doResize = false;
        this.minFocusHeight = 100;
        this.nContextLabels = 20;
        this.data = [];
        this.rowsCols = [];
        this.measureCols = [];
        this.monthMap = {
            1:'Jan',
            2:'Feb',
            3:'Mar',
            4:'Apr',
            5:'May',
            6:'Jun',
            7:'Jul',
            8:'Aug',
            9:'Sep',
            10:'Oct',
            11:'Nov',
            12:'Dec',
            'Jan':'Jan',
            'Feb':'Feb',
            'Mar':'Mar',
            'Apr':'Apr',
            'May':'May',
            'Jun':'Jun',
            'Jul':'Jul',
            'Aug':'Aug',
            'Sep':'Sep',
            'Oct':'Oct',
            'Nov':'Nov',
            'Dec':'Dec',
            'January':'Jan',
            'February':'Feb',
            'March':'Mar',
            'April':'Apr',
            'May':'May',
            'June':'Jun',
            'July':'Jul',
            'August':'Aug',
            'Septempber':'Sep',
            'October':'Oct',
            'November':'Nov',
            'December':'Dec'
        };

        this.init();
    }

    // return the state of this visualization for persistance/back-one etc
    pentaho.viz.Zoom.prototype.getState = function() {
        if( this.debug ) console.log('pentaho.viz.Zoom.getState()');
        var state = {
            fixedyaxis: this.fixedyaxis,
            chartType: this.chartType
        };
        return state;
    };

    // sets the state of the visualization - called when a visualization is loaded
    pentaho.viz.Zoom.prototype.setState = function(state) {
        if( this.debug ) console.log('pentaho.viz.Zoom.setState()');
        this.fixedyaxis = state.fixedyaxis;
        this.chartType = state.chartType;
    };

    pentaho.viz.Zoom.prototype.fixedyaxisChanged = function( value ) {
        this.vizOptions.fixedyaxis = value;
        this.draw( this.dataTable, this.vizOptions);
        return true;
    }

    pentaho.viz.Zoom.prototype.contextChartTypeChanged = function( value ) {
        this.vizOptions.contextChartType = value;
        this.draw( this.dataTable, this.vizOptions);
        return true;
    }

    pentaho.viz.Zoom.prototype.resize = function() {
        this.doResize = true;
        this.draw(this.dataTable, this.vizOptions);
    }

    /*
        draw()

        dataTable   a pentaho.DataTable object with the data to display
        vizOptions  the options for the visualization
    */
    pentaho.viz.Zoom.prototype.draw = function( pdataTable, options ) {

        this.fixedyaxis = "fixed";
        if( this.debug ) console.log('pentaho.viz.Zoom.draw()');

            if( options ) {
                if( options.fixedyaxis ) {
                    this.fixedyaxis = options.fixedyaxis;
                }
                var chartType = options.contextChartType;
                if( chartType != null && typeof chartType != 'undefined' ) {
                    this.chartType = chartType;
                }
            }

            // check the controller current visualizations arguments (set by the properties panel)
            if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
                var fixedyaxis = this.controller.currentViz.args.fixedyaxis;
                if( fixedyaxis ) {
                    this.fixedyaxis = fixedyaxis;
                }
                var chartType = this.controller.currentViz.args.contextChartType;
                if( chartType != null && typeof chartType != 'undefined' ) {
                    this.chartType = chartType;
                }
            }

            // check Analyzer's report document (yuck)
            if( cv && cv.rptEditor && cv.rptEditor.report && cv.rptEditor.report.reportDoc ) {
                var fixedyaxis = cv.rptEditor.report.reportDoc.getChartOption('fixedyaxis');
                if( fixedyaxis ) {
                    this.fixedyaxis = fixedyaxis;
                }
                var chartType = cv.rptEditor.report.reportDoc.getChartOption('contextChartType');
                if( chartType != null && typeof chartType != 'undefined' ) {
                    this.chartType = chartType;
                }
            }

        // handle fonts, background
        vizUtil.handleCommonOptions( this, options );

        // set up the color ranges
        vizUtil.setupColorRanges(this);

        // apply the background color/gradient
        vizUtil.applyBackground(this.element, options);

        this.vizOptions = options;
        this.dataTable = pdataTable;
        this.data = [];

        this.rowsCols = [];
        this.measureCols = [];

        for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
            var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
            if(dataReq) {
                for (var idx=0; idx < dataReq.length; idx++) {
                    if( dataReq[idx].id == 'rows' ) {
                        this.rowsCols.push( colNo );
                    }
                    else if( dataReq[idx].id == 'measures' ) {
                        this.measureCols.push( colNo );
                        this.data.push([]);
                    }
                }
            }
        }

        var min = null;
        var max = null;
        for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
            // create the label
            var label = '';
            for( var colNo=0; colNo< this.rowsCols.length; colNo++ ) {
                if( colNo > 0 ) {
                    label += '~';
                }
                label += this.dataTable.getFormattedValue(rowNo, colNo);
            }
            for( var colNo=0; colNo< this.measureCols.length; colNo++ ) {
                var item = {
                    x: rowNo,
                    label: label,
                    y: this.dataTable.getValue(rowNo,this.measureCols[colNo] ),
                    idx: rowNo,
                    tooltip: label + "<br/>" + this.dataTable.getFormattedValue(rowNo,this.measureCols[colNo] )
                };
                this.data[colNo].push(item)
                if( min == null ) {
                    min = item.y;
                    max = item.y;
                } else {
                    min = Math.min( min, item.y );
                    max = Math.max( max, item.y );
                }
            }
        }

        this.processData();

        if( this.debug ) console.log('pentaho.viz.Zoom.draw creating scales');

        /* Scales and sizing. */

        var bottomChartHeight = 50;
        this.leftMargin = 100;
        this.rightMargin = 20;
        this.topMargin = 20;
        this.bottomMargin = 100;
        var labelHeight = 50;
        var w = vizUtil.getClientWidth(this);
        var h = vizUtil.getClientHeight(this);
        this.panelW = w-this.leftMargin-this.rightMargin;
        this.panelH = h-this.topMargin-this.bottomMargin;
        var h1 = this.panelH - labelHeight - bottomChartHeight;
        var h2 = bottomChartHeight;
        var contextTop = h1+labelHeight;
        this.x = pv.Scale.linear(0,this.data[0].length-1).range(0, this.panelW);

        var doFocus = h1 > this.minFocusHeight;
        if( !doFocus ) {
            h1 = 50;
            h2 = this.panelH;
            contextTop = 0;
        }
        this.y = pv.Scale.linear(this.min, this.max).range(0, h2);

        /* Interaction state. Focus scales will have domain set on-render. */
        if( !this.doResize ) {
            if( this.data[0].length < 100 ) {
                this.i = {x:0, dx: Math.min( this.data[0].length-1, 10 )};
            } else {
                this.i = {x:0, dx: Math.max( this.data[0].length/20, 20 ) };
            }
        }
        this.fx = pv.Scale.linear().range(0, this.panelW);
        this.fy = pv.Scale.linear().range(0, h1);

        /* Root panel. */
        if( this.debug ) console.log('pentaho.viz.Zoom.draw creating root panel');
        var vis = new pv.Panel()
            .width(this.panelW)
            .height(this.panelH)
            .bottom(this.bottomMargin)
            .left(this.leftMargin)
            .right(this.rightMargin)
            .top(this.topMargin)
            .canvas(this.svgDiv)
            .fillStyle("#ffffff")
            ;

        vis['viz'] =  this;
        this.pvVis = vis;

        if( this.debug ) console.log('pentaho.viz.Zoom.draw creating focus panel');
        /* Focus panel (zoomed in). */

        if( doFocus ) {
            var focus = vis.add(pv.Panel)
                .def("init", function(n) {
                console.log('focus.init',this.parent.viz);

                    var measureNo = typeof n == "undefined" ? this.parent.viz.data.length-1 : n;
                    var data = this.parent.viz.data[measureNo];
                    var d1 = this.parent.viz.x.invert(this.parent.viz.i.x);
                    var d2 = this.parent.viz.x.invert(this.parent.viz.i.x + this.parent.viz.i.dx);
                    var dd = data.slice(
                            Math.max(0, pv.search.index(data, d1, function(d) { return d.x }) - 1),
                            pv.search.index(data, d2, function(d) { return d.x }) + 1);
                    this.parent.viz.fx.domain(d1, d2);
                    this.parent.viz.fy.domain(this.parent.viz.fixedyaxis == 'fixed' ? this.parent.viz.y.domain() : [0, pv.max(dd, function(d) { return d.y })] );
                    return dd;
                  })
                .top(0)
                .width(this.panelW)
                .left(0)
                .height(h1);

            /* X-axis ticks. */
            if( this.debug ) console.log('pentaho.viz.Zoom.draw creating x-axis');
            focus.add(pv.Rule)
                .data(function() { return this.parent.parent.viz.fx.ticks( Math.min(this.parent.parent.viz.data[0].length-1,this.parent.parent.viz.nContextLabels)) })
                .left(this.fx)
                .strokeStyle("#eee")
                .bottom(0)
                .anchor("bottom")
                .add(pv.Label)
                .text(function(d) {
                    var idx = Math.floor(d);
                    return this.parent.parent.viz.getDateLabel(idx);
                } )
                .textAlign("right")
                .textAngle(-Math.PI/8)
                .textStyle(this.labelColor)
                .font(this.labelFontStr)
                ;

            /* Y-axis ticks. */
            if( this.debug ) console.log('pentaho.viz.Zoom.draw creating y-axis');
            focus.add(pv.Rule)
                .data(function() { return this.parent.parent.viz.fy.ticks(7)})
                .bottom(this.fy)
                .strokeStyle(function(d) { return d ? "#aaa" : "#000" })
              .anchor("left").add(pv.Label)
                .text(this.fy.tickFormat)
                .textStyle(this.labelColor)
                .font(this.labelFontStr)
                ;

            /* Focus area chart. */
            if( this.debug ) console.log('pentaho.viz.Zoom.draw creating focus chart');
            var focusPanel = focus.add(pv.Panel)
                .overflow("hidden");

            if( this.chartType == 'area' ) {
                var data = this.getData(0);
                focusPanel.add(pv.Area)
                    .data(data)
                    .left(function(d) { return this.parent.parent.parent.viz.fx(d.x) })
                    .bottom(1)
                    .height(function(d) { return this.parent.parent.parent.viz.fy(d.y) })
                    .fillStyle(pentaho.palettes[this.paletteNo].colors[0])
                    .title( function(){ return "";} ) // Prevent browser tooltip
                  .anchor("top").add(pv.Line)
                    .fillStyle(null)
                    .strokeStyle(pentaho.palettes[this.paletteNo].colors[0])
                    .lineWidth(2);
            }
            else if( this.chartType == 'line' ) {
                this.lines = [];
                for( var measureNo = 0; measureNo < this.measureCols.length; measureNo++ ) {
                    var data = this.getData(measureNo);
                    var line = focusPanel.add(pv.Line)
                        .data( data )
                        .left(function(d) { return this.parent.parent.parent.viz.fx(d.x) })
                        .bottom(function(d) { return this.parent.parent.parent.viz.fy(d.y) })
                        .strokeStyle(pentaho.palettes[this.paletteNo].colors[measureNo])
                        .title( function(){ return "";} ) // Prevent browser tooltip
                    ;
                    this.lines.push(line);
                }
            }

        }

        /* Context panel (zoomed out). */
        if( this.debug ) console.log('pentaho.viz.Zoom.draw creating context panel');
        var context = vis.add(pv.Panel)
            .top(contextTop)
            .width(this.panelW)
            .left(0)
            .height(h2);

        var nTicks = this.x.ticks().length;
        var minIdx = this.x.ticks()[0];
        var maxIdx = this.x.ticks()[nTicks-1];
        console.log(this.data[0][minIdx]);
        console.log(this.data[0][maxIdx]);
        // see if we have a date
        var minDateObj = this.parseDate(this.data[0][minIdx].label);
        var maxDateObj = this.parseDate(this.data[0][maxIdx].label);
        this.majorDateFmt = null;
        this.minorDateFmt = null;
        this.firstDateFmt = null;
        this.firstTick = true;
        if( minDateObj != null && maxDateObj != null ) {

            //        var minDate = this.convertToDate( minDateObj );
            //        var maxDate = this.convertToDate( maxDateObj );
            var minDate = minDateObj;
            var maxDate = maxDateObj;
            var minMillis = minDate.toDate().getTime();
            var maxMillis = maxDate.toDate().getTime();
            if( ""+minMillis != "NaN" && ""+maxMillis != "NaN" ) {
                var millisDiff = maxMillis - minMillis;
                var daysDiff = millisDiff / (1000 * 60 * 60 * 24);
                console.log( millisDiff );
                console.log( daysDiff );
                if( daysDiff > 3000) {
                    this.firstDateFmt = "MMM YYYY";
                    this.majorDateFmt = "YYYY";
                    this.minorDateFmt = "MMM"
                }
                else if( daysDiff > 300) {
                    this.firstDateFmt = "MMM YYYY";
                    this.majorDateFmt = "MMM";
                    this.minorDateFmt = "MMM"
                }
                else if( daysDiff > 30) {
                    this.firstDateFmt = "MMM Do YYYY";
                    this.majorDateFmt = "MMM Do";
                    this.minorDateFmt = "Do";
                }
                else if( daysDiff > 3) {
                    this.firstDateFmt = "MMM Do YYYY HH:mm";
                    this.majorDateFmt = "Do HH:mm";
                    this.minorDateFmt = "Do HH:mm";
                } else {
                    this.firstDateFmt = "MMM Do YYYY HH:mm";
                    this.majorDateFmt = "HH:mm";
                    this.minorDateFmt = "HH:mm";
                }
                if( !this.firstDateFmt ) {
                    this.firstDateFmt = this.majorDateFmt;
                }
                console.log( this.firstDateFmt );
                console.log( this.majorDateFmt );
                console.log( this.minorDateFmt );
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
            .text(function(d) { var idx = Math.floor(d); return this.parent.parent.viz.data[0][idx].label; } )
            .textAlign("right")
            .textAngle(-Math.PI/8)
            .textStyle(this.labelColor)
            .font(this.labelFontStr)
            ;

        /* Y-axis ticks. */
        context.add(pv.Rule)
            .strokeStyle("#0000ff")
            .bottom(0);

        /* Context area chart. */
        if( this.debug ) console.log('pentaho.viz.Zoom.draw creating context chart');
        for( var measureNo=0; measureNo<this.measureCols.length; measureNo++ ) {
            if( this.chartType == 'area' ) {
                context.add(pv.Area)
                    .data(this.data[measureNo])
                    .left(function(d) { return this.parent.parent.viz.x(d.x) } )
                    .bottom(0)
                    .height(function(d) { return this.parent.parent.viz.y(d.y) } )
                    .fillStyle(pentaho.palettes[this.paletteNo].colors[0])
                  .anchor("top").add(pv.Line)
                    .strokeStyle(pentaho.palettes[this.paletteNo].colors[0])
                    .lineWidth(2);
            }
            else if( this.chartType == 'line' ) {
                context.add(pv.Line)
                    .data( this.data[measureNo] )
                    .left(function(d) { return this.parent.parent.viz.x(d.x) } )
                    .bottom(function(d) { return this.parent.parent.viz.y(d.y) })
                    .strokeStyle(pentaho.palettes[this.paletteNo].colors[measureNo])
                    .title( function(){ return "";} ) // Prevent browser tooltip
                ;
            }
        }

        /* The selectable, draggable focus region. */
        if( this.debug ) console.log('pentaho.viz.Zoom.draw creating drag region');
        context.add(pv.Panel)
            .data([this.i])
            .cursor("crosshair")
            .events("all")
            .event("mousedown", pv.Behavior.select())
            .event("select", function(d) {
                this.parent.parent.viz.drawFocus(d)
            })
          .add(pv.Bar)
            .left(function(d) { return d.x })
            .width(function(d) { return d.dx })
            .fillStyle("rgba(255, 128, 128, .4)")
            .cursor("move")
            .event("mousedown", pv.Behavior.drag())
            .event("drag", function(d) {
                this.parent.parent.parent.viz.drawFocus(d)
            });

        if( this.debug ) console.log('pentaho.viz.Zoom.draw rendering');
        vis.render();

        if( this.debug ) console.log('pentaho.viz.Zoom.draw() done');

        this.doResize = false;
    }

    pentaho.viz.Zoom.prototype.processData = function() {

        if( this.debug ) console.log('pentaho.viz.Zoom.processData()');

        this.dateCol = -1;
        this.yearCol = -1;
        this.monthCol = -1;
        this.dayCol = -1;
        this.data = [];
        this.measureCols = [];
        this.min = null;
        this.max = null;
        for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
            var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
            if(dataReq) {
                for (var idx=0; idx < dataReq.length; idx++) {
                    if( dataReq[idx].id == 'date' ) {
                        this.dateCol = colNo;
                    }
                    else if( dataReq[idx].id == 'year' ) {
                        this.yearCol = colNo;
                    }
                    else if( dataReq[idx].id == 'month' ) {
                        this.monthCol = colNo;
                    }
                    else if( dataReq[idx].id == 'day' ) {
                        this.dayCol = colNo;
                    }
                    else if( dataReq[idx].id == 'measures' ) {
                        this.measureCols.push( colNo );
                        this.data.push([]);
                    }
                }
            }
        }

        for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
            var year, month, day, date, dateObj;
            if( this.dateCol != -1 ) {
                dateObj = this.parseDate( this.dataTable.getFormattedValue( rowNo, this.dateCol ) );
                dateObj = dateObj.toDate();
                year = dateObj.getYear();
                month = dateObj.getMonth()+1;
                day = dateObj.getDate();
                date = ""+year+"-"+month+"-"+day;
            } else {
                date = "";
                month = 1;
                day = 1;
                if( this.yearCol != -1 ) {
                    year = parseInt(this.dataTable.getFormattedValue( rowNo, this.yearCol ),"10");
                    date += ""+(year);
                }
                if( this.monthCol != -1 ) {
                    var str = this.dataTable.getFormattedValue( rowNo, this.monthCol );
                    month = parseInt(str,"10");
                    if( !(month >= 1) || !(month <= 12)) {
                        month = this.monthMap[str];
                    }
                    if( date != "" ) {
                        date += "-";
                    }
                    date += month;
                }
                if( this.dayCol != -1 ) {
                    day = parseInt(this.dataTable.getFormattedValue( rowNo, this.dayCol ),"10");
                    if( date != "" ) {
                        date += "-";
                    }
                    date += day;
                } else {
                    day = 1;
                }
                var dateObj = new Date(year, month-1, day);
            }
            for( var colNo=0; colNo< this.measureCols.length; colNo++ ) {
                var value = this.dataTable.getValue(rowNo,this.measureCols[colNo] );
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
                this.data[colNo].push( item );
                if( this.min == null ) {
                    this.min = value;
                    this.max = value;
                } else {
                    this.min = Math.min( this.min, value );
                    this.max = Math.max( this.max, value );
                }
            }

        }

        if( this.debug) console.log("data", this.data);
    }

    pentaho.viz.Zoom.prototype.getDateLabel = function(idx) {

        var label = this.data[0][idx].label;
        if( !this.firstDateFmt ) {
            return label;
        }
        var date = this.parseDate(label);
        var dateStr;
        if(this.firstTick) {
            var dateStr = date.format(this.firstDateFmt);
        } else {
            dateStr = date.format(this.majorDateFmt);
        }
        this.firstTick = false;
        return dateStr;
    }

    pentaho.viz.Zoom.prototype.drawFocus = function(d) {
        if( this.debug ) console.log('pentaho.viz.Zoom.drawFocus()',d);
        this.firstTick = true;
        for( var idx=0; idx< this.measureCols.length; idx++ ) {
            this.i = d;
            var data = this.getData(idx);
            if( this.debug ) console.log('data',data);
            if( this.lines && this.lines.length ) {
                this.lines[idx].data( data );
            }
        }
        this.pvVis.render();
        this.sendSelections();
    }

    pentaho.viz.Zoom.prototype.sendSelections = function() {

        // FIXME (dleao): Added this check cause the function was throwing
        // due to not existing any rowsCols.
        if(!this.rowsCols.length) return;

        // add a selection for each time period
        var selections = [];
        for( var rowIdx = this.startRow; rowIdx < this.endRow; rowIdx++ ) {
            var rowItem = this.dataTable.getValue(rowIdx, this.rowsCols[0] );
          selections.push( {
            rowId: [this.dataTable.getColumnId(this.rowsCols[0])],
            rowIdx: rowIdx,
            rowItem: [rowItem],
            colItem: new Array(),
            colId: new Array(),
            type: 'row'
          } );
        }

        var args = {
          source: this,
          selections: selections,
          selectionMode: "APPEND"
        };

        pentaho.events.trigger( this, "select", args );

    }

    pentaho.viz.Zoom.prototype.getData = function(measureNo) {
        if( this.debug) console.log('getData',measureNo);
        var data = this.data[measureNo];
        var d1 = this.x.invert(this.i.x);
        var d2 = this.x.invert(this.i.x + this.i.dx);
        this.startRow = Math.floor(d1);
        this.endRow = Math.floor(d2);
        var dd = data.slice(
                Math.max(0, pv.search.index(data, d1, function(d) { return d.x }) - 1),
                pv.search.index(data, d2, function(d) { return d.x }) + 1);
        this.fx.domain(d1, d2);
        this.fy.domain(this.fixedyaxis == 'fixed' ? this.y.domain() : [0, pv.max(dd, function(d) { return d.y })] );
        return dd;
    }

    pentaho.viz.Zoom.prototype.convertToDate = function(dateObj) {

        var date = new Date();
        date.setYear( dateObj.year );
        date.setMonth( dateObj.month-1 );
        date.setDate( dateObj.day );
        date.setHours( dateObj.hours ? dateObj.hours : 0);
        date.setMinutes( dateObj.minutes ? dateObj.minutes : 0);
        date.setSeconds( dateObj.seconds ? dateObj.seconds : 0);
        return date;
    }

    pentaho.viz.Zoom.prototype.parseDate = function(dateStr) {

        var date = moment(dateStr);
        return date;

        try {
            if( dateStr.length >= 10 ) {
                var date = {};
                date.year = parseInt(dateStr.substr(0,4));
                date.month = parseInt(dateStr.substr(5,2));
                date.day = parseInt(dateStr.substr(8,2));
                if( dateStr.length > 11 ) {
                    date.hours = parseInt(dateStr.substr(11,2));
                }
                if( dateStr.length > 14 ) {
                    date.minutes = parseInt(dateStr.substr(14,2));
                }
                if( dateStr.length > 17 ) {
                    date.seconds = parseInt(dateStr.substr(17,2));
                }
                return date;
            }
        } catch (e) {
        }
        return null;
    }

    pentaho.viz.Zoom.prototype.init = function() {

        if( this.debug ) console.log('pentaho.viz.Zoom.init()');
        this.svgDiv = document.createElement('DIV');
        this.element.appendChild( this.svgDiv );
        this.svgDiv.id = "svgDiv";
        this.svgDiv.style.position="absolute";
        this.svgDiv.style.top="0px";
        this.svgDiv.style.left="0px";
        this.svgDiv.style.width="100%";
        this.svgDiv.style.height="100%";
        this.svgDiv.style.overflow="hidden";
        this.svgDiv.style.textAlign="center";
    };

    return pentaho.viz.Zoom;
});
