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
	
	this.maxFilesRequestedCount = 6;
	this.filesRequestedCount = 0;
};

FileRequestControler.prototype.isFull = function ()
{
	return this.filesRequestedCount >= this.maxFilesRequestedCount; 
};

FileRequestControler.prototype.isFullPlus = function ()
{
	return this.filesRequestedCount >= (this.maxFilesRequestedCount + 2); 
};
