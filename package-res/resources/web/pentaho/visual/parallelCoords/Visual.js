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
    "cdf/lib/CCC/protovis",
    "jquery",
    "dojo/_base/lang",
    "pentaho/common/Messages",
    "cdf/lib/CCC/tipsy",
    "css!../table"
], function(utils, paletteRegistry, visualEvents, pv, $, lang, Messages) {

    return ParallelCoords;

    function ParallelCoords(div) {

        this.debug = false;

        if(this.debug) console.log('ParallelCoords.create');

        this.element = div;

        this.data = [];
        this.labelColor = "#000000";
        this.w = 200;
        this.h = 200;
        this.plotAreaColor = "rgba(240,240,240,";
        this.backgroundColor = "rgba(255,255,255,";
        this.opacity = 0;
        this.rootPanel = null;
        this.colors = paletteRegistry.get("twelveDaysViz").colors;
        this.allStr = "All";
        this.sideMargin = 90;
        this.legendWidth = 150;
        this.defaultMeasure = null;
        this.selections = [];
        this.showTable = true;
        this.mouseDown = false;

        this.clearHighlights = function() {
            if(this.debug) console.log('ParallelCoords.clearHighlights()');
            this.resetSliders();
        };

        this.setHighlights = function(lights) {
            if(this.debug) console.log('ParallelCoords.setHighlights()');
            if(!lights || lights.length == 0) {
                if(!this.mouseDown) {
                    this.clearHighlights();
                }
            }
        };

        this.draw = function(dataTable, drawSpec) {
            if(this.debug) console.log('ParallelCoords.draw()');
            this.dataTable = dataTable;
            this.drawSpec  = drawSpec;

            if(drawSpec.showTable != null) {
                this.showTable = !!drawSpec.showTable;
            }

            utils.handleCommonOptions(this, drawSpec);

            utils.applyBackground(this.element, drawSpec);

            $(".tipsy").remove();

            this.processData();

            this.centerNode.innerHTML = "";
            this.table = document.createElement('TABLE');
            this.centerNode.appendChild(this.table);

            this.tableDiv.style.display = this.showTable ? "block" : "none";

            if(this.showTable) {
                utils.createSelectionTable(this.table, dataTable, this.labelFontStr, this.labelColor);
            }

            this.resize();
        };

        this.resize = function() {

            if(this.debug) console.log('ParallelCoords.resize()');

            this.dims = pv.keys(this.measures);

            /* Sizing and scales. */

            if(this.showTable) {
                this.w = (utils.getClientWidth(this));
                this.h = Math.floor((utils.getClientHeight(this))*.66);
                this.tableDiv.style.top = ""+(this.h+400)+"px";
            } else {
                this.w = utils.getClientWidth(this)-20;
                this.h = utils.getClientHeight(this)-20;
            }
            this.svgDiv.style.width=""+this.w+"px";
            this.svgDiv.style.height=""+this.h+"px";

            this.w = this.w-120;
            this.h = this.h-60;

            this.x = pv.Scale.ordinal(this.dims).splitFlush(0, this.w);

            this.y = pv.dict(this.dims, lang.hitch(this, function(t) {
                return pv.Scale.linear(
                    this.dataObj.filter(
                        function(d) { return !isNaN(d[t]); }
                   ),
                    function(d) { return Math.floor(d[t])-0.5; },
                    function(d) { return Math.ceil(d[t]) +0.5; }
               ).range(0, this.h);
            }));

            this.c = pv.dict(this.dims, lang.hitch(this, function(t) {
                return pv.Scale.linear(
                        this.dataObj.filter(function(d) { return !isNaN(d[t]); }),
                        function(d) { return Math.floor(d[t])-0.5; },
                        function(d) { return Math.ceil(d[t]) +0.5; })
                    .range("#ff0000", "#00ff00");
            }));

            /* Interaction state. */
            this.filter = pv.dict(this.dims, lang.hitch(this, function(t) {
                return {min: this.y[t].domain()[0], max: this.y[t].domain()[1]};
            }));

            this.active = this.defaultMeasure;

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

            /* The root panel. */
            var vis = new pv.Panel()
                        .width(this.w)
                        .height(this.h)
                        .left(60)
                        .right(60)
                        .top(40)
                        .bottom(20)
                        .canvas(this.svgDiv);

            // The parallel coordinates display.
            vis.add(pv.Panel)
                .data(this.dataObj)
                .visible(lang.hitch(this, function(d) {
                    var visible = true;
                    for(var idx=0; idx<this.dims.length; idx++) {
                        var t = this.dims[idx];
                        visible &= (d[t] >= this.filter[t].min) && (d[t] <= this.filter[t].max);
                    }
                    return visible;
                }))
              .add(pv.Line)
                .data(this.dims)
                .left(lang.hitch(this, function(t, d) { return this.x(t); }))
                .bottom(lang.hitch(this, function(t, d) { return this.y[t](d[t]); }))
                .strokeStyle("#ddd")
                .lineWidth(1)
                .antialias(false);

            // Rule per dimension.
            var rule = vis.add(pv.Rule)
                .data(this.dims)
                .left(this.x);

            // Dimension label
            rule.anchor("top").add(pv.Label)
                .top(-12)
                .font(this.labelFontStr)
                .textStyle(this.labelColor)
                .text(lang.hitch(this, function(d) { return this.measures[d].name; }));

            // The parallel coordinates display.
            this.change = vis.add(pv.Panel);

            this.change.add(pv.Panel)
                .data(this.dataObj)
                .visible(lang.hitch(this, function(d) {
                    var visible = true;
                    for(var idx=0; idx<this.dims.length; idx++) {
                        var t = this.dims[idx];
                        visible &= (d[t] >= this.filter[t].min) && (d[t] <= this.filter[t].max);
                    }
                    if(visible) {
                        this.selections.push(d);
                    }
                    return visible;
                }))
              .add(pv.Line)
                .data(this.dims)
                .left(lang.hitch(this, function(t, d) { return this.x(t); }))
                .bottom(lang.hitch(this, function(t, d) { return this.y[t](d[t]); }))
                .strokeStyle(lang.hitch(this, function(t, d) { return this.c[this.active](d[this.active]); }))
                .lineWidth(1)
                .text(function(t, d) { return d.tooltip; })
                .title("")
                .events("all")
                .event('mousemove', pv.Behavior.tipsy(tipOptions));

            this.handles = this.dims.map(lang.hitch(this, function(dim) { return {y:0, dy:this.h, dim:dim}; }));

            /* Handle select and drag */
            var handle = this.change.add(pv.Panel)
                .data(this.handles)
                .left(lang.hitch(this, function(t) { return this.x(t.dim) - 30; }))
                .width(60)
                .fillStyle("rgba(0,0,0,.001)")
                .cursor("crosshair")
                .event("mousedown", pv.Behavior.select())
                .event("select", lang.hitch(this, this.update))
                .event("selectend", lang.hitch(this, this.selectAll))
                .event("selectstart", lang.hitch(this, this.mouseDown))
              .add(pv.Bar)
                .left(25)
                .top(function(d) { return d.y; })
                .width(10)
                .height(function(d) { return d.dy; })
                .fillStyle(lang.hitch(this, function(t) {
                    return t.dim == this.active
                    ? this.c[t.dim]((this.filter[t.dim].max + this.filter[t.dim].min) / 2)
                    : "hsla(0,0,50%,.5)"; }))
                .strokeStyle("white")
                .cursor("move")
                .event("mousedown", pv.Behavior.drag())
                .event("dragstart", lang.hitch(this, this.update))
                .event("drag", lang.hitch(this, this.update));

            handle.anchor("bottom").add(pv.Label)
                .textBaseline("top")
                .font(this.labelFontStr)
                .textStyle(this.labelColor)
                .text(lang.hitch(this, function(d) { return this.filter[d.dim].min.toFixed(0); }));

            handle.anchor("top").add(pv.Label)
                .textBaseline("bottom")
                .font(this.labelFontStr)
                .textStyle(this.labelColor)
                .text(lang.hitch(this, function(d) { return this.filter[d.dim].max.toFixed(0); }));

                if(this.debug) console.log('ParallelCoords.resize rendering');
                vis.render();
        };

        this.mouseUp = function() {
            this.mouseDown = false;
        };

        this.mouseDown = function() {
            this.mouseDown = true;
        };

        this.init = function() {

            if(this.debug) console.log('ParallelCoords.init()');
            this.allStr = Messages.getString('all');

            this.svgDiv = document.createElement('DIV');
            this.element.appendChild(this.svgDiv);
            this.svgDiv.id = "svgDiv";
    //        this.svgDiv.style.position="absolute";
            this.svgDiv.style.top="0px";
            this.svgDiv.style.left="0px";
            this.svgDiv.style.width="90%";
            this.svgDiv.style.height="90%";
    //        this.svgDiv.style.overflow="hidden";
            this.svgDiv.style.textAlign="left";
            if(this.debug) console.log('ParallelCoords.done()');
            this.tableDiv = document.createElement('DIV');
            this.element.appendChild(this.tableDiv);
            this.tableDiv.id = "tableDiv";
            this.centerNode = document.createElement('CENTER');
            this.tableDiv.appendChild(this.centerNode);
        };

        this.processData = function() {
            if(this.debug) console.log('ParallelCoords.processData()');

            this.rowsCols = [];
            this.measuresCols = [];

            this.measures = {};

            for(var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
                var dataReq = this.dataTable.getColumnProperty(colNo,'dataReq');
                if(dataReq) {
                    for (var idx=0; idx < dataReq.length; idx++) {
                        if(dataReq[idx].id == 'cols') {
                            this.rowsCols.push(colNo);
                        }
                        else if(dataReq[idx].id == 'measures') {
                            this.measuresCols.push(colNo);
                            var id = this.dataTable.getColumnId(colNo);
                            var name = this.dataTable.getColumnLabel(colNo);
                            this.measures[id] = {
                                name: name,
                                unit: ""
                            };
                        }
                    }
                }
            }

            this.dataObj = [];
            // create the data object
            for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
                var name = '';
                var tooltip = '';
                for(var idx=0; idx<this.rowsCols.length; idx++) {
                    if(idx > 0) {
                        name += ' ~ ';
                    }
                    name    += this.dataTable.getFormattedValue(rowNo,this.rowsCols[idx]);
                    tooltip += this.dataTable.getColumnLabel(this.rowsCols[idx]) + ': '+this.dataTable.getFormattedValue(rowNo,this.rowsCols[idx])+"</br>";
                }

                var obj = {
                    name:   name,
                    rowIdx: rowNo
                };

                for(var idx=0; idx<this.measuresCols.length; idx++) {
                    obj[this.dataTable.getColumnId(this.measuresCols[idx])] = this.dataTable.getValue(rowNo, this.measuresCols[idx]);
                    tooltip += this.dataTable.getColumnLabel(this.measuresCols[idx]) + ': '+this.dataTable.getFormattedValue(rowNo,this.measuresCols[idx])+"</br>";
                }

                obj.tooltip = tooltip;
                this.dataObj.push(obj);
            }

            this.defaultMeasure = this.dataTable.getColumnId(this.measuresCols[0]);
        };

        // Updater for slider and resizer.
        this.update = function(d) {
          var t = d.dim;
          this.filter[t].min = Math.max(this.y[t].domain()[0], this.y[t].invert(this.h - d.y - d.dy));
          this.filter[t].max = Math.min(this.y[t].domain()[1], this.y[t].invert(this.h - d.y));
          this.active = t;
          this.selections = [];
          this.change.render();
          this.updateSelections();
          return false;
        };

        this.resetSliders = function() {
            for(var idx=0; idx<this.handles.length; idx++) {
                var d = this.handles[idx];
                var t = d.dim;
                this.filter[t].min = Math.max(this.y[t].domain()[0], this.y[t].invert(0));
                this.filter[t].max = Math.min(this.y[t].domain()[1], this.y[t].invert(this.h));
                d.y = 0; d.dy = this.h;
                this.active = t;
                this.change.render();
            }
            this.selections = [];
            this.resize();
            this.updateSelections();
        };

        // Updater for slider and resizer.
        this.selectAll = function(d) {
          this.mouseUp();
          if (d.dy < 3) {
            var t = d.dim;
            this.filter[t].min = Math.max(this.y[t].domain()[0], this.y[t].invert(0));
            this.filter[t].max = Math.min(this.y[t].domain()[1], this.y[t].invert(this.h));
            d.y = 0; d.dy = this.h;
            this.active = t;
            this.selections = [];
            this.change.render();
            this.updateSelections();
          }
          return false;
        };

        this.updateSelections = function() {
            if(this.selections.length == this.dataObj.length) {
                // every thing is selected - so nothing is selected
                this.selections = [];
            }

            if(this.selections.length == 0) {
                utils.clearSelections();
                utils.updateSelectionTable(this.table, this.dataTable, this.selections, this.labelFontStr, this.labelColor);
                return;
            }

            var selectionList = [];

            for(var idx=0; idx<this.selections.length; idx++) {
                var selection = {
                    rowId:   [],
                    rowIdx:  this.selections[idx].rowIdx,
                    rowItem: [],
                    colItem: [],
                    colId:   [],
                    type:    'row'
                };

                for(var colNo=0; colNo<this.rowsCols.length; colNo++) {
                    selection.rowId.push(this.dataTable.getColumnId(this.rowsCols[colNo]));
                    selection.rowItem.push(this.dataTable.getValue(this.selections[idx].rowIdx,this.rowsCols[colNo]));
                }
                selectionList.push(selection);
            }

            var args = {
                mode: "REPLACE",
                type: 'row',
                source: this,
                selections: selectionList
            };

            visualEvents.trigger(this, "select", args);

            if(this.showTable) {
                utils.updateSelectionTable(this.table, this.dataTable, this.selections, this.labelFontStr, this.labelColor);
            }
        };

        this.init();
    }
});
