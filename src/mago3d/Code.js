"use strict";

var CODE = {};

//0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***
CODE.fileLoadState = {
	"READY" : 0,
	"LOADING" : 1,
	"LOADING_FINISH" : 2,
	"PARSE" : 3,
	"FINISH" : 4
};
