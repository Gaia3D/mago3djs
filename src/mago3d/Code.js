"use strict";

var CODE = {};

//0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
CODE.fileLoadState = {
	"READY" : 0,
	"LOADING_STARTED" : 1,
	"LOADING_FINISHED" : 2,
	"PARSE_STARTED" : 3,
	"PARSE_FINISHED" : 4
};
