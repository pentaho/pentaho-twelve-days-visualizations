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
    "pentaho/visual/events",
    "cdf/lib/CCC/protovis",
    "dojo/_base/lang",
    "pentaho/common/Messages",
    "cdf/lib/CCC/tipsy"
], function(utils, paletteRegistry, colorUtils, visualEvents, pv, lang, Messages) {

    return Calendar;

    function Calendar(div) {

        this.debug = false;

        if(this.debug) console.log('Calendar.create');

        this.element = div;

        this.labelColor = "#ffffff";
        this.w = 200;
        this.h = 200;
        this.rootPanel = null;
        this.format = pv.Format.number();
        this.data = [];
        this.mouseOverNode = null;
        this.highLightsSet = false;
        this.highlights = [];
        this.colorByTooltipHint = "(color)";
        this.sizeByTooltipHint = "(size)";
        this.calendarBackgroundColor = "#cccccc";
        this.gradient = {
            color1: "#ff0000",
            color2: "#ffff00",
            color3: "#00ff00",
            threshold1: '',
            threshold2: ''
        };

        this.clearHighlights = function() {
            if(this.debug) console.log('Calendar.clearHighlights()');
            this.highlights = [];
            var n = this.dataTable ? this.dataTable.getNumberOfRows() : this.highlights.length;
            for(var idx=0; idx<n; idx++) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        this.setHighlights = function(lights) {
            if(this.debug) console.log('Calendar.setHighlights()');
            if(!lights || lights.length == 0) {
                this.clearHighlights();
                this.highlight();
            }
        };

        this.highlight = function() {
            if(this.debug) console.log('Calendar.highlight()');
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
            if(this.debug) console.log('Calendar.draw()', drawSpec);

            this.drawSpec = drawSpec;

            switch(drawSpec.action) {
                case "change:gradient1":
                    this.gradient = this.drawSpec.gradient1;
                    this.resize();
                    break;

                case "change:backgroundcolor":
                    var color = this.drawSpec.backgroundcolor;
                    if(color && color != this.calendarBackgroundColor) {
                        this.calendarBackgroundColor = color;
                        this.resize();
                    }
                    break;
            }

            this.dataTable = dataTable;

            this.clearHighlights();

            if(drawSpec.gradient1) {
                this.gradient = drawSpec.gradient1;
            }

            if(drawSpec.backgroundcolor) {
                this.calendarBackgroundColor = this.drawSpec.backgroundcolor;
            }

            utils.handleCommonOptions(this, drawSpec);

            utils.applyBackground(this.element, drawSpec);

            this.processData();

            this.resize();
        };

        this.resize = function() {

            if(this.debug) console.log('Calendar.resize()');

            console.log(this.gradient);
            this.colorRange = [this.gradient.color1,this.gradient.color2,this.gradient.color3];
            if(this.gradient.threshold1 && ''+parseFloat(this.gradient.threshold1) != "NaN") {
                this.colorMinValue = parseFloat(this.gradient.threshold1);
            }
            if(this.gradient.threshold2 && ''+parseFloat(this.gradient.threshold2) != "NaN") {
                this.colorMaxValue = parseFloat(this.gradient.threshold2);
            }

            /* Size parameters. */
            this.w = utils.getClientWidth(this)-40;
            this.h = utils.getClientHeight(this)-40;

            this.cellSize = 14;

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

            if(this.debug) console.log('adding Calendar layout');

            this.colors = paletteRegistry.get().colors;

            // create the background
            var dates = [];
            for(var yearNo=0; yearNo<this.years.length; yearNo++) {
                var year = this.years[yearNo];
                var date = new Date(year, 0, 1);
                var yearStart = new Date(year,0,1);
                var dayOfWeek = yearStart.getDay();
                for(var dayNo=0; dayNo<366; dayNo++) {
                    if(date.getFullYear() == year) {

                        var week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + dayOfWeek+1)/7);
                        var d = {
                            year:  date.getFullYear(),
                            month: date.getMonth()+1,
                            day:   date.getDate(),
                            week:  week,
                            dayOfWeek: date.getDay()
                        };
                        dates.push(d);
                    }

                    date.setMilliseconds(date.getMilliseconds()+1000*60*60*24);
                }
            }

            /* Root panel. */
            if(this.debug) console.log('resizing main panel', this.rootPanel);
            this.svgDiv.style.height = ''+this.h+'px';
            this.svgDiv.style.width = ''+this.w+'px';
            this.rootPanel = new pv.Panel()
                .width(Math.max(this.w,970))
                .height(Math.max(this.h, 140*this.years.length))
                .left(20)
                .top(20)
                .canvas(this.svgDiv);

            this.rootPanel.vis = this;

            console.log("calendarBackgroundColor", this.calendarBackgroundColor);

            // add the calendar background
            this.rootPanel.add(pv.Dot)
                .data(dates)
                .left(function(d) {
                    return (d.week + d.month) * this.root.vis.cellSize +
                        this.root.vis.cellSize / 2;
                    })
                .top(function(d) {
                    return (d.year - this.root.vis.minYear) * (this.root.vis.cellSize * 10) +
                        (d.dayOfWeek * this.root.vis.cellSize) +
                        this.root.vis.cellSize / 2;
                })
                .shapeSize(35)
                .shape("square")
                .fillStyle(function() {return this.root.vis.calendarBackgroundColor; })
                .strokeStyle(function() {return this.root.vis.calendarBackgroundColor; });

            // add the month names
            var leftPos = function() {
                    return this.index * this.root.vis.cellSize * (64 / 12) +
                        this.root.vis.cellSize * 4;
                };

            for(var idx=0; idx<this.years.length; idx++) {
                this.rootPanel.add(pv.Label)
                    .data(this.months)
                    .left(leftPos)
                    .top(idx * this.cellSize * 10)
                    .textAlign("center")
                    .textStyle(this.labelColor)
                    .font(this.labelFontStr);
            }

            this.dotPanel = this.rootPanel.add(pv.Panel);

            // add the dots for the data set
            this.dotPanel.add(pv.Dot)
                .data(this.data)
                .left(function(d) {
                    var left;
                    if(this.root.vis.dayCol != -1 || this.root.vis.dateCol != -1) {
                        left = (d.week + d.month) * this.root.vis.cellSize +
                               this.root.vis.cellSize / 2;
                    } else {
                        left = (d.week + d.month) * this.root.vis.cellSize +
                               this.root.vis.cellSize / 2 +
                               this.root.vis.cellSize * 2.5;
                    }
                    d.x = left;
                    d.left = function() { return 200; };
                    return left;
                })
                .top(function(d) {
                    var top;
                    if(this.root.vis.dayCol != -1 || this.root.vis.dateCol != -1) {
                        top = (d.year - this.root.vis.minYear) * (this.root.vis.cellSize * 10) +
                              (d.dayOfWeek * this.root.vis.cellSize) +
                              this.root.vis.cellSize / 2;
                    } else {
                        top = (d.year-this.root.vis.minYear) * (this.root.vis.cellSize * 10) +
                              3.5 * this.root.vis.cellSize;
                    }
                    d.y = top;
                    return top;
                })
                .shapeSize(lang.hitch(this, function(d) {
                    var size;
                    if(this.dayCol != -1 || this.dateCol != -1) {
                        if(!d.sizeValue) {
                            size = 40;
                        } else {
                            size = 15 + (d.sizeValue - this.sizeMinValue) /
                                        (this.sizeMaxValue-this.sizeMinValue) * 60;
                        }
                    } else {
                        if(!d.sizeValue) {
                            size = 250;
                        } else {
                            size = 50 + (d.sizeValue - this.sizeMinValue) /
                                        (this.sizeMaxValue-this.sizeMinValue) * 200;
                        }
                    }
                    d.dx = size;
                    d.dy = size;
                    return size;
                }))
                .shape("circle")
                .fillStyle(lang.hitch(this, this.getColor))
                .strokeStyle(lang.hitch(this, function(d) {
                    return d == this.mouseOverNode ? "#000000" : "#dddddd";
                }))
                .lineWidth(1)
                .text(function(d) {return d.tooltip; })
                .title("")
                .events("all")
                .event('click', function(d) {
                    this.root.vis.mouseClick(d);
                })
                .event('mousemove', pv.Behavior.tipsy(tipOptions));
                // TODO (dleao): this was throwing, so I commented it.
                /*
                .event('mouseout', function(d) {
                    this.root.vis.mouseOut(d);
                })
                */

            // add the year labels
            this.rootPanel.add(pv.Label)
                .data(this.years)
                .left(0)
                .top(function(d) {
                    return (d-this.root.vis.minYear) * (this.root.vis.cellSize*10) + 3.5*this.root.vis.cellSize;
                })
                .textAlign("center")
                .textAngle(-Math.PI/2)
                .textStyle(this.labelColor)
                .font(this.labelFontStr);

            /*
            this.dotPanel
                .data([{x:0, y:0, dx:100, dy:100}])
                .cursor("crosshair")
                .events("all")
                .event("mousedown", pv.Behavior.select())
                .event("select", dojo.hitch(this, this.update))
                .event("selectend", dojo.hitch(this, this.update))
                ;

            this.selectPanel = this.dotPanel.add(pv.Panel);

            this.selectPanel.data([{x:0, y:0, dx:100, dy:100}])
                .fillStyle("rgba(0,0,0,.5)")
                ;
            */

            if(this.debug) console.log('rendering');
            this.rootPanel.render();

        };

        this.getColor = function(d) {
            var color = pv.color("#ffffff");
            if(typeof d.colorValue == 'undefined') {
                return color;
            }

            if(this.scalingType == "linear") {
                color = colorUtils.getRgbGradient(d.colorValue, this.colorMinValue, this.colorMaxValue, this.colorRange);
            } else {
                color = colorUtils.getRgbStep(d.colorValue, this.colorMinValue, this.colorMaxValue, this.colorRange);
            }

            if(typeof color === "string") {
                var rgbColor = colorUtils.parseColor(color);

                color = new pv.Color.Rgb(rgbColor[0], rgbColor[1], rgbColor[2], 1);

                if(this.highLightsSet && !this.highlights[d.rowIdx]) {
                    color = color.alpha(0.2);
                }
            }

            return color;
        };

        this.mouseMove = function(d, t) {
            if(this.debug) console.log("Calendar mouseMove()", d);
            this.mouseOverNode = d;
            d.panel.render();
        };

        this.mouseOut = function(d, t) {
            if(this.debug) console.log("Calendar mouseOut()", d);
            this.mouseOverNode = null;
            d.panel.render();
        };

        this.mouseClick = function(source) {
            if(this.debug) console.log("Calendar mouseClick()", source);

            var targetNode = source;

            if(targetNode.rowIdx == -1) {
                // cannot select this
                return;
            }

            // create a selection object
            this.highlights[targetNode.rowIdx] = !this.highlights[targetNode.rowIdx];
            this.highlight();

            var rowIdx = targetNode.rowIdx;

            var selection = {
                rowId:   [],
                rowIdx:  rowIdx,
                rowItem: [],
                colItem: [],
                colId:   [],
                type:    'row'
            };

            if(this.dateCol != -1) {
                selection.rowId.push(this.dataTable.getColumnId(this.dateCol));
                selection.rowItem.push(this.dataTable.getValue(rowIdx,this.dateCol));
            } else {
                selection.rowId.push(this.dataTable.getColumnId(this.yearCol));
                selection.rowItem.push(this.dataTable.getValue(rowIdx,this.yearCol));
                selection.rowId.push(this.dataTable.getColumnId(this.monthCol));
                selection.rowItem.push(this.dataTable.getValue(rowIdx,this.monthCol));
                if(this.dayCol != -1) {
                    selection.rowId.push(this.dataTable.getColumnId(this.dayCol));
                    selection.rowItem.push(this.dataTable.getValue(rowIdx,this.dayCol));
                }
            }

            var args = {
                mode: this.highLightsSet ? "TOGGLE" : "REPLACE",
                type: 'row',
                source: this,
                selections: this.highLightsSet ? [selection] : []
            };

            if(this.debug) console.log('selecting',args);

            visualEvents.trigger(this, "select", args);

            if(!this.highLightsSet) {
                if(this.debug) console.log("SunBurst clearing selections");
                utils.clearSelections();
                // null out the pending selection
            }

        };

        /* Compute new index values, rescale if needed, and render.
        this.update = function(d, t) {
            if(this.debug) console.log('Calendar.update()');
        };
        */

        this.init = function() {

            if(this.debug) console.log('Calendar.init()');

            this.colorByTooltipHint = Messages.getString("colorByTooltipHint");
            this.sizeByTooltipHint = Messages.getString("sizeByTooltipHint");

            this.svgDiv = document.createElement('DIV');
            this.element.appendChild(this.svgDiv);
            this.svgDiv.id = "svgDiv";
            this.svgDiv.style.position="absolute";
            this.svgDiv.style.top="0px";
            this.svgDiv.style.left="0px";
            this.svgDiv.style.width="99%";
            this.svgDiv.style.height="99%";
            this.svgDiv.style.textAlign="center";

            this.months = [];
            this.months[0] = Messages.getString('jan');
            this.months[1] = Messages.getString('feb');
            this.months[2] = Messages.getString('mar');
            this.months[3] = Messages.getString('apr');
            this.months[4] = Messages.getString('may');
            this.months[5] = Messages.getString('jun');
            this.months[6] = Messages.getString('jul');
            this.months[7] = Messages.getString('aug');
            this.months[8] = Messages.getString('sep');
            this.months[9] = Messages.getString('oct');
            this.months[10] = Messages.getString('nov');
            this.months[11] = Messages.getString('dec');

            this.monthMap={};
            this.monthMap[Messages.getString('jan')] = 1;
            this.monthMap[Messages.getString('feb')] = 2;
            this.monthMap[Messages.getString('mar')] = 3;
            this.monthMap[Messages.getString('apr')] = 4;
            this.monthMap[Messages.getString('may')] = 5;
            this.monthMap[Messages.getString('jun')] = 6;
            this.monthMap[Messages.getString('jul')] = 7;
            this.monthMap[Messages.getString('aug')] = 8;
            this.monthMap[Messages.getString('sep')] = 9;
            this.monthMap[Messages.getString('oct')] = 10;
            this.monthMap[Messages.getString('nov')] = 11;
            this.monthMap[Messages.getString('dec')] = 12;
            this.monthMap[Messages.getString('jan2')] = 1;
            this.monthMap[Messages.getString('feb2')] = 2;
            this.monthMap[Messages.getString('mar2')] = 3;
            this.monthMap[Messages.getString('apr2')] = 4;
            this.monthMap[Messages.getString('may2')] = 5;
            this.monthMap[Messages.getString('jun2')] = 6;
            this.monthMap[Messages.getString('jul2')] = 7;
            this.monthMap[Messages.getString('aug2')] = 8;
            this.monthMap[Messages.getString('sep2')] = 9;
            this.monthMap[Messages.getString('oct2')] = 10;
            this.monthMap[Messages.getString('nov2')] = 11;
            this.monthMap[Messages.getString('dec2')] = 12;
        };

        this.getRoleFirstColumnIndex = function(name) {
            return this.drawSpec[name] ? this.dataTable.getColumnIndexByAttribute(this.drawSpec[name][0]) : -1;
        };

        this.processData = function() {

            if(this.debug) console.log('Calendar.processData()');

            this.colorByCol = this.getRoleFirstColumnIndex("colorby");
            this.sizeByCol  = this.getRoleFirstColumnIndex("sizeby");
            this.dateCol = this.getRoleFirstColumnIndex("date");
            this.yearCol = this.getRoleFirstColumnIndex("year");
            this.monthCol = this.getRoleFirstColumnIndex("month");
            this.dayCol = this.getRoleFirstColumnIndex("day");
            this.data = [];

            this.colorMinValue = null;
            this.colorMaxValue = null;
            this.sizeMinValue = null;
            this.sizeMaxValue = null;
            this.totalValue = 0;
            this.minYear = null;
            var yearSet = {};
            var year;

            for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
                var colorValue = 1;
                var sizeValue;
                var tooltip = "";
                var str;

                if(this.colorByCol != -1) colorValue = this.dataTable.getValue(rowNo, this.colorByCol);
                if(this.sizeByCol  != -1) sizeValue  = this.dataTable.getValue(rowNo, this.sizeByCol );

                var month, day, date;
                if(this.yearCol != -1)
                  year = parseInt(this.dataTable.getFormattedValue(rowNo, this.yearCol), 10);

                if(this.monthCol != -1) {
                    str = this.dataTable.getFormattedValue(rowNo, this.monthCol);
                    month = parseInt(str, 10);
                    if(!(month >= 1) || !(month <= 12)) {
                        month = this.monthMap[str];
                    }
                }

                if(this.dayCol != -1) {
                    day = parseInt(this.dataTable.getFormattedValue(rowNo, this.dayCol), 10);
                } else {
                    day = 1;
                }

                if(this.dateCol != -1) {
                    date  = this.dataTable.getFormattedValue(rowNo, this.dateCol);
                    str   = date.split('-');
                    year  = parseInt(str[0], 10);
                    month = str.length > 1 ? parseInt(str[1], 10) : 1;
                    day   = str.length > 2 ? parseInt(str[2], 10) : 1;
                }

                var dateObj = new Date(year, month-1, day);

                var yearStart = new Date(year,0,1);
                var dayOfWeek = yearStart.getDay();

                var dateStr = "" + dateObj;
                if(dateStr.indexOf("00:00:00") != -1) {
                    // trim off the useless time part
                    dateStr = dateStr.substr(0, dateStr.indexOf("00:00:00")-1);
                }
                tooltip += dateStr;

                if(this.colorByCol != -1) {
                    tooltip += "<br/>" +
                        this.dataTable.getColumnLabel(this.colorByCol) + " " +
                        this.colorByTooltipHint + ": "+
                        this.dataTable.getFormattedValue(rowNo, this.colorByCol);
                }

                if(this.sizeByCol != -1) {
                    tooltip += "<br/>" +
                        this.dataTable.getColumnLabel(this.sizeByCol) + " " +
                        this.sizeByTooltipHint + ": "+
                        this.dataTable.getFormattedValue(rowNo, this.sizeByCol);
                }

                var week = Math.ceil((((dateObj.getTime() - yearStart.getTime()) / 86400000) + dayOfWeek+1)/7);
                if(!yearSet[year]) {
                    yearSet[year] = true;
                }
                dayOfWeek = dateObj.getDay();

                var obj = {
                    year: year,
                    month: month,
                    day: day,
                    date: date,
                    rowIdx: rowNo,
                    colorValue: colorValue,
                    sizeValue: sizeValue,
                    dateObj: dateObj,
                    week: week,
                    dayOfWeek: dayOfWeek,
                    tooltip: tooltip
                };

                this.data.push(obj);
                if(this.colorMinValue == null) {
                    this.colorMinValue = obj.colorValue;
                    this.colorMaxValue = obj.colorValue;
                    this.sizeMinValue = obj.sizeValue;
                    this.sizeMaxValue = obj.sizeValue;
                    this.minYear = obj.year;
                } else {
                    this.colorMinValue = Math.min(obj.colorValue, this.colorMinValue);
                    this.colorMaxValue = Math.max(obj.colorValue, this.colorMaxValue);
                    this.sizeMinValue = Math.min(obj.sizeValue, this.sizeMinValue);
                    this.sizeMaxValue = Math.max(obj.sizeValue, this.sizeMaxValue);
                    this.minYear =  Math.min(obj.year, this.minYear);
                }
            }

            if(this.gradient) {
                if (this.gradient.threshold1 != null && !isNaN(parseFloat(this.gradient.threshold1))) {
                    this.colorMinValue = parseFloat(this.gradient.threshold1);
                }

                if (this.gradient.threshold2 != null && !isNaN(parseFloat(this.gradient.threshold2))) {
                    this.colorMaxValue = parseFloat(this.gradient.threshold2);
                }
            }

            this.years = [];
            for(year in yearSet) this.years.push(year);
            this.years.sort();

            if(this.debug) console.log("data", this.data);
        };

        this.init();
    }
});
