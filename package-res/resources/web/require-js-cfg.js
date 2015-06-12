(function() {
    /*global CONTEXT_PATH:true, requireCfg:true */

    // NOTE: must be in sync with the actual pentaho plugin folder name!
    var pluginId = 'twelve-days-visualizations';

    // NOTE: `mid` must be in sync with that declared used in analyzer_plugin.
    // NOTE: must be a valid JS identifier.
    var pluginJsId = 'twelveDaysViz';

    // AMD module id
    var mid        = pluginJsId;
    var pluginPath = CONTEXT_PATH + 'content/' + pluginId + '/resources/web';
    var configPath = CONTEXT_PATH + 'content/' + pluginId + '/resources/config';

    // ----------

    var amd = requireCfg;

    // Local map for requires made from within this module
    amd.map[mid] = {};

    // ----------

    // Basic plugin configuration
    amd.paths [mid] = pluginPath;
    amd.config[mid + '/pentaho/visual/visualTypeHelper'] = {pluginId: pluginId, pluginJsId: pluginJsId};

    // Special mapping for vizTypes.config.json
    amd.paths[mid + '/config'] = configPath;

    // Register the IVisualTypeProvider and Visual API config
    amd.config.service[mid + "/visualTypeProvider"] = "IVisualTypeProvider";
    amd.config.service[mid + "/visualApiConfig"] = "IVisualApiConfiguration";

    // Configure "d3"
    // The local mid should not to be used directly. Just require 'd3'.
    var localMid = mid + '/lib/d3';
    amd.paths[localMid] = pluginPath + '/lib/d3/d3.v2.min';
    amd.shim [localMid] = {exports: 'd3'};
    // Redirect all "d3" module requires to the local d3 version.
    amd.map[mid].d3 = localMid;

    // Configure "crossfilter"
    // The local mid should not to be used directly. Just require 'crossfilter'.
    localMid = mid + '/lib/crossfilter';
    amd.paths[localMid] = pluginPath + '/lib/crossfilter/crossfilter.v1.min';
    amd.shim [localMid] = {
        exports: 'crossfilter',
        deps:    ['d3']
    };
    // Redirect all "crossfilter" module requires to the local "crossfilter" version.
    amd.map[mid].crossfilter = localMid;

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
    amd.map[mid]["jquery"] = "common-ui/jquery";

    // Configure "protovis" - prefer common-ui's jQuery
    var cccMap = amd.map["cdf/lib/CCC"] || (amd.map["cdf/lib/CCC"] = {});
    cccMap["jquery"] = "common-ui/jquery";
} ());
