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

    return visualTypeHelper.registerVisualization('funnel', {
        type:   'misc',
        source: 'Protovis',
        maxValues: [200,200,200,500],
        dataReqs: [
          {
            name: 'Default',
            reqs :
                [
                  {
                    id: 'cols', // Needed by Analyzer to indicate to render to column (and not rows)
                    dataType: 'string',
                    dataStructure: 'column',
                    caption: 'points',
                    required: false,
                    allowMultiple: true
                  },
                  {
                    id: 'measures',
                    dataType: 'number',
                    dataStructure: 'column',
                    caption: 'measures',
                    required: true,
                    allowMultiple: false
                  },
                  {
                    id: "optionsBtn",
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
