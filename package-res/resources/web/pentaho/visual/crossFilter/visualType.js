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
    '../visualTypeHelper'
], function(visualTypeHelper) {

    return visualTypeHelper.registerVisualization('crossFilter', {
        type:   'multivariate', // generic type id
        source: 'crossfilter',  // id of the source library
        maxValues: [50000,50000,50000,50000],
        dataReqs: [  // dataReqs describes the data requirements of this visualization
            {
                name: 'Default',
                reqs:
                    [
                        {   id: 'rows',             // id of the data element
                            dataType: 'string',         // data type - 'string', 'number', 'date', 'boolean', 'any' or a comma separated list
                            dataStructure: 'column',    // 'column' or 'row' - only 'column' supported so far
                            caption: 'rows',        // visible name
                            required: true,              // true or false
                            allowMultiple: true         // true or false
                        },
                        {   id: 'measures',
                            dataType: 'number',
                            dataStructure: 'column',
                            caption: 'measures',
                            required: true,
                            allowMultiple: true         // true or false
                        },
                      {
                        id: 'showTable',
                        dataType: 'boolean',
                        value: true,
                        ui: {
                          label: "showTable",
                          group: "options",
                          type: 'checkbox'
                        }
                      }/*,
                      {
                        id: 'barColor',
                        dataType: 'string',
                        value: "#4488aa",
                        ui: {
                          label: "barColor",
                          group: "options",
                          type: 'colorbox',
                          caption: 'Bar Color'
                        }
                      },*/
                      /*
                      TODO (dleao): This requires the missing class CrossFilterColorDialog
                      {
                          id: "colorsBtn",
                          dataType: 'none',
                          ui: {
                              group: "options",
                              type: "button",
                              label: "Colors"
                          }
                      }
                      */
                      /*,
                      {
                          id: "optionsBtn",
                          dataType: 'none',
                          ui: {
                              group: "options",
                              type: "button",
                              label: "chartoptions"
                          }
                      }*/
                    ]
            }
        ]
    });
});
