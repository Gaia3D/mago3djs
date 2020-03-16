'use strict';

/**
 * Movement class for camera.
 * @class Movement
 */
var Movement = function(options) 
{
	if (!(this instanceof Movement)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.movementType = CODE.movementType.NO_MOVEMENT; // it can be translation, rotation or no movement.
	this.deltaTime;
	
	this.currLinearVelocity;
	this.translationDir;
	
	this.currAngularVelocity;
	this.rotationAxis;
	this.xAngVelocity;
	this.zAngVelocity;
	//this.angRad;
	//this.xRotAngRad;
	//this.zRotAngRad;
	
	this.rotationPoint;
	
	if (options)
	{
		if (options.movementType !== undefined)
		{ this.movementType = options.movementType; }
		
		if (options.linearVelocity !== undefined)
		{ this.currLinearVelocity = options.linearVelocity; }
		
		if (options.translationDir !== undefined)
		{ this.translationDir = options.translationDirection; }
		
		if (options.angularVelocity !== undefined)
		{ this.currAngularVelocity = options.angularVelocity; }
		
		if (options.rotationAxis !== undefined)
		{ this.rotationAxis = options.rotationAxis; }
	
		if (options.rotationPoint !== undefined)
		{ this.rotationPoint = options.rotationPoint; }
	}
};