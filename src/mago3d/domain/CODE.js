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
	"IN_PARSE_QUEUE"   : 6,
	"BINDING_STARTED"  : 7,
	"BINDING_FINISHED" : 8,
	"LOAD_FAILED"      : 9
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

CODE.magoCurrentProcess = {
	"Unknown"                    : 0,
	"DepthRendering"             : 1,
	"ColorRendering"             : 2,
	"ColorCodeRendering"         : 3,
	"DepthShadowRendering"       : 4,
	"SilhouetteDepthRendering"   : 5,
	"StencilSilhouetteRendering" : 6
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
	"DRAWING_PIPE"             : 9,
	"DRAWING_SPHERE"           : 10,
	"DRAWING_BOX"              : 11,
	"DRAWING_CUTTINGPLANE"     : 12,
	"DRAWING_CLIPPINGBOX"      : 13,
	"DRAWING_CONCENTRICTUBES"  : 14,
	"DRAWING_TUBE"             : 15,
	"DRAWING_FREECONTOURWALL"  : 16,
	"DRAWING_CYLYNDER"         : 17
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

CODE.movementType = {
	"NO_MOVEMENT" : 0,
	"TRANSLATION" : 1,
	"ROTATION"    : 2,
	"ROTATION_ZX" : 3
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

CODE.relativePosition2D = {
	"UNKNOWN"    : 0,
	"LEFT"       : 1,
	"RIGHT"      : 2,
	"COINCIDENT" : 3
};
CODE.imageFilter = {
	"UNKNOWN"                     : 0,
	"BATHYMETRY"                  : 1,
	"OCEANCOLOR_WATERMARKBYALPHA" : 2
};
CODE.cesiumTerrainType = {
	GEOSERVER          : 'geoserver',
	CESIUM_DEFAULT     : 'cesium-default',
	CESIUM_ION_DEFAULT : 'cesium-ion-default',
	CESIUM_ION_CDN     : 'cesium-ion-cdn',
	CESIUM_CUSTOMER    : 'cesium-customer'
};
CODE.magoEarthTerrainType = {
	PLAIN     : 'plain',
	ELEVATION : 'elevation',
	REALTIME  : 'realtime'
};

CODE.drawGeometryType = {
	POINT     : 'point',
	LINE    	 : 'line',
	POLYGON   : 'polygon',
	RECTANGLE : 'rectangle'
};

CODE.PROJECT_ID_PREFIX = "projectId_";
CODE.PROJECT_DATA_FOLDER_PREFIX = "projectDataFolder_";

CODE.parametricCurveState = {
	"NORMAL" : 0,
	"EDITED" : 1
};
