pen.define([
    'require',
    'json!./analyzer_plugin.config.json', // vizualizations config object
    './pentaho/viz/util'
], function(require, vizs) {

    var prefix = './pentaho/viz/';
    var suffix = '/definition';
    return {
        // Require active vizs dynamically.
        load: function(name, req, callback) {
            // name is ignored
            var depMids = [];
            for(var vizLocalId in vizs)
                if(vizs[vizLocalId])
                    depMids.push(prefix + vizLocalId + suffix);

            require(depMids, function() { callback(null); });
        }
    };
});
