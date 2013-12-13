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

    dojo.provide("pentaho.common.propertiesPanel.GradientPicker");
    dojo.require("dijit._Widget");
    dojo.require("dijit._Templated");
    dojo.require("pentaho.common.Messages");
    dojo.require("pentaho.common.propertiesPanel.Panel");
    dojo.require("pentaho.common.propertiesPanel.Configuration");

    dojo.declare("pentaho.common.propertiesPanel.GradientPicker", [
        dijit._Widget,
        dijit._Templated,
        pentaho.common.propertiesPanel.StatefulUI
    ],
    {
        widgetsInTemplate: true,
        value: {
            color1: "red",
            color2: "yellow",
            color3: "green",
            threshold1: '',
            threshold2: ''
        },
        templateString: "<div><fieldset><legend class='pentaho-fieldset-pane-title'>${label}</legend><table><tr><td><table><tr><td><div dojoAttachPoint='colorBox1' dojoType='pentaho.common.propertiesPanel.ColorBox'></div></td></tr><tr><td><div dojoAttachPoint='colorBox2' dojoType='pentaho.common.propertiesPanel.ColorBox'></div></td></tr><tr><td><div dojoAttachPoint='colorBox3' dojoType='pentaho.common.propertiesPanel.ColorBox'></div></td></tr></table></td><td><table><tr><td>-&nbsp;<input type='text' dojoAttachPoint='threshold1Edit' class='input' style='width:75px; text-align:right'/></div></td></tr><tr><td>-&nbsp;<input type='text' dojoAttachPoint='threshold2Edit' id='' style='width:75px; text-align:right'/></td></tr></table></td></tr></table></fieldset></div>",
        constructor:function (options) {
            this.disabled = this.model.disabled;
            this.label = pentaho.common.Messages.getString(this.model.ui.label,this.model.ui.label);
            this.inherited(arguments);
        },

        postCreate: function(){
            this.value = this.model.value;
            this.threshold1Edit.value = this.value.threshold1;
            this.threshold2Edit.value = this.value.threshold2;
            this.colorBox1.value = this.value.color1;
            this.colorBox2.value = this.value.color2;
            this.colorBox3.value = this.value.color3;
            this.connect(this.threshold1Edit, "onchange", dojo.hitch(this, this.onChange));
            this.connect(this.threshold2Edit, "onchange", dojo.hitch(this, this.onChange));
            dojo.style(this.colorBox1.domNode,"background-color",this.value.color1);
            dojo.style(this.colorBox2.domNode,"background-color",this.value.color2);
            dojo.style(this.colorBox3.domNode,"background-color",this.value.color3);
            this.colorBox1.registerOkFunc(dojo.hitch( this, "onChange") );
            this.colorBox2.registerOkFunc(dojo.hitch( this, "onChange") );
            this.colorBox3.registerOkFunc(dojo.hitch( this, "onChange") );
        },

        onChange: function(){
            console.log("GradientPicker.onChange()")
            // we have to force a new object
            this.value = {
                color1: this.colorBox1.value,
                color2: this.colorBox2.value,
                color3: this.colorBox3.value,
                threshold1: this.threshold1Edit.value,
                threshold2: this.threshold2Edit.value
            }
            this.model.set('value', this.value);
        },

        set: function(prop, newVal){
            console.log("GradientPicker.set",''+prop,newVal)
            if(this.colorBox1){
                if(prop == "value"){
                    this.value = newVal;
                    dojo.style(this.colorBox1,"background-color",this.value.color1);
                    dojo.style(this.colorBox2,"background-color",this.value.color2);
                    dojo.style(this.colorBox3,"background-color",this.value.color3);
                    this.threshold1Edit.value = this.value.threshold1;
                    this.threshold2Edit.value = this.value.threshold2;
                }
            }
        }
    });

    pentaho.common.propertiesPanel.Panel.registeredTypes["gradientpicker"] = pentaho.common.propertiesPanel.GradientPicker;
    pentaho.common.propertiesPanel.Configuration.registeredTypes["gradientpicker"] = pentaho.common.propertiesPanel.Property;

    return pentaho.common.propertiesPanel.GradientPicker;
});