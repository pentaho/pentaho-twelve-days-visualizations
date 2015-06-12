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
    '../visualUtils',
    "pentaho/visual/color/paletteRegistry",
    "pentaho/visual/events",
    'jquery',
    'cdf/lib/CCC/protovis',
    'dojo/_base/lang',
    'cdf/lib/CCC/tipsy'
], function(utils, paletteRegistry, visualEvents, $, pv, lang) {

    return Funnel;

    function Funnel(div) {

        this.debug = false;

        if(this.debug) console.log('Funnel.create');

        this.element = div;

        this.labelColor = "#ffffff";
        this.w = 200;
        this.h = 200;
        this.rootPanel = null;
        this.colorMode = 'gradient';
        this.colors = paletteRegistry.get("twelveDaysViz").colors;
        this.format = pv.Format.number();
        this.data = [];
        this.mouseOverNode = null;
        this.highLightsSet = false;
        this.highlights = [];

        this.clearHighlights = function() {
            if(this.debug) console.log('Funnel.clearHighlights()');
            for(var idx=0; idx<this.highlights.length; idx++) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        this.setHighlights = function(lights) {
            if(this.debug) console.log('Funnel.setHighlights()');
            if(!lights || lights.length == 0) {
                this.clearHighlights();
                this.highlight();
            }
        };

        this.highlight = function() {
            if(this.debug) console.log('Funnel.highlight()');
            this.highLightsSet = false;
            for(var idx=0; idx<this.highlights.length; idx++) {
                if(this.highlights[idx]) {
                    this.highLightsSet = true;
                    break;
                }
            }
            this.rootPanel.render();
        };

        this.draw = function(dataTable, drawSpec) {
            if(this.debug) console.log('Funnel.draw()');

            this.dataTable = dataTable;
            this.drawSpec  = drawSpec;

            this.clearHighlights();

            $(".tipsy").remove();

            utils.handleCommonOptions(this, drawSpec);

            utils.applyBackground(this.element, drawSpec);

            this.processData();

            this.resize();
        };

        this.resize = function() {

            if(this.debug) console.log('Funnel.resize()');

            /* Size parameters. */
            this.w = utils.getClientWidth(this)-40;
            this.h = utils.getClientHeight(this)-40;

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
            if(this.debug) console.log('resizing main panel', this.rootPanel);
            this.rootPanel = new pv.Panel()
                .width(this.w)
                .height(this.h)
                .left(20)
                .top(20)
                .canvas(this.svgDiv);

            this.rootPanel.vis = this;

            if(this.debug) console.log('adding funnel layout');

            var pvAreaBase = new pv.Area()
                    .top(function(d) {
                        return this.index * this.parent.height();
                    })
                    .left(function(d) {
                        var width = d.value * this.parent.width() / 100;
                        return (this.parent.width() - width) / 2;
                    })
                    .width(function(d) {
                        return d.value * this.parent.width() / 100;
                    })
                    .fillStyle(lang.hitch(this, function(d) {
                        var color = pv.color(this.colors[d.index % this.colors.length]);
                        if(this.highLightsSet && !this.highlights[d.meta.rowIdx]) {
                            color = color.alpha(0.2);
                        }
                        return color;
                    }))
                    .strokeStyle(lang.hitch(this, function(d) {
                        return d == this.mouseOverNode ? "#000000" : pv.color(this.colors[d.index % this.colors.length]);
                    }))
                    .lineWidth(2)
                    .text(function(d) { return d.meta.tooltip; })
                    .title("")
                    .events("all");


            function onAreaClick(d) {
                this.root.vis.mouseClick(d);
            }

            function onAreaMouseout(d) {
                this.root.vis.mouseOut(d);
            }

            var pvLabelBase = new pv.Label()
                    .top(function(d) {
                        if(d.labelPosition == 'top') {
                            return 10 + 1 * this.root.vis.labelSize;
                        }
                        return this.parent.height() / 2 + this.root.vis.labelSize / 2;
                    })
                    .left(function(d) { return this.parent.width() / 2; })
                    .text(function(d) { return d.label; })
                    .font(this.labelFontStr)
                    .textStyle(this.labelColor)
                    .textAlign("center");

            for(var idx = 0; idx < this.data.length; idx++) {
                var datum = this.data[idx];

                var panel = this.rootPanel.add(pv.Panel)
                    .top(this.h * datum.top / 100)
                    .left(0)
                    .height((this.h * datum.h / 100) - 5);

                panel.add(pv.Area)
                    .extend(pvAreaBase)
                    .data([
                        {value: datum.w1, index: datum.index,     meta: datum},
                        {value: datum.w2, index: datum.index + 1, meta: datum}
                     ])
                    .event('click',     onAreaClick)
                    .event('mousemove', tipsy)
                    .event('mouseout',  onAreaMouseout);

                panel.add(pv.Label)
                    .extend(pvLabelBase)
                    .data([datum]);
            }

            if(this.debug) console.log('rendering');
            this.rootPanel.render();
        };

        this.mouseMove = function(d, t) {
            if(this.debug) console.log("Funnel mouseMove()", d);
            this.mouseOverNode = d;
            this.rootPanel.render();
        };

        this.mouseOut = function(d, t) {
            if(this.debug) console.log("Funnel mouseOut()", d);
            this.mouseOverNode = null;
            //this.rootPanel.render();
        };

        this.mouseClick = function(source) {
            if(this.debug) console.log("Funnel mouseClick()", source);

            var targetNode = source;

            if(targetNode.meta.rowIdx == -1) {
                // cannot select this
                return;
            }

            if(this.pendingSelection && this.pendingSelection.selections[0].rowIdx == targetNode.meta.rowIdx) {
                clearTimeout(this.doubleClickTimer);
                visualEvents.trigger(this, "doubleclick", this.pendingSelection);
                return;
            }

            if(typeof targetNode.meta == 'undefined') {
                return;
            }

            // create a selection object
            this.highlights[targetNode.meta.rowIdx] = !this.highlights[targetNode.meta.rowIdx];
            this.highlight();

            var rowIdx = targetNode.meta.rowIdx;

            var selection = {
                rowId:   [],
                rowIdx:  rowIdx,
                rowItem: [],
                colItem: [],
                colId:   [],
                type:    'row'
            };

            for(var idx=0; idx<this.rowsCols.length; idx++) {
                selection.rowId.push(this.dataTable.getColumnId(this.rowsCols[idx]));
                selection.rowItem.push(this.dataTable.getValue(rowIdx,this.rowsCols[idx]));
            }

            var args = {
                mode: "TOGGLE",
                type: 'row',
                source: this,
                selections: [selection]
            };

            this.pendingSelection = args;
            // start a double click timer

            this.doubleClickTimer = setTimeout(lang.hitch(this, this.toggleGroup), 300);
        };

        this.toggleGroup = function(n) {

            visualEvents.trigger(this, "select", this.pendingSelection);

            this.pendingSelection = null;
        };

        /* Compute new index values, rescale if needed, and render. */
        this.update = function() {
            if(this.debug) console.log('Funnel.update()');
        };

        this.init = function() {
            if(this.debug) console.log('Funnel.init()');
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

        this.processData = function() {

            this.measuresCols = [];
            this.rowsCols = [];
            this.data = [];

            for(var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
                var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
                if(dataReq) {
                    for (var idx=0; idx < dataReq.length; idx++) {
                        if(dataReq[idx].id == 'cols') {
                            this.rowsCols.push(colNo);
                        } else if(dataReq[idx].id == 'measures') {
                            this.measuresCols.push(colNo);
                        }
                    }
                }
            }

            this.minValue = null;
            this.maxValue = null;
            this.totalValue = 0;
            var value, tooltip;
            if(this.measuresCols.length > 1 && this.dataTable.getNumberOfRows() == 1) {
                // create the funnel using multiple measures
                for(var idx=0; idx<this.measuresCols.length; idx++) {
                    value = this.dataTable.getValue(0, this.measuresCols[idx]);
                    if(value != null && typeof value != 'undefined' && value > 0) {
                        tooltip = this.dataTable.getColumnLabel(
                                this.measuresCols[idx]) + ": " +
                                this.dataTable.getFormattedValue(0, this.measuresCols[idx]);
                        var obj = {
                            value: value,
                            id: this.dataTable.getColumnId(this.measuresCols[idx]),
                            label: this.dataTable.getColumnLabel(this.measuresCols[idx]),
                            rowIdx: -1,
                            index: idx,
                            tooltip: tooltip
                        };

                        this.data.push(obj);
                        if(this.minValue == null) {
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
                for(var idx=0; idx<this.data.length; idx++) {
                    this.data[idx].w1 = this.data[idx].value/this.totalValue*100;
                    if(idx == this.data.length-1) {
                        this.data[idx].w2 = this.data[idx].w1;
                    } else {
                        this.data[idx].w2 = this.data[idx+1].value/this.totalValue*100;
                    }
                    this.data[idx].top = 100/this.data.length*idx;
                    this.data[idx].h = 100/this.data.length;
                    this.data[idx].labelPosition = 'top';
                }
            } else {
                for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
                    value = this.dataTable.getValue(rowNo, this.measuresCols[0]);
                    if(value != null && typeof value != 'undefined' && value > 0) {
                        var label = '';
                        tooltip = '';
                        for(var idx=0; idx<this.rowsCols.length; idx++) {
                            if(idx > 0) {
                                label += ' ~ ';
                            }
                            label += this.dataTable.getFormattedValue(rowNo,this.rowsCols[idx]);
                            tooltip += this.dataTable.getColumnLabel(this.rowsCols[idx]) + ': ' +
                                       this.dataTable.getFormattedValue(rowNo,this.rowsCols[idx])+"</br>";
                        }
                        if(this.measuresCols.length > 1) {
                            label += ' ~ '+this.dataTable.getColumnLabel(this.measuresCols[0]);
                        }
                        tooltip += this.dataTable.getColumnLabel(this.measuresCols[0]) + ': ' +
                                   this.dataTable.getFormattedValue(rowNo,this.measuresCols[0])+"</br>";
                        var obj = {
                            value:   value,
                            label:   label,
                            rowIdx:  rowNo,
                            index:   rowNo,
                            tooltip: tooltip
                        };
                        this.data.push(obj);
                        if(this.minValue == null) {
                            this.minValue = this.maxValue = obj.value;
                        } else {
                            this.minValue = Math.min(obj.value, this.minValue);
                            this.maxValue = Math.max(obj.value, this.minValue);
                        }
                        this.totalValue += obj.value;
                    }
                }

                // now calculate the cumulative %
                pct = 0;
                for(var idx=0; idx<this.data.length; idx++) {
                    pct += this.data[idx].value/this.totalValue;
                    this.data[idx].pct = pct;
                    if(idx == 0) {
                        this.data[idx].w1 = 100;
                    } else {
                        this.data[idx].w1 = this.data[idx-1].w2;
                    }
                    this.data[idx].w2 = Math.sqrt((1-this.data[idx].pct)*10000);
                    this.data[idx].top = 100-this.data[idx].w1;
                    this.data[idx].h = this.data[idx].w1-this.data[idx].w2;
                    this.data[idx].labelPosition = 'middle';
                }
            }

            if(this.debug) console.log("data", this.data);
        };

        this.init();

        if(this.debug) console.log('Funnel.create done');
    }
});
