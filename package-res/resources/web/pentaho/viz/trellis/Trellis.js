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
    'cdf/lib/CCC/protovis',
    'dojo/_base/lang',
    'cdf/lib/CCC/protovis-msie'
], function(vizUtil, pv, lang) {

    pentaho.viz.Trellis = function( div ) {

        this.debug = false;

        if( this.debug ) console.log('pentaho.viz.Trellis.create');

        // Visualization API fields
        this.vizId = null;
        this.controller = null;
        this.id = null;
        this.elementId = div.id;
        this.element = div

        this.data = [];
        this.dataCount = 0;
        this.labelColor = "#000000";
        this.w = 200;
        this.h = 200;
        this.plotAreaColor = "rgba(240,240,240,";
        this.vis = null;
        this.backgroundColor = "rgba(255,255,255,";
        this.opacity = 0;
        this.rootPanel = null;
        this.allStr = "All";
        this.sideMargin = 90;
        this.topMargin = 90;
        this.legendWidth = 150;
        this.paletteNo = 0;
        this.showTable = true;
        this.highlights = [];


        // return the state of this visualization for persistance/back-one etc
        this.getState = function() {
            if( this.debug ) console.log('pentaho.viz.Trellis.getState()');
            var state = {
                topMargin: this.topMargin,
                sideMargin: this.sideMargin,
                showTable:  this.showTable
            };
            return state;
        };

        // sets the state of the visualization - called when a visualization is loaded
        this.setState = function(state) {
            if( this.debug ) console.log('pentaho.viz.Trellis.setState()');
            this.showTable = state.showTable;
            this.topMargin = state.topMargin;
            this.sideMargin = state.sideMargin;
        };

        this.showTableChanged = function( value ) {
            this.options.showTable = value;
            this.draw( this.dataTable, this.options );
            return true;
        };

        this.topmarginChanged = function( value ) {
            this.options.topMargin = value;
            this.draw( this.dataTable, this.options );
            return true;
        };

        this.sidemarginChanged = function( value ) {
            this.options.sideMargin = value;
            this.draw( this.dataTable, this.options );
            return true;
        };

        // These are the highlighting functions
        this.clearHighlights = function() {
            if( this.debug ) console.log('pentaho.viz.Trellis.clearHighlights()');
            for( var idx=0; idx<this.highlights.length; idx++ ) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        this.setHighlights = function(lights) {
            if( this.debug ) console.log('pentaho.viz.Trellis.setHighlights()');
            if( !lights || lights.length == 0 ) {
                this.clearHighlights();
                this.highlight();
            }
        };

        this.highlight = function() {
            if( this.debug ) console.log('pentaho.viz.Trellis.highlight()');

            this.highLightsSet = false;
            for( var idx=0; idx<this.highlights.length; idx++ ) {
                if( this.highlights[idx] ) {
                    this.highLightsSet = true;
                    break;
                }
            }
            this.rootPanel.render();

        };

        this.draw = function( dataTable, options ) {
            if( this.debug ) console.log('pentaho.viz.Trellis.draw()');
            this.dataTable = dataTable;
            this.options = options;

            if( options ) {
                if( options.labelColor ) {
                    this.labelColor = options.labelColor;
                }
                if( typeof options.opacity != 'undefined' ) {
                    this.opacity = options.opacity;
                }
                if( options.backgroundColor ) {
                    this.backgroundColor = options.backgroundColor;
                }
                if( options.sideMargin ) {
                    this.sideMargin = options.sideMargin;
                }
                if( options.topMargin ) {
                    this.topMargin = options.topMargin;
                }
                if( options.showTable ) {
                    this.showTable = options.showTable;
                }
            }

            // check the controller current visualizations arguments (set by the properties panel)
            if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
                var labelColor = this.controller.currentViz.args.labelColor;
                if( labelColor ) { // TODO localize this?
                    this.labelColor = labelColor;
                }

                if( typeof this.controller.currentViz.args.paletteno == 'string') {
                    this.paletteNo = parseInt( this.controller.currentViz.args.paletteno );
                }

                if( typeof this.controller.currentViz.args.opacity == 'number' ) {
                    this.opacity = this.controller.currentViz.args.opacity / 100;
                }
                if( typeof this.controller.currentViz.args.sidemargin == 'number' ) {
                    this.sideMargin = this.controller.currentViz.args.sidemargin * 3;
                    this.options.sideMargin = this.sideMargin;
                }
                if( typeof this.controller.currentViz.args.topmargin == 'number' ) {
                    this.topMargin = this.controller.currentViz.args.topmargin * 2;
                }
                var labelFontFamily = this.controller.currentViz.args.labelFontFamily;
                if( labelFontFamily && labelFontFamily != 'Default') { // TODO localize this?
                    this.labelFontFamily = labelFontFamily;
                }
                var labelSize = this.controller.currentViz.args.labelSize;
                if( labelSize ) {
                    this.labelSize = labelSize;
                }
                var labelStyle = this.controller.currentViz.args.labelStyle;
                if( labelStyle && labelStyle != 'PLAIN') {
                    this.labelStyle = labelStyle;
                }
                var backgroundType = this.controller.currentViz.args.backgroundType;
                if( backgroundType ) {
                    this.backgroundType = backgroundType;
                }
                var backgroundColor = this.controller.currentViz.args.backgroundColor;
                if( backgroundColor ) {
                    this.backgroundColor = backgroundColor;
                }
                var backgroundColorEnd = this.controller.currentViz.args.backgroundColorEnd;
                if( backgroundColorEnd ) {
                    this.backgroundColorEnd = backgroundColorEnd;
                }

            }

            if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
                if( typeof this.controller.currentViz.args.showTable != 'undefined' ) {
                    this.showTable = this.controller.currentViz.args.showTable;
                    options.showTable = this.showTable;
                }
            }

            // check Analyzer's report document (yuck)
            if( cv && cv.rptEditor && cv.rptEditor.report && cv.rptEditor.report.reportDoc ) {
                var labelColor = cv.rptEditor.report.reportDoc.getChartOption('labelColor');
                if( labelColor ) {
                    this.labelColor = labelColor;
                    this.controller.currentViz.args.labelColor = labelColor;
                }
                var labelFontFamily = cv.rptEditor.report.reportDoc.getChartOption('labelFontFamily');
                if( labelFontFamily && labelFontFamily != 'Default') { // TODO localize this?
                    this.labelFontFamily = labelFontFamily;
                    this.controller.currentViz.args.labelFontFamily = labelFontFamily;
                }
                var labelSize = cv.rptEditor.report.reportDoc.getChartOption('labelSize');
                if( labelSize ) {
                    this.labelSize = labelSize;
                    this.controller.currentViz.args.labelSize = labelSize;
                }
                var labelStyle = cv.rptEditor.report.reportDoc.getChartOption('labelStyle');
                if( labelStyle && labelStyle != 'PLAIN') {
                    this.labelStyle = labelStyle;
                    this.controller.currentViz.args.labelStyle = labelStyle;
                }
                var backgroundType = cv.rptEditor.report.reportDoc.getChartOption('backgroundFill');
                if( backgroundType ) {
                    this.backgroundType = backgroundType;
                    this.controller.currentViz.args.backgroundType = backgroundType;
                }
                var backgroundColor = cv.rptEditor.report.reportDoc.getChartOption('backgroundColor');
                if( backgroundColor ) {
                    this.backgroundColor = backgroundColor;
                    this.controller.currentViz.args.backgroundColor = backgroundColor;
                }
                var backgroundColorEnd = cv.rptEditor.report.reportDoc.getChartOption('backgroundColorEnd');
                if( backgroundColorEnd ) {
                    this.backgroundColorEnd = backgroundColorEnd;
                    this.controller.currentViz.args.backgroundColorEnd = backgroundColorEnd;
                }
            }

            if( this.backgroundType == 'NONE' ) {
                this.element.style.background = 'none';
                this.element.style.backgroundColor = '';
            }
            else if( this.backgroundType == 'SOLID' ) {
                this.element.style.backgroundColor = this.backgroundColor;
            }
            else if( this.backgroundType == 'GRADIENT' ) {
                this.element.style.backgroundColor = '';
                var origBack = this.element.style.background;
                if( div.style.background ) {
                    var back = "-moz-linear-gradient(top, "+this.backgroundColor+", "+this.backgroundColorEnd+")";
                    div.style.background = back;
                    if( !div.style.background || div.style.background == origBack ) {
                        back = "-webkit-gradient(linear, left top, left bottom, from("+this.backgroundColor+"), to("+this.backgroundColorEnd+"))";
                        div.style.background = back;
                    }
                }
                // detect IE
                var browserName=navigator.appName;
                if (browserName=="Microsoft Internet Explorer") {
                    back = "progid:DXImageTransform.Microsoft.Gradient(startColorstr="+this.backgroundColor+", endColorstr="+this.backgroundColorEnd+")";
                    console.log("setting style.filter="+back);
                    div.style.filter = back;
                }
            }

            this.labelFontStr = '';

            if( this.labelStyle && this.labelStyle != 'PLAIN') {
                this.labelFontStr += this.labelStyle + " ";
            }
            this.labelFontStr += this.labelSize+"pt ";
            if( this.labelFontFamily && this.labelFontFamily != 'Default') { // TODO localize this?
                this.labelFontStr += this.labelFontFamily;
            } else {
                this.labelFontStr += "Arial";
            }

            this.processData();

            this.highlights = [];

            this.resize();
        };

        this.resize = function() {

            if( this.debug ) console.log('pentaho.viz.Trellis.resize()');

            var localThis = this;

            /* Size parameters. */
            var padding = 30;
            var w = this.getClientWidth() - (2*this.sideMargin) - (padding*this.measures.length) - this.legendWidth;
            var h = this.getClientHeight() - (2*this.topMargin) - (padding*this.measures.length);

            var minSize = Math.min( w, h );
            var size = (minSize)/this.measures.length;

            w = ((size + padding) * this.measures.length) + 2*this.sideMargin + this.legendWidth;
            h = ((size + padding) * this.measures.length) + 2*this.topMargin;

            /* Scales for color and position. */

            pv.data = {};
            pv.data.dataObj = this.dataObj

            while(this.element.firstChild) {
                this.element.removeChild(this.element.firstChild);
            }

            var grey = pv.rgb(144, 144, 144, .2);

            var position = pv.dict(this.measures, function(t) {
                    return pv.Scale.linear(pv.data.dataObj, function(d) { return d[t] })
                    .range(0, size) });

            this.position = position;
            this.size = size;

            var center = document.createElement('CENTER');
            this.element.appendChild(center);

            if( this.debug ) console.log('creating main panel');
            /* Root panel. */
            var vis = new pv.Panel()
                .width(w)
                .height(h)
                .left(((this.getClientWidth() - w)/2))
                .top(((this.getClientHeight() - h)/2))
                .canvas(center);

            this.rootPanel = vis;

            vis['measures'] = this.measures;
            vis['sideMargin'] = this.sideMargin;
            vis['topMargin'] = this.topMargin;
            vis['legendWidth'] = this.legendWidth;
            vis['labelSize'] = this.labelSize;
            vis['colorFunc'] = this.getColor;
            vis['viz'] = this;

            if( this.debug ) console.log('creating cells');
            /* One cell per trait pair. */
            var cell = vis.add(pv.Panel)
                .data(this.measures)
                .top(function() { return (this.parent.topMargin) + this.index * (size + padding) + padding / 2; } )
                .height(size)
              .add(pv.Panel)
                .data(function(y) { return this.parent.parent.measures.map(function(x) { return ({px:x, py:y}); } ); } )
                .left(function() { return (this.parent.parent.sideMargin + this.parent.parent.legendWidth) + this.index * (size + padding) + padding / 2; } )
                .width(size);

            var legend = vis.add(pv.Panel)
                .width(this.legendWidth)
                .height(h)
                .left(0)
                .right(0);

            if( this.debug ) console.log('creating diagonal');

            var tipOptions = {
              delayIn: 200,
              delayOut:80,
              offset:  2,
              html:    true,
              gravity: "nw",
              fade:    false,
              followMouse: true,
              corners: true,
              arrow:   false,
              opacity: 1
            };

            /* Framed dot plots not along the diagonal. */
            var plot = cell.add(pv.Panel)
                .visible(function(t) { return t.px != t.py; } )
                .strokeStyle("#aaa");

            plot.sideMargin = this.sideMargin;

            /* X-axis ticks. */
            if( this.debug ) console.log('creating x-axis');
            var xtick = plot.add(pv.Rule)
                .data(function(t) { return position[t.px].ticks(5) } )
                .left(function(d, t) { return position[t.px](d) })
                .strokeStyle("#eee");

            /* Bottom label. */
            if( this.debug ) console.log('creating bottom label');
            xtick.anchor("bottom").add(pv.Label)
                .visible(function() { return (cell.parent.index == cell.parent.parent.measures.length - 1); } )
                .text(function(d, t) { return position[t.px].tickFormat(d); } )
                .textStyle(this.labelColor)
                .textAlign("right")
                .textAngle(-Math.PI/4)
                .font(this.labelFontStr);

            /* Top label. */
            if( this.debug ) console.log('creating top label');
            xtick.anchor("top").add(pv.Label)
                .visible(function() { return (cell.parent.index == 0); } )
                .text(function(d, t) { return position[t.px].tickFormat(d) } )
                .textStyle(this.labelColor)
                .textAlign("left")
                .textAngle(-Math.PI/4)
                .font(this.labelFontStr);

            /* Y-axis ticks. */
            if( this.debug ) console.log('creating y-axis ticks');
            var ytick = plot.add(pv.Rule)
                .data(function(t) { return position[t.py].ticks(5); } )
                .bottom(function(d, t) { return position[t.py](d); } )
                .strokeStyle("#eee");

            /* Left label. */
            if( this.debug ) console.log('creating left label');
            ytick.anchor("left").add(pv.Label)
                .visible(function() { return (cell.index == 0) } )
                .text(function(d, t) { return position[t.py].tickFormat(d); } )
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            /* Right label. */
            if( this.debug ) console.log('creating right label');
            ytick.anchor("right").add(pv.Label)
                .visible(function() { return (cell.index == cell.parent.parent.measures.length - 1); } )
                .text(function(d, t) { return position[t.py].tickFormat(d); } )
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            /* Frame and dot plot. */
            if( this.debug ) console.log('creating dot plots');
            this.dot = plot.add(pv.Dot)
                .data(this.dataObj)
                .left(function(d, t) { return position[t.px](d[t.px]); } )
                .bottom(function(d, t) { return position[t.py](d[t.py]); } )
                .shapeSize(10)
                .strokeStyle(null)
                .fillStyle(function(d) {
                    var s = localThis.s;
                    var unselected = s &&
                        ((d[s.px] < s.x1) || (d[s.px] > s.x2) ||
                         (d[s.py] < s.y1) || (d[s.py] > s.y2));
                    this.root.viz.highlights[d.rowIdx] = !unselected;
                    return unselected ? grey : this.root.colorFunc(d);
                } )
                ;

            /* Interaction: new selection and display and drag selection */
            if( this.debug ) console.log('creating selection panels');
            plot.add(pv.Panel)
               .data([{x:20, y:20, dx:100, dy:100}])
               .fillStyle("rgba(0,0,0,.05)")
               .cursor("crosshair")
               .events("all")
               .event("mousedown", pv.Behavior.select())
               .event("selectstart", function() {
                    this.root.viz.clearHighlights;
                    this.root.viz.update; // TODO: <--- What's this? Missing parenthesis?
                    localThis.s = null;
                    return vis;
                } )
               .event("select", lang.hitch( this, this.update ) )
             .add(pv.Bar)
               .visible(function(d, k, t) {
                    var s = localThis.s;
                    return s && s.px == t.px && s.py == t.py;
                } )
               .left(function(d) { return d.x; } )
               .top(function(d) { return d.y; } )
               .width(function(d) { return d.dx; } )
               .height(function(d) { return d.dy; } )
               .fillStyle("rgba(0,0,0,.15)")
               .strokeStyle("white")
               .cursor("move")
               .event("mousedown", pv.Behavior.drag())
               .event("drag", lang.hitch( this, this.update ) );

            /* Labels along the diagonal. */
            if( this.debug ) console.log('creating diagonal labels');
            cell.anchor("center").add(pv.Label)
                .visible(function(t) { return t.px == t.py; } )
                .textStyle(this.labelColor)
                .font(this.labelFontStr)
                .text(function(t) { return t.px.replace(/([WL])/, " $1").toLowerCase(); } );

            /* Legend. */
            if( this.debug ) console.log('creating legend');
            vis.add(pv.Dot)
                .data(this.colorBy)
                .top(function() { return 25 + this.index * (this.parent.labelSize * 1.8 ); } )
                .left( 10 )
                .shapeSize(20)
                .strokeStyle(null)
                .fillStyle(function(d) { return this.parent.colorFunc(d); })
                .font(this.labelFontStr)
              .anchor("right").add(pv.Label)
              .textStyle(this.labelColor)
                .font(this.labelFontStr);

            var center = document.createElement('CENTER');
            this.element.appendChild(center);
            var table = document.createElement('TABLE');
            center.appendChild(table);
            if( this.showTable ) {
                vizUtil.createSelectionTable( table, this.dataTable, this.labelFontStr, this.labelColor);
            }

            if( this.debug ) console.log('rendering');
            vis.render();

        }

        this.getColor = function( d ) {

            if( this.viz.paletteMap && d.colorByLabel ) {
                return this.viz.paletteMap[d.colorByLabel];
            }
            else if( this.viz.paletteMap && this.viz.paletteMap[d] ) {
                return this.viz.paletteMap[d]
            } else {
                return pentaho.palettes[this.viz.paletteNo].colors[0];
            }
            return;

            var colors = pentaho.palettes[this.viz.paletteNo].colors;
            return colors[d % colors.length];
        };

        /* Compute new index values, rescale if needed, and render.
        this.update = function() {
            if( this.debug ) console.log('pentaho.viz.Trellis.update()');

        }
        */

        this.init = function() {

            if( this.debug ) console.log('pentaho.viz.Trellis.init()');
            this.allStr = pentaho.common.Messages.getString('all');

            this.svgDiv = document.createElement('DIV');
            this.element.appendChild( this.svgDiv );
            this.svgDiv.id = "svgDiv";
            this.svgDiv.style.position="absolute";
            this.svgDiv.style.top="0px";
            this.svgDiv.style.left="0px";
            this.svgDiv.style.width="100%";
            this.svgDiv.style.height="100%";
            this.svgDiv.style.textAlign="left";
            if( this.debug ) console.log('pentaho.viz.Trellis.done()');
        };

        this.processData = function() {

            this.rowsCols = [];
            this.colorByCol = -1;
            this.measuresCols = [];
            this.measures = [];

            for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
                var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
                if(dataReq) {
                    for (var idx=0; idx < dataReq.length; idx++) {
                        if( dataReq[idx].id == 'cols' ) {
                            this.rowsCols.push( colNo );
                        }
                        else if( dataReq[idx].id == 'measures' ) {
                            this.measuresCols.push( colNo );
                            this.measures.push( this.dataTable.getColumnLabel( colNo ) );
                        }
                        else if( dataReq[idx].id == 'colorby' ) {
                            this.colorByCol = colNo;
                        }
                    }
                }
            }
            if( this.colorByCol != -1 ) {
                this.colorBy = this.dataTable.getDistinctFormattedValues(this.colorByCol)
                var metrics = this.options.metrics[this.colorByCol];
                this.paletteMap = metrics.paletteMap;
            } else {
                this.colorBy = [this.allStr];
            }
            this.dataObj = [];
            // create the data object
            for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
                var obj = {
                };
                if( this.colorByCol != -1 ) {
                    obj.colorBy = this.dataTable.getValue( rowNo, this.colorByCol);
                    obj.colorByLabel = this.dataTable.getFormattedValue( rowNo, this.colorByCol);
                } else {
                    obj.colorBy = this.allStr;
                    obj.colorByLabel = this.allStr;
                }
                for( var idx=0; idx<this.measuresCols.length; idx++ ) {
                    obj[this.measures[idx]] = this.dataTable.getValue( rowNo, this.measuresCols[idx] );
                }
                obj['rowIdx'] = rowNo;
                this.dataObj.push( obj );
            }

        }

        this.getClientWidth = function() {
          return this.element.offsetWidth;
        };

        this.getClientHeight = function() {
          return this.element.offsetHeight;
        };

        /* Interaction: update selection. */
        this.update = function(d, t) {
            var s = this.s = d;
            s.px = t.px;
            s.py = t.py;
            s.x1 = this.position[t.px].invert(d.x);
            s.x2 = this.position[t.px].invert(d.x + d.dx);
            s.y1 = this.position[t.py].invert(this.size - d.y - d.dy);
            s.y2 = this.position[t.py].invert(this.size - d.y);
            this.dot.context(null, 0, function() { this.render() });

            var table = document.getElementById('datalist');

            if( this.showTable ) {
                var rows = [];
                for( var idx=0; idx<this.highlights.length; idx++ ) {
                    if( this.highlights[idx] ) {
                        rows.push( { rowIdx: idx } );
                    }
                    console.log( this.highlights );
                }
                vizUtil.updateSelectionTable( table, this.dataTable, rows, this.labelFontStr, this.labelColor );
            }
        };

        this.init();
    };

    return pentaho.viz.Trellis;
} );
