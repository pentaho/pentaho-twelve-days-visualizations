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
    'layoutCloud',
    'cdf/lib/CCC/protovis-msie',
    'cdf/lib/CCC/tipsy'
], function(vizUtil, VizController, pv, LayoutCloud) {

    /*
        constructor
        This takes an HTML DOM element as a parameter
    */
    pentaho.viz.TagCloud = function( element ) {
        this.debug = false;
        this.element = element;
        this.elementName = element.id;
        this.cdaTable = null;
        this.dataTable = null;
        this.vizOptions = null;
        this.fixedyaxis = true;
        this.labelColor = "#000000";
        this.paletteNo = 0;
        this.colorRange = ["#ff0000","#ffff00","#00ff00"];
        this.scalingType = "linear";
        this.mouseOverTag = null;
        this.highlights = [];
        this.highLightsSet = false;
        this.colorText = true;
        this.rowsCols = [];
        this.colorCol = -1;
        this.sizeCol = -1;
        this.version = "1.0";

        this.init();
    }

    pentaho.viz.TagCloud.prototype.colortextChanged = function(value) {
        this.colorText = value;
        this.options.colorText = value;
        this.draw(this.dataTable, this.options);
        return true;
    }

    pentaho.viz.TagCloud.prototype.colorSetChanged = function(value) {
        this.colorSet = value;
        this.options.colorSet = value;
        this.draw(this.dataTable, this.options);
        return true;
    }

    pentaho.viz.TagCloud.prototype.patternChanged = function(value) {
        this.pattern = value;
        this.options.pattern = value;
        this.draw(this.dataTable, this.options);
        return true;
    }

    pentaho.viz.TagCloud.prototype.reverseColorsChanged = function( value ) {
        this.reverseColors = value;
        this.options.reverseColors = value;
        this.draw(this.dataTable, this.options);
        return true;
    }

    // return the state of this visualization for persistance/back-one etc
    pentaho.viz.TagCloud.prototype.getState = function() {
        if( this.debug ) console.log('pentaho.viz.PackedCircle.getState()');
        var state = {
            colorMode: this.colorMode,
            scalingType: this.scalingType,
            pattern: this.pattern,
            colorSet: this.colorSet,
            colorText: this.colorText
        };
        return state;
    };

    pentaho.viz.TagCloud.prototype.setState = function(state) {
        if( this.debug ) console.log('pentaho.viz.PackedCircle.setState()');
        this.colorMode = state.colorMode;
        this.scalingType = state.scalingType;
        this.pattern = state.pattern;
        this.colorSet = state.colorSet;
        this.colorText = state.colorText;

        vizUtil.setupColorRanges();
    };

    pentaho.viz.TagCloud.prototype.resize = function() {
        this.draw(this.dataTable, this.options);
    }

    /*
        draw()

        dataTable   a pentaho.DataTable object with the data to display
        vizOptions  the options for the visualization
    */
    pentaho.viz.TagCloud.prototype.draw = function( pdataTable, options ) {

        this.options = options;
        this.dataTable = pdataTable;
        this.clearHighlights();

        this.fixedyaxis = false;
        if( this.debug ) console.log('pentaho.viz.TagCloud.draw()');

        // handle fonts, background
        vizUtil.handleCommonOptions( this, options );

        // set up the color ranges
        vizUtil.setupColorRanges(this);

        // apply the background color/gradient
        vizUtil.applyBackground(this.element, options);

        // check the controller current visualizations arguments (set by the properties panel)
        if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
            if( typeof this.controller.currentViz.args.colortext != 'undefined' ) {
                this.colorText = this.controller.currentViz.args.colortext;
            }
        }

        this.data = [];

        this.rowsCols = [];
        this.colorCol = -1;
        this.sizeCol = -1;

        for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
            var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
            if(dataReq) {
                for (var idx=0; idx < dataReq.length; idx++) {
                    if( dataReq[idx].id == 'rows' ) {
                        this.rowsCols.push( colNo );
                    }
                    else if( dataReq[idx].id == 'colorby' ) {
                        this.colorCol = colNo;
                    }
                    else if( dataReq[idx].id == 'sizeby' ) {
                        this.sizeCol = colNo;
                    }
                }
            }
        }

        this.minSize = null;
        this.maxSize = null;
        this.minColor = null;
        this.maxColor = null;
        var sizeLabel = this.sizeCol != -1 ? this.dataTable.getColumnLabel(this.sizeCol) : "";
        var colorLabel = this.colorCol != -1 ? this.dataTable.getColumnLabel(this.colorCol) : "";
        for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
            // create the label
            var label = '';
            for( var colNo=0; colNo< this.rowsCols.length; colNo++ ) {
                if( colNo > 0 ) {
                    label += '~';
                }
                label += this.dataTable.getFormattedValue(rowNo, colNo);
            }
            var size = 10;
            var color = null;
            if( this.sizeCol != -1 ) {
                size = this.dataTable.getValue(rowNo,this.sizeCol );
            }
            if( this.colorCol != -1 ) {
                color = this.dataTable.getValue(rowNo,this.colorCol );
            }
            var tooltip = label;
            tooltip += this.sizeCol != -1 ? ("<br/>"+sizeLabel+": "+this.dataTable.getFormattedValue(rowNo, this.sizeCol)) : "";
            tooltip += this.colorCol != -1 ? ("<br/>"+colorLabel+": "+this.dataTable.getFormattedValue(rowNo, this.colorCol)) : ""
            var item = {
                nodeName: label,
                sizeValue: size,
                colorValue: color,
                meta: {
                    rowIdx: rowNo,
                    highlight: false,
                    tooltip: tooltip
                }
            };
            this.data.push(item)
            if( this.minSize == null ) {
                this.minSize = item.sizeValue;
                this.minSize = item.sizeValue;
                this.minColor = item.colorValue;
                this.maxColor = item.colorValue;
            } else {
                this.minSize = Math.min( this.minSize, item.sizeValue );
                this.maxSize = Math.max( this.maxSize, item.sizeValue );
                this.minColor = Math.min( this.minColor, item.colorValue );
                this.maxColor = Math.max( this.maxColor, item.colorValue );
            }
        }
        if( this.minSize == null ) {
            this.minSize = 0;
            this.maxSize = 2;
        }
        this.sizeRange = this.maxSize - this.minSize;

        /* Scales and sizing. */
        var w = vizUtil.getClientWidth(this);
        var h = vizUtil.getClientHeight(this);
        var padding = 10;
        var skews = [
                {v:1, h:0}
            ];

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

        var vis = new pv.Panel()
            .width(w)
            .height(h)
            .canvas(this.svgDiv);
        vis.viz = this;

        this.rootPanel = vis;
        // tag cloud
        if( this.debug ) console.log('pentaho.viz.TagCloud.draw creating root panel');
        var vis3 = vis.add(pv.Panel)
            .data(skews)
            .top(0)
            .left(0)
            .width(w)
            .height(h);

        if( this.debug ) console.log('pentaho.viz.TagCloud.draw creating text');
        var tagCloud = vis3.add(LayoutCloud.Text)
            .nodes(this.data)
            .textStyle(dojo.hitch( this, function(d) {
                return (this.colorText && this.colorCol != -1) ? this.getColor(d) : this.labelColor;
            }) )
            .font(dojo.hitch( this, function(d) {
                var size = 25;
                if( this.sizeCol != -1 ) {
                    size = Math.floor(10+40*((d.sizeValue-this.minSize)/this.sizeRange));
                }
                return "" + size + "px "+this.labelFontFamily;
            } ) )
            .horizontalSkew(function(d, v) { return v.h } )
            .verticalSkew(function(d, v) { return v.v } )
            ;

        if( this.debug ) console.log('pentaho.viz.TagCloud.draw creating bars');
        if( !this.colorText ) {
            tagCloud.node.add(pv.Bar)
                .fillStyle( dojo.hitch( this, function(d) {
                    return this.colorText ? "none" : this.getColor(d)
                }) )
                .strokeStyle(function(d) {
                    if( d == this.parent.parent.parent.viz.mouseOverTag ) {
                        return "#000000";
                    } else {
                        return this.parent.parent.parent.viz.getColor(d);
                    }
                } )
                .lineWidth(2)
                ;
        }
        tagCloud.label.add(pv.Label)
        ;

        tagCloud.node.add(pv.Bar)
            .fillStyle( "rgba(255,255,255,0.1)" )
            .title( function(){ return "";} ) // Prevent browser tooltip
            .text(function(d){ return d && d.meta ? d.meta.tooltip : ""; })
            .events("all")
            .event('click', dojo.hitch( this, function(d) { this.mouseClick(d); } ) )
            .event('mouseover', dojo.hitch( this, function(d) { this.mouseMove(d); } ) )
            .event('mouseout', dojo.hitch( this, function(d) { this.mouseOut(d); } ) )
            .event('mousemove', pv.Behavior.tipsy(tipOptions) )
            ;

        if( this.debug ) console.log('pentaho.viz.TagCloud.draw rendering');
        vis.render();
        if( this.debug ) console.log('pentaho.viz.TagCloud.draw() done');

    }

    pentaho.viz.TagCloud.prototype.mouseMove = function( d, t ) {
        if( this.debug ) console.log( "pentaho.viz.TagCloud mouseMove()", d );
        this.mouseOverTag = d;
        this.rootPanel.render();
    };

    pentaho.viz.TagCloud.prototype.mouseOut = function( d, t ) {
        if( this.debug ) console.log( "pentaho.viz.TagCloud mouseOut()", d );
        this.mouseOverTag = null;
        this.rootPanel.render();
    };

    pentaho.viz.TagCloud.prototype.mouseClick = function( source ) {
        if( this.debug ) console.log( "pentaho.viz.TagCloud mouseClick()", source );

        var targetNode = source;

        if( this.pendingSelection && this.pendingSelection.selections[0].rowIdx == targetNode.meta.rowIdx ) {
            clearTimeout(this.doubleClickTimer);
            this.controller.chartDoubleClickHandler( this.pendingSelection );
            return;
        }

        if( typeof targetNode.meta == 'undefined' ) {
            return;
        }

        // create a selection object
        targetNode.meta.highlight = !targetNode.meta.highlight;
        this.highlights[targetNode.meta.rowIdx] = targetNode.meta.highlight;
        this.highlight();

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

        this.doubleClickTimer = setTimeout( dojo.hitch(this, this.toggleGroup), 300 );

    };

    pentaho.viz.TagCloud.prototype.toggleGroup = function(n ) {

        this.controller.chartSelectHandler( this.pendingSelection );

        this.pendingSelection = null;
    };

    pentaho.viz.TagCloud.prototype.clearHighlights = function() {
        if( this.debug ) console.log('pentaho.viz.TagCloud.clearHighlights()');
        for( var idx=0; idx<this.highlights.length; idx++ ) {
            this.highlights[idx] = false;
        }
        this.highLightsSet = false;
    };

    pentaho.viz.TagCloud.prototype.setHighlights = function(lights) {
        if( !lights || lights.length == 0 ) {
            this.clearHighlights();
            this.highlight();
        }
    };

    pentaho.viz.TagCloud.prototype.highlight = function() {

        this.highLightsSet = false;
        for( var idx=0; idx<this.highlights.length; idx++ ) {
            if( this.highlights[idx] ) {
                this.highLightsSet = true;
                break;
            }
        }
        this.rootPanel.render();

    };


    pentaho.viz.TagCloud.prototype.getColor = function(d) {

        var color = pv.color("#cccccc");
        if( this.colorCol == -1 ) {
        }
        else if(this.scalingType == "linear"){
            try {
                color = vizUtil.getRgbGradientFromMultiColorHex( d.colorValue, this.minColor, this.maxColor, this.colorRange);
            } catch (e) { console.log(e.message); color = pv.color("#cccccc"); }
        } else {
            try {
                color = VizController.getRgbStepFromMultiColorHex( d.colorValue, this.minColor, this.maxColor, this.colorRange);
            } catch (e) { console.log(e.message); color = pv.color("#cccccc"); }
        }

        if( color.indexOf && color.indexOf('RGB') == 0 ) {
            var cols = color.split(',');
            var r = parseInt( cols[0].substr(4) );
            var g = parseInt( cols[1]);
            var b = parseInt( cols[2].substr( 0, cols[2].length-1 ) );
            color = new pv.Color.Rgb(r, g, b, 1);

            if(this.highLightsSet && !d.meta.highlight) {
                color = color.alpha(0.2);
            }
        }

        return color;

    }

    pentaho.viz.TagCloud.prototype.init = function() {

        if( this.debug ) console.log('pentaho.viz.TagCloud.init()');
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

    return pentaho.viz.TagCloud;
});
