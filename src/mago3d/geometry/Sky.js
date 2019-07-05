'use strict';

/**
 * This class is used to render the sky.
 * @class Sky
 */
var Sky = function() 
{
	if (!(this instanceof Sky)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.ellipsoid;
};

/**
 * Makes the ellipsoide mesh.
 */
Sky.prototype.makeMesh = function()
{
	var atmosphereHeight = 100000.0;
	var equatorialRadius = Globe.equatorialRadius() + atmosphereHeight;
	var polarRadius = Globe.polarRadius() + atmosphereHeight;
	
	
	this.ellipsoid = new Ellipsoid( equatorialRadius, equatorialRadius, polarRadius );
	
	
};

/**
 * Render this ellipsoid
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 */
Sky.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	if (this.ellipsoid === undefined)
	{ return; }
	
	this.ellipsoid.render(magoManager, shader, renderType, glPrimitive);
};