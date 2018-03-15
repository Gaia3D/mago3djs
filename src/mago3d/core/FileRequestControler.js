'use strict';

/**
 * xmlhttprequest 요청 개수를 저장하기 위한 객체
 * @class FileRequestControler
 */
var FileRequestControler = function() 
{
	if (!(this instanceof FileRequestControler)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.maxFilesRequestedCount = 1;
	this.filesRequestedCount = 0;
	this.headerFilesRequestedCount = 0;
	this.modelRefFilesRequestedCount = 0;
};

FileRequestControler.prototype.isFull = function ()
{
	return this.filesRequestedCount >= this.maxFilesRequestedCount; 
};

FileRequestControler.prototype.isFullHeaders = function ()
{
	return this.headerFilesRequestedCount >= 1; 
};

FileRequestControler.prototype.isFullPlus = function (extraCount)
{
	return this.filesRequestedCount >= (this.maxFilesRequestedCount + extraCount); 
};

FileRequestControler.prototype.isFullPlusModelReferences = function (extraCount)
{
	return this.modelRefFilesRequestedCount >= (this.maxFilesRequestedCount + extraCount); 
};
