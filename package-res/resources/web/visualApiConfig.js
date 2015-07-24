/*!
 * Copyright 2010 - 2015 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define(function() {

  return /* @type IVisualApiConfiguration */{

    // IVisualType Configurations for sets of <type,container>
    types: /* @type IVisualTypeConfiguration[] */[

      // Disable sunburst in Analyzer, by default, as it has been superseded by "ccc-sunburst".
      {
        id:        "x-twelveDaysViz/sunBurst",
        container: "analyzer",
        enabled:   false
      },

      {
        id:        /^x-twelveDaysViz\//,
        container: "analyzer",

        getEditorProperties: function(editorDoc, filterPropsList, filterPropsMap) {
          var spec = {}, value;

          function read(name) {
            if(!filterPropsMap || filterPropsMap[name])
              return editorDoc.get(name);
          }

          // LABEL
          value = read('labelColor');
          if(value) spec.labelColor = value;

          value = read('labelFontFamily');
          if(value && value !== 'Default') spec.labelFontFamily = value;

          value = read('labelSize');
          if(value) spec.labelSize = parseFloat(value) || 10;

          value = read('labelStyle');
          if(value && value !== 'PLAIN') spec.labelStyle = value;

          // BACKGROUND
          value = read('backgroundFill');
          if(value) spec.backgroundType = value;

          value = read('backgroundColor');
          if(value) {
            spec.backgroundColor = value;

            value = read('backgroundColorEnd');
            if(value) spec.backgroundColorEnd = value;
          }

          return spec;
        }
      }
    ]
  };
});
