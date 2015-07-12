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
  "./pentaho/visual/calendar/visualType",
  "./pentaho/visual/chord/visualType",
  "./pentaho/visual/crossFilter/visualType",
  "./pentaho/visual/funnel/visualType",
  "./pentaho/visual/index/visualType",
  "./pentaho/visual/packedCircle/visualType",
  "./pentaho/visual/parallelCoords/visualType",
  "./pentaho/visual/sunBurst/visualType",
  "./pentaho/visual/tagCloud/visualType",
  "./pentaho/visual/treeMap/visualType",
  "./pentaho/visual/trellis/visualType",
  "./pentaho/visual/zoom/visualType"
], function(calendar, chord, crossFilter, funnel, index, packedCircle, parallelCoords,
    sunBurst, tagCloud, treeMap, trellis, zoom) {

    return {
        getAll: function() {
            return [
                calendar, chord, crossFilter, funnel, index, packedCircle, parallelCoords,
                sunBurst, tagCloud, treeMap, trellis, zoom
            ];
        }
    };
});
