'use strict';

/**
 * 블록 목록
 * @class BlocksList
 */
var BlocksArrayPartition = function(version) 
{
	if (!(this instanceof BlocksArrayPartition)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.
	this.fileLoadState = CODE.fileLoadState.READY;
	this.dataArraybuffer; // file loaded data, that is no parsed yet.

};