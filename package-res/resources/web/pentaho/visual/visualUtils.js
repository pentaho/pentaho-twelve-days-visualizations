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
    "pentaho/visual/color/utils",
    "dojo/on"
], function(colorUtils, on) {

    /*global cv:true*/

    return {
        handleCommonOptions: function(visual, options) {
            this.handleLabelOptions(visual, options);
            this.handleBackgroundOptions(visual, options);
            this.handleColorScaleOptions(visual, options);
        },

        handleLabelOptions: function(visual, options) {
            if(options.labelColor) visual.labelColor = options.labelColor;

            if(options.labelStyle && options.labelStyle !== 'PLAIN')
                visual.labelStyle = options.labelStyle;

            if(options.labelSize) visual.labelSize = options.labelSize;

            if(options.labelFontFamily) {
                visual.labelFontFamily = options.labelFontFamily !== "Default"
                    ? options.labelFontFamily
                    : "Arial";
            }

            // Update labelFontStr
            visual.labelFontStr = '';
            if(visual.labelStyle && visual.labelStyle != 'PLAIN') {
                visual.labelFontStr += visual.labelStyle + " ";
            }

            visual.labelFontStr += visual.labelSize + "pt ";

            if(visual.labelFontFamily && visual.labelFontFamily !== "Default") { // TODO localize this?
                visual.labelFontStr += visual.labelFontFamily;
            } else {
                visual.labelFontStr += "Arial";
            }
        },

        handleBackgroundOptions: function(visual, options) {
            if(options.backgroundType !== undefined) visual.backgroundType = options.backgroundType;
            if(options.backgroundColor !== undefined) visual.backgroundColor = options.backgroundColor;
            if(options.backgroundColorEnd !== undefined) visual.backgroundColorEnd = options.backgroundColorEnd;
        },

        handleColorScaleOptions: function(visual, options) {
            if(options.reverseColors !== undefined) visual.reverseColors = !!options.reverseColors;
            if(options.pattern) visual.pattern = options.pattern;

            // Default pattern
            if(!visual.pattern) visual.pattern = 'GRADIENT';

            // Update colorMode and scalingType
            visual.colorMode   = visual.pattern == 'PIE' ? 'top' : 'gradient';
            visual.scalingType = visual.pattern == 'GRADIENT' ? 'linear' : 'steps';

            if(options.colorSet) visual.colorSet = options.colorSet;

            // Default colorSet
            if(!visual.colorSet) visual.colorSet = 'ryg';
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

        setupColorRanges: function(visual) {
            var colorRange = colorUtils.buildPalette(visual.colorSet, visual.pattern, visual.reverseColors);

            if(!colorRange && (colorRange = visual.colorRange)) {
                if(visual.reverseColors) colorRange = colorRange.slice().reverse();
            }

            if(colorRange) visual.colorRange = colorRange;
        },

        getClientWidth:  function(visual) { return visual.element.offsetWidth; },

        getClientHeight: function(visual) { return visual.element.offsetHeight; },

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
