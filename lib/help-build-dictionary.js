/**
 * Module dependencies
 */

var _ = require('lodash');
var includeAll = require('include-all');



/**
 * helpBuildDictionary()
 *
 * Go through each module in the source directory according to these options.
 * This primarily relies on include-all, with a few extra bits of logic, including
 * the determination of each module's "identity".  Tolerates non-existent files/directories
 * by ignoring them.
 *
 * @param {Dictionary} options [see README.md for details]
 * @param {Function} cb
 *
 * @private
 */
module.exports = function helpBuildDictionary (options, cb) {

  // Defaults
  options.replaceVal = options.replaceVal || '';

  // Deliberately exclude source control directories
  if (!options.excludeDirs) {
    options.excludeDirs = /^\.(git|svn)$/;
  }

  var files = includeAll(options);

  // Start building the module dictionary
  var dictionary = {};

  // Iterate through each module in the set
  _.each(files, function (module, filename) {

    // Build the result dictionary by merging all of the target modules.
    // Note: Each module must export a dictionary in order for this to work
    // (e.g. for building a configuration dictionary from a set of config files)
    if (options.aggregate) {

      // Check that source module is a valid dictionary
      if (!_.isPlainObject(module)) {
        return cb(new Error('When using `aggregate`, modules must export dictionaries.  But module (`'+filename+'`) is invalid:' + module));
      }

      // Merge module into dictionary
      _.merge(dictionary, module);

      return;
    }

    // Keyname is how the module will be identified in the returned module tree
    var keyName = filename;

    // If a module is found but marked as `undefined`,
    // don't actually include it (since it's probably unusable)
    if (typeof module === 'undefined') {
      return;
    }

    // Unless the `identity` option is explicitly disabled,
    // (or `dontLoad` is set)
    if (!options.dontLoad && options.identity !== false) {

      // If no `identity` property is specified in module, infer it from the filename
      if (!module.identity) {
        if (options.replaceExpr) {
          module.identity = filename.replace(options.replaceExpr, options.replaceVal);
        }
        else {
          module.identity = filename;
        }
      }

      // globalId is the name of the variable for this module
      // that will be exposed globally in Sails unless configured otherwise

      // Generate `globalId` using the original value of module.identity
      if (!module.globalId) {module.globalId = module.identity;}

      // `identity` is the all-lowercase version
      module.identity = module.identity.toLowerCase();

      // Use the identity for the key name
      keyName = options.useGlobalIdForKeyName ? module.globalId : module.identity;
    }

    // Save the module's contents in our dictionary
    // (this will actually just be `true` if the `dontLoad` option is set)
    dictionary[keyName] = module;
  });//</each key/module pair in the module map>

  // Always return at least an empty dictionary
  dictionary = dictionary || {};

  return cb(null, dictionary);
};