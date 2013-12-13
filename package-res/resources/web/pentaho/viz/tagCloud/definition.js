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
    '../util'
], function(vizUtil) {

    return vizUtil.registerVisualization('tagCloud', {
        type:   'misc',                     // generic type id
        source: 'Protovis',                 // id of the source library
        needsColorGradient: false,
        customType: '',
        maxValues: [50000,50000,50000,50000],
        getDropZoneLabel: function(type){
          var label = type;
          return label;
        },
        args: {
        },
        propMap: [
        ],
        helper: {
            canRefreshReport: function(report) {
              var ok = true;
              if (report.findGemsByGembarId("rows").length == 0 ||
                  (report.findGemsByGembarId("sizeby").length == 0 && report.findGemsByGembarId("colorby").length == 0))
                ok = false;
              return ok;
            }
        },
        dataReqs: [                             // dataReqs describes the data requirements of this visualization
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
                        {   id: 'sizeby',
                            dataType: 'number',
                            dataStructure: 'column',
                            caption: 'sizeby',
                            required: false,
                            allowMultiple: false         // true or false
                        },
                        {   id: 'colorby',
                            dataType: 'number',
                            dataStructure: 'column',
                            caption: 'colorby',
                            required: false,
                            allowMultiple: false         // true or false
                        },
                        { // This defines a checkbox property for sorting (or not) the data
                            id: 'colortext',
                            dataType: 'boolean',
                            value: true,
                            ui: {
                                group: "options",
                                type: 'checkbox',
                                label: "text",
                                caption: "colorwhat"
                            }
                        },
                          {  // This defines a combo box property for choosing the color gradient type
                            id: 'pattern',
                            dataType: 'string',
                            values: ["GRADIENT", "3-COLOR", "5-COLOR", "PIE"],
                            ui: {
                              labels: ["gradient", "step_3", "step_5", "pie"],
                              group: "options",
                              type: 'combo',
                              caption: "Pattern"
                            }
                          },
                          { // This defines a combo box property for choosing the color gradient
                            id: 'colorSet',
                            dataType: 'string',
                            values: ["ryg", "ryb", "blue", "gray"],
                            ui: {
                              labels: ["RYG", "RYB", "blue_scale", "gray_scale"],
                              group: "options",
                              type: 'combo',
                              caption: "Color"
                            }
                          },
                          { // This defines a checkbox property for reversing the color gradient
                            id: 'reverseColors',
                            dataType: 'boolean',
                            ui: {
                              label: "reverse_colors",
                              group: "options",
                              type: 'checkbox'
                            }
                          },
                          { // This defines a button the user can click to get the standard chart options dialog
                              id: "optionsBtn",
                              dataType: 'none',
                              ui: {
                                  group: "options",
                                  type: "button",
                                  label: "chartoptions"
                              }
                          }
                    ]
            }
        ]
    });
} );