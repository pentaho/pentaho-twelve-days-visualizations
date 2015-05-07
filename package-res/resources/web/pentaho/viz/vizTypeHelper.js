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
    "require",
    "module",
    "common-ui/vizapi/colorPaletteRegistry",
    "pentaho/common/Messages",
    "dojo/_base/lang",
    "dojo/_base/declare"
], function(require, module, vizColorPaletteRegistry, Messages, lang, declare) {
    /*global CONTEXT_PATH:true, cv:true, analyzer:true, analyzerPlugins:true*/

    var config = module.config() || {},
        pluginId   = config.pluginId,
        pluginJsId = config.pluginJsId,
        defaultVizType = 'misc',
        vizs = [],
        vizMenuInfoDirty = false;

    installPalette();

    // Common msg bundle.
    registerMsgBundle('', 'pentaho/viz');

    return {
        registerVisualization: function(vizLocalId, definition) {
            var vizId = buildVizId(vizLocalId);

            registerMsgBundle(vizId, 'pentaho/viz/' + vizLocalId);

            var vizName = vizLocalId.charAt(0).toUpperCase() + vizLocalId.substr(1);

            definition.id   = vizId;
            definition.name = Messages.getString(vizName);
            definition.instanceModule = pluginJsId + "/vizFactory";
            if(!definition.type) definition.type = defaultVizType;

            if(typeof cv !== 'undefined') registerAnalyzerPlugin(vizLocalId, definition);

            return definition;
        } // end registerVisualization
    };

    function registerAnalyzerPlugin(vizLocalId, definition) {

        if(typeof analyzerPlugins === 'undefined') analyzerPlugins =  [];

        vizs.push(definition);
        vizMenuInfoDirty = true;

        var vizId = definition.id;

        analyzerPlugins.push({

            init: function() {
                processMenuInfo();

                // Register types to display in Analyzer
                cv.pentahoVisualizations.push(definition);

                cv.pentahoVisualizationHelpers[vizId] = {
                    previousAction: null,
                    placeholderImageSrc: require.toUrl('./' + vizLocalId + '/placeholder.png'),
                    canRefreshReport: function(report) {
                        var visHelper = definition.helper;
                        if(visHelper && visHelper.canRefreshReport)
                            return visHelper.canRefreshReport(report);

                        // Adapted from cv.Report#isRequiredGembarsFilled
                        var dataReq = report.getVizDataReq();
                        for(var i = 0; i < dataReq.length ; i++)
                          if(dataReq[i].required && report.findGemsByGembarId(dataReq[i].id).length == 0)
                             return false;

                        return true;
                    },

                    generateOptionsFromAnalyzerState: function (report) {
                        var userDefinedOpts = {},
                            args = report.visualization.args;

                        // set the last action taken
                        if(args.configAction !== 'undefined' && args.configAction != null) {
                           args.configAction = null;
                        } else if(report.history.current() != null) {
                            this.previousAction = report.history.current().action;
                        }

                        return userDefinedOpts;
                    }
                };

                var vizConfigTypeName = vizId + "Config";

                declare("analyzer." + vizConfigTypeName, [analyzer.LayoutConfig], {

                    onModelEvent: function (config, item, eventName, args) {
                        var chart, vizArgs, eventFunc, func, result;
                        if(eventName === "value") {
                            // works by convention where the ids of the data req items match the property names
                            vizArgs = this.report.visualization.args;
                            vizArgs[item.id] = args.newVal;

                            if(typeof(args.prevVal) !== 'undefined' && args.prevVal != args.newVal) {
                                eventFunc = item.id + "Changed";
                                vizArgs.configAction = eventFunc;
                                chart = this.report.visualizationController.chart;
                                func  = lang.hitch(chart, chart[eventFunc]);
                                if(func && typeof func == "function") {
                                    result = func(args.newVal);
                                    if(result) return;
                                }
                            }
                        } else if(eventName === "clicked") {
                            vizArgs = this.report.visualization.args;
                            vizArgs[item.id] = args.newVal;

                            eventFunc = item.id + "Clicked";
                            vizArgs.configAction = eventFunc;
                            chart = this.report.visualizationController.chart;
                            func = lang.hitch(chart, chart[eventFunc]);
                            if(func && typeof func == "function") {
                                result = func();
                                if(result) return;
                            }
                        }

                        this.inherited(arguments); // Let super class handle the insertAt and removedGem events
                    },

                    _setScalingType: function(scalingType) {
                        this.report.visualization.args.scalingType = scalingType;
                    },

                    _setColorRange: function(range) {
                        this.report.visualization.args.colorRange = range;
                    },

                    updateConfiguration: function(config) {
                    }
                });

                analyzer.LayoutPanel.configurationManagers["JSON_" + vizId] = analyzer[vizConfigTypeName];
            } // end init
        }); // analyzerPlugins.push
    }

    function installPalette() {
        vizColorPaletteRegistry.add({
            name:   "twelveDaysViz",
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
        });
    }

    function buildVizId(vizLocalId) {
        return vizLocalId ? (pluginJsId + '/' + vizLocalId) : pluginJsId;
    }

    function registerMsgBundle(bundleId, relativePath) {

        Messages.addUrlBundle(
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
