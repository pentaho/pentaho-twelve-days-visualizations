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
    'require',
    'module',
    './VizController',
], function(require, module, VizController) {

    var config = module.config() || {};
    var pluginId = config.pluginId;
    var pluginJsId = config.pluginJsId;

    var defaultVizType = 'misc';
    var vizs = [];
    var vizMenuInfoDirty = false;

    installDefaultPalette();

    // Common msg bundle.
    registerMsgBundle('', 'pentaho/viz');

    // This is the namespace for viz classes installed by the plugin.
    // The VizController requires viz instance classes to be
    // instantiate-able from a global namespace.
    if(typeof pentaho.viz === 'undefined') pentaho.viz = {};

    return {
        registerVisualization: function( vizLocalId, definition ) {
            var vizId = buildVizId( vizLocalId );

            registerMsgBundle( vizId, 'pentaho/viz/' + vizLocalId );

            var vizName = vizLocalId.charAt(0).toUpperCase() + vizLocalId.substr(1);

            var vizRelativeDir = './' + vizLocalId;

            // Load asynchronously, assuming the risk of not being there when needed.
            require([vizRelativeDir + '/' + vizName]);

            definition.id   = vizId;
            definition.name = pentaho.common.Messages.getString( vizName ); // visible name
            definition['class'] = 'pentaho.viz.' + vizName; // type of the Javascript object to instantiate
            if(!definition.type) definition.type = defaultVizType;

            vizs.push(definition);
            vizMenuInfoDirty = true;

            pentaho.visualizations.push(definition);

            if( typeof cv === 'undefined' ) return definition;

            if( typeof analyzerPlugins === 'undefined' ) analyzerPlugins =  [];

            analyzerPlugins.push({
                vizLocalId: vizLocalId,
                vizId:      vizId,
                pluginId:   pluginId, // TODO: remove if possible

                init: function() {
                    processMenuInfo();

                    // Register types to display in Analyzer
                    cv.pentahoVisualizations.push(definition);

                    cv.pentahoVisualizationHelpers[this.vizId] = {
                        previousAction: null,
                        placeholderImageSrc: require.toUrl(vizRelativeDir + '/' + vizLocalId + '.png'),
                        canRefreshReport: function( report ) {
                            var visHelper = definition.helper;
                            if( visHelper && visHelper.canRefreshReport ) {
                                return visHelper.canRefreshReport( report );
                            }

                            // Adapted from cv.Report#isRequiredGembarsFilled
                            var dataReq = report.getVizDataReq();
                            for(var i = 0; i < dataReq.length ; i++) {
                              if(dataReq[i].required == true) {
                                if(report.findGemsByGembarId(dataReq[i].id).length == 0)
                                  return false;
                              }
                            }

                            return true;
                        },

                        generateOptionsFromAnalyzerState: function ( report ) {
                            var userDefinedOpts = {};
                            var args = report.visualization.args;
                            // set the last action taken
                            if( args.configAction !== 'undefined' &&
                                args.configAction != null ) {
                                args.configAction = null;
                            } else if( report.history.current() != null ) {
                                var action = report.history.current().action;
                                this.previousAction = action;
                            }
                            return userDefinedOpts;
                        }
                    };

                    var vizConfigTypeName = this.vizId + "Config";

                    dojo.declare("analyzer." + vizConfigTypeName, [analyzer.LayoutConfig], {

                        onModelEvent: function (config, item, eventName, args) {
                            var chart, vizArgs, eventFunc, func, result;
                            if (eventName === "value") {
                                // works by convention where the ids of the data req items match the property names
                                vizArgs = this.report.visualization.args;
                                vizArgs[item.id] = args.newVal;

                                if(typeof(args.prevVal) !== 'undefined' && args.prevVal != args.newVal) {
                                    eventFunc = item.id + "Changed";
                                    vizArgs.configAction = eventFunc;
                                    chart = this.report.visualizationController.chart;
                                    func  = dojo.hitch(chart, chart[eventFunc]);
                                    if( func && typeof func == "function" ) {
                                        result = func(args.newVal);
                                        if( result ) { return; }
                                    }
                                }
                            } else if (eventName === "clicked") {
                                vizArgs = this.report.visualization.args;
                                vizArgs[item.id] = args.newVal;

                                eventFunc = item.id + "Clicked"
                                vizArgs.configAction = eventFunc;
                                chart = this.report.visualizationController.chart;
                                func = dojo.hitch(chart, chart[eventFunc]);
                                if( func && typeof func == "function" ) {
                                    result = func();
                                    if( result ) { return; }
                                }
                            }

                            this.inherited(arguments); // Let super class handle the insertAt and removedGem events
                        },

                        _setScalingType:function(scalingType) {
                            this.report.visualization.args.scalingType = scalingType;
                        },
                        _setColorRange:function(range) {
                            this.report.visualization.args.colorRange = range;
                        },
                        getConfiguration:function() {
                            var config = this.inherited(arguments);
                            return config;
                        },
                        updateConfiguration: function(config) {}
                    });

                    analyzer.LayoutPanel.configurationManagers
                    ["JSON_" + this.vizId] = analyzer[vizConfigTypeName];

                    dojo.connect(analyzer[vizConfigTypeName], "onClick", function (item, eventName, args) { });
                } // end init
            } ); // analyzerPlugins.push

            return definition;
        }, // end registerVisualization

        handleCommonOptions: function( viz, options ) {
            // Check the options for settings (set by the caller)
            if( options ) {
                if( typeof options.labelColor != 'undefined' ) {
                    viz.labelColor = options.labelColor;
                }
                if( typeof options.labelStyle != 'undefined' ) {
                    viz.labelStyle = options.labelStyle;
                }
                if( typeof options.labelSize != 'undefined' ) {
                    viz.labelSize = options.labelSize;
                }
                if( typeof options.labelFontFamily != 'undefined' ) {
                    viz.labelFontFamily = options.labelFontFamily;
                }
                if( typeof options.backgroundType != 'undefined' ) {
                    viz.backgroundType = options.backgroundType;
                }
                if( typeof options.backgroundColor != 'undefined' ) {
                    viz.backgroundColor = options.backgroundColor;
                }
                if( typeof options.backgroundColorEnd != 'undefined' ) {
                    viz.backgroundColorEnd = options.backgroundColorEnd;
                }
                if( typeof options.reverseColors != 'undefined') {
                    viz.reverseColors = options.reverseColors;
                }
                if( typeof options.scalingType != 'undefined') {
                    viz.scalingType = options.scalingType;
                }
                if( typeof options.pattern != 'undefined') {
                    viz.pattern = options.pattern;
                    viz.colorMode = viz.pattern == 'PIE' ? 'top' : 'gradient';
                    viz.scalingType = viz.pattern == 'GRADIENT' ? 'linear' : 'steps'
                }
                if( typeof options.colorSet != 'undefined') {
                    viz.colorSet = options.colorSet;
                }
                if( typeof options.reverseColors != 'undefined') {
                    viz.reverseColors = options.reverseColors;
                }
            }

            // check the controller current visualizations arguments (set by the properties panel)
            var vizArgs = viz.controller && viz.controller.currentViz && viz.controller.currentViz.args;
            if(vizArgs) {
                var labelColor = vizArgs.labelColor;
                if( labelColor ) { // TODO localize this?
                    viz.labelColor = labelColor;
                }
                var labelFontFamily = vizArgs.labelFontFamily;
                if( labelFontFamily && labelFontFamily != 'Default') { // TODO localize this?
                    viz.labelFontFamily = labelFontFamily;
                }
                var labelSize = vizArgs.labelSize;
                if( labelSize ) {
                    viz.labelSize = labelSize;
                }
                var labelStyle = vizArgs.labelStyle;
                if( labelStyle && labelStyle != 'PLAIN') {
                    viz.labelStyle = labelStyle;
                }
                var backgroundType = vizArgs.backgroundType;
                if( backgroundType ) {
                    viz.backgroundType = backgroundType;
                }
                var backgroundColor = vizArgs.backgroundColor;
                if( backgroundColor ) {
                    viz.backgroundColor = backgroundColor;
                }
                var backgroundColorEnd = vizArgs.backgroundColorEnd;
                if( backgroundColorEnd ) {
                    viz.backgroundColorEnd = backgroundColorEnd;
                }
                if( typeof vizArgs.reverseColors != 'undefined' ) {
                    viz.reverseColors = vizArgs.reverseColors;
                    options.reverseColors = viz.reverseColors;
                }
                if( typeof vizArgs.pattern != 'undefined' || typeof vizArgs.colorSet != 'undefined' ) {

                    if( typeof vizArgs.pattern != 'undefined' ) {
                        viz.pattern = vizArgs.pattern;
                    } else {
                        viz.pattern = 'GRADIENT';
                    }
                    viz.colorMode = viz.pattern == 'PIE' ? 'top' : 'gradient';
                    viz.scalingType = viz.pattern == 'GRADIENT' ? 'linear' : 'steps'
                    if( typeof vizArgs.colorSet != 'undefined' ) {
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
                var labelColor = reportDoc.getChartOption('labelColor');
                if( labelColor ) {
                    viz.labelColor = labelColor;
                    vizArgs.labelColor = labelColor;
                    options.labelColor = labelColor;
                }
                var labelFontFamily = reportDoc.getChartOption('labelFontFamily');
                if( labelFontFamily && labelFontFamily != 'Default') { // TODO localize this?
                    viz.labelFontFamily = labelFontFamily;
                    vizArgs.labelFontFamily = labelFontFamily;
                    options.labelFontFamily = labelFontFamily;
                }
                var labelSize = reportDoc.getChartOption('labelSize');
                if( labelSize ) {
                    viz.labelSize = labelSize;
                    options.labelSize = labelSize;
                    vizArgs.labelSize = labelSize;
                }
                var labelStyle = reportDoc.getChartOption('labelStyle');
                if( labelStyle && labelStyle != 'PLAIN') {
                    viz.labelStyle = labelStyle;
                    vizArgs.labelStyle = labelStyle;
                    options.labelStyle = labelStyle;
                }
                var backgroundType = reportDoc.getChartOption('backgroundFill');
                if( backgroundType ) {
                    viz.backgroundType = backgroundType;
                    vizArgs.backgroundType = backgroundType;
                    options.backgroundType = backgroundType;
                }
                var backgroundColor = reportDoc.getChartOption('backgroundColor');
                if( backgroundColor ) {
                    viz.backgroundColor = backgroundColor;
                    vizArgs.backgroundColor = backgroundColor;
                    options.backgroundColor = backgroundColor;
                }
                var backgroundColorEnd = reportDoc.getChartOption('backgroundColorEnd');
                if( backgroundColorEnd ) {
                    viz.backgroundColorEnd = backgroundColorEnd;
                    vizArgs.backgroundColorEnd = backgroundColorEnd;
                    options.backgroundColorEnd = backgroundColorEnd;
                }
            }
            viz.labelFontStr = '';

            if( viz.labelStyle && viz.labelStyle != 'PLAIN') {
                viz.labelFontStr += viz.labelStyle + " ";
            }
            viz.labelFontStr += viz.labelSize+"pt ";
            if( viz.labelFontFamily && viz.labelFontFamily != 'Default') { // TODO localize this?
                viz.labelFontStr += viz.labelFontFamily;
            } else {
                viz.labelFontStr += "Arial";
            }
        },

        applyBackground: function( element, options ) {

            if( options.backgroundType == 'NONE' ) {
                element.style.background = 'none';
                element.style.backgroundColor = '';
            }
            else if( options.backgroundType == 'SOLID' ) {
                element.style.backgroundColor = options.backgroundColor;
            }
            else if( options.backgroundType == 'GRADIENT' ) {
                delete element.style.backgroundColor;
                var origBack = element.style.background;
                if( element.style.background ) {
                    var back = "-moz-linear-gradient(top, "+options.backgroundColor+", "+options.backgroundColorEnd+")";
                    element.style.background = back;
                    if( !element.style.background || element.style.background == origBack ) {
                        back = "-webkit-gradient(linear, left top, left bottom, from("+options.backgroundColor+"), to("+options.backgroundColorEnd+"))";
                        element.style.background = back;
                    }
                }
                // detect IE
                var browserName=navigator.appName;
                if (browserName=="Microsoft Internet Explorer") {
                    back = "progid:DXImageTransform.Microsoft.Gradient(startColorstr="+options.backgroundColor+", endColorstr="+options.backgroundColorEnd+")";
                    element.style.filter = back;
                }
            }
        },

        setupColorRanges: function( viz ) {
            if( viz.colorSet == 'ryg' ) {
                if( viz.pattern == '5-COLOR' ) {
                    viz.colorRange = ["#ff0000","#ffbf3f","#ffff00","#bfdf3f","#008000"];
                } else {
                    viz.colorRange = ["#ff0000","#ffff00","#008000"];
                }
            }
            else if( viz.colorSet == 'ryb' ) {
                if( viz.pattern == '5-COLOR' ) {
                    viz.colorRange = ["#ff0000","#ffbf3f","#ffff00","#dcddde","#4bb6e4"];
                } else {
                    viz.colorRange = ["#ff0000","#ffff00","#4bb6e4"];
                }
            }
            else if( viz.colorSet == 'blue' ) {
                if( viz.pattern == '5-COLOR' ) {
                    viz.colorRange = ["#cbe7ff","#99d0ff","#33a1ff","#006ecc","#0345a9"];
                } else {
                    viz.colorRange = ["#cbe7ff","#33a1ff","#0345a9"];
                }
            }
            else if( viz.colorSet == 'gray' ) {
                if( viz.pattern == '5-COLOR' ) {
                    viz.colorRange = ["#e6e6e6","#cccccc","#999999","#666666","#333333"];
                } else {
                    viz.colorRange = ["#e6e6e6","#999999","#333333"];
                }
            }
            if( viz.reverseColors ) {
                var range = viz.colorRange;
                viz.colorRange = [];
                for( var idx=range.length-1; idx>=0; idx-- ) {
                    viz.colorRange.push(range[idx]);
                }
            }
        },

        getClientWidth:  function(viz) { return viz.element.offsetWidth; },

        getClientHeight: function(viz) { return viz.element.offsetHeight; },

        getRgbGradientFromMultiColorHex: function(value, min, max, colors) {
            if( value < min ) {
                value = min;
            }
            else if(value > max) {
                value = max;
            }
            var steps = colors.length-1;
            var range = max-min;

            if(range <= 0) {
                var start = colors.length-1;
                var end = start;
            } else {
                var start = Math.floor(((value-min)/range) * steps);
                var end = Math.ceil(((value-min)/range) * steps);
            }
            var color1 = VizController.convertToRGB(colors[start]);
            var color2 = VizController.convertToRGB(colors[end]);

            var rangeMin = (start / steps) * range + min;
            var rangeMax = (end / steps) * range + min;

            var inRange
            if(rangeMin == rangeMax){
                inRange = 1;
            } else {
                inRange = (value-rangeMin)/(rangeMax-rangeMin);
            }
            var cols = new Array(3);
            cols[0] = Math.floor( inRange * (color2[0] - color1[0]) + color1[0] );
            cols[1] = Math.floor( inRange * (color2[1] - color1[1]) + color1[1] );
            cols[2] = Math.floor( inRange * (color2[2] - color1[2]) + color1[2] );
            return VizController.getRrbColor(cols[0], cols[1], cols[2]);
        },

        clearSelections: function( ) {
            // TODO convert this call when Analyzer has a generic way to do this
            if( typeof cv != 'undefined' && cv.getActiveReport && cv.getActiveReport () ) {
                cv.getActiveReport().hideSelectionFilterButtons();
            }
        },

        createSelectionTable: function( table, dataTable, labelFontStr, labelColor ) {
            console.log('pentaho.viz.util.CreateSelectionTable()');

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
            for( var colNo=0; colNo<dataTable.getNumberOfColumns(); colNo++) {
                var cell = row.insertCell(colNo+1);
                var sortable = '';
                if( dataTable.getColumnType(colNo).toUpperCase() == 'NUMBER' ) {
                    cell.className = 'tableheader alignRight';
                    sortable = ' <span onClick="crossFilterWrapper.setSort('+measureNo+')"><></span>';
                    measureNo++;
                } else {
                    cell.className = 'tableheader';
                }
                cell.style.font = labelFontStr;
                cell.style.color = labelColor;
                cell.style.borderBottom = "2px solid "+labelColor;
                cell.innerHTML = dataTable.getColumnLabel(colNo) + sortable;
            }
        },

        updateSelectionTable: function( table, dataTable, rows, labelFontStr, labelColor ) {
            console.log('pentaho.viz.util.UpdateSelectionTable()');

            while( table.rows.length>1) {
                table.deleteRow(1);
            }

            var colCount = dataTable.getNumberOfColumns();
            var rowCount = rows.length;
            for( var idx=0; idx<rowCount; idx++ ) {
                var rowIdx = rows[idx].rowIdx;
                var row = table.insertRow(idx+1);
                var cell = row.insertCell(0);
                cell.innerHTML = ''+(idx+1);
                var rowClass = idx % 2 ? ' oddRow' : '';
                var className = 'tableCell' + rowClass;
                if( idx == rowCount-1 ) {
                    className += ' lastRow';
                }
                cell.className = className+' alignRight';
                cell.style.font = labelFontStr;
                cell.style.color = labelColor;
                for( var colNo=0; colNo<colCount; colNo++) {
                    var cell = row.insertCell(colNo+1);
                    var value = dataTable.getFormattedValue(rowIdx, colNo);
                    if( typeof value == 'undefined') {
                        value = dataTable.getValue(rowIdx, colNo);
                    }
                    cell.innerHTML = value;
                    if( dataTable.getColumnType(colNo).toUpperCase() == 'NUMBER' ) {
                        className += ' alignRight';
                    }
                    if( colNo == colCount-1 ) {
                        className += ' lastColumn';
                    }
                    cell.className = className;
                    cell.style.font = labelFontStr;
                    cell.style.color = labelColor;
                }
            }
        }
    };

    function installDefaultPalette() {
        var palettes = pentaho.palettes;
        if( palettes.length && pentaho.palettes[0].name === 'palette 1' ) {
            palettes.unshift({
                name: 'default',
                colors: [
                    "#0d8ecf",
                    "#b0de09",
                    "#fcd202",
                    "#ff6600",
                    "#cd0d74",
                    "#cc0000",
                    "#00cc00",
                    "#650cd0",
                    "#3a3a3a",
                    "#7272e3",
                    "#79c1e4",
                    "#d3ed77",
                    "#fde673",
                    "#ffaa72",
                    "#e379b2",
                    "#e37272",
                    "#72e372",
                    "#aa79e5",
                    "#929292",
                    "#00007a",
                    "#07547b",
                    "#698405",
                    "#967c01",
                    "#983b00",
                    "#7a0745",
                    "#7a0000",
                    "#007a00",
                    "#3c077b",
                    "#000000"
                ]
            } );
        }
    }

    function buildVizId( vizLocalId ) {
        return vizLocalId ? (pluginJsId + '/' + vizLocalId) : pluginJsId;
    }

    function registerMsgBundle( bundleId, relativePath ) {
        dojo.require("pentaho.common.Messages");

        pentaho.common.Messages.addUrlBundle(
            bundleId,
            CONTEXT_PATH + 'i18n?plugin=' + pluginId +
            '&name=resources/web/' +
            (relativePath ? (relativePath + '/') : '') +
            'nls/messages');

        // NOTE: The fetch for the url is synchronous
        // and so the messages are now already available.
    }

    function compare(a, b) {
        return (a === b) ? 0 : ((a > b) ? 1 : -1);
    }

    // var vizs = [];
    function processMenuInfo() {
        if(!vizMenuInfoDirty) return;

        // 1 - viz type, alphabetically.
        // 2 - viz name, alphabetically.
        vizs.sort(function(va, vb) {
            return compare(va.type, vb.type) || compare(va.name, vb.name);
        });

        // Default value is 10000; place after GeoMap (that does not specify)
        var nextMenuOrdinal = 10500;
        var prevType;
        vizs.forEach(function(v) {
            v.menuOrdinal = nextMenuOrdinal++;
            if(!prevType || prevType !== v.type) {
                prevType = v.type;
                v.menuSeparator = true;
            } else {
                delete v.menuSeparator;
            }
        });

        vizMenuInfoDirty = false;
    }
});
