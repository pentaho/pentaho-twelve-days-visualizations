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
    '../VizController',
    'cdf/lib/CCC/protovis',
    'dojo/_base/lang',
    'cdf/lib/CCC/protovis-msie',
    'cdf/lib/CCC/tipsy'
], function(vizUtil, VizController, pv) {

    pentaho.viz.SunBurst = function( div ) {

        this.debug = false;

        if( this.debug ) console.log('pentaho.viz.SunBurst.create');

        // Visualization API fields
        this.vizId = null;
        this.controller = null;
        this.id = null;
        this.elementId = div.id;
        this.element = div;
        this.version = "1.0";

        this.labelColor = "#ffffff";
        this.lineColor = "#ffffff";
        this.w = 200;
        this.h = 200;
        this.rootPanel = null;
        this.allStr = "All";
        this.minValue;
        this.maxValue;
        this.colorMode = 'gradient';
        this.paletteNo = 0;
        this.highlights = [];
        this.highLightsSet = false;
        this.colorSet = 'ryg';
        this.colorRange = ["#ff0010","#fffc5a","#008028"];
        this.scalingType = "linear";
        this.sorted = false;
        this.sortChange = false;
        this.isIE = false;

        this.colorSetChanged = function(value) {
            this.colorSet = value;
            this.options.colorSet = value;
            this.draw( this.dataTable, this.options);
            return true;
        }

        this.patternChanged = function(value) {
            this.pattern = value;
            this.options.pattern = value;
            this.draw( this.dataTable, this.options);
            return true;
        }

        this.sortedChanged = function( value ) {
            this.sorted = value;
            this.options.sorted = value;
            this.sortChange = true;
            this.draw( this.dataTable, this.options);
            return true;
        }

        this.reverseColorsChanged = function( value ) {
            this.reverseColors = value;
            this.options.reverseColors = value;
            this.draw( this.dataTable, this.options);
            return true;
        }

        // These are the highlighting functions
        this.clearHighlights = function() {
            if( this.debug ) console.log('pentaho.viz.SunBurst.clearHighlights()');
            for( var idx=0; idx<this.highlights.length; idx++ ) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        this.setHighlights = function(lights) {
            if( this.debug ) console.log('pentaho.viz.SunBurst.setHighlights()');
            if( !lights || lights.length == 0 ) {
                this.clearHighlights();
                this.highlight();
            }
        };

        this.highlight = function() {
            if( this.debug ) console.log('pentaho.viz.SunBurst.highlight()');

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
            if( this.debug ) console.log('pentaho.viz.SunBurst.getState()');
            var state = {
                    colorMode: this.colorMode,
                    scalingType: this.scalingType,
                    pattern: this.pattern,
                    colorSet: this.colorSet
            };
            return state;
        };

        // sets the state of the visualization - called when a visualization is loaded
        this.setState = function(state) {
            if( this.debug ) console.log('pentaho.viz.SunBurst.setState()');
            this.colorMode = state.colorMode;
            this.scalingType = state.scalingType;
            this.pattern = state.pattern;
            this.colorSet = state.colorSet;
            this.setupColorRanges();
        };

        // this is called when the visualization needs to be drawn
        this.draw = function( dataTable, options ) {
            if( this.debug ) console.log('pentaho.viz.SunBurst.draw()');
            this.dataTable = dataTable;
            this.options = options;

            this.clearHighlights();
            this.sortChange = false;

            // check the controller current visualizations arguments (set by the properties panel)
            if( typeof options.sorted != "undefined" ) {
                    this.sorted = options.sorted;
            }
            if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
                if( typeof this.controller.currentViz.args.sorted != 'undefined' ) {
                    this.sorted = this.controller.currentViz.args.sorted;
                }
            }

            // handle fonts, background
            vizUtil.handleCommonOptions( this, options );

            // set up the color ranges
            vizUtil.setupColorRanges(this);

            // apply the background color/gradient
            vizUtil.applyBackground(this.element, options);

            // set up the data structures
            this.processData();

            // draw the visualization
            this.resize();
        };

        // for the specified node return the color to shade it in
        this.getColor = function(d) {
            // default to gray
            var color = pv.color("#cccccc");
            if( !d.parentNode ) {
                color = color.alpha(0);
                return color;
            }

            if( this.colorMode == 'top' ) {
                // color the node using the category/pie slice color
                if( d.meta && d.meta.color ) {
                    color = pv.color(d.meta.color);
                    if(this.highLightsSet && !this.highlights[d.meta.rowIdx]) {
                        // we are in highlight mode and this node is not highlighted, so fade it out
                        color = color.alpha(0.2);
                    }
                }

                if( typeof d.nodeValue != 'undefined' ) {
                    // calculate the color value
                    var scale = (d.nodeValue - this.minValue) / (this.maxValue-this.minValue);
                    if( this.reverseColors ) {
                        scale = 1 - scale;
                    }
                    // make it a +/- 20% color scale
                    scale = scale * 0.6 + 0.7;
                    // adjust the colors based on value
                    var rgb = color.rgb();
                    var r = Math.floor(Math.min( 255, rgb.r * scale ));
                    var g = Math.floor(Math.min( 255, rgb.g * scale ));
                    var b = Math.floor(Math.min( 255, rgb.b * scale ));
                    var a = color.opacity;
                    color = new pv.Color.Rgb(r, g, b, a);
                }
            }
            else if( this.colorMode == 'gradient' ) {
                // we are in graient mode
                if( typeof d.nodeValue == 'undefined' ) {
                    // we don't have a value to use
                    if( d.meta && d.meta.color ) {
                        color = pv.color(d.meta.color);
                        if(this.highLightsSet && !this.highlights[d.meta.rowIdx]) {
                            // we are in highlight mode and this node is not highlighted, so fade it out
                            color = color.alpha(0.2);
                        }
                    }
                    return color;
                }

                if(this.scalingType == "linear"){
                    // use a linear color gradient
                    color = vizUtil.getRgbGradientFromMultiColorHex( d.nodeValue, this.minValue, this.maxValue, this.colorRange);
                } else {
                    // use stepped color gradient
                    color = VizController.getRgbStepFromMultiColorHex( d.nodeValue, this.minValue, this.maxValue, this.colorRange);
                }
                if( color && color.indexOf && color.indexOf('RGB') == 0 ) {
                    var cols = color.split(',');
                    // convert the '#xxxxxx' color into a Protovis color
                    var r = parseInt( cols[0].substr(4) );
                    var g = parseInt( cols[1]);
                    var b = parseInt( cols[2].substr( 0, cols[2].length-1 ) );
                    color = new pv.Color.Rgb(r, g, b, 1);

                    if(this.highLightsSet && !this.highlights[d.meta.rowIdx]) {
                        // we are in highlight mode and this node is not highlighted, so fade it out
                        color = color.alpha(0.2);
                    }
                }
            }

            return color;
        }

        this.resize = function() {
            // draw the visualization the correct size

            if( this.debug ) console.log('pentaho.viz.SunBurst.resize()');

            // sort the data if necessary
            if( this.sortChange && this.partition ) {
                if( this.sorted ) {
                    this.partition.order("descending");
                    this.partition.render();
                    return;
                } else {
                    this.partition.order("none");
                    this.partition.render();
                }

            }

            // Current size parameters
            var w = vizUtil.getClientWidth(this);
            var h = vizUtil.getClientHeight(this);

            if( this.debug ) console.log('creating main panel');
            // Create the root panel.
            this.rootPanel = new pv.Panel()
                .width(w)
                .height(h)
                .left(0)
                .top(0)
                .canvas(this.svgDiv);

            this.rootPanel.vis = this;

            if( this.debug ) console.log('adding radial partition');

            // Create the radial partition
            this.partition = this.rootPanel.add(pv.Layout.Partition.Fill)
                .nodes(this.nodes)
                .size(function(d) { return d.nodeValue } )
                .orient("radial")
                ;
            if( this.sorted ) {
                this.partition.order("descending");
            } else {
                this.partition.order(null);
            }

            this.partition.vis = this;

            var tipOptions = {
              delayIn: 200,
              delayOut:80,
              offset:  2,
              html:    true,
              gravity: "nw",
              fade:    false,
              followMouse: true,
              corners: true,
              arrowVisible:   false,
              opacity: 1
            };

            // Add the wedges
            this.partition.node.add(pv.Wedge)
                .fillStyle(function(d) { return this.parent.vis.getColor(d); })
                .strokeStyle(function(d) { return d == this.parent.vis.mouseOverWedge ? "#000000" : this.parent.vis.lineColor; } )
                .lineWidth(function(d) { return d == this.parent.vis.mouseOverWedge ? 2 : 1; })
                .title( function(){ return "";} ) // Prevent browser tooltip
                .text(function(d){ return d && d.meta ? d.meta.tooltip : ""; })
                .events("all")
                .event('click', function(d) {
                    this.parent.vis.mouseClick(d);
                } )
                .event('mouseover', function(d) {
                    this.parent.vis.mouseMove(d);
                } )
                .event('mousemove', pv.Behavior.tipsy(tipOptions) )
                .event('mouseout', function(d) {
                    this.parent.vis.mouseOut(d);
                } );
                ;

            // Add the labels
            this.partition.label.add(pv.Label)
                .textStyle(this.labelColor)
                .font(this.labelFontStr)
                .visible(function(d) { return d.parentNode && (d.angle * d.outerRadius >= 6); });

            if( this.debug ) console.log('rendering');
            // Render the panel
            this.rootPanel.render();

        };

        this.mouseMove = function( d, t ) {
            if( this.debug ) console.log( "SunBurst mouseMove()", d );
            // store the node the mouse is over
            this.mouseOverWedge = d;
            // render the panel, and the node will provide a mouse over effect
            this.rootPanel.render();
        };

        this.mouseOut = function( d, t ) {
            if( this.debug ) console.log( "SunBurst mouseOut()", d );
            // null out the mouse-over info
            this.mouseOverWedge = null;
            // render the panel
            this.rootPanel.render();
        };

        this.mouseClick = function( source ) {
            if( this.debug ) console.log( "SunBurst mouseClick()", source );
            var targetNode = source;

            if( this.pendingSelection && this.pendingSelection.selections[0].rowIdx == targetNode.meta.rowIdx ) {
                // this is a double-click
                if( this.debug ) console.log('SunBurst double click');
                clearTimeout(this.doubleClickTimer);
                console.log(this.pendingSelection);
                this.pendingSelection.selections[0].rowId = targetNode.meta.rowId;
                this.pendingSelection.selections[0].rowItem = targetNode.meta.rowItem;
                console.log(this.pendingSelection);
                pentaho.events.trigger( this, "doubleclick", this.pendingSelection );
                this.pendingSelection = null;
                return;
            }
            if( typeof targetNode.meta == 'undefined' ) {
                // we don't have any information to handle the click
                return;
            }

            var rowIdx = targetNode.meta.rowIdx;

            var selection = {
                rowId: [],
                rowIdx: rowIdx,
                rowItem: [],
                colItem: new Array(),
                colId: new Array(),
                type: 'row'
            };

            for( var idx=0; idx<this.rowsCols.length; idx++ ) {
                selection.rowId.push( this.dataTable.getColumnId(this.rowsCols[idx]) );
                selection.rowItem.push( this.dataTable.getValue(rowIdx,this.rowsCols[idx]) )
            }
            var args = {
                mode: "TOGGLE",
                type: 'row',
                source: this,
                selections: [selection]

            };

            this.pendingSelection = args;

            // start a double click timer
            this.doubleClickTimer = setTimeout( dojo.hitch(this, "toggleGroup"), this.isIE ? 1000 : 250 );

            if( this.debug ) console.log( "SunBurst mouseClick done" );
        };

        this.toggleGroup = function( ) {

            if( this.debug ) console.log( "SunBurst toggleGroup()" );
            if( !this.mouseOverWedge.meta.isLeaf ) {
                return;
            }

            // create a selection object
            this.highlights[this.mouseOverWedge.meta.rowIdx] = !this.highlights[this.mouseOverWedge.meta.rowIdx];
            this.highlight();

            // the timer expired, so this is a click, not a double-click
            this.controller.chartSelectHandler( this.pendingSelection );
            // null out the pending selection

            if(!this.highLightsSet) {
                if( this.debug ) console.log( "SunBurst clearing selections" );
                vizUtil.clearSelections();
                // null out the pending selection
            }

            this.pendingSelection = null;
            if( this.debug ) console.log( "SunBurst toggleGroup done" );
        };

        this.init = function() {
            if(this.debug) console.log( "SunBurst init()" );

            // detect IE
            this.isIE = navigator.appName=="Microsoft Internet Explorer";

            // Create a div to contain the visualization
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

            // create the data structures needed
            this.hierarchy = this.buildHierarchy();

        }

        this.buildHierarchy = function() {

            // build a hierarchy from the data table provided
            var dataTable = this.dataTable;
            this.rowsCols = [];
            this.measureCol = -1;
            this.minValue = null;
            this.maxValue = null;

            // work out which columns the column items and measure are in
            for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
                var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
                if(dataReq) {
                    for (var idx=0; idx < dataReq.length; idx++) {
                        if( dataReq[idx].id == 'cols' ) {
                            this.rowsCols.push( colNo );
                        }
                        else if( dataReq[idx].id == 'measure' ) {
                            this.measureCol = colNo;
                        }
                    }
                }
            }

            var hierarchy = {};
            this.itemMetas = {};
            var topLevelCount=0;
            var colors = pentaho.palettes[this.paletteNo].colors;
            var removeN = this.allStr.length + 1;

            for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
                // process each row
                var branch = hierarchy;
                var itemKey = this.allStr;
                var color;
                for( var rowColIdx=0; rowColIdx<this.rowsCols.length; rowColIdx++ ) {
                    // process each column
                    var colNo = this.rowsCols[rowColIdx];
                    var rowId = dataTable.getColumnId(colNo);
                    var item = this.dataTable.getFormattedValue(rowNo, colNo);
                    var itemId = this.dataTable.getValue(rowNo, colNo);
                    itemKey += '~';
                    itemKey += item;
                    if( rowColIdx < this.rowsCols.length-1 ) {
                        // this is one of the upper levels
                        if( !branch[item] ) {
                            branch[item] = {};
                            this.itemMetas[itemKey] = {};
                            this.itemMetas[itemKey] = {
                                // stuff for selections
                                rowId: [rowId],
                                rowItem: [itemId],
                                colItem: new Array(),
                                colId: new Array(),
                                rowIdx: rowNo,
                                isLeaf: false,
                                type: 'row',
                                tooltip: itemKey.substr(removeN)
                            };
                            if( rowColIdx == 0 ) {
                                color = colors[topLevelCount % colors.length];
                                this.itemMetas[itemKey].color = color;
                                topLevelCount++;
                            } else {
                                this.itemMetas[itemKey].color = color;
                            }
                        } else if (rowColIdx == 0){
                            color = this.itemMetas[itemKey].color;
                        }
                        branch = branch[item];
                    }
                    else if( rowColIdx == this.rowsCols.length-1 ) {
                        // this is a leaf node
                        var value = this.dataTable.getValue(rowNo, this.measureCol);
                        if( value == null || typeof value == 'undefined' || value < 0 ) {
                            // cannot display negative or missing values, so set the value to 0
                            value = 0;
                        }
                        branch[item] = value;
                        this.itemMetas[itemKey] = {};
                        this.itemMetas[itemKey] = {
                            // stuff for selections
                            rowIdx: rowNo,
                            rowId: [rowId],
                            rowItem: [itemId],
                            colItem: new Array(),
                            colId: new Array(),
                            type: 'row',
                            isLeaf: true,
                            tooltip: itemKey.substr(removeN) + "<br/>" + this.dataTable.getFormattedValue(rowNo, this.measureCol)
                        };
                        if( colNo == 0 ) {
                            // store a default color
                            color = colors[rowNo % colors.length];
                        }
                        this.itemMetas[itemKey].color = color;
                        this.itemMetas[itemKey].value = value;
                        if( this.minValue == null ) {
                            this.minValue = value;
                            this.maxValue = value;
                        } else {
                            this.minValue = Math.min(this.minValue, value);
                            this.maxValue = Math.max(this.maxValue, value);;
                        }
                    }
                }
            }

            this.pruneBranches(hierarchy);
            this.hierarchy = hierarchy;
            // convert into a PV DOM
            this.nodes = pv.dom(this.hierarchy).root(this.allStr).nodes();

            // attach the meta info to the DOM nodes
            for( var idx=0; idx<this.nodes.length; idx++ ) {
                var node = this.nodes[idx];
                // create a key
                var itemKey = node.nodeName;
                var parent = node.parentNode;
                while( parent ) {
                    itemKey = parent.nodeName + '~' + itemKey
                    parent = parent.parentNode;
                }
                var meta = this.itemMetas[itemKey];
                node.meta = meta;

            }

            if( this.debug ) console.log( "hierarchy", this.hierarchy );
            if( this.debug ) console.log( "nodes", this.nodes );

            return hierarchy;

        }

        this.pruneBranches = function(branch) {
            // remove branches that are empty or have a total of 0
            var total = 0;
            var x;
            for( x in branch ) {
                var item = branch[x];
                if( typeof item == "number" ) {
                    if( item == 0 ) {
                        delete branch[x];
                    }
                    total += item;
                } else {
                    var value = this.pruneBranches( item );
                    if( value == 0 ) {
                        delete branch[x];
                    } else {
                        total += value;
                    }
                }
            }

            return total;
        }

        // Initialize this object
        this.init();

    };

    return pentaho.viz.SunBurst;
} );
