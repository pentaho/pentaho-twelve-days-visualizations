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
pen.define(['./ColorBox'], function() {

    dojo.provide("pentaho.common.propertiesPanel.ColorPicker");
    dojo.require("dijit._Widget");
    dojo.require("dijit._Templated");
    dojo.require("pentaho.common.Messages");
    dojo.require("pentaho.common.propertiesPanel.Panel");
    dojo.require("pentaho.common.propertiesPanel.Configuration");

    dojo.declare("pentaho.common.propertiesPanel.ColorPicker", [
        dijit._Widget,
        dijit._Templated,
        pentaho.common.propertiesPanel.StatefulUI
    ],
    {
        widgetsInTemplate: true,
        value: "none",
        templateString: "<div><table><tr><td><div dojoAttachPoint='colorBox' dojoType='pentaho.common.propertiesPanel.ColorBox'></div></td><td style='padding-left: 5px'><label for='${model.id}_colorbox'>${label}</label></rd></tr></table></div>",

        constructor: function (options) {
            console.log('ColorPicker.constructor');
            this.disabled = this.model.disabled;
            this.label = pentaho.common.Messages.getString(this.model.ui.label, this.model.ui.label);
            this.inherited(arguments);
        },

        postCreate: function(){
            console.log('ColorPicker.postCreate');
            this.value = this.model.value;
            dojo.style(this.colorBox.domNode,"background-color",this.value);
            this.colorBox.registerOkFunc(dojo.hitch( this, "onClick") );
        },

        onClick: function( color ) {
            console.log('ColorPicker.onClick');
            if( color != null && color != this.value ) {
                this.value = color;
                dojo.style(this.colorBox,"background-color",this.value);
                this.model.set('value', this.value);
            }
        },

        set: function(prop, newVal){
            console.log('ColorPicker.set '+prop, newVal);
            if(this.colorBox){
              if(prop == "value" && newVal != this.value){
                dojo.style(this.colorBox,"background-color",this.value);
              }
            }
        }
    });

    pentaho.common.propertiesPanel.Panel.registeredTypes["colorpicker"] = pentaho.common.propertiesPanel.ColorPicker;
    pentaho.common.propertiesPanel.Configuration.registeredTypes["colorpicker"] = pentaho.common.propertiesPanel.Property;

    return pentaho.common.propertiesPanel.ColorPicker;
});