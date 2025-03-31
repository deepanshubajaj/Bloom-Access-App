"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.translateCancellationError = translateCancellationError;
var _functions = require("./functions");
var _constants = require("./constants");
var _errorCodes = require("./errors/errorCodes");
/**
 * Since the introduction of a new JS api, the native rejections need to be processed in JS layer.
 *
 * This is easier than reworking 2 native modules
 **/
function translateCancellationError(e) {
  if ((0, _functions.isErrorWithCode)(e) && e.code === _errorCodes.SIGN_IN_CANCELLED_CODE) {
    return _constants.cancelledResult;
  } else {
    throw e;
  }
}
//# sourceMappingURL=translateNativeRejection.js.map