'use strict';

/**
 *
 * @param {*} value The object.
 * @returns {Boolean} Returns true if the object is empty, returns false otherwise.
 */
function isEmpty(value){ 
    if( value === "" || value === null || value === undefined || ( value !== null && typeof value === "object" && !Object.keys(value).length ) )
    { 
        return true 
    }
    else
    { 
        return false 
    } 
};

