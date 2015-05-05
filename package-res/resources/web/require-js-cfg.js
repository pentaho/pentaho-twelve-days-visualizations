(function() {
    // NOTE: must be in sync with the actual plugin folder name.
    var pluginId = 'twelve-days-visualizations';

    // NOTE: `mid` must be in sync with that declared used in analyzer_plugin.
    // NOTE: must be a valid JS identifier.
    var pluginJsId = 'twelveDaysViz';

    // AMD module id
    var mid        = pluginJsId;
    var pluginPath = CONTEXT_PATH + 'content/' + pluginId + '/resources/web';

    // ----------

    /*global requireCfg:true */
    var amd = requireCfg;

    if(!amd.config) amd.config = {};
    if(!amd.map)    amd.map    = {};
    amd.map[mid] = {}; // For requires made from within this module

    // ----------

    // Basic plugin configuration
    amd.paths [mid] = pluginPath;
    amd.config[mid + '/pentaho/viz/util'] = {pluginId: pluginId, pluginJsId: pluginJsId};

    // Configure "d3"
    // The local mid should not to be used directly. Just require 'd3'.
    var localMid = mid + '/lib/d3';
    amd.paths[localMid] = pluginPath + '/lib/d3/d3.v2.min';
    amd.shim [localMid] = {exports: 'd3'};
    // Redirect all "d3" module requires to the local d3 version.

    amd.map  [mid].d3 = localMid;

    // Configure "crossfilter"
    // The local mid should not to be used directly. Just require 'crossfilter'.
    localMid = mid + '/lib/crossfilter';
    amd.paths[localMid] = pluginPath + '/lib/crossfilter/crossfilter.v1.min';
    amd.shim [localMid] = {
        exports: 'crossfilter',
        deps:    ['d3']
    };
    // Redirect all "crossfilter" module requires to the local "crossfilter" version.
    amd.map  [mid].crossfilter = localMid;

    // Configure "moment"
    // Idem...
    localMid = mid + '/lib/moment';
    amd.paths[localMid] = pluginPath + '/lib/moment/moment.min';
    amd.shim [localMid] = {exports: 'moment'};
    // Redirect all "moment" module requires to the local "moment" version.
    amd.map  [mid].moment = localMid;

    // Configure "layoutCloud"
    // Idem...
    localMid = mid + '/lib/layoutCloud';
    amd.paths[localMid] = pluginPath + '/lib/layoutCloud/Layout.Cloud';
    // Redirect all "layoutCloud" module requires to the local "layoutCloud" version.
    amd.map  [mid].layoutCloud = localMid;


    // Configure "jquery"
    // Redirect all "jquery" module requires to cdf's "jquery"
    amd.map[mid].jquery = "cdf/lib/jquery";

    // Configure amd-plugins (text and json)
    amd.paths['text'] = pluginPath + '/lib/amd-plugins/text';
    amd.paths['json'] = pluginPath + '/lib/amd-plugins/json';
} ());