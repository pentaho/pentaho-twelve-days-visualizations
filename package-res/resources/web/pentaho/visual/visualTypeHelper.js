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
    "pentaho/visual/color/paletteRegistry",
    "pentaho/common/Messages",
    "es6-promise-shim"
], function(require, module, paletteRegistry, Messages) {
    /*global CONTEXT_PATH:true, cv:true, analyzerPlugins:true, Promise:true*/

    var config     = module.config() || {},
        pluginId   = config.pluginId,
        pluginJsId = config.pluginJsId,
        defaultCategory = 'misc',
        visualTypes = [],
        menuInfoDirty = false;

    installPalette();

    // Common msg bundle.
    registerMsgBundle('', 'pentaho/visual');

    return {
        registerVisualization: function(localTypeId, visualType) {
            var typeId = buildVisualTypeId(localTypeId);

            registerMsgBundle(typeId, 'pentaho/visual/' + localTypeId);

            var typeName = localTypeId.charAt(0).toUpperCase() + localTypeId.substr(1);

            visualType.id = typeId;
            visualType.localTypeId = localTypeId;
            visualType.name = Messages.getString(typeName);
            visualType.factory = visualFactory;
            if(!visualType.type) visualType.type = defaultCategory;

            if(typeof cv !== 'undefined') registerAnalyzerPlugin(localTypeId, visualType);

            return visualType;
        } // end registerVisualization
    };

    // Visual Instance Factory.
    // Works by convention on `type`.
    function visualFactory(createOptions) {
        var localTypeId = createOptions.type.localTypeId;
        if(!localTypeId)
            throw new Error(
                "Invalid Twelve Days Of Visualizations visualization type: '" +
                createOptions.type.id + "'.");

        // @type Promise<IVisual>
        return new Promise(function(resolve, reject) {
            require(["./" + localTypeId + "/Visual"], function(VisualClass) {
                resolve(new VisualClass(createOptions.domElement));
            }, reject);
        });
    }

    function registerAnalyzerPlugin(localTypeId, visualType) {

        if(typeof analyzerPlugins === 'undefined') analyzerPlugins =  [];

        visualTypes.push(visualType);
        menuInfoDirty = true;

        var typeId = visualType.id;

        analyzerPlugins.push({

            init: function() {
                processMenuInfo();

                // Register types to display in Analyzer
                cv.pentahoVisualizationHelpers[typeId] = {
                    placeholderImageSrc: require.toUrl('./' + localTypeId + '/placeholder.png')
                };
            } // end init
        }); // analyzerPlugins.push
    }

    function installPalette() {
        paletteRegistry.add({
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

    function buildVisualTypeId(localTypeId) {
        return localTypeId ? (pluginJsId + '/' + localTypeId) : pluginJsId;
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

    // var visualTypes = [];
    function processMenuInfo() {
        if(!menuInfoDirty) return;

        // 1 - visual type, alphabetically.
        // 2 - visual name, alphabetically.
        visualTypes.sort(function(va, vb) {
            return compare(va.type, vb.type) || compare(va.name, vb.name);
        });

        // Default value is 10000; place after GeoMap (that does not specify)
        var nextMenuOrdinal = 10500;
        var prevType;
        visualTypes.forEach(function(v) {
            v.menuOrdinal = nextMenuOrdinal++;
            if(!prevType || prevType !== v.type) {
                prevType = v.type;
                v.menuSeparator = true;
            } else {
                delete v.menuSeparator;
            }
        });

        menuInfoDirty = false;
    }
});
