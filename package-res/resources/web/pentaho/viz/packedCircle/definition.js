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

    return vizUtil.registerVisualization('packedCircle', {
        type:   'hierarchy',
        source: 'Protovis',
        needsColorGradient: true,
        maxValues: [2000,2000,2000,5000],
        getDropZoneLabel: function(type) {
          return type;
        },
        args: {
        },
        propMap: [
        ],
        helper: {
            canRefreshReport: function(report) {
              var ok = true;
              if (report.findGemsByGembarId("cols").length == 0 || report.findGemsByGembarId("measure").length == 0)
                ok = false;
              return ok;
            }
        },
        dataReqs: [
          {
            name: 'Default',
            reqs :
                [
                  {   id: 'cols', // Needed by Analyzer to indicate to render to column (and not rows)
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'points',
                    required: true,
                    allowMultiple: true
                  },
                  {   id: 'measure',
                    dataType: 'number',
                    dataStructure: 'column',
                    caption: 'measure',
                    required: true,
                    allowMultiple: false
                  },
                  {
                    id: 'pattern',
                    dataType: 'string',
                    values: ["GRADIENT", "3-COLOR", "5-COLOR", "PIE"],
                    ui: {
                      labels: ["gradient", "step_3", "step_5", "category"],
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
                  },
                  {
                    id: 'reverseColors',
                    dataType: 'boolean',
                    ui: {
                      label: "reverse_colors",
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
} );
