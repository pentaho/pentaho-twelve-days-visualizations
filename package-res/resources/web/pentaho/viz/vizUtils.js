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
    "common-ui/vizapi/VizController",
    "dojo/on"
], function(VizController, on) {

    /*global cv:true*/

    return {
        handleCommonOptions: function(viz, options) {
            // Check the options for settings (set by the caller)
            if(options) {
                if(typeof options.labelColor != 'undefined') {
                    viz.labelColor = options.labelColor;
                }
                if(typeof options.labelStyle != 'undefined') {
                    viz.labelStyle = options.labelStyle;
                }
                if(typeof options.labelSize != 'undefined') {
                    viz.labelSize = options.labelSize;
                }
                if(typeof options.labelFontFamily != 'undefined') {
                    viz.labelFontFamily = options.labelFontFamily;
                }
                if(typeof options.backgroundType != 'undefined') {
                    viz.backgroundType = options.backgroundType;
                }
                if(typeof options.backgroundColor != 'undefined') {
                    viz.backgroundColor = options.backgroundColor;
                }
                if(typeof options.backgroundColorEnd != 'undefined') {
                    viz.backgroundColorEnd = options.backgroundColorEnd;
                }
                if(typeof options.reverseColors != 'undefined') {
                    viz.reverseColors = options.reverseColors;
                }
                if(typeof options.scalingType != 'undefined') {
                    viz.scalingType = options.scalingType;
                }
                if(typeof options.pattern != 'undefined') {
                    viz.pattern = options.pattern;
                    viz.colorMode = viz.pattern == 'PIE' ? 'top' : 'gradient';
                    viz.scalingType = viz.pattern == 'GRADIENT' ? 'linear' : 'steps';
                }
                if(typeof options.colorSet != 'undefined') {
                    viz.colorSet = options.colorSet;
                }
                if(typeof options.reverseColors != 'undefined') {
                    viz.reverseColors = options.reverseColors;
                }
            }

            var labelColor, labelFontFamily, labelSize, labelStyle, backgroundType, backgroundColor, backgroundColorEnd;

            // check the controller current visualizations arguments (set by the properties panel)
            var vizArgs = viz.controller && viz.controller.currentViz && viz.controller.currentViz.args;
            if(vizArgs) {
                labelColor = vizArgs.labelColor;
                if(labelColor) { // TODO localize this?
                    viz.labelColor = labelColor;
                }
                labelFontFamily = vizArgs.labelFontFamily;
                if(labelFontFamily && labelFontFamily != 'Default') { // TODO localize this?
                    viz.labelFontFamily = labelFontFamily;
                }
                labelSize = vizArgs.labelSize;
                if(labelSize) {
                    viz.labelSize = labelSize;
                }
                labelStyle = vizArgs.labelStyle;
                if(labelStyle && labelStyle != 'PLAIN') {
                    viz.labelStyle = labelStyle;
                }
                backgroundType = vizArgs.backgroundType;
                if(backgroundType) {
                    viz.backgroundType = backgroundType;
                }
                backgroundColor = vizArgs.backgroundColor;
                if(backgroundColor) {
                    viz.backgroundColor = backgroundColor;
                }
                backgroundColorEnd = vizArgs.backgroundColorEnd;
                if(backgroundColorEnd) {
                    viz.backgroundColorEnd = backgroundColorEnd;
                }
                if(typeof vizArgs.reverseColors != 'undefined') {
                    viz.reverseColors = vizArgs.reverseColors;
                    options.reverseColors = viz.reverseColors;
                }
                if(typeof vizArgs.pattern != 'undefined' || typeof vizArgs.colorSet != 'undefined') {

                    if(typeof vizArgs.pattern != 'undefined') {
                        viz.pattern = vizArgs.pattern;
                    } else {
                        viz.pattern = 'GRADIENT';
                    }
                    viz.colorMode = viz.pattern == 'PIE' ? 'top' : 'gradient';
                    viz.scalingType = viz.pattern == 'GRADIENT' ? 'linear' : 'steps';
                    if(typeof vizArgs.colorSet != 'undefined') {
                        viz.colorSet = vizArgs.colorSet;
                    } else {
                        viz.colorSet = 'ryg';
                    }
                    viz.options.colorMode = viz.colorMode;
                    viz.options.scalingType = viz.scalingType;
                    viz.options.pattern = viz.pattern;
                    viz.options.colorSet = viz.colorSet;
                }
            }

            // check Analyzer's report document (yuck)
            var reportDoc = typeof cv != 'undefined' && cv && cv.rptEditor && cv.rptEditor.report && cv.rptEditor.report.reportDoc;
            if(reportDoc) {
                labelColor = reportDoc.getChartOption('labelColor');
                if(labelColor) {
                    viz.labelColor = labelColor;
                    if(vizArgs) vizArgs.labelColor = labelColor;
                    options.labelColor = labelColor;
                }
                labelFontFamily = reportDoc.getChartOption('labelFontFamily');
                if(labelFontFamily && labelFontFamily != 'Default') { // TODO localize this?
                    viz.labelFontFamily = labelFontFamily;
                    if(vizArgs) vizArgs.labelFontFamily = labelFontFamily;
                    options.labelFontFamily = labelFontFamily;
                }
                labelSize = reportDoc.getChartOption('labelSize');
                if(labelSize) {
                    viz.labelSize = labelSize;
                    options.labelSize = labelSize;
                    if(vizArgs) vizArgs.labelSize = labelSize;
                }
                labelStyle = reportDoc.getChartOption('labelStyle');
                if(labelStyle && labelStyle != 'PLAIN') {
                    viz.labelStyle = labelStyle;
                    if(vizArgs) vizArgs.labelStyle = labelStyle;
                    options.labelStyle = labelStyle;
                }
                backgroundType = reportDoc.getChartOption('backgroundFill');
                if(backgroundType) {
                    viz.backgroundType = backgroundType;
                    if(vizArgs) vizArgs.backgroundType = backgroundType;
                    options.backgroundType = backgroundType;
                }
                backgroundColor = reportDoc.getChartOption('backgroundColor');
                if(backgroundColor) {
                    viz.backgroundColor = backgroundColor;
                    if(vizArgs) vizArgs.backgroundColor = backgroundColor;
                    options.backgroundColor = backgroundColor;
                }
                backgroundColorEnd = reportDoc.getChartOption('backgroundColorEnd');
                if(backgroundColorEnd) {
                    viz.backgroundColorEnd = backgroundColorEnd;
                    if(vizArgs) vizArgs.backgroundColorEnd = backgroundColorEnd;
                    options.backgroundColorEnd = backgroundColorEnd;
                }
            }

            viz.labelFontStr = '';
            if(viz.labelStyle && viz.labelStyle != 'PLAIN') {
                viz.labelFontStr += viz.labelStyle + " ";
            }

            viz.labelFontStr += viz.labelSize+"pt ";
            if(viz.labelFontFamily && viz.labelFontFamily != 'Default') { // TODO localize this?
                viz.labelFontStr += viz.labelFontFamily;
            } else {
                viz.labelFontStr += "Arial";
            }
        },

        applyBackground: function(element, options) {
            if(options.backgroundType == 'NONE') {
                element.style.background = 'none';
                element.style.backgroundColor = '';
            } else if(options.backgroundType == 'SOLID') {
                element.style.backgroundColor = options.backgroundColor;
            } else if(options.backgroundType == 'GRADIENT') {
                delete element.style.backgroundColor;
                var origBack = element.style.background;
                var back;
                if(element.style.background) {
                    back = "-moz-linear-gradient(top, "+options.backgroundColor+", "+options.backgroundColorEnd+")";
                    element.style.background = back;
                    if(!element.style.background || element.style.background == origBack) {
                        back = "-webkit-gradient(linear, left top, left bottom, from("+options.backgroundColor+"), to("+options.backgroundColorEnd+"))";
                        element.style.background = back;
                    }
                }

                // detect IE
                var browserName=navigator.appName;
                if(browserName=="Microsoft Internet Explorer") {
                    back = "progid:DXImageTransform.Microsoft.Gradient(startColorstr="+options.backgroundColor+", endColorstr="+options.backgroundColorEnd+")";
                    element.style.filter = back;
                }
            }
        },

        setupColorRanges: function(viz) {
            if(viz.colorSet == 'ryg') {
                if(viz.pattern == '5-COLOR') {
                    viz.colorRange = ["#ff0000","#ffbf3f","#ffff00","#bfdf3f","#008000"];
                } else {
                    viz.colorRange = ["#ff0000","#ffff00","#008000"];
                }
            } else if(viz.colorSet == 'ryb') {
                if(viz.pattern == '5-COLOR') {
                    viz.colorRange = ["#ff0000","#ffbf3f","#ffff00","#dcddde","#4bb6e4"];
                } else {
                    viz.colorRange = ["#ff0000","#ffff00","#4bb6e4"];
                }
            } else if(viz.colorSet == 'blue') {
                if(viz.pattern == '5-COLOR') {
                    viz.colorRange = ["#cbe7ff","#99d0ff","#33a1ff","#006ecc","#0345a9"];
                } else {
                    viz.colorRange = ["#cbe7ff","#33a1ff","#0345a9"];
                }
            } else if(viz.colorSet == 'gray') {
                if(viz.pattern == '5-COLOR') {
                    viz.colorRange = ["#e6e6e6","#cccccc","#999999","#666666","#333333"];
                } else {
                    viz.colorRange = ["#e6e6e6","#999999","#333333"];
                }
            }

            if(viz.reverseColors) {
                var range = viz.colorRange;
                viz.colorRange = [];
                for(var idx=range.length-1; idx>=0; idx--) {
                    viz.colorRange.push(range[idx]);
                }
            }
        },

        getClientWidth:  function(viz) { return viz.element.offsetWidth; },

        getClientHeight: function(viz) { return viz.element.offsetHeight; },

        getRgbGradientFromMultiColorHex: function(value, min, max, colors) {
            if(value < min) {
                value = min;
            } else if(value > max) {
                value = max;
            }

            var steps = colors.length-1;
            var range = max-min;

            var start, end;
            if(range <= 0) {
                start = colors.length-1;
                end = start;
            } else {
                start = Math.floor(((value-min)/range) * steps);
                end = Math.ceil(((value-min)/range) * steps);
            }

            var color1 = VizController.convertToRGB(colors[start]);
            var color2 = VizController.convertToRGB(colors[end]);

            var rangeMin = (start / steps) * range + min;
            var rangeMax = (end / steps) * range + min;

            var inRange;
            if(rangeMin == rangeMax) {
                inRange = 1;
            } else {
                inRange = (value-rangeMin)/(rangeMax-rangeMin);
            }

            var cols = new Array(3);
            cols[0] = Math.floor(inRange * (color2[0] - color1[0]) + color1[0]);
            cols[1] = Math.floor(inRange * (color2[1] - color1[1]) + color1[1]);
            cols[2] = Math.floor(inRange * (color2[2] - color1[2]) + color1[2]);

            return VizController.getRrbColor(cols[0], cols[1], cols[2]);
        },

        clearSelections: function() {
            // TODO convert this call when Analyzer has a generic way to do this
            var report;
            if(typeof cv !== "undefined" && cv.getActiveReport && (report = cv.getActiveReport()))
                report.hideSelectionFilterButtons();
        },

        createSelectionTable: function(table, dataTable, labelFontStr, labelColor, numberSortCallback) {
            table.id = 'datalist';
            table.className = 'datatable';
            table.cellPadding = "0";
            table.cellSpacing = "0";

            var row = table.insertRow(-1);
            var cell = row.insertCell(0);
            cell.innerHTML = "#";
            cell.className = 'tableheader alignRight';
            cell.style.font = labelFontStr;
            cell.style.color = labelColor;
            cell.style.borderBottom = "2px solid "+labelColor;
            var measureNo = 0;

            var createSortCallback = function(measureNum) {
                return function() {
                    numberSortCallback(measureNum);
                };
            };

            for(var colNo=0; colNo<dataTable.getNumberOfColumns(); colNo++) {
                cell = row.insertCell(colNo+1);
                var sortFun = null;
                if(dataTable.getColumnType(colNo) === 'number') {
                    cell.className = 'tableheader alignRight';
                    if(numberSortCallback) sortFun = createSortCallback(measureNo);
                    measureNo++;
                } else {
                    cell.className = 'tableheader';
                }

                cell.style.font  = labelFontStr;
                cell.style.color = labelColor;
                cell.style.borderBottom = "2px solid "+labelColor;
                cell.innerHTML = dataTable.getColumnLabel(colNo) + (sortFun ? " " : "");
                if(sortFun) {
                    var span = document.createElement("span");
                    span.innerText = "<>";
                    on(span, "click", sortFun);

                    cell.appendChild(span);
                }
            }
        },

        updateSelectionTable: function(table, dataTable, rows, labelFontStr, labelColor) {
            while(table.rows.length>1) table.deleteRow(1);

            var colCount = dataTable.getNumberOfColumns();
            var rowCount = rows.length;
            for(var idx=0; idx<rowCount; idx++) {
                var rowIdx = rows[idx].rowIdx;
                var row = table.insertRow(idx+1);
                var cell = row.insertCell(0);
                cell.innerHTML = ''+(idx+1);
                var rowClass = idx % 2 ? ' oddRow' : '';
                var className = 'tableCell' + rowClass;
                if(idx == rowCount-1) {
                    className += ' lastRow';
                }
                cell.className = className+' alignRight';
                cell.style.font  = labelFontStr;
                cell.style.color = labelColor;
                for(var colNo=0; colNo<colCount; colNo++) {
                    cell = row.insertCell(colNo+1);
                    var value = dataTable.getFormattedValue(rowIdx, colNo);
                    if(typeof value == 'undefined') {
                        value = dataTable.getValue(rowIdx, colNo);
                    }
                    cell.innerHTML = value;
                    if(dataTable.getColumnType(colNo) == 'number') {
                        className += ' alignRight';
                    }
                    if(colNo == colCount-1) {
                        className += ' lastColumn';
                    }
                    cell.className = className;
                    cell.style.font = labelFontStr;
                    cell.style.color = labelColor;
                }
            }
        }
    };
});
