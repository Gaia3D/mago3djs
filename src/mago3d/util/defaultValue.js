'use strict';

/**
 * Returns the first parameter if not undefined, otherwise the second parameter.
 * Useful for setting a default value for a parameter.
 *
 * @param {*} a
 * @param {*} b
 * @returns {*} Returns the first parameter if not undefined, otherwise the second parameter. 
 */
var defaultValue = function (a, b) 
{
	if (a !== undefined && a !== null) 
	{
		return a;
	}
	return b;
};