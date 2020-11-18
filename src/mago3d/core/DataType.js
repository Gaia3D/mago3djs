'use strict';
/**
 * @enum
 * mago3d data type enum
 */
var DataType = {
	'F4D'    : 'f4d',
	'OBJECT' : 'object',
	'NATIVE' : 'native',
	'ALL'    : 'all'
};

/**
 * 
 * @param {string} str 
 * @static
 */
DataType.getKey = function(str) 
{
	switch (str) 
	{
	case 'f4d' : return 'F4D';
	case 'object' : return 'OBJECT';
	case 'native' : return 'NATIVE';
	case 'all' : return 'ALL';
	default : return 'F4D';
	}
};

/**
 * 
 * @param {number} number 
 * @static
 */
DataType.getValueByOrdinal = function(number) 
{
	switch (number) 
	{
	case 0 : return Mago3D.DataType.F4D;
	case 1 : return Mago3D.DataType.OBJECT;
	case 2 : return Mago3D.DataType.NATIVE;
	case 2 : return Mago3D.DataType.ALL;
	}
};