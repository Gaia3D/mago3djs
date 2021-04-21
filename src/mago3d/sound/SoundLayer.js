'use strict';

/**
 * @class SoundLayer
 */
var SoundLayer = function(soundManager, options) 
{
	if (!(this instanceof SoundLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    this.soundManager = soundManager;

	this.geographicExtent;
	this.textureWidth = new Int32Array([512]);
	this.textureHeight = new Int32Array([512]);

	// simulation textures.
	this.terrainHeightTexA; // terrain DEM texture.
	this.terrainHeightTexB; // terrain DEM texture.

	this.soundHeightTexA; // water height over terrain.
	this.soundHeightTexB; // water height over terrain.

	// water source & rain.
	this.soundSourceTex;

	this.soundFluxTexA; // water fluxing in 4 directions.
	this.soundFluxTexB; // water fluxing in 4 directions.

	this.soundVelocityTexA;
	this.soundVelocityTexB;

	this.terrainMinMaxHeights = new Float32Array([10.0, 200.0]);

	// The water renderable surface.
	this.surface; // tile size surface, with 512 x 512 points (as DEM texture size).

	// The buildings & objects intersected by this waterTile.
	this.visibleObjectsControler;

	if(options)
	{
		if(options.geographicExtent)
		{
			this.geographicExtent = options.geographicExtent;
		}
	}
};