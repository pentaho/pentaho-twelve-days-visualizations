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
pen.define(function() {

    dojo.provide("pentaho.common.ColorDialog");
    dojo.require("dijit._Widget");
    dojo.require("dijit._Templated");
    dojo.require('pentaho.common.Dialog');

    dojo.declare("pentaho.common.ColorDialog", [
        pentaho.common.Dialog,
        dijit.ColorPalette
    ],
    {
        templateString: '<div dojoAttachPoint="dialogContainer" class="filterDialogContainer dialog-content pentaho-padding-sm" dojoAttachPoint="containerNode" style="width:230px; height:150px"><center><div dojoAttachPoint="colorDialogPalette" dojoType="dijit.ColorPalette">\n</div></center></div></div>',
        widgetsInTemplate: true,
        buttons: ['Cancel_txt'],
        _onSuccessCallback: undefined,
        _onCancelCallback: undefined,
        color: null,

        postCreate: function() {
            console.log('pentaho.common.ColorDialog.postCreate');
            this.inherited(arguments);
            this.callbacks = [dojo.hitch(this, this.cancel)];
            console.log('palette',this.colorDialogPalette);
            dojo.connect(this.colorDialogPalette, "onChange", this, '_colorChange' );
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

    return pentaho.common.ColorDialog;
});
