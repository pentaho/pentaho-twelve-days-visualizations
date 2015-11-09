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

    return visualTypeHelper.registerVisualization('trellis', {
        type:   'multivariate',
        source: 'Protovis',
        maxValues: [2000,2000,2000,5000],
        updateEditModel: function(editModel, changedProp) {

          if(!changedProp || changedProp === "cols" || changedProp === "colorby") {

            // One or the other is required

            var cols    = editModel.byId("cols"),
                colorBy = editModel.byId("colorby");

            cols.required = colorBy.required = !cols.value.length &&
                !colorBy.value.length;
          }
        },
        dataReqs: [
          {
            name: 'Default',
            reqs :
                [
                  {   id: 'cols',
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'points',
                    required: false,
                    allowMultiple: true
                  },
                  {   id: 'colorby',
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'color',
                    required: false,
                    allowMultiple: false
                  },
                  {   id: 'measures',
                    dataType: 'number',
                    dataStructure: 'column',
                    caption: 'measures',
                    minOccur: 2,
                    allowMultiple: true
                  },
                  {
                    id: 'topMargin',
                    dataType: 'number',
                    uiType: 'slider',
                    value: 30,
                    ui: {
                        group: "options",
                        type: 'slider',
                        caption: "topmargin"
                    }
                  },
                  {
                    id: 'sideMargin',
                    dataType: 'number',
                    uiType: 'slider',
                    value: 30,
                    ui: {
                        group: "options",
                        type: 'slider',
                        caption: "sidemargin"
                    }
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
