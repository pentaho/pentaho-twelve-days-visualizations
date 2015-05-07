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
    "dojo/_base/declare",
    "dojo/on",
    "dojo/_base/lang",
    "dijit/_Widget",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "pentaho/common/Dialog",
    "dijit/ColorPalette",
    "../ColorDialog",
    "dojo/dom-style",
    "./ColorBox",
    "./StatefulUI",
    "pentaho/common/Messages",
    "pentaho/common/propertiesPanel/Panel",
    "pentaho/common/propertiesPanel/Configuration"
], function(declare, on, lang, Widget, TemplatedMixin,WidgetsInTemplateMixin, Dialog, ColorPalette,
            ColorDialog, style, ColorBox, StatefulUI, Messages, Panel, Configuration) {

    /*global pentaho:true*/

    var GradientPicker = declare(
            "pentaho.common.propertiesPanel.GradientPicker",
            [
                Widget,
                TemplatedMixin,
                WidgetsInTemplateMixin,
                StatefulUI
            ],
            {
                value: {
                    color1: "red",
                    color2: "yellow",
                    color3: "green",
                    threshold1: '',
                    threshold2: ''
                },

                templateString: "<div><fieldset><legend class='pentaho-fieldset-pane-title'>${label}</legend>" +
                    "<table><tr><td><table><tr><td><div dojoAttachPoint='colorBox1' " +
                    "dojoType='pentaho.common.propertiesPanel.ColorBox'></div></td></tr><tr><td>" +
                    "<div dojoAttachPoint='colorBox2' dojoType='pentaho.common.propertiesPanel.ColorBox'></div></td></tr>" +
                    "<tr><td><div dojoAttachPoint='colorBox3' dojoType='pentaho.common.propertiesPanel.ColorBox'></div>" +
                    "</td></tr></table></td><td><table><tr><td>-&nbsp;<input type='text' dojoAttachPoint='threshold1Edit' " +
                    "class='input' style='width:75px; text-align:right'/></div></td></tr><tr><td>-&nbsp;" +
                    "<input type='text' dojoAttachPoint='threshold2Edit' id='' style='width:75px; text-align:right'/>" +
                    "</td></tr></table></td></tr></table></fieldset></div>",

                constructor: function(options) {
                    this.disabled = this.model.disabled;
                    this.label = Messages.getString(this.model.ui.label, this.model.ui.label);
                    this.inherited(arguments);
                },

                postCreate: function() {
                    this.value = this.model.value;
                    this.threshold1Edit.value = this.value.threshold1;
                    this.threshold2Edit.value = this.value.threshold2;
                    this.colorBox1.value = this.value.color1;
                    this.colorBox2.value = this.value.color2;
                    this.colorBox3.value = this.value.color3;
                    on(this.threshold1Edit, "change", lang.hitch(this, this.onChange));
                    on(this.threshold2Edit, "change", lang.hitch(this, this.onChange));
                    style.set(this.colorBox1.domNode, "background-color", this.value.color1);
                    style.set(this.colorBox2.domNode, "background-color", this.value.color2);
                    style.set(this.colorBox3.domNode, "background-color", this.value.color3);
                    this.colorBox1.registerOkFunc(lang.hitch(this, "onChange"));
                    this.colorBox2.registerOkFunc(lang.hitch(this, "onChange"));
                    this.colorBox3.registerOkFunc(lang.hitch(this, "onChange"));
                },

                onChange: function() {
                    // We have to force a new object.
                    this.value = {
                        color1: this.colorBox1.value,
                        color2: this.colorBox2.value,
                        color3: this.colorBox3.value,
                        threshold1: this.threshold1Edit.value,
                        threshold2: this.threshold2Edit.value
                    };
                    this.model.set('value', this.value);
                },

                set: function(prop, newVal) {
                    if(this.colorBox1) {
                        if(prop == "value") {
                            this.value = newVal;
                            // TODO: check which is right: this.colorBox1 or this.colorBox1.domNode as above.
                            style.set(this.colorBox1, "background-color", this.value.color1);
                            style.set(this.colorBox2, "background-color", this.value.color2);
                            style.set(this.colorBox3, "background-color", this.value.color3);
                            this.threshold1Edit.value = this.value.threshold1;
                            this.threshold2Edit.value = this.value.threshold2;
                        }
                    }
                }
            });

    Panel.registeredTypes["gradientpicker"] = GradientPicker;
    Configuration.registeredTypes["gradientpicker"] = pentaho.common.propertiesPanel.Property;

    return GradientPicker;
});
