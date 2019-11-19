'use strict';

/**
 * @param {*} option 
 * @class BasicVehicle
 */
var BasicVehicle = function()
{
};

BasicVehicle.degreeValidator = function(deg)
{
	//if (deg > 360) { deg -= 360; }
	//if (deg < -360) { deg += 360; }

	return deg;
};

BasicVehicle.MODE = {
	'NORMAL'             : 0,
	'PARALLEL_TRANSLATE' : 1,
	'PARALLEL_ROTATION'  : 2,
	'CIRCULAR_ROTATION'  : 3
};
BasicVehicle.ACCEL_STATUS = {
	'FORWARD' : 0,
	'REVERSE' : 1,
	'NONE'    : 2
};