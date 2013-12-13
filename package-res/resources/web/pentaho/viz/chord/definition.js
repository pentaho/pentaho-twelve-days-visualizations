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

    return vizUtil.registerVisualization('chord', {
        type:    'correlate',
        source:  'D3',
        menuSeparator: true,
        menuOrdinal:   10315,
        needsColorGradient: false,
        customType: '',
        maxValues: [2000,2000,2000,5000],
        getDropZoneLabel: function(type) {
          var label = type;
          return label;
        },
        args: {
        },
        propMap: [
        ],
        helper: {
            canRefreshReport: function(controller) {
              return !(controller.findGemsByGembarId("rows"   ).length  < 1) &&
                     !(controller.findGemsByGembarId("cols"   ).length  < 1) &&
                     !(controller.findGemsByGembarId("measure").length != 1);
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
                    caption: 'chorditem1',
                    required: true,
                    allowMultiple: true
                  },
                  {   id: 'rows',
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'chorditem2',
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
