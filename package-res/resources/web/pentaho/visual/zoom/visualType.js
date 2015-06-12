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

    return visualTypeHelper.registerVisualization('zoom', {
        type:    'time',      // generic type id
        source:  'Protovis',  // id of the source library
        maxValues: [50000,50000,50000,50000],

        updateEditModel: function(editModel, changedProp) {

          if(!changedProp || changedProp === "date" || changedProp === "year" ||
             changedProp === "month" || changedProp === "day") {

            // At least one of the four is required.
            var date  = editModel.byId("date");
            var year  = editModel.byId("year");
            var month = editModel.byId("month");
            var day   = editModel.byId("day");
            var none  = !date.value.length && !year.value.length && !month.value.length &&
                !day.value.length;

            date.required = year.required = month.required = day.required = none;
          }
        },
        dataReqs: [ // dataReqs describes the data requirements of this visualization
            {
                name: 'Default',
                reqs:
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
                      {   id: 'measures',
                          dataType: 'number',
                          dataStructure: 'column',
                          caption: 'measures',
                          required: true,
                          allowMultiple: true         // true or false
                      },
                  {
                    id: 'fixedYAxis',
                    dataType: 'string',
                    values: ["fixed", "dynamic"],
                    ui: {
                      labels: ["Fixed", "Dynamic"],
                      group: "options",
                      type: 'combo',
                      caption: "Y Axis"
                    }
                  },
                  {
                    id: 'contextChartType',
                    dataType: 'string',
                    values: ["line", "area"],
                    ui: {
                      labels: ["Line", "Area"],
                      group: "options",
                      type: 'combo',
                      caption: "Chart Type"
                    }
                  },
                  {
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
});
