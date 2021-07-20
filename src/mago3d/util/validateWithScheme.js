'use strict';

/**
 *
 * @param {*} object 체크될 대상
 * @param {object} scheme 체크할 스키마
 * @returns {Boolean} 스키마의 조건 통과시 true
 */
var validateWithScheme = function (object, scheme) 
{
    return !!Object.keys(scheme).filter(function (key) {
        return scheme[key](object[key]);
    }).length;
};