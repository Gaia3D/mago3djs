'use strict';
/**
 * @enum
 * mago3d data height reference
 */
var HeightReference = {
	'NONE'               : 'none',
	'CLAMP_TO_GROUND'    : 'clampToGround',
	'RELATIVE_TO_GROUND' : 'relativeToGround'
};
/**
 * 
 * @param {string} str 
 * @static
 */
HeightReference.getKey = function(str) 
{
	switch (str) 
	{
	case 'clampToGround' : return 'CLAMP_TO_GROUND';
	case 'relativeToGround' : return 'RELATIVE_TO_GROUND';
	default : return 'NONE';
	}
};

/**
 * 
 * @param {number} number 
 * @static
 */
HeightReference.getValueByOrdinal = function(number) 
{
	switch (number) 
	{
	case 0 : return Mago3D.HeightReference.NONE;
	case 1 : return Mago3D.HeightReference.CLAMP_TO_GROUND;
	case 2 : return Mago3D.HeightReference.RELATIVE_TO_GROUND;
	}
};