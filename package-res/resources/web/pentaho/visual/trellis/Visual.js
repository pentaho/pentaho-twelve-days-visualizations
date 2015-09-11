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
    "pentaho/visual/color/utils",
    "cdf/lib/CCC/protovis",
    "dojo/_base/lang",
    "pentaho/common/Messages",
    "css!../table"
], function(utils, paletteRegistry, visualColorUtils, pv, lang, Messages) {
    /*global cv:true*/
    return Trellis;

    function Trellis(div) {

        var localThis = this;

        this.debug = false;

        if(this.debug) console.log('Trellis.create');

        this.element = div;

        this.data = [];
        this.labelColor = "#000000";
        this.w = 200;
        this.h = 200;
        this.plotAreaColor = "rgba(240,240,240,";
        this.vis = null;
        this.backgroundColor = "rgba(255,255,255,";
        this.rootPanel = null;
        this.allStr = "All";
        this.sideMargin = 90;
        this.topMargin = 90;
        this.legendWidth = 150;
        this.colors = paletteRegistry.get("twelveDaysViz").colors;
        this.showTable = true;
        this.highlights = [];

        // These are the highlighting functions
        this.clearHighlights = function() {
            if(this.debug) console.log('Trellis.clearHighlights()');
            for(var idx=0; idx<this.highlights.length; idx++) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        this.setHighlights = function(lights) {
            if(this.debug) console.log('Trellis.setHighlights()');
            if(!lights || lights.length == 0) {
                this.clearHighlights();
                this.highlight();
            }
        };

        this.highlight = function() {
            if(this.debug) console.log('Trellis.highlight()');

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
            if(this.debug) console.log('Trellis.draw()');
            this.dataTable = dataTable;
            this.drawSpec  = drawSpec;

            utils.handleCommonOptions(this, drawSpec);

            if(drawSpec.sideMargin) this.sideMargin = drawSpec.sideMargin;
            if(drawSpec.topMargin) this.topMargin = drawSpec.topMargin;
            if(drawSpec.showTable != null) this.showTable = !!drawSpec.showTable;

            utils.applyBackground(this.element, drawSpec);

            this.processData();

            this.highlights = [];

            this.resize();
        };

        this.resize = function() {

            if(this.debug) console.log('Trellis.resize()');

            /* Size parameters. */
            var padding = 30;
            var w = this.getClientWidth() - (2*this.sideMargin) - (padding*this.measures.length) - this.legendWidth;

            var chartClientHeight = this.getClientHeight();

            // Reserve 30% of space to the table and scroll the rest
            if(this.showTable) chartClientHeight *= 0.7;

            var h = chartClientHeight - (2*this.topMargin) - (padding*this.measures.length);

            var minSize = Math.min(w, h);
            var size = (minSize)/this.measures.length;

            w = ((size + padding) * this.measures.length) + 2*this.sideMargin + this.legendWidth;
            h = ((size + padding) * this.measures.length) + 2*this.topMargin;

            /* Scales for color and position. */
            while(this.svgDiv.firstChild) {
                this.svgDiv.removeChild(this.svgDiv.firstChild);
            }

            var grey = pv.rgb(144, 144, 144, .2);

            var position = pv.dict(this.measures, function(t) {
                    return pv.Scale.linear(localThis.dataObj, function(d) { return d[t]; })
                       .range(0, size);
                });

            this.position = position;
            this.size = size;

            var center = document.createElement('CENTER');
            this.svgDiv.appendChild(center);

            if(this.debug) console.log('creating main panel');
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

            if(this.debug) console.log('creating cells');
            /* One cell per trait pair. */
            var cell = vis.add(pv.Panel)
                .data(this.measures)
                .top(function() { return (this.parent.topMargin) + this.index * (size + padding) + padding / 2; })
                .height(size)
              .add(pv.Panel)
                .data(function(y) { return this.parent.parent.measures.map(function(x) { return ({px:x, py:y}); }); })
                .left(function() { return (this.parent.parent.sideMargin + this.parent.parent.legendWidth) + this.index * (size + padding) + padding / 2; })
                .width(size);

            vis.add(pv.Panel)
                .width(this.legendWidth)
                .height(h)
                .left(0)
                .right(0);

            if(this.debug) console.log('creating diagonal');

            /* Framed dot plots not along the diagonal. */
            var plot = cell.add(pv.Panel)
                .visible(function(t) { return t.px != t.py; })
                .strokeStyle("#aaa");

            plot.sideMargin = this.sideMargin;

            /* X-axis ticks. */
            if(this.debug) console.log('creating x-axis');
            var xtick = plot.add(pv.Rule)
                .data(function(t) { return position[t.px].ticks(5); })
                .left(function(d, t) { return position[t.px](d); })
                .strokeStyle("#eee");

            /* Bottom label. */
            if(this.debug) console.log('creating bottom label');
            xtick.anchor("bottom").add(pv.Label)
                .visible(function() { return (cell.parent.index == cell.parent.parent.measures.length - 1); })
                .text(function(d, t) { return position[t.px].tickFormat(d); })
                .textStyle(this.labelColor)
                .textAlign("right")
                .textAngle(-Math.PI/4)
                .font(this.labelFontStr);

            /* Top label. */
            if(this.debug) console.log('creating top label');
            xtick.anchor("top").add(pv.Label)
                .visible(function() { return (cell.parent.index == 0); })
                .text(function(d, t) { return position[t.px].tickFormat(d); })
                .textStyle(this.labelColor)
                .textAlign("left")
                .textAngle(-Math.PI/4)
                .font(this.labelFontStr);

            /* Y-axis ticks. */
            if(this.debug) console.log('creating y-axis ticks');
            var ytick = plot.add(pv.Rule)
                .data(function(t) { return position[t.py].ticks(5); })
                .bottom(function(d, t) { return position[t.py](d); })
                .strokeStyle("#eee");

            /* Left label. */
            if(this.debug) console.log('creating left label');
            ytick.anchor("left").add(pv.Label)
                .visible(function() { return (cell.index == 0); })
                .text(function(d, t) { return position[t.py].tickFormat(d); })
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            /* Right label. */
            if(this.debug) console.log('creating right label');
            ytick.anchor("right").add(pv.Label)
                .visible(function() { return (cell.index == cell.parent.parent.measures.length - 1); })
                .text(function(d, t) { return position[t.py].tickFormat(d); })
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            /* Frame and dot plot. */
            if(this.debug) console.log('creating dot plots');
            this.dot = plot.add(pv.Dot)
                .data(this.dataObj)
                .left(function(d, t) { return position[t.px](d[t.px]); })
                .bottom(function(d, t) { return position[t.py](d[t.py]); })
                .shapeSize(10)
                .strokeStyle(null)
                .fillStyle(function(d) {
                    var s = localThis.s;
                    var unselected = s &&
                        ((d[s.px] < s.x1) || (d[s.px] > s.x2) ||
                         (d[s.py] < s.y1) || (d[s.py] > s.y2));
                    this.root.viz.highlights[d.rowIdx] = !unselected;
                    return unselected ? grey : this.root.colorFunc(d);
                });

            /* Interaction: new selection and display and drag selection */
            if(this.debug) console.log('creating selection panels');
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
                })
               .event("select", lang.hitch(this, this.update))
             .add(pv.Bar)
               .visible(function(d, k, t) {
                    var s = localThis.s;
                    return s && s.px == t.px && s.py == t.py;
                })
               .left(function(d) { return d.x; })
               .top(function(d) { return d.y; })
               .width(function(d) { return d.dx; })
               .height(function(d) { return d.dy; })
               .fillStyle("rgba(0,0,0,.15)")
               .strokeStyle("white")
               .cursor("move")
               .event("mousedown", pv.Behavior.drag())
               .event("drag", lang.hitch(this, this.update));

            /* Labels along the diagonal. */
            if(this.debug) console.log('creating diagonal labels');
            cell.anchor("center").add(pv.Label)
                .visible(function(t) { return t.px == t.py; })
                .textStyle(this.labelColor)
                .font(this.labelFontStr)
                .text(function(t) { return t.px.replace(/([WL])/, " $1").toLowerCase(); });

            /* Legend. */
            if(this.debug) console.log('creating legend');
            vis.add(pv.Dot)
                .data(this.colorBy)
                .top(function() { return 25 + this.index * (this.parent.labelSize * 1.8); })
                .left(10)
                .shapeSize(20)
                .strokeStyle(null)
                .fillStyle(function(d) { return this.parent.colorFunc(d); })
                .font(this.labelFontStr)
              .anchor("right").add(pv.Label)
              .textStyle(this.labelColor)
                .font(this.labelFontStr);

            center = document.createElement('CENTER');
            this.svgDiv.appendChild(center);
            var table = document.createElement('TABLE');
            center.appendChild(table);
            if(this.showTable) {
                utils.createSelectionTable(table, this.dataTable, this.labelFontStr, this.labelColor);
            }

            if(this.debug) console.log('rendering');
            vis.render();
        };

        // rootPanel method
        this.getColor = function(d) {
            if(this.viz.paletteMap && d.colorByLabel) {
                return this.viz.paletteMap[d.colorByLabel];
            }
            if(this.viz.paletteMap && this.viz.paletteMap[d]) {
                return this.viz.paletteMap[d];
            }
            return localThis.colors[0];
        };

        this.init = function() {
            if(this.debug) console.log('Trellis.init()');
            this.allStr = Messages.getString('all');

            this.svgDiv = document.createElement('DIV');
            this.element.appendChild(this.svgDiv);
            this.svgDiv.id = "svgDiv";
            this.svgDiv.style.position="absolute";
            this.svgDiv.style.top="0px";
            this.svgDiv.style.left="0px";
            this.svgDiv.style.width="100%";
            this.svgDiv.style.height="100%";
            this.svgDiv.style.textAlign="left";
            this.svgDiv.style.overflowY="auto";
            if(this.debug) console.log('Trellis.done()');
        };

        this.getRoleFirstColumnIndex = function(name) {
            return this.drawSpec[name] ? this.dataTable.getColumnIndexByAttribute(this.drawSpec[name][0]) : -1;
        };

        this.getRoleColumnIndexes = function(roleName) {
            var attrNames = this.drawSpec[roleName];
            return attrNames
                ? attrNames.map(this.dataTable.getColumnIndexByAttribute, this.dataTable)
                : [];
        };

        this.processData = function() {
            this.rowsCols = this.getRoleColumnIndexes("cols");
            this.colorByCol = this.getRoleFirstColumnIndex("colorby");
            this.measuresCols = this.getRoleColumnIndexes("measures");
            this.measures = this.measuresCols.map(this.dataTable.getColumnLabel, this.dataTable);

            if(this.colorByCol != -1) {
                this.colorBy    = this.dataTable.getDistinctFormattedValues(this.colorByCol);
                this.paletteMap = visualColorUtils.createPaletteMap(this.colorBy, this.colors);
            } else {
                this.colorBy = [this.allStr];
            }

            this.dataObj = [];
            // create the data object
            for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
                var obj = {
                };
                if(this.colorByCol != -1) {
                    obj.colorBy = this.dataTable.getValue(rowNo, this.colorByCol);
                    obj.colorByLabel = this.dataTable.getFormattedValue(rowNo, this.colorByCol);
                } else {
                    obj.colorBy = this.allStr;
                    obj.colorByLabel = this.allStr;
                }
                for(var idx=0; idx<this.measuresCols.length; idx++) {
                    obj[this.measures[idx]] = this.dataTable.getValue(rowNo, this.measuresCols[idx]);
                }
                obj['rowIdx'] = rowNo;
                this.dataObj.push(obj);
            }
        };

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
            this.dot.context(null, 0, function() { this.render(); });

            var table = document.getElementById('datalist');

            if(this.showTable) {
                var rows = [];
                for(var idx=0; idx<this.highlights.length; idx++) {
                    if(this.highlights[idx]) rows.push({rowIdx: idx});
                }
                utils.updateSelectionTable(table, this.dataTable, rows, this.labelFontStr, this.labelColor);
            }
        };

        this.init();
    }
});
