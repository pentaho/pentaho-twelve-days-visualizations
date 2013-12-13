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
    'cdf/lib/CCC/protovis-msie',
    'cdf/lib/CCC/tipsy'
], function(vizUtil, pv) {

    pentaho.viz.Distribution = function( div ) {

        this.debug = false;

        if( this.debug ) console.log('pentaho.viz.Distribution.create');

        // Visualization API fields
        this.vizId = null;
        this.controller = null;
        this.id = null;
        this.elementId = div.id;
        this.element = div
        this.paletteNo = 0;

        // fields for this visualization
        this.labelColor = "#ffffff";
        this.w = 200;   // width
        this.h = 200;   // height
        this.rootPanel = null;  // the base Protovis panel
        this.data = []; // the data set for this visualization
        this.highLightsSet = false; // are any data elements highlighted?
        this.highlights = [];       // array of booleans, one per data row,

        // Clear out the highlights array and reset highLightsSet
        this.clearHighlights = function() {
            if( this.debug ) console.log('pentaho.viz.Distribution.clearHighlights()');
            this.highlights = [];
            var n = this.dataTable ? this.dataTable.getNumberOfRows() : this.highlights.length;
            for( var idx=0; idx<n; idx++ ) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        // this is called when we need to update the highlights that are set
        this.setHighlights = function(lights) {
            if( this.debug ) console.log('pentaho.viz.Distribution.setHighlights()');
            if( !lights || lights.length == 0 ) {
                this.clearHighlights();
                this.highlight();
            }
        };

        // Check to see if we need to set the highLightsSet flag and then render the base panel
        this.highlight = function() {
            if( this.debug ) console.log('pentaho.viz.Distribution.highlight()');
            this.highLightsSet = false;
            for( var idx=0; idx<this.highlights.length; idx++ ) {
                if( this.highlights[idx] ) {
                    this.highLightsSet = true;
                    break;
                }
            }
            this.rootPanel.render();
        };

        // return the state of this visualization for persistance/back-one etc
        this.getState = function() {
            if( this.debug ) console.log('pentaho.viz.Distribution.getState()');
            var state = {
                    colorMode: this.colorMode,
                    scalingType: this.scalingType,
                    pattern: this.pattern,
                    colorSet: this.colorSet
            };
            return state;
        };

        this.setState = function(state) {
            if( this.debug ) console.log('pentaho.viz.Distribution.setState()');
            this.colorMode = state.colorMode;
            this.scalingType = state.scalingType;
            this.pattern = state.pattern;
            this.colorSet = state.colorSet;
        };

        this.draw = function( dataTable, options ) {
            if( this.debug ) console.log('pentaho.viz.Distribution.draw()');
            this.dataTable = dataTable;
            this.options = options;
            this.clearHighlights();
            this.sortChange = false;

            console.log(options);

            vizUtil.handleCommonOptions( this, options );

            vizUtil.setupColorRanges(this);

            vizUtil.applyBackground(this.element, options);

            this.processData();

            this.resize();
        };

        this.resize = function() {

            if( this.debug ) console.log('pentaho.viz.Distribution.resize()');

            /* Size parameters. */
            this.w = vizUtil.getClientWidth(this)-40;
            this.h = vizUtil.getClientHeight(this)-40;

            // get the min and max values of the measure so we can create a range
            var min = this.options.metrics[this.measuresCols[0]].range.min;
            var max = this.options.metrics[this.measuresCols[0]].range.max;

            // these are the default options for tooltips
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

            this.scaleY = pv.Scale.linear(min, max).range(0, this.h-60) // create a linear scale with a 20px margin

            /* Root panel. */
            if( this.debug ) console.log('resizing main panel', this.rootPanel);
            this.rootPanel = new pv.Panel()
                .width(this.w)
                .height(this.h)
                .left(0)
                .top(0)
                .canvas(this.svgDiv);

            // give the root panel a way to get back to this object
            this.rootPanel.vis = this;
            // select the color palette
            this.colors = pentaho.palettes[this.paletteNo].colors;

            if( this.debug ) console.log('adding Distribution layout');

            this.barWidth = this.w/this.data.length;
            this.spacing = 5;
            this.barWidth = this.barWidth-this.spacing;
            if( this.barWidth < 5 ) {
                this.barWidth = 5;
            }

            this.outlierMin = null;
            this.outlierMax = null;
            if( this.average && this.bucketSize && this.stdDev ) {

                this.outlierMin = (this.average-this.stdDev*3)/this.bucketSize;
                this.outlierMax = (this.average+this.stdDev*3)/this.bucketSize;

                console.log(this);

                this.rootPanel.add(pv.Bar)
                    .data([
                        {'left':this.average/this.bucketSize, color: '#aaaaff'},
                        {'left':(this.average-this.stdDev)/this.bucketSize, color: '#aaaaff'},
                        {'left':(this.average-this.stdDev*2)/this.bucketSize, color: '#ccccff'},
                        {'left':(this.average+this.stdDev)/this.bucketSize, color: '#ccccff'},
                        {'left':(this.average-this.stdDev*3)/this.bucketSize, color: '#eeeeff'},
                        {'left':(this.average+this.stdDev*2)/this.bucketSize, color: '#eeeeff'}
                    ])
                    .width( (this.stdDev/this.bucketSize) * ( this.barWidth + this.spacing ) )
                    .left( function(d) {
                        // use the index of the bar to define the y coord of the bar so they will go down the screen
                        return (d.left+1) * ( this.root.vis.barWidth + this.root.vis.spacing );
                    } )
                    .height(this.h-40)
                    .top(20)
                    .fillStyle(function(d) { return d.color; });

            }

            // create some bars
            var bars = this.rootPanel.add(pv.Bar)
                .data( this.data )
                .width( this.barWidth )   // the height of each bar
                .left( function() {
                    // use the index of the bar to define the y coord of the bar so they will go down the screen
                    return (1 + this.index) * ( this.root.vis.barWidth + this.root.vis.spacing );
                } )
                .height( function(d) {
                    // use the value of this data obejct to define the width of the bar
                    return this.root.vis.scaleY(d.value);
                }  )
                .top( function(d) { return this.root.vis.h-20-this.root.vis.scaleY(d.value) } ) // left padding
                .fillStyle( function() {
                    var colors = this.root.vis.colors; // use the root panel to get to the visualization object
                    if( this.index < this.root.vis.outlierMin ) {
                        return colors[2];
                    }
                    if( this.index > this.root.vis.outlierMax ) {
                        return colors[2];
                    }
                    return colors[0];
                } )
                .title( function(){ return "";} ) // Prevent browser tooltip
                .text(function(d){
                    // use the tooltip attribute of the data object
                    return d.tooltip;
                })
                .events("all")
                .event('mousemove', pv.Behavior.tipsy(tipOptions) ) // enable hover tips
            ;

            if( this.average && this.bucketSize ) {

                this.rootPanel.add(pv.Bar)
                    .data([{'average':this.average/this.bucketSize}])
                    .width( 3 )
                    .left( function(d) {
                        // use the index of the bar to define the y coord of the bar so they will go down the screen
                        return (d.average+1) * ( this.root.vis.barWidth + this.root.vis.spacing );
                    } )
                    .height(this.h+20)
                    .top(0)
                    .fillStyle('#000000');

            }

            this.rootPanel.add(pv.Rule)
                .bottom(20);

            this.rootPanel.add(pv.Rule)
                .left(20);

            this.rootPanel.add(pv.Rule)
                .data(function() { return this.root.vis.scaleY.ticks(7)})
                .bottom(this.scaleY)
                .strokeStyle(function(d) { return d ? "#aaa" : "#000" })
              .anchor("left").add(pv.Label)
                .text(this.scaleY.tickFormat)
                .textStyle(this.labelColor)
                .font(this.labelFontStr)
                ;

            if( this.debug ) console.log('rendering');
            this.rootPanel.render();

        };

        this.init = function() {

            if( this.debug ) console.log('pentaho.viz.Distribution.init()');
            // create a DIV to hold the SVG
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

        this.processData = function() {

            if( this.debug ) console.log('pentaho.viz.Distribution.processData()');
            // setup internal data structures based on the data table

            this.measuresCols = [];
            this.rowsCols = [];
            this.data = [];

            // for this sample we will grab the first row data and the first measure

            for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
                var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
                if(dataReq) {
                    for (var idx=0; idx < dataReq.length; idx++) {
                        if( dataReq[idx].id == 'cols' ) { // this matches the id in the data req definition (circa line 56)
                            this.rowsCols.push( colNo );
                        }
                        else if( dataReq[idx].id == 'measures' ) { // this matches the id in the data req definition (circa line 63)
                            this.measuresCols.push( colNo );
                        }
                    }
                }
            }

            for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
                // get the nice name of the row header
                var item = this.dataTable.getFormattedValue( rowNo, this.rowsCols[0] );
                // get the raw value of the measure
                var value = this.dataTable.getValue( rowNo, this.measuresCols[0] );
                // get the formatted value of the measure ($ , . etc)
                var fmtValue = this.dataTable.getFormattedValue( rowNo, this.measuresCols[0] );
                // create a tooltip
                if( item == "Average" ) {
                    this.average = value;
                }
                else if(item == "StdDev") {
                    this.stdDev = value;
                }
                else if(item == "Bucket Size") {
                    this.bucketSize = value;
                }
                else {
                    var tooltip = this.dataTable.getColumnLabel( this.rowsCols[0] ) + ": " + item + "</br>" +
                                  this.dataTable.getColumnLabel( this.measuresCols[0] ) + ": " + fmtValue
                    // create an obect to hold the values
                    var data = {
                        value: value,
                        fmtValue: fmtValue,
                        item: item,
                        tooltip: tooltip
                    }
                    // add the data obejct to the array
                    this.data.push( data );
                }

            }

            if( this.debug) console.log("data", this.data);

        }

        this.init();

        if( this.debug ) console.log('pentaho.viz.Distribution.create done');
    };

    return pentaho.viz.Distribution;
} );
