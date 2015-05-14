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
    "dojo/_base/declare"
], function(declare) {

    // StatefuUI copied from common-ui pentaho/common/propertiesPanel/Panel.js as it is no longer public there.
    // Remove once it is again public.

    return declare([], {
            constructor: function(options) {
                this.model = options.model;
                this.propPanel = options.propPanel;

                var me = this;
                this.model.watch(function(propName, prevVal, newVal) {
                  switch(propName) {
                    case "value":
                    case "default":
                      me.set(propName, newVal);
                      break;
                   }
                });
            },

            onUIEvent: function(type, args) {
            }
        });
});
