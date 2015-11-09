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
    "require",
    "../visualUtils",
    "pentaho/visual/color/paletteRegistry",
    "pentaho/visual/events",
    "d3",
    "dojo/_base/lang",
    "pentaho/common/Messages"
], function(require, utils, paletteRegistry, visualEvents, d3, lang, Messages) {

    return Chord;

    function Chord(div) {

        this.debug = false;
        if(this.debug) console.log('Chord');

        this.element = div;
        this.highLightNo = -1;
        this.playing = false;
        this.timeout = null;
        this.labelColor = "black";
        this.labelSize = 20;
        this.plotAreaColor = "green";
        this.backgroundFill = "NONE";
        this.backgroundColor = "#ffffff";
        this.backgroundColorEnd = "#000000";
        this.colors = paletteRegistry.get("twelveDaysViz").colors;
        this.formatPercent = d3.format(".1%");
        this.opacity = 1;
        this.highlights = [];
        this.pendingSelection = null;
        this.doubleClickTimer = null;
        this.titleStr = 'Highlighted: ';
        this.playImg = null;
        this.highLightsSet = false;

        var playImgPlayUrl = require.toUrl('./images/play.png');
        var playImgStopUrl = require.toUrl('./images/stop.png');

        this.setPlaying = function(playing) {
            this.playing = !!playing;
            this.playImg.src = playing ? playImgStopUrl : playImgPlayUrl;
        };

        // start or stop the highlight animation
        this.playClick = function() {
            this.playing = !this.playing;
            var localThis = this;
            if(this.playing) {
                this.setPlaying(true);
                this.clearHighlights();
                this.highLightNo = -1;
                this.timeout = setTimeout(function() { return localThis.nextHighlight.apply(localThis); }, 10);
            } else {
                this.setPlaying(false);
                clearTimeout(this.timeout);
                this.highLightNo = -1;
                this.highlight();
                setTimeout(function() { return localThis.highlight.apply(localThis); }, 200);
            }
        }

        this.clearHighlights = function() {
            for(var idx=0; idx<this.highlights.length; idx++) {
                this.highlights[idx] = false;
            }
            this.highLightsSet = false;
        };

        // show the next highlight, wrap to the first one if we need to
        this.nextHighlight = function() {

            this.highLightNo++;
            if(this.highLightNo == this.matrix.length) {
                this.highLightNo = -1;
            }
            this.highlight();
            var localThis = this;
            if(this.playing) {
                if(this.highLightNo == -1) {
                    setTimeout(function() { return localThis.nextHighlight.apply(localThis); }, 2000);
                } else {
                    setTimeout(function() { return localThis.nextHighlight.apply(localThis); }, 800);
                }
            }
        };

        this.highlight = function() {
            var localThis = this;

            this.highLightsSet = false;
            for(var idx=0; idx<this.highlights.length; idx++) {
                if(this.highlights[idx]) {
                    this.highLightsSet = true;
                    break;
                }
            }

            if(this.playing || this.highLightNo != -1 || !this.highLightsSet) {
                var showAll = this.highLightNo == -1 || !this.playing;
                if(this.chord) {
                    if(showAll) {
                        this.chord.style("fill", function(d) {
                            return localThis.items[d.source.index].color;
                        });
                    } else {
                        this.chord.style("fill", function(d) {
                            return (d.source.index == localThis.highLightNo ||
                                    d.target.index == localThis.highLightNo ||
                                    localThis.highlights[d.source.index]    ||
                                    localThis.highlights[d.target.index])
                                ? localThis.items[d.source.index].color
                                : "rgba(255,255,255,0.1)";
                        });
                    }
                }
                document.getElementById('title').innerHTML = this.titleStr + (showAll ? "All" : localThis.items[this.highLightNo].name);
            } else {
                if(this.chord) {
                    this.chord.style("fill", function(d) {
                        return localThis.highlights[d.source.index] || localThis.highlights[d.target.index]
                            ? localThis.items[d.source.index].color
                            : "rgba(255,255,255,0.1)";
                        });
                }
            }
        };

        this.setHighlights = function(lights) {
            if(!lights || lights.length == 0) {
                this.clearHighlights();
                this.highlightNo = -1;
                this.setPlaying(false);
                this.highlight();
            }
        };

        this.resize = function() {
            this.width = utils.getClientWidth(this)-20,
            this.height = utils.getClientHeight(this)-20,
            this.outerRadius = Math.min(this.width, this.height) / 2 - 20,
            this.innerRadius = this.outerRadius - 36;
            this.svg.attr("width", "100%");
            this.svg.attr("height", "100%");
            this.rootCircle.attr("transform", "translate(" + this.width / 2 + "," + ((this.height / 2)+20) + ") scale("+this.outerRadius/this.origRadius+","+this.outerRadius/this.origRadius+")");
        };

        this.click = function(n) {

            if(this.pendingSelection && this.pendingSelection._chordIdx == n) {
                clearTimeout(this.doubleClickTimer);
                visualEvents.trigger(this, "doubleclick", this.pendingSelection);
                return;
            }

            this.highlights[n] = !this.highlights[n];
            this.setPlaying(false);
            this.highLightNo = -1;
            this.highlight();

            var rowItem = this.items[n].id;
            var selection = {
                rowId:   [],
                rowIdx:  -1,
                rowItem: [],
                colItem: [],
                colId:   [],
                type:    'row'
            };

            for(var idx=0; idx<rowItem.length; idx++) {
                selection.rowId.push(this.dataTable.getColumnId(this.items[n].cols[idx]));
                selection.rowItem.push(rowItem[idx]);
            }

            var args = {
                mode: "TOGGLE",
                type: 'row',
                source: this,
                _chordIdx: n,
                selections: [selection]

            };

            this.pendingSelection = args;
            // start a double click timer

            this.doubleClickTimer = setTimeout(lang.hitch(this, this.toggleGroup), 300);

        };

        this.toggleGroup = function(n) {

            visualEvents.trigger(this, "select", this.pendingSelection);
            if(!this.highLightsSet) {
                if(this.debug) console.log("ChordChart clearing selections");
                utils.clearSelections();
                // null out the pending selection
            }
            this.pendingSelection = null;
        };

        this.draw = function(dataTable, drawSpec) {
            if(this.debug) console.log('Chord draw');

            // detect IE
            var browserName=navigator.appName;
            if (browserName=="Microsoft Internet Explorer") {
                this.element.innerHTML = Messages.getString('noIE');
                return;
            }

            this.dataTable = dataTable;
            this.drawSpec  = drawSpec;

            utils.handleCommonOptions(this, drawSpec);

            this.processData();

            this.width = utils.getClientWidth(this)-20;
            this.height = utils.getClientHeight(this)-20;
            this.outerRadius = Math.min(this.width, this.height) / 2 - 20;
            this.origRadius = this.outerRadius;
            this.innerRadius = this.outerRadius - 36;
            this.arc = d3.svg.arc()
                .innerRadius(this.innerRadius)
                .outerRadius(this.outerRadius);

            this.arc2 = d3.svg.arc()
                .innerRadius(this.outerRadius)
                .outerRadius(this.outerRadius+30);

            this.layout = d3.layout.chord()
                .padding(.04)
                .sortSubgroups(d3.descending)
                .sortChords(d3.ascending);

            this.path = d3.svg.chord().radius(this.innerRadius);

            utils.applyBackground(this.element, drawSpec);

            document.getElementById('title').style.color = this.labelColor;
            document.getElementById('title').style.fontSize = ''+Math.min(24,this.labelSize * 1.5)+'pt';
            if(this.labelFontFamily) {
                document.getElementById('title').style.fontFamily = this.labelFontFamily;
            }

            // Compute the chord layout.
            this.layout.matrix(this.matrix);

            var localThis = this;

            if(this.group) {
                this.group.remove();
            }
            if(this.chord) {
                this.chord.remove();
            }
            // Add a group per neighborhood.

            this.rootCircle.attr("fill-opacity",""+this.opacity);

            this.group = this.rootCircle.selectAll(".group")
                .data(this.layout.groups)
              .enter().append("g")
                .attr("fill-opacity", "0.75")
                .attr("cursor","pointer")
                .on("mouseover", function(d, i) {
                    localThis.highLightNo = i;
                    localThis.playing = true;
                    localThis.highlight.apply(localThis);
                    localThis.setPlaying(false);
                })
                .on("mouseout", function() {
                    localThis.highLightNo = -1;
                    localThis.highlight.apply(localThis);
                })
                .on("click", function(d, i) {
                    localThis.click(i);
                });

            // Add a mouseover title.
            this.group.append("title").text(function(d, i) {
              return localThis.items[i].name;
            });

            // Add the group arc.
            var groupPath = this.group.append("path")
                .attr("id", function(d, i) { return "group" + i; })
                .attr("d", this.arc)
                .style("fill", function(d, i) { return localThis.items[i].color; });

            // Add the group arc.
            this.group.append("path")
                .attr("id", function(d, i) { return "group" + i; })
                .attr("d", this.arc2)
                .style("fill", "none");

            // Add a text label.
            var groupText = this.group.append("text")
                .attr("dx", 5)
                .attr("dy", 25);

            groupText.append("textPath")
                .attr("xlink:href", function(d, i) { return "#group" + i; })
                .text(function(d, i) { return localThis.items[i].name; })
                .style("font-size",''+this.labelSize+"pt")
                .style("fill", this.labelColor);

            if(this.labelStyle) {
                groupText.style("font-style",this.labelStyle);
            }
            if(this.labelFontFamily) {
                groupText.style("font-family",this.labelFontFamily);
            }

            // Remove the labels that don't fit. :(
            groupText.filter(function(d, i) { return (groupPath[0][i].getTotalLength() / 2 - 35) < this.getComputedTextLength(); })
                .remove();

            // Add the chords.
            this.chord = this.rootCircle.selectAll(".chord")
                .data(this.layout.chords)
              .enter().append("path")
                .style("fill", function(d) { return localThis.items[d.source.index].color; })
                .style("stroke-width", ".25px")
                .style("stroke", "#000000")
                .attr("d", this.path);

            // Add an elaborate mouseover title for each chod.
            this.chord.append("title").text(function(d) {
              return localThis.items[d.source.index].name
                  + " and " + localThis.items[d.target.index].name
                  + ": " + localThis.formatPercent(d.source.value);
            });

            this.resize();
            this.highlight();
        };

        this.init = function() {

            if(this.debug) console.log('Chord init()');

            // detect IE
            var browserName=navigator.appName;
            if (browserName=="Microsoft Internet Explorer") {
                return;
            }

            this.titleStr = Messages.getString('title') + " ";

            this.width  = utils.getClientWidth(this) - 20;
            this.height = utils.getClientHeight(this) - 20;

            if(this.debug) console.log('init: creating div and styling');

            this.svgDiv = document.createElement('DIV');
            this.element.appendChild(this.svgDiv);
            this.svgDiv.id = "svgDiv";
            this.svgDiv.style.position="absolute";
            this.svgDiv.style.top="0px";
            this.svgDiv.style.left="0px";
            this.svgDiv.style.width="100%";
            this.svgDiv.style.height="100%";

            if(this.debug) console.log('init: creating title div and styling');
            this.titleDiv = document.createElement('DIV');
            this.element.appendChild(this.titleDiv);
            this.titleDiv.id = "titleDiv";
            this.titleDiv.style.position="absolute";
            this.titleDiv.style.top="0px";
            this.titleDiv.style.left="0px";
            this.titleDiv.style.width="100%";
            this.titleDiv.style.height="30px";

            var table = document.createElement('TABLE');
            this.titleDiv.appendChild(table);
            var row = table.insertRow(0);

            var cell = row.insertCell(0);
            cell.style.whiteSpace = 'nowrap';
            cell.style.fontSize = '2em';

            var span = document.createElement('SPAN');
            span.id = "title";
            cell.appendChild(span);

            cell = row.insertCell(1);
            cell.style.width="100%";

            cell = row.insertCell(2);

            this.playImg = document.createElement('IMG');
            this.setPlaying(false);
            this.playImg.style.cursor = "pointer";
            var localThis = this;
            this.playImg.onclick = function() { localThis.playClick(); };
            cell.appendChild(this.playImg);

            if(this.debug) console.log('init: creating SVG ');
            try {
                this.svg = d3.select("#svgDiv").append("svg")
                .attr("width", this.width)
                .attr("height", this.height);

                this.rootCircle = this.svg.append("g")
                    .attr("id", "circle")
                    .attr("transform", "translate(" + this.width / 2 + "," + ((this.height / 2)+20) + ")")
                    .attr("fill",this.plotAreaColor);

                this.rootCircle.append("circle")
                    .attr("r", this.outerRadius);
            } catch (e) {
                alert(e.message);
            }
            if(this.debug) console.log('init: done');
        };

        this.getRoleColumnIndexes = function(roleName) {
            var attrNames = this.drawSpec[roleName];
            return attrNames
                ? attrNames.map(this.dataTable.getColumnIndexByAttribute, this.dataTable)
                : [];
        };

        this.getRoleFirstColumnIndex = function(roleName) {
            return this.drawSpec[roleName]
                ? this.dataTable.getColumnIndexByAttribute(this.drawSpec[roleName][0])
                : -1;
        };

        this.processData = function() {
            var rowsNos = this.getRoleColumnIndexes("rows");
            var colsNos = this.getRoleColumnIndexes("cols");
            var measureCol = this.getRoleFirstColumnIndex("measure");

            this.column1Names = [];
            this.column1Ids = [];
            this.column2Names = [];
            this.column2Ids = [];

            var rowsDistinct = [];
            var colsDistinct = [];

            var values;

            // see if any of the columns have only one value
            for(var idx=0; idx<rowsNos.length; idx++) {
                values = this.dataTable.getDistinctFormattedValues(rowsNos[idx]);
                rowsDistinct[idx] = values.length;
            }

            for(var idx=0; idx<colsNos.length; idx++) {
                values = this.dataTable.getDistinctFormattedValues(colsNos[idx]);
                colsDistinct[idx] = values.length;
            }

            var rowValueMap = {};
            var colValueMap = {};
            var only1Row = true;
            for(var idx=0; idx<rowsDistinct.length; idx++) {
                only1Row = only1Row && rowsDistinct[idx] == 1;
            }

            var ids, str;

            // create lists of the labels
            for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
                str = '';
                ids = [];
                for(var idx=0; idx<rowsNos.length; idx++) {
                    if(rowsDistinct[idx] > 1 || rowsNos.length == 1) {
                        if(str != '') {
                            str += '~';
                        }
                        str += this.dataTable.getFormattedValue(rowNo, rowsNos[idx]);
                    }
                    ids[idx] = this.dataTable.getValue(rowNo, rowsNos[idx]);
                }

                if(!rowValueMap[str]) {
                    rowValueMap[str] = true;
                    this.column1Names.push(str);
                    this.column1Ids.push(ids);
                }

                str = '';
                ids = [];
                for(var idx=0; idx<colsNos.length; idx++) {
                    if(colsDistinct[idx] > 1 || colsNos.length == 1) {
                        if(str != '') {
                            str += '~';
                        }
                        str += this.dataTable.getFormattedValue(rowNo, colsNos[idx]);
                    }
                    ids[idx] = this.dataTable.getValue(rowNo, colsNos[idx]);
                }
                if(!colValueMap[str]) {
                    colValueMap[str] = true;
                    this.column2Names.push(str);
                    this.column2Ids.push(ids);
                }
            }

            var itemMap = {};
            this.items = [];
            for(var idx=0; idx<this.column2Names.length; idx++) {
                this.items.push({
                    name: this.column2Names[idx],
                    id: this.column2Ids[idx],
                    color: this.colors[idx],
                    cols: colsNos
                });
                itemMap[this.column2Names[idx]] = idx;
            }

            for(var idx=0; idx<this.column1Names.length; idx++) {
                this.items.push({
                    name: this.column1Names[idx],
                    id: this.column1Ids[idx],
                    color: "#999999",
                    cols: rowsNos
                });

                itemMap[this.column1Names[idx]] = this.column2Names.length + idx;
            }

            // create the highlights array
            this.highlights = new Array(this.items.length);

            // create the matrix
            this.matrix = new Array(this.items.length);
            for(var idx=0; idx<this.items.length; idx++) {
                this.highlights[idx] = false;
                this.matrix[idx] = new Array(this.items.length);
                for(var idx2=0; idx2<this.items.length; idx2++) {
                    this.matrix[idx][idx2] = 0;
                }
            }

            // now process the rows
            for(var rowNo=0; rowNo<this.dataTable.getNumberOfRows(); rowNo++) {
                var item1 = '';
                for(var idx=0; idx<rowsNos.length; idx++) {
                    if(rowsDistinct[idx] > 1 || rowsNos.length == 1) {
                        if(item1 != '') {
                            item1 += '~';
                        }
                        item1 += this.dataTable.getFormattedValue(rowNo, rowsNos[idx]);
                    }
                }

                var item2 = '';
                for(var idx=0; idx<colsNos.length; idx++) {
                    if(colsDistinct[idx] > 1 || colsNos.length == 1) {
                        if(item2 != '') {
                            item2 += '~';
                        }
                        item2 += this.dataTable.getFormattedValue(rowNo, colsNos[idx]);
                    }
                }

                var x = itemMap[item1];
                var y = itemMap[item2];
                var value = this.dataTable.getValue(rowNo,measureCol);
                if(value != null && typeof value != 'undefined' && value > 0) {
                    this.matrix[x][y] = value;
                    this.matrix[y][x] = value;
                } else {
                    this.matrix[x][y] = 0;
                    this.matrix[y][x] = 0;
                }
            }
        };

        this.init();
    }
});
