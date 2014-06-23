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
    'cdf/lib/CCC/protovis',
    'dojo/_base/lang',
    'cdf/lib/CCC/protovis-msie',
    'cdf/lib/CCC/tipsy'
], function(vizUtil, $, pv, lang) {

    pentaho.viz.Funnel = function( div ) {

        this.debug = false;

        if( this.debug ) console.log('pentaho.viz.Funnel.create');

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
        this.paletteNo = 0;
        this.minValue;
        this.maxValue;
        this.totalValue;
        this.colorMode = 'gradient';
        this.paletteNo = 0;
        this.format = pv.Format.number();
        this.data = [];
        this.funnelMode = 'AREA';
        this.mouseOverNode = null;
        this.highLightsSet = false;
        this.highlights = [];

        this.clearHighlights = function() {
            if( this.debug ) console.log('pentaho.viz.Funnel.clearHighlights()');
            for( var idx=0; idx<this.highlights.length; idx++ ) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        this.setHighlights = function(lights) {
            if( this.debug ) console.log('pentaho.viz.Funnel.setHighlights()');
            if( !lights || lights.length == 0 ) {
                this.clearHighlights();
                this.highlight();
            }
        };

        this.highlight = function() {
            if( this.debug ) console.log('pentaho.viz.Funnel.highlight()');
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
            if( this.debug ) console.log('pentaho.viz.Funnel.getState()');
            var state = {
                    colorMode: this.colorMode,
                    scalingType: this.scalingType,
                    pattern: this.pattern,
                    colorSet: this.colorSet
            };
            return state;
        };

        this.setState = function(state) {
            if( this.debug ) console.log('pentaho.viz.Funnel.setState()');
            this.colorMode = state.colorMode;
            this.scalingType = state.scalingType;
            this.pattern = state.pattern;
            this.colorSet = state.colorSet;
        };

        this.draw = function( dataTable, options ) {
            if( this.debug ) console.log('pentaho.viz.Funnel.draw()');
            this.dataTable = dataTable;
            this.options = options;
            this.clearHighlights();
            this.sortChange = false;
            $(".tipsy").remove();

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
                if( typeof options.colorMode != 'undefined') {
                    this.colorMode = options.colorMode;
                }
                if( typeof options.scalingType != 'undefined') {
                    this.scalingType = options.scalingType;
                }
                if( typeof options.pattern != 'undefined') {
                    this.pattern = options.pattern;
                }
                if( typeof options.colorSet != 'undefined') {
                    this.colorSet = options.colorSet;
                }
            }

            // check the controller current visualizations arguments (set by the properties panel)
            if( this.controller && this.controller.currentViz && this.controller.currentViz.args ) {
                var labelColor = this.controller.currentViz.args.labelColor;
                if( labelColor ) {
                    this.labelColor = labelColor;
                }

                if( typeof this.controller.currentViz.args.paletteno == 'string') {
                    this.paletteNo = parseInt( this.controller.currentViz.args.paletteno );
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
                if( typeof this.controller.currentViz.args.sorted != 'undefined' ) {
                    this.sorted = this.controller.currentViz.args.sorted;
                }
                if( typeof this.controller.currentViz.args.pattern != 'undefined' || typeof this.controller.currentViz.args.colorSet != 'undefined' ) {

                    if( typeof this.controller.currentViz.args.pattern != 'undefined' ) {
                        this.pattern = this.controller.currentViz.args.pattern;
                    } else {
                        this.pattern = 'GRADIENT';
                    }
                    this.colorMode = this.pattern == 'PIE' ? 'top' : 'gradient';
                    this.scalingType = this.pattern == 'GRADIENT' ? 'linear' : 'steps'
                    if( typeof this.controller.currentViz.args.colorSet != 'undefined' ) {
                        this.colorSet = this.controller.currentViz.args.colorSet;
                    } else {
                        this.colorSet = 'ryg';
                    }
                    this.options.colorMode = this.colorMode;
                    this.options.scalingType = this.scalingType;
                    this.options.pattern = this.pattern;
                    this.options.colorSet = this.colorSet;
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

            this.resize();
        };

        this.resize = function() {

            if( this.debug ) console.log('pentaho.viz.Funnel.resize()');

            /* Size parameters. */
            this.w = vizUtil.getClientWidth(this)-40;
            this.h = vizUtil.getClientHeight(this)-40;

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

            var tipsy = pv.Behavior.tipsy(tipOptions);

            /* Root panel. */
            if( this.debug ) console.log('resizing main panel', this.rootPanel);
            this.rootPanel = new pv.Panel()
                .width(this.w)
                .height(this.h)
                .left(20)
                .top(20)
                .canvas(this.svgDiv);

            this.rootPanel.vis = this;

            if( this.debug ) console.log('adding funnel layout');

            this.colors = pentaho.palettes[this.paletteNo].colors;

            for( var idx=0; idx<this.data.length; idx++ ) {
                var panel = this.rootPanel.add(pv.Panel)
                    .top( this.h*(this.data[idx].top)/100 )
                    .left(0)
                    .height((this.h*(this.data[idx].h)/100)-5)
                    ;

                panel.add(pv.Area)
                    .data([{ value: this.data[idx].w1, index: this.data[idx].index, meta: this.data[idx]},
                        { value: this.data[idx].w2, index: this.data[idx].index+1, meta: this.data[idx]}])
                    .top( function(d) {
                        return this.index * this.parent.height();
                    } )
                    .left( function(d) {
                        var width = d.value * this.parent.width() / 100;
                        return (this.parent.width() - width)/2;
                    }
                    )
                    .width( function(d) {
                        var width = d.value * this.parent.width() / 100;
                        return width;
                    } )
                    .fillStyle( lang.hitch( this, function(d) {
                        var color = pv.color( this.colors[d.index % this.colors.length] );
                        console.log(d.meta);
                        if(this.highLightsSet && !this.highlights[d.meta.rowIdx]) {
                            color = color.alpha(0.2);
                        }
                        return color;
                    }))
                    .strokeStyle(lang.hitch( this, function(d) {
                        return d == this.mouseOverNode ? "#000000" : pv.color( this.colors[d.index % this.colors.length] );
                    } ) )
                    .lineWidth(2)
                    .text(function(d) { return d.meta.tooltip; } )
                    .title("")
                    .events("all")
                    .event('click', function(d) {
                        this.root.vis.mouseClick(d);
                    } )
                    .event('mousemove', tipsy)
                    .event('mouseout', function(d) {
                        this.root.vis.mouseOut(d);
                    } )
                    ;

                panel.add(pv.Label)
                    .data([this.data[idx]])
                    .top( function(d) {
                        if( d.labelPosition == 'top' ) {
                            return 10+ this.root.vis.labelSize*1;
                        } else {
                            return (this.parent.height()/2) + this.root.vis.labelSize/2;
                        }
                    } )
                    .left( function(d) { return this.parent.width()/2; } )
                    .text( function(d) { return d.label; } )
                    .font(this.labelFontStr)
                    .textStyle(this.labelColor)
                    .textAlign("center")
                    ;

            }

            if( this.debug ) console.log('rendering');
            this.rootPanel.render();

        };

        this.mouseMove = function( d, t ) {
            if( this.debug ) console.log( "Funnel mouseMove()", d );
            this.mouseOverNode = d;
            this.rootPanel.render();
        };

        this.mouseOut = function( d, t ) {
            if( this.debug ) console.log( "Funnel mouseOut()", d );
            this.mouseOverNode = null;
            //this.rootPanel.render();
        };

        this.mouseClick = function( source ) {
            if( this.debug ) console.log( "Funnel mouseClick()", source );

            var targetNode = source;

            if( targetNode.meta.rowIdx == -1 ) {
                // cannot select this
                return;
            }

            if( this.pendingSelection && this.pendingSelection.selections[0].rowIdx == targetNode.meta.rowIdx ) {
                clearTimeout(this.doubleClickTimer);
                this.controller.chartDoubleClickHandler( this.pendingSelection );
                return;
            }

            if( typeof targetNode.meta == 'undefined' ) {
                return;
            }

            // create a selection object
            this.highlights[targetNode.meta.rowIdx] = !this.highlights[targetNode.meta.rowIdx];
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

            this.doubleClickTimer = setTimeout( lang.hitch(this, this.toggleGroup), 300 );

        };

        this.toggleGroup = function(n ) {

            this.controller.chartSelectHandler( this.pendingSelection );

            this.pendingSelection = null;
        };

        /* Compute new index values, rescale if needed, and render. */
        this.update = function() {
            if( this.debug ) console.log('pentaho.viz.Funnel.update()');

        }

        this.init = function() {

            if( this.debug ) console.log('pentaho.viz.Funnel.init()');
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

            this.measuresCols = [];
            this.rowsCols = [];
            this.data = [];

            for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
                var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
                if(dataReq) {
                    for (var idx=0; idx < dataReq.length; idx++) {
                        if( dataReq[idx].id == 'cols' ) {
                            this.rowsCols.push( colNo );
                        }
                        else if( dataReq[idx].id == 'measures' ) {
                            this.measuresCols.push( colNo );
                        }
                    }
                }
            }
            this.minValue = null;
            this.maxValue = null;
            this.totalValue = 0;
            if( this.measuresCols.length > 1 && this.dataTable.getNumberOfRows() == 1 ) {
                // create the funnel using multiple measures


                for( var idx=0; idx<this.measuresCols.length; idx++ ) {
                    var value = this.dataTable.getValue( 0, this.measuresCols[idx] );
                    if( value != null && typeof value != 'undefined' && value > 0 ) {
                        var tooltip = this.dataTable.getColumnLabel(this.measuresCols[idx]) + ": " + this.dataTable.getFormattedValue( 0, this.measuresCols[idx] )
                        var obj = {
                            value: value,
                            id: this.dataTable.getColumnId( this.measuresCols[idx] ),
                            label: this.dataTable.getColumnLabel( this.measuresCols[idx] ),
                            rowIdx: -1,
                            index: idx,
                            tooltip: tooltip
                        };
                        this.data.push( obj );
                        if( this.minValue == null ) {
                            this.minValue = obj.value;
                            this.maxValue = obj.value;
                        } else {
                            this.minValue = Math.min(obj.value, this.minValue);
                            this.maxValue = Math.max(obj.value, this.minValue);
                        }
                        this.totalValue += obj.value;
                    }
                }
                // now calculate the cumulative %
                var pct = 0;
                for( var idx=0; idx<this.data.length; idx++ ) {
                    this.data[idx].w1 = this.data[idx].value/this.totalValue*100;
                    if( idx == this.data.length-1 ) {
                        this.data[idx].w2 = this.data[idx].w1;
                    } else {
                        this.data[idx].w2 = this.data[idx+1].value/this.totalValue*100;
                    }
                    this.data[idx].top = 100/this.data.length*idx;
                    this.data[idx].h = 100/this.data.length;
                    this.data[idx].labelPosition = 'top';
                }
            } else {
                for( var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++ ) {
                    var value = this.dataTable.getValue( rowNo, this.measuresCols[0] );
                    if( value != null && typeof value != 'undefined' && value > 0 ) {
                        var label = '';
                        var tooltip = '';
                        for( var idx=0; idx<this.rowsCols.length; idx++) {
                            if( idx > 0 ) {
                                label += ' ~ ';
                            }
                            label += this.dataTable.getFormattedValue(rowNo,this.rowsCols[idx]);
                            tooltip += this.dataTable.getColumnLabel(this.rowsCols[idx]) + ': '+this.dataTable.getFormattedValue(rowNo,this.rowsCols[idx])+"</br>";
                        }
                        if( this.measuresCols.length > 1 ) {
                            label += ' ~ '+this.dataTable.getColumnLabel( this.measuresCols[0] );
                        }
                        tooltip += this.dataTable.getColumnLabel(this.measuresCols[0]) + ': '+this.dataTable.getFormattedValue(rowNo,this.measuresCols[0])+"</br>";
                        var obj = {
                            value: value,
                            label: label,
                            rowIdx: rowNo,
                            index: rowNo,
                            tooltip: tooltip
                        };
                        this.data.push( obj );
                        if( this.minValue == null ) {
                            this.minValue = obj.value;
                            this.maxValue = obj.value;
                        } else {
                            this.minValue = Math.min(obj.value, this.minValue);
                            this.maxValue = Math.max(obj.value, this.minValue);
                        }
                        this.totalValue += obj.value;
                    }

                }
                // now calculate the cumulative %
                var pct = 0;
                for( var idx=0; idx<this.data.length; idx++ ) {
                    pct += this.data[idx].value/this.totalValue;
                    this.data[idx].pct = pct;
                    if( idx == 0 ) {
                        this.data[idx].w1 = 100;
                    } else {
                        this.data[idx].w1 = this.data[idx-1].w2;
                    }
                    this.data[idx].w2 = Math.sqrt((1-this.data[idx].pct)*10000)
                    this.data[idx].top = 100-this.data[idx].w1;
                    this.data[idx].h = this.data[idx].w1-this.data[idx].w2;
                    this.data[idx].labelPosition = 'middle';

                }
            }

            if( this.debug) console.log("data", this.data);

        }

        this.init();

        if( this.debug ) console.log('pentaho.viz.Funnel.create done');

    };

    return pentaho.viz.Funnel;
} );
