/*!
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
    "es6-promise-shim",
    "require"
], function(Promise, require) {

    // Async Instance Factory
    // Works by convention on `type`.
    return function(type, arg) {
        var vizLocalId = splitVizId(type);
        if(!vizLocalId) throw new Error("Invalid Twelve Days Of Visualizations visualization type: '" + type + "'.");

        // @type Promise<IViz>
        return new Promise(function(resolve, reject) {
            require(["./pentaho/viz/" + vizLocalId + "/Viz"], function(VizClass) {
                var viz = new VizClass(arg);
                resolve(viz);
            });
        });
    };

    // eg: "twelveDaysViz/sunBurst""
    function splitVizId(vizType) {
        var parts = (vizType || "").split("/");
        if(parts.length === 2) return parts[1];
    }
});
