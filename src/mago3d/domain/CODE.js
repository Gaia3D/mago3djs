"use strict";

var CODE = {};

// magoManager가 다 로딩 되지 않은 상태에서 화면으로 부터 호출 되는 것을 막기 위해
CODE.magoManagerState = {
	"INIT"   	: 0,
	"STARTED"	: 1,
	"READY"   : 2
};

//0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.
CODE.fileLoadState = {
	"READY"            : 0,
	"LOADING_STARTED"  : 1,
	"LOADING_FINISHED" : 2,
	"PARSE_STARTED"    : 3,
	"PARSE_FINISHED"   : 4,
	"IN_QUEUE"         : 5,
	"LOAD_FAILED"      : 6
};

CODE.moveMode = {
	"ALL"              : "0",
	"OBJECT"           : "1",
	"GEOGRAPHICPOINTS" : "2",
	"NONE"             : "3"
};

CODE.magoMode = {
	"NORMAL"  : 0,
	"DRAWING" : 1
};

CODE.modelerMode = {
	"INACTIVE"                 : 0,
	"DRAWING_POLYLINE"         : 1,
	"DRAWING_PLANEGRID"        : 2,
	"DRAWING_GEOGRAPHICPOINTS" : 3,
	"DRAWING_EXCAVATIONPOINTS" : 4,
	"DRAWING_TUNNELPOINTS"     : 5,
	"DRAWING_BSPLINE"          : 6,
	"DRAWING_BASICFACTORY"     : 7,
	"DRAWING_STATICGEOMETRY"   : 8,
	"DRAWING_PIPE"             : 9
};

CODE.boxFace = {
	"UNKNOWN" : 0,
	"LEFT"    : 1,
	"RIGHT"   : 2,
	"FRONT"   : 3,
	"REAR"    : 4,
	"TOP"     : 5,
	"BOTTOM"  : 6
};

CODE.modelerDrawingState = {
	"NO_STARTED" : 0,
	"STARTED"    : 1
};

CODE.modelerDrawingElement = {
	"NOTHING"          : 0,
	"POINTS"           : 1,
	"LINES"            : 2,
	"POLYLINES"        : 3,
	"GEOGRAPHICPOINTS" : 4,
};

CODE.units = {
	"METRE"  : 0,
	"DEGREE" : 1,
	"RADIAN" : 2
};


CODE.trackMode = {
	"TRACKING" : 0,
	"DRIVER"   : 1
};

CODE.imageryType = {
	"UNKNOWN"      : 0,
	"CRS84"        : 1,
	"WEB_MERCATOR" : 2
};

CODE.animationType = {
	"UNKNOWN"         : 0,
	"REALTIME_POINTS" : 1,
	"PATH"            : 2
};

CODE.PROJECT_ID_PREFIX = "projectId_";
CODE.PROJECT_DATA_FOLDER_PREFIX = "projectDataFolder_";
