"use strict";

var CODE = {};

// magoManager가 다 로딩 되지 않은 상태에서 화면으로 부터 호출 되는 것을 막기 위해
CODE.magoManagerState = {
	"INIT"   	: 0,
	"STARTED"	: 1,
	"READY"   : 2
};

//0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
CODE.fileLoadState = {
	"READY"            : 0,
	"LOADING_STARTED"  : 1,
	"LOADING_FINISHED" : 2,
	"PARSE_STARTED"    : 3,
	"PARSE_FINISHED"   : 4
};

CODE.moveMode = {
	"ALL"    : "0",
	"OBJECT" : "1",
	"NONE"   : "2"
};

CODE.OBJECT_INDEX_FILE_PREFIX = "objectIndexFile_";