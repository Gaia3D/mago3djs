'use strict';

/**
 * @class SoundManager
 */
var SoundManager = function(magoManager) 
{
	if (!(this instanceof SoundManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    this.soundLayersArray = [];
    this.magoManager = magoManager;

	this.fbo;

    //this.createDefaultShaders();
	//this.init();
};