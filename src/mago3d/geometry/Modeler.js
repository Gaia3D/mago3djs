
'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class Modeler
 */
var Modeler = function() 
{
	if (!(this instanceof Modeler)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.mode = CODE.modelerMode.INACTIVE; // test for the moment.***
	this.drawingState = CODE.modelerDrawingState.NO_STARTED; // test for the moment.***
	this.drawingElement = CODE.modelerDrawingElement.NOTHING; // test for the moment.***
	this.planeGrid; // sketch plane.***
	this.polyLine2d; // current polyline2D to sketch.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
Modeler.prototype.addPointToPolyline = function(point2d) 
{
	if(this.polyLine2d === undefined)
		this.polyLine2d = new PolyLine2D();
	
	this.polyLine2d.newPoint2d(point2d.x, point2d.y);
};


/**
 * 어떤 일을 하고 있습니까?
 */
Modeler.prototype.render = function(magoManager, shader) 
{
	// 1rst, render the planeGrid if exist.***
	if(this.planeGrid !== undefined)
	{
		this.planeGrid.render(magoManager, shader);
	}
	
	if(this.polyLine2d !== undefined)
	{
		// Provisionally render the polyLine2d on the sketch plane here.***
		var points2dCount = this.polyLine2d.getPointsCount();
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Modeler.prototype.createPlaneGrid = function(width, height, numCols, numRows) 
{
	// Test function.***
	if(width === undefined)
		width = 500.0;
	
	if(height === undefined)
		height = 500.0;
	
	if(numCols === undefined)
		numCols = 50;
	
	if(numRows === undefined)
		numRows = 50;
	
	if(this.planeGrid === undefined)
	{
		this.planeGrid = new PlaneGrid(width, height, numCols, numRows);
	}
	
	
};