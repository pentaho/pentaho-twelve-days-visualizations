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
    'cdf/lib/CCC/protovis',
    'cdf/lib/CCC/protovis-msie'
], function(vizUtil, pv) {

    pentaho.viz.Index = function( div ) {

        this.debug = false;

        if( this.debug ) console.log('pentaho.viz.Index.create');

        // Visualization API fields
        this.vizId = null;
        this.controller = null;
        this.id = null;
        this.elementId = div.id;
        this.element = div

        this.leftMargin = 80;
        this.rightMargin = 100;
        this.bottomMargin = 100;
        this.topMargin = 50;
        this.totalMarginWidth = this.leftMargin+this.rightMargin;
        this.totalMarginHeight = this.topMargin+this.bottomMargin;
        this.data = [];
        this.dataCount = 0;
        this.labelColor = "#000000";
        this.w = 200;
        this.h = 200;
        this.rescale = true;
        this.plotAreaColor = "rgba(240,240,240,";
        this.vis = null;
        this.backgroundColor = "rgba(255,255,255,";
        this.opacity = 0;
        this.S = 1;
        this.x = pv.Scale.linear(0,this.S-1).range(0,this.w);
        this.x2 = pv.Scale.linear(0,this.S-1).range(this.leftMargin,this.w-this.totalMarginWidth);
        this.y = pv.Scale.linear(-1,1).range(0,this.h);
        this.rootPanel = null;
        this.paletteNo = 0;
        this.pixelsPerLabel = 25;
        this.fy = function(d) { return d.price; }; // y-axis value
        this.fx = function(d) { return d.index; };  // x-axis value
        this.maxLabelLength = 100;
        this.yAxisLabel = 'Realtive Change';
        this.titleBase = 'Comparison for:';

        // return the state of this visualization for persistance/back-one etc
        this.getState = function() {
            if( this.debug ) console.log('pentaho.viz.Trellis.getState()');
            var state = {
                rightMargin: this.rightMargin,
                bottomMargin: this.bottomMargin
            };
            return state;
        };

        // sets the state of the visualization - called when a visualization is loaded
        this.setState = function(state) {
            if( this.debug ) console.log('pentaho.viz.Trellis.setState()');
            this.rightMargin  = state.rightMargin;
            this.bottomMargin = state.bottomMargin;
        };

        this.bottommarginChanged = function( value ) {
            this.options.bottomMargin = value;
            this.draw( this.dataTable, this.options );
            return true;
        };

        this.rightmarginChanged = function( value ) {
            this.options.rightMargin = value;
            this.draw( this.dataTable, this.options );
            return true;
        };


        this.draw = function( dataTable, options ) {
            if( this.debug ) console.log('pentaho.viz.Index.draw()');
            this.dataTable = dataTable;
            this.options = options;

            vizUtil.handleCommonOptions( this, options );

            vizUtil.applyBackground(this.element, options);

            if( options ) {
                if( options.bottomMargin ) {
                    this.bottomMargin = options.bottomMargin;
                    this.totalMarginHeight = this.topMargin+this.bottomMargin;
                }
                if( options.rightMargin ) {
                    this.rightMargin = options.rightMargin;
                    this.totalMarginWidth = this.leftMargin+this.rightMargin;
                }
            }

            // check the controller current visualizations arguments (set by the properties panel)
            if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
                if( typeof this.controller.currentViz.args.rightmargin == 'number' ) {
                    this.rightMargin = this.controller.currentViz.args.rightmargin * 2;
                    this.options.rightMargin = this.rightMargin;
                    this.totalMarginWidth = this.leftMargin+this.rightMargin;
                }
                if( typeof this.controller.currentViz.args.bottommargin == 'number' ) {
                    this.bottomMargin = this.controller.currentViz.args.bottommargin * 2;
                    this.totalMarginHeight = this.topMargin+this.bottomMargin;
                }
            }

            this.seriesNames = dataTable.getDistinctFormattedValues(1);
            this.categoryNames = dataTable.getDistinctFormattedValues(0);

            var seriesMap = {};
            for( var idx=0; idx<this.seriesNames.length; idx++) {
                seriesMap[this.seriesNames[idx]] = idx;
            }
            var categoryMap = {};
            for( var idx=0; idx<this.categoryNames.length; idx++) {
                categoryMap[this.categoryNames[idx]] = idx;
            }
            this.S = this.categoryNames.length;

            this.dataGrid = new Array(this.seriesNames.length);
            for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
                var series = this.dataTable.getFormattedValue(rowNo,1);
                var category = this.dataTable.getFormattedValue(rowNo,0);
                var seriesNo = seriesMap[series];
                var categoryNo = categoryMap[category];
                var arr = this.dataGrid[seriesNo];
                if(!arr) {
                    arr = new Array(this.categoryNames.length);
                    for( var n=0; n<this.categoryNames.length; n++ ) {
                        arr[n] = null;
                    }
                    this.dataGrid[seriesNo] = arr;
                }
                var value = this.dataTable.getValue(rowNo,2);
                arr[categoryNo] = value;
            }
            // remove any rows with nulls - cannot compute the % values
            this.dataObj = {
                "Category" : {
                    "values": this.categoryNames
                }
            };

            for( var idx=0; idx<this.seriesNames.length; idx++ ) {
                this.dataObj[this.seriesNames[idx]] = {
                    "values": this.dataGrid[idx]
                };
            }

            this.w = vizUtil.getClientWidth(this);
            this.h = vizUtil.getClientHeight(this);
            this.S = this.categoryNames.length;
            this.idx = Math.floor(this.S/2) - 1;
            this.x = pv.Scale.linear(0,this.S-1).range(0,this.w-this.totalMarginWidth);
            this.x2 = pv.Scale.linear(0,this.S-1).range(0,this.w-this.totalMarginWidth);
            this.y = pv.Scale.linear(-10,10).range(0,this.h);

            this.init();
            this.resize();
        }

        this.resize = function(width, height)  {

            if( this.debug ) console.log('pentaho.viz.Index.resize()');

            this.w = vizUtil.getClientWidth(this);
            this.h = vizUtil.getClientHeight(this);
            this.S = this.categoryNames.length;
            this.idx = Math.floor(this.S/2) - 1;
            this.x2 = pv.Scale.linear(0,this.S-1).range(0,this.w-this.totalMarginWidth);

            this.rootPanel.width(this.w);
            this.rootPanel.height(this.h);
            this.rootPanel.render();

            this.vis.width(this.w-this.totalMarginWidth);
            this.vis.height(this.h-this.totalMarginHeight);
            this.y.range(0,this.h-this.totalMarginHeight);
            this.x.range(0,this.w-this.totalMarginWidth);
            visRule.left(this.x);

            var labelCount = this.categoryNames.length;
            if( (this.w / labelCount) < this.pixelsPerLabel ) {
                labelCount = Math.floor(this.w/this.pixelsPerLabel);
            }
            var localThis = this;

            visRule.data(function () { return localThis.x.ticks(labelCount); })

             this.update();
        }

        /* Compute new index values, rescale if needed, and render. */
        this.update = function() {

            if( this.debug ) console.log('pentaho.viz.Index.update()');

            for(prop in this.dataObj) {
                this.dataCount = this.dataObj[prop].values.length;
            }
            this.data = this.indexify(this.dataObj, this.seriesNames, this.idx);
            var min, max;
            var localThis = this;
            if (this.rescale) {
              min = pv.min(this.data.map(function(d) { return pv.min(d.values, localThis.fy); }));
              max = pv.max(this.data.map(function(d) { return pv.max(d.values, localThis.fy); }));
            }
            this.y.domain(min, max);
    //        if( this.debug ) console.log('pentaho.viz.Index.update() rendering');
            this.vis.render();
        }

        /* Normalize the data according to an index point. */
        this.indexify = function(data, cols, idx) {
            if( this.debug ) console.log('pentaho.viz.Index.indexing()');
            var localThis = this;
            try {
                var result = [data.length];
                for( var sNo=0; sNo<this.seriesNames.length; sNo++ ) {
                    var c = this.seriesNames[sNo];
                    var v = data[c].values[idx];
                    var values = new Array(data[c].values.length);
                    for( var vNo=0; vNo<values.length; vNo++ ) {
                        var d = data[c].values[vNo];
                        values[vNo] = {
                            index: vNo,
                            price: (v == null) ? 0 : ((d-v)/v)
                        }
                    }
                    result[sNo] = {
                        series: c,
                        hidden: v == null,
                        values: values
                    }
                }
                return result;

            } catch (e) {
                console.log('pentaho.viz.Index.indexing error: '+e.message);
            }
            if( this.debug ) console.log('pentaho.viz.Index.indexing() done');
        };

        this.init = function() {

            if( this.debug ) console.log('pentaho.viz.Index.init()');
            localThis = this;

            var n = 0;
            for( var idx=0; idx<this.seriesNames.length; idx++ ) {
                n = Math.max(this.seriesNames[idx].length,n);
            }
            this.maxLabelLength = n*6;
            if( typeof this.options.rightMargin == 'number' ) {
            } else {
                this.rightMargin = Math.min(this.maxLabelLength,200);
            }
            this.totalMarginWidth = this.leftMargin+this.rightMargin;

            /* The visualization panel. Stores the active index. */
            this.rootPanel = new pv.Panel()
                .left(0)
                .right(0)
                .top(0)
                .bottom(0)
                .width(this.w)
                .height(this.h)
                .canvas(this.svgDiv);

    /*
            if( this.backgroundColor && this.backgroundColor != "" ) {
                if( this.backgroundColor.indexOf( 'rgba' ) == 0 ) {
                    this.rootPanel.fillStyle(this.backgroundColor+this.opacity+")");
                } else {
                    this.rootPanel.fillStyle(this.backgroundColor);
                }
            }
    */
            /* the plot area */
            this.vis = this.rootPanel.add(pv.Panel);

            this.vis['categoryNames'] = this.categoryNames;
            this.vis['titleBase'] = this.titleBase;
            this.rootPanel['seriesNames'] = this.seriesNames;

            var labelFontStr = '';
            var titleFontStr = '';

            if( this.labelStyle && this.labelStyle != 'PLAIN') {
                labelFontStr += this.labelStyle + " ";
                titleFontStr += this.labelStyle + " ";
            }
            labelFontStr += this.labelSize+"pt ";
            titleFontStr += Math.min(30,this.labelSize * 2)+"pt ";
            if( this.labelFontFamily && this.labelFontFamily != 'Default') { // TODO localize this?
                labelFontStr += this.labelFontFamily;
                titleFontStr += this.labelFontFamily;
            } else {
                labelFontStr += "Arial";
                titleFontStr += "Arial";
            }

            this.vis.def("i", -1)
                .left(this.leftMargin)
                .right(this.rightMargin)
                .top(this.topMargin)
                .bottom(this.bottomMargin)
                .width(this.w)
                .height(this.h)
                .canvas(this.element);

            if( this.plotAreaColor && this.plotAreaColor != "" ) {
                if( this.plotAreaColor.indexOf( 'rgba' ) == 0 ) {
                    this.vis.fillStyle(this.plotAreaColor+(1-(1-this.opacity)/3)+")");
                } else {
                    this.vis.fillStyle(this.plotAreaColor);
                }
            }

            /* Horizontal gridlines showing %-change. */
            this.vis.add(pv.Rule)
                .data(function() { return localThis.y.ticks(10); })
                .bottom(localThis.y)
                .strokeStyle(function(d) { return d==0 ? "black" : "#cccccc"; } )
                .anchor("left").add(pv.Label)
                .text(function(d) { return (d * 100).toFixed(0) + "%"; })
                .textStyle(this.labelColor)
                .font(labelFontStr);

            /* Bottom axis */
            visRule = this.vis.add(pv.Rule);
            visRule.categoryNames = this.categoryNames;
            visRule.data(function () { return localThis.x.ticks(); })
                .left(localThis.x2)
                .strokeStyle(function(d) { return "none"; })
                .bottom(0)
                .anchor("bottom")
                .add(pv.Label)
                .text(function(d) { return this.parent.categoryNames[d]; } )
                .textAlign("right")
                .textAngle(-Math.PI/4)
                .textStyle(this.labelColor)
                .font(this.labelFontStr);


            /* Y-axis label */
            this.vis.add(pv.Label)
                .text(this.yAxisLabel)
                .left(-this.leftMargin+25)
                .top(this.topMargin)
                .textAlign("center")
                .textAngle(-Math.PI/2)
                .textStyle(this.labelColor)
                .font(labelFontStr);

            this.vis.add(pv.Label)
                .text(function() { return this.parent.titleBase+" "+this.parent.categoryNames[localThis.idx]; } )
                .left(0)
                .top(-5)
                .textAlign("left")
                .textStyle(this.labelColor)
                .font(titleFontStr);

            /* Stock lines. */
            this.vis.add(pv.Panel)
                .data(function() { return localThis.data; } )
                .bottom(0)
                .height(0)
              .add(pv.Line)
                .data(function(d) { return d.values; } )
                .strokeStyle(function(d) { return pentaho.palettes[localThis.paletteNo].colors[this.parent.index]; })
                .visible(function() { return !localThis.data[this.parent.index].hidden })
                .left(this.x.by(this.fx))
                .bottom(this.y.by(this.fy))
                .lineWidth(2)
              .add(pv.Label)
                .visible(function() { return this.index == localThis.S-1 && !localThis.data[this.parent.index].hidden })
                .textBaseline("middle")
                .textMargin(6)
                .text(function() { return localThis.data[this.parent.index].series; } )
                .textStyle(this.labelColor)
                .font(labelFontStr);

            /* Current index line. */
            this.vis.add(pv.Rule)
                .visible(function() { return localThis.idx >= 0 && localThis.idx != localThis.vis.i(); } )
                .left(function() { return localThis.x(localThis.idx); } )
                .top(0)
                .bottom(0)
                .lineWidth(2)
                .strokeStyle(this.labelColor);

            /* A legend entry for each person. */
            this.rootPanel.add(pv.Dot)
                .data(function() { return this.parent.seriesNames; } )
                    .left(this.leftMargin+10)
                    .top(function(d) { return localThis.topMargin + 10 + this.index*25; } )
                    .fillStyle(function(d) { return pentaho.palettes[localThis.paletteNo].colors[this.index]; } )
                    .strokeStyle(null)
                    .anchor("right")
                    .add(pv.Label)
                    .text(function(d) { return d; } )
                    .textStyle(this.labelColor)
                    .font(labelFontStr);

            /* An invisible bar to capture events (without flickering). */
            this.vis.add(pv.Panel)
                .events("all")
                .fillStyle("rgba(127,127,127,0.00001)") // (almost) invisible
                .event("mousemove", function() {
                    if( this.debug ) console.log('pentaho.viz.Index mousemove');
                    localThis.idx = localThis.x.invert(localThis.vis.mouse().x+((localThis.w-localThis.totalMarginWidth)/(localThis.categoryNames.length-1)/2)) >> 0;
                    localThis.update();
                });

        };

        this.onCreate = function() {
            if( this.debug ) console.log('pentaho.viz.Index.onCreate()');
            this.yAxisLabel = pentaho.common.Messages.getString('yaxisTitle');
            this.titleBase = pentaho.common.Messages.getString('titleBase');

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

        this.onCreate();

    };

    return pentaho.viz.Index;
} );