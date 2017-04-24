'use strict';

/**
 * xmlhttprequest 요청 개수를 저장하기 위한 객체
 * @class FileRequestControler
 */
var FileRequestControler = function() {
	if(!(this instanceof FileRequestControler)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.maxFilesRequestedCount = 50;
	this.filesRequestedCount = 0;
	
	//this.maxNeoBuildingHeaderRequestedCount = 50;
	//this.neoBuildingHeaderRequestedCount = 0;
	
	//this.maxNeoBuildingBlocksListsRequestedCount = 10;
	//this.neoBuildingBlocksListsRequestedCount = 0;
};
