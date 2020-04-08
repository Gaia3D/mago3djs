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
 * Render this ellipsoid
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 */
Sky.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	// To avoid z-fight, split the sky in 8 regions.***
	if (this.ellipsoid === undefined)
	{ 
		var atmosphereHeight = 150000.0;
		var equatorialRadius = Globe.equatorialRadius() + atmosphereHeight;
		var polarRadius = Globe.polarRadius() + atmosphereHeight;
		
		this.ellipsoid = new Ellipsoid( equatorialRadius, equatorialRadius, polarRadius );
		
		var options = {
			"bLoopColumns"       : false,
			"bTrianglesSenseCCW" : false
		};
	
		this.ellipsoid.makeMesh(options);
		var vboMemoryManager = magoManager.vboMemoryManager;
		this.ellipsoid.makeVbo(vboMemoryManager);
		return; 
	}
	
	var gl = magoManager.getGl();
	gl.uniform3fv(shader.buildingPosHIGH_loc, this.ellipsoid.terrainPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, this.ellipsoid.terrainPositionLOW);
	var equatorialRadius = Globe.equatorialRadius();
	var polarRadius = Globe.polarRadius() + atmosphereHeight;
	gl.uniform1f(shader.equatorialRadius_loc, equatorialRadius);
	
	gl.depthRange(1.0, 1.0);
	this.ellipsoid.render(magoManager, shader, renderType, glPrimitive);
	gl.depthRange(0.0, 1.0);
};