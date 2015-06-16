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
    '../vizTypeHelper',
    'pentaho/common/propertiesPanel/Panel',
    "dojo/on",
    '../../common/propertiesPanel/ColorPicker',
    '../../common/propertiesPanel/GradientPicker'
], function(vizTypeHelper, Panel, on, ColorPicker, GradientPicker) {

    // TODO: Patch bug in 5.1 propertiesPanel/Panel
    Panel.onUIEvent = function (type, args) {
        on.emit(this, type, args);
    };

    return vizTypeHelper.registerVisualization('calendar', {
        type:   'time',
        source: 'Protovis',
        needsColorGradient: true,
        customType: '',
        maxValues: [5000,5000,5000,5000],
        getDropZoneLabel: function(type) {
          var label = type;
          return label;
        },
        helper: {
            canRefreshReport: function(report) {
              var ok = false;
              if( (report.findGemsByGembarId("colorby").length == 1 ||
                   report.findGemsByGembarId("sizeby" ).length == 1) &&

                  (report.findGemsByGembarId("date").length == 1 ||
                   (report.findGemsByGembarId("year").length == 1 && report.findGemsByGembarId("month").length == 1))) {
                ok = true;
              }
              return ok;
            }
        },
        dataReqs: [
          {
            name: 'Default',
            reqs :
                [
                  {   id: 'date',
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'date',
                    required: false,
                    allowMultiple: false
                  },
                  {   id: 'year',
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'year',
                    required: false,
                    allowMultiple: false
                  },
                  {   id: 'month',
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'month',
                    required: false,
                    allowMultiple: false
                  },
                  {   id: 'day',
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'day',
                    required: false,
                    allowMultiple: false
                  },
                  {   id: 'colorby',
                    dataType: 'number',
                    dataStructure: 'column',
                    caption: 'colorby',
                    required: false,
                    allowMultiple: false
                  },
                  {   id: 'sizeby',
                    dataType: 'number',
                    dataStructure: 'column',
                    caption: 'sizeby',
                    required: false,
                    allowMultiple: false
                  },
                  {   id: "gradient1",
                    dataType: 'string',
                    value: {
                      color1: "red",
                      color2: "yellow",
                      color3: "green",
                      threshold1: '',
                      threshold2: ''
                    },
                    ui: {
                        group: "options",
                        type:  "gradientpicker",
                        label: "Gradient"
                    }
                  },
                  {   id: "backgroundcolor",
                    dataType: 'string',
                    value: "#cccccc",
                    ui: {
                        group: "options",
                        type: "colorpicker",
                        label: "Background Color"
                    }
                  },
                      /*
                    {
                        id: 'pattern',
                        dataType: 'string',
                        values: ["GRADIENT", "3-COLOR", "5-COLOR"],
                        ui: {
                          labels: ["gradient", "step_3", "step_5"],
                          group: "options",
                          type: 'combo',
                          caption: "Pattern"
                        }
                      },
                      {
                        id: 'colorSet',
                        dataType: 'string',
                        values: ["ryg", "ryb", "blue", "gray"],
                        ui: {
                          labels: ["RYG", "RYB", "blue_scale", "gray_scale"],
                          group: "options",
                          type: 'combo',
                          caption: "Color"
                        }
                      }
                      ,
                  {
                    id: 'reverseColors',
                    dataType: 'boolean',
                    ui: {
                      label: "reverse_colors",
                      group: "options",
                      type: 'checkbox'
                    }
                  },
                  */
                  {   id: "optionsBtn",
                    dataType: 'none',
                    ui: {
                        group: "options",
                        type:  "button",
                        label: "chartoptions"
                    }
                  }
              ]
          }
        ]
    });
});
