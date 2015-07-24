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
    'jquery',
    '../VizController',
    'cdf/lib/CCC/protovis',
    'dojo/_base/lang',
    'cdf/lib/CCC/protovis-msie',
    'cdf/lib/CCC/tipsy'
], function(vizUtil, $, VizController, pv, lang) {

    pentaho.viz.PackedCircle = function( div ) {

        this.debug = false;

        if( this.debug ) console.log('pentaho.viz.PackedCircle.create');

        // Visualization API fields
        this.vizId = null;
        this.controller = null;
        this.id = null;
        this.elementId = div.id;
        this.element = div

        this.labelColor = "#ffffff";
        this.w = 200;
        this.h = 200;
        this.rootPanel = null;
        this.rootPanel = null;
        this.paletteNo = 0;
        this.allStr = "All";
        this.minValue;
        this.maxValue;
        this.colorMode = 'gradient';
        this.paletteNo = 0;
        this.highlights = [];
        this.highLightsSet = false;
        this.colorSet = 'ryg';
        this.colorRange = ["#ff0000","#ffff00","#00ff00"];
        this.scalingType = "linear";
        this.sorted = false;
        this.sortChange = false;
        this.format = pv.Format.number();

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

        this.clearHighlights = function() {
            if( this.debug ) console.log('pentaho.viz.PackedCircle.clearHighlights()');
            this.highlights = [];
            var n = this.dataTable ? this.dataTable.getNumberOfRows() : this.highlights.length;
            for( var idx=0; idx<n; idx++ ) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        this.setHighlights = function(lights) {
            if( !lights || lights.length == 0 ) {
                this.clearHighlights();
                this.highlight();
            }
        };

        this.highlight = function() {

            this.highLightsSet = false;
            for( var idx=0; idx<this.highlights.length; idx++ ) {
                if( this.highlights[idx] ) {
                    this.highLightsSet = true;
                    break;
                }
            }
            this.pack.reset();
            this.rootPanel.render();

        };

        // return the state of this visualization for persistance/back-one etc
        this.getState = function() {
            if( this.debug ) console.log('pentaho.viz.PackedCircle.getState()');
            var state = {
                    colorMode: this.colorMode,
                    scalingType: this.scalingType,
                    pattern: this.pattern,
                    colorSet: this.colorSet
            };
            return state;
        };

        this.setState = function(state) {
            if( this.debug ) console.log('pentaho.viz.PackedCircle.setState()');
            this.colorMode = state.colorMode;
            this.scalingType = state.scalingType;
            this.pattern = state.pattern;
            this.colorSet = state.colorSet;
            vizUtil.setupColorRanges();
        };

        this.draw = function( dataTable, options ) {
            if( this.debug ) console.log('pentaho.viz.PackedCircle.draw()');
            this.dataTable = dataTable;
            this.options = options;
            this.clearHighlights();
            this.sortChange = false;
            $(".tipsy").remove();

            vizUtil.handleCommonOptions( this, options );

            vizUtil.setupColorRanges(this);

            vizUtil.applyBackground(this.element, options);

            this.processData();

            /* Size parameters. */
            var w = vizUtil.getClientWidth(this);
            var h = vizUtil.getClientHeight(this);

            /* Root panel. */
            this.rootPanel = new pv.Panel()
                .width(w)
                .height(h)
                .left(0)
                .top(0)
                .canvas(this.svgDiv);

            this.rootPanel.vis = this;

            this.resize();
        };

        this.getColor = function(d) {
            var color = pv.color("#cccccc");
            if( !d.parentNode ) {
                color = color.alpha(0);
                if( this.debug) console.log('PackedCircle.getColor() done');
                return color;
            }
            if( this.colorMode == 'top' ) {

                if( d.meta && d.meta.color ) {
                    color = pv.color(d.meta.color);
                    if(this.highLightsSet && !d.meta.highlight) {
                        color = color.alpha(0.2);
                    }
                }

                if( typeof d.nodeValue != 'undefined' ) {
                    var scale = (d.nodeValue - this.minValue) / (this.maxValue-this.minValue);
                    // make it a +/- 20%
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
                if( typeof d.nodeValue == 'undefined' ) {
                    if( d.meta && d.meta.color ) {
                        color = pv.color(d.meta.color);
                        if(this.highLightsSet && !d.meta.highlight) {
                            color = color.alpha(0.2);
                        }
                    }
                    return color;
                }
                if(this.scalingType == "linear"){
                  try {
                   color = vizUtil.getRgbGradientFromMultiColorHex( d.nodeValue, this.minValue, this.maxValue, this.colorRange);
                  } catch (e) { console.log(e.message); color = "#cccccc"; }
                } else {
                  try {
                   color = VizController.getRgbStepFromMultiColorHex( d.nodeValue, this.minValue, this.maxValue, this.colorRange);
                  } catch (e) { console.log(e.message); color = "#cccccc"; }
                }
              if( color.indexOf('RGB') == 0 ) {
                var cols = color.split(',');
                var r = parseInt( cols[0].substr(4) );
                var g = parseInt( cols[1]);
                var b = parseInt( cols[2].substr( 0, cols[2].length-1 ) );
                color = new pv.Color.Rgb(r, g, b, 1);

                if(this.highLightsSet && !d.meta.highlight) {
                    color = color.alpha(0.2);
                }

              }
            }
            return color;
        }

        this.resize = function() {

            if( this.debug ) console.log('pentaho.viz.PackedCircle.resize()');

            if( this.sortChange && this.partition ) {
                if( this.sorted ) {
                    this.partition.order("descending");
                    this.partition.render();
                    return;
                } else {
                    this.partition.order("none");
                }

            }

            var tipOptions = {
              delayIn: 200,
              delayOut:80,
              offset:  2,
              html:    true,
              gravity: "nw",
              fade:    false,
              followMouse: true,
              corners: true,
              arrowVisible: false,
              opacity: 1
            };

            /* Size parameters. */
            var w = vizUtil.getClientWidth(this);
            var h = vizUtil.getClientHeight(this);

            if( this.debug ) console.log('resizing main panel', this.rootPanel);

            /* Root panel. */
            this.rootPanel.width(w)
                .height(h);

            if( this.debug ) console.log('adding packed layout');

            this.pack = this.rootPanel.add(pv.Layout.Pack);
            this.pack.vis = this;
            this.pack.nodes(this.nodes)
                .size(function(d) { return d.nodeValue; } );

            if( this.sorted ) {
                this.pack.order("descending");
            } else {
                this.pack.order(null);
            }

            this.pack.node.add(pv.Dot)
                .title(function(d) { return d.nodeName + (d.firstChild ? "" : ": " + this.parent.vis.format(d.nodeValue)); })
                .fillStyle(function(d) { return this.parent.vis.getColor(d); })
                .strokeStyle(function(d) { return d == this.parent.vis.mouseOverWedge ? "#000000" : this.parent.vis.labelColor; } )
                .lineWidth(function(d) { return d == this.parent.vis.mouseOverWedge ? 2 : 1; })
                .text(function(d) {
                        if(d && d.meta && d.meta.tooltip ) {
                            return d.meta.tooltip;
                        }
                        return "";
                    }
                )
                .title("")
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


            this.pack.label.add(pv.Label)
                .visible(function(d) { return !d.firstChild; } )
                .text(function(d) { return d.nodeName.substring(0, d.radius / 5); } )
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            if( this.debug ) console.log('rendering');
            this.pack.reset();
            this.rootPanel.render();

        };

        this.mouseMove = function( d, t ) {
            if( this.debug ) console.log( "PackedCircle mouseMove()", d );
            this.mouseOverWedge = d;
            this.pack.reset();
            this.rootPanel.render();
        };

        this.mouseOut = function( d, t ) {
            if( this.debug ) console.log( "PackedCircle mouseOut()", d );
            this.mouseOverWedge = null;
            this.pack.reset();
            this.rootPanel.render();
        };

        this.mouseClick = function( source ) {
            if( this.debug ) console.log( "PackedCircle mouseClick()", source );

            var targetNode = source;

            if( this.pendingSelection && this.pendingSelection.selections[0].rowIdx == targetNode.meta.rowIdx ) {
                clearTimeout(this.doubleClickTimer);
                pentaho.events.trigger( this, "doubleclick", this.pendingSelection );

                // this.controller.chartDoubleClickHandler( this.pendingSelection );
                return;
            }

            if( typeof targetNode.meta == 'undefined' ) {
                return;
            }

            // create a selection object
            this.highlights[targetNode.meta.rowIdx] = !this.highlights[targetNode.meta.rowIdx];
            targetNode.meta.highlight = this.highlights[targetNode.meta.rowIdx];
            this.highlight();

            if(!this.highLightsSet) {
                vizUtil.clearSelections();
                return;
            }

            console.log(targetNode.meta);

            var rowIdx = targetNode.meta.rowIdx;

            var selection = {
                rowId: [],
                rowIdx: rowIdx,
                rowItem: [],
                colItem: new Array(),
                colId: new Array(),
                type: 'row'
            };

            for( var idx=0; idx<=targetNode.meta.level; idx++ ) {
                selection.rowId.push( this.dataTable.getColumnId(idx) );
                selection.rowItem.push( this.dataTable.getValue(rowIdx,idx) )
            }

            var args = {
                mode: "TOGGLE",
                type: 'row',
                source: this,
                selections: [selection]

            };

            this.pendingSelection = args;
            // start a double click timer

            this.doubleClickTimer = setTimeout( lang.hitch(this, this.toggleGroup), 300 );

        };

        this.toggleGroup = function(n ) {

            this.controller.chartSelectHandler( this.pendingSelection );

            this.pendingSelection = null;
        };

        /* Compute new index values, rescale if needed, and render. */
        this.update = function() {
            if( this.debug ) console.log('pentaho.viz.PackedCircle.update()');

        }

        this.init = function() {

            if( this.debug ) console.log('pentaho.viz.PackedCircle.init()');
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

            this.hierarchy = this.buildHierarchy();

        }

        this.init();

        this.buildHierarchy = function() {
            var dataTable = this.dataTable;

            this.rowsCols = [];
            this.measureCol = -1;
            this.minValue = null;
            this.maxValue = null;

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
            for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
                var branch = hierarchy;
                var itemKey = this.allStr;
                var tooltip = "";
                var color;
                for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++ ) {
                    var rowId = this.dataTable.getColumnId(colNo);
                    var item = this.dataTable.getFormattedValue(rowNo, colNo);
                    var itemId = this.dataTable.getValue(rowNo, colNo);
                    itemKey += '~';
                    itemKey += item;
                    tooltip += this.dataTable.getColumnLabel(colNo) + ": " + item + "<br/>";
                    if( colNo < this.rowsCols.length-1 ) {
                        // this is an parent level
                        if( !branch[item] ) {
                            branch[item] = {};
                            this.itemMetas[itemKey] = {};
                            this.itemMetas[itemKey] = {
                                // stuff for selections
                                rowIdx: rowNo,
                                rowId: [rowId],
                                rowItem: [itemId],
                                colItem: new Array(),
                                colId: new Array(),
                                type: 'row',
                                tooltip: tooltip,
                                level: colNo
                            };
                            if( colNo == 0 ) {
                                color = colors[topLevelCount % colors.length];
                                this.itemMetas[itemKey].color = color;
                                topLevelCount++;
                            } else {
                                this.itemMetas[itemKey].color = color;
                            }
                        }
                        branch = branch[item];

                    }
                    else if( colNo == this.rowsCols.length-1 ) {
                        // this is the lowest level
                        var value = this.dataTable.getValue(rowNo, this.measureCol);
                        if( value == null || typeof value == 'undefined' || value < 0 ) {
                            value = 0;
                        }
                        branch[item] = value;
                        this.itemMetas[itemKey] = {};
                        tooltip += this.dataTable.getColumnLabel(this.measureCol) + ": " + this.dataTable.getFormattedValue(rowNo, this.measureCol);

                        // TODO store all of the row information, or use the rowIdx to create it later?
                        this.itemMetas[itemKey] = {
                            // stuff for selections
                            rowIdx: rowNo,
                            rowId: [rowId],
                            rowItem: [itemId],
                            colItem: new Array(),
                            colId: new Array(),
                            type: 'row',
                            tooltip: tooltip,
                            level: colNo
                        };
                        if( colNo == 0 ) {
                            color = colors[rowNo % colors.length];
                        }
                        this.itemMetas[itemKey].color = color;
                        this.itemMetas[itemKey].value = value;
                        if( this.minValue == null ) {
                            this.minValue = value;
                            this.maxValue = value;
                        } else {
                            this.minValue = Math.min(this.minValue, value);
                            this.maxValue = Math.max(this.maxValue, value);
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
    };

    return pentaho.viz.PackedCircle;
} );
