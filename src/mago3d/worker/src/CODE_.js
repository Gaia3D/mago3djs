'use strict';

var CODE_ = {};

CODE_.status = {
	"UNKNOWN" : 0,
	"NORMAL" : 1,
	"DELETED" : 2,
	"HIGHLIGHTED" : 3
}

CODE_.cardinal = {
	"UNKNOWN" : 0,
	"SOUTH" : 1,
	"EAST" : 2,
	"NORTH" : 3,
	"WEST" : 4
}

CODE_.relativePositionPoint2DWithTriangle2D = {
	"UNKNOWN" : 0,
	"OUTSIDE" : 1,
	"INSIDE" : 2,
	"COINCIDENT_WITH_TRIANGLE_POINT" : 3,
	"COINCIDENT_WITH_TRIANGLE_EDGE" : 4
}

CODE_.relativePositionPoint2DWithSegment2D = {
	"UNKNOWN" : 0,
	"OUTSIDE" : 1,
	"INSIDE" : 2,
	"COINCIDENT_WITH_START_POINT" : 3,
	"COINCIDENT_WITH_END_POINT" : 4
}

CODE_.relativePositionSegment2DWithSegment2D = {
	"UNKNOWN" : 0,
	"NO_INTERSECTION" : 1,
	"INTERSECTION" : 2
}

CODE_.relativePositionSegment3DWithPlane2D = {
	"UNKNOWN" : 0,
	"NO_INTERSECTION" : 1,
	"INTERSECTION" : 2,
	"START_POINT_COINCIDENT" : 3,
	"END_POINT_COINCIDENT" : 4,
	"TWO_POINTS_COINCIDENT" : 5
}

CODE_.relativePosition2D = {
	"UNKNOWN"    : 0,
	"LEFT"       : 1,
	"RIGHT"      : 2,
	"COINCIDENT" : 3
};