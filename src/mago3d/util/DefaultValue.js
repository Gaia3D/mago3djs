'use strict';

/**
 * Returns the first parameter if not undefined, otherwise the second parameter.
 * Useful for setting a default value for a parameter.
 *
 * @exports defaultValue
 *
 * @param {*} a
 * @param {*} b
 * @returns {*} Returns the first parameter if not undefined, otherwise the second parameter.
 *
 * @example
 * param = defaultValue(param, 'default');
 * 
 * @copyright https://github.com/AnalyticalGraphicsInc/cesium
 */
function defaultValue(a, b) {
    if (a !== undefined) {
        return a;
    }
    return b;
}