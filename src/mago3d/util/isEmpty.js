'use strict';

/**
 *
 * @param {*} value The object.
 * @returns {Boolean} Returns true if the object is empty, returns false otherwise.
 */
var isEmpty = function (value)
{ 
	if ( value === "" || value === null || value === undefined || ( value !== null && typeof value === "object" && !Object.keys(value).length ) )
	{ 
		return true; 
	}
	else
	{ 
		return false; 
	} 
};

