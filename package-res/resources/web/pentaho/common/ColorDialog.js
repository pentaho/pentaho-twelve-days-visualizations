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
    "dojo/aspect", 
    "dojo/_base/lang", 
    "dijit/_Widget", 
    "dijit/_TemplatedMixin", 
    "dijit/_WidgetsInTemplateMixin", 
    "pentaho/common/Dialog", 
    "dijit/ColorPalette"
], function(declare, on, aspect, lang, Widget, TemplatedMixin, _WidgetsInTemplateMixin, Dialog, ColorPalette) {

    return declare("pentaho.common.ColorDialog", [
        Dialog,
        TemplatedMixin,
        _WidgetsInTemplateMixin
    ],
    {
        templateString: '<div dojoAttachPoint="dialogContainer" class="filterDialogContainer dialog-content pentaho-padding-sm" dojoAttachPoint="containerNode" style="width:230px; height:150px"><center><div dojoAttachPoint="colorDialogPalette" data-dojo-type="dijit/ColorPalette">\n</div></center></div></div>',
        buttons: ['Cancel_txt'],
        _onSuccessCallback: undefined,
        _onCancelCallback: undefined,
        color: null,

        postCreate: function() {
            console.log('pentaho.common.ColorDialog.postCreate');
            this.inherited(arguments);
            this.callbacks = [lang.hitch(this, this.cancel)];
            console.log('palette',this.colorDialogPalette);
            on(this.colorDialogPalette, "change", lang.hitch(this, '_colorChange' ));
        },

        _colorChange: function(color) {
            console.log('pentaho.common.ColorDialog._colorChange');
            this.colorDialogPalette._setValueAttr(color, false);
            this.color = color;
            this.save();
        },

        onCancel: function() {
            this.cancel();
        },

        save: function() {
            if (this._onSuccessCallback) {
              try {
                this._onSuccessCallback();
              } catch (e) {
              }
            }
            this.hide();
        },

        cancel: function() {
            if (this._onCancelCallback) {
              try {
                this._onCancelCallback();
              } catch (e) {
              }
            }
            this.hide();
        },

        registerOnSuccessCallback: function(f) {
            this._onSuccessCallback = f;
        },

        registerOnCancelCallback: function(f) {
            this._onCancelCallback = f;
        }
    });
});
