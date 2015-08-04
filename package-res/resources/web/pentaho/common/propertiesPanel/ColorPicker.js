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
pen.define(["dojo/_base/declare", "dojo/on", "dojo/_base/lang", "dijit/_Widget", "dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin", "pentaho/common/Dialog", "dijit/ColorPalette", "../ColorDialog", "dojo/dom-style", "./ColorBox", "pentaho/common/Messages",
"pentaho/common/propertiesPanel/Panel",
"pentaho/common/propertiesPanel/Configuration"], function(declare, on, lang, Widget, TemplatedMixin, _WidgetsInTemplateMixin, Dialog, ColorPalette, ColorDialog, style, ColorBox, Messages, Panel, Configuration) {
    // StatefuUI copied from common-ui pentaho/common/propertiesPanel/Panel.js as it is no longer public there. Remove once it is again public.
    var StatefulUI = declare(
        [],
        {
          constructor: function (options) {
            this.model = options.model;
            this.propPanel = options.propPanel;
            var outterThis = this;
            this.model.watch(function (propName, prevVal, newVal) {
    
              switch (propName) {
                case "value":
                case "default":
                  outterThis.set(propName, newVal);
                  break;
              }
            });
          },
          onUIEvent: function (type, args) {
    
          }
        }
    );
    
    var ColorPicker = declare("pentaho.common.propertiesPanel.ColorPicker", [
        Widget,
        TemplatedMixin,
        _WidgetsInTemplateMixin,
        StatefulUI
    ],
    {
        value: "none",
        templateString: "<div><table><tr><td><div dojoAttachPoint='colorBox' dojoType='pentaho.common.propertiesPanel.ColorBox'></div></td><td style='padding-left: 5px'><label for='${model.id}_colorbox'>${label}</label></rd></tr></table></div>",

        constructor: function (options) {
            console.log('ColorPicker.constructor');
            this.disabled = this.model.disabled;
            this.label = Messages.getString(this.model.ui.label, this.model.ui.label);
            this.inherited(arguments);
        },

        postCreate: function(){
            console.log('ColorPicker.postCreate');
            this.value = this.model.value;
            style.set(this.colorBox.domNode,"background-color",this.value);
            this.colorBox.registerOkFunc(dojo.hitch( this, "onClick") );
        },

        onClick: function( color ) {
            console.log('ColorPicker.onClick');
            if( color != null && color != this.value ) {
                this.value = color;
                style.set(this.colorBox,"background-color",this.value);
                this.model.set('value', this.value);
            }
        },

        set: function(prop, newVal){
            console.log('ColorPicker.set '+prop, newVal);
            if(this.colorBox){
              if(prop == "value" && newVal != this.value){
                style.set(this.colorBox,"background-color",this.value);
              }
            }
        }
    });

    Panel.registeredTypes["colorpicker"] = ColorPicker;
    Configuration.registeredTypes["colorpicker"] = pentaho.common.propertiesPanel.Property;

    return ColorPicker;
});