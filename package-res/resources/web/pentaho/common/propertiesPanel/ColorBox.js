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
pen.define(['../ColorDialog'], function(ColorDialog) {

    dojo.provide("pentaho.common.propertiesPanel.ColorBox");
    dojo.require("dijit._Widget");
    dojo.require("dijit._Templated");

    dojo.declare("pentaho.common.propertiesPanel.ColorBox", [
        dijit._Widget,
        dijit._Templated
    ],
    {
        widgetsInTemplate: false,
        value: "none",
        okFunc: null,
        templateString: "<div style='width:20px; height: 20px; background-color: none; cursor: pointer; border: 1px solid #808080;' dojoAttachPoint='colorBox'>&nbsp;</div>",
        constructor:function (options) {
            console.log('ColorBox.constructor');
            this.inherited(arguments);
        },

        postCreate: function(){
            console.log('ColorBox.postCreate');
            dojo.style(this.colorBox,"background-color",this.value);
            this.connect(this.colorBox, "onclick", "onClick");

        },

        onClick: function(){
            console.log('ColorBox.onClick');

            if( !ColorDialog.dialog ) {
                ColorDialog.dialog = new ColorDialog();
            }
            var func = dojo.hitch( this, function() { this.colorsChanged() } );
            ColorDialog.dialog.registerOnSuccessCallback( func );
            ColorDialog.dialog.show();
        },

        registerOkFunc: function( func ) {
            console.log('ColorBox.registerOkFunc');
            this.okFunc = func;
        },

        colorsChanged: function() {
            console.log('ColorBox.colorsChanged');
            var color = ColorDialog.dialog.color;
            if( color != null && color != this.value ) {
                this.value = color;
                dojo.style(this.colorBox,"background-color",this.value);
                if( this.okFunc ) {
                    this.okFunc(color);
                }
            }
        },

        set: function(prop, newVal){
            console.log('ColorBox.set');
            if(this.colorBox) {
              if(prop == "value" && newVal != this.value) {
                dojo.style(this.colorBox,"background-color",this.value);
              }
            }

        }
    });

    return pentaho.common.propertiesPanel.ColorBox;
});