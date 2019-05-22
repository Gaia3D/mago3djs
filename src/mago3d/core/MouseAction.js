'use strict';

/**
 * Manages & controls all mouse actions.
 * @class MouseAction
 */
var MouseAction = function() 
{
	if (!(this instanceof MouseAction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * Start mouse click x position in screen coordinates.
	 * @type {Number}
	 * @default 0
	 */
	this.strX;
	
	/**
	 * Start mouse click y position in screen coordinates.
	 * @type {Number}
	 * @default 0
	 */
	this.strY;
	
	/**
	 * Linear depth value of the start click point.
	 * @type {Number}
	 * @default 0
	 */
	this.strLinealDepth;
	
	/**
	 * Start click point in camera coordinates.
	 * @type {Point3D}
	 * @default (0,0,0)
	 */
	this.strCamCoordPoint;
	
	/**
	 * Start click point in world coordinates.
	 * @type {Point3D}
	 * @default (0,0,0)
	 */
	this.strWorldPoint;
	
	/**
	 * TEST var: Start click point in world coordinates.
	 * @type {Point3D}
	 * @default (0,0,0)
	 */
	this.strWorldPoint2;
	
	/**
	 * Transformation matrix of start click point location.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.strModelViewMatrix = new Matrix4();
	
	/**
	 * Transformation matrix inverse of start click point location.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.strModelViewMatrixInv = new Matrix4();
	
	/**
	 * Camera state on start click.
	 * @type {Camera}
	 * @default Camera.
	 */
	this.strCamera = new Camera();
	
	/**
	 * Camera target on start click.
	 * @type {Float32Array(3)}
	 * @default (0,0,0).
	 */
	this.strCameraTarget = new Float32Array([0.0, 0.0, 0.0]);
	
	/**
	 * Current mouse click x position in screen coordinates.
	 * @type {Number}
	 * @default 0
	 */
	this.curX;
	
	/**
	 * Current mouse click y position in screen coordinates.
	 * @type {Number}
	 * @default 0
	 */
	this.curY;
	
	/**
	 * Camera rotation point.
	 * @type {Point3D}
	 * @default (0,0,0).
	 */
	this.camRotPoint = new Point3D();
	
	/**
	 * Camera rotation axis.
	 * @type {Point3D}
	 * @default (0,0,0).
	 */
	this.camRotAxis = new Point3D();
	
	/**
	 * Aux var. Start click point in world coordinates.
	 * @type {Point3D}
	 * @default (0,0,0).
	 */
	this.strWorldPointAux;
	
	/**
	 * Aux var. Start click point location.
	 * @type {GeographicCoord}
	 * @default (0,0,0).
	 */
	this.strLocationAux;
	
};

/**
 * Deletes the auxiliary start point & location.
 */
MouseAction.prototype.clearStartPositionsAux = function()
{
	if (this.strWorldPointAux)
	{
		this.strWorldPointAux.deleteObjects();
	}
	this.strWorldPointAux = undefined;
		
	if (this.strLocationAux)
	{
		this.strLocationAux.deleteObjects();
	}
	this.strLocationAux = undefined;
};

/**
 * Calculates the camera start position in world coordinates.
 * @param {MagoManager} magoManager Main Mago3D manager.
 */
MouseAction.prototype.claculateStartPositionsAux = function(magoManager)
{
	var strLinDepth = this.strLinealDepth;
					
	// calculate the strWorldPos.***
	var frustumFar = 100000000.0;
	var strRealDepth = strLinDepth*frustumFar;
	// now, find the 3d position of the pixel in camCoord.****
	magoManager.resultRaySC = magoManager.getRayCamSpace(this.strX, this.strY, magoManager.resultRaySC);
	var strCamPos = new Point3D();
	strCamPos.set(magoManager.resultRaySC[0] * strRealDepth, magoManager.resultRaySC[1] * strRealDepth, magoManager.resultRaySC[2] * strRealDepth);
	this.strWorldPointAux = magoManager.cameraCoordPositionToWorldCoord(strCamPos, this.strWorldPointAux);
	this.strLocationAux = ManagerUtils.pointToGeographicCoord(this.strWorldPointAux, undefined, magoManager);
};

/**
 * Save the current-state on start-state vars.
 */
MouseAction.prototype.saveCurrentToStart = function()
{
	this.strX = this.curX;
	this.strY = this.curY;
	
	// world point.***
	if (this.strWorldPoint === undefined)
	{ this.strWorldPoint = new Point3D(); }
	
	if (this.curWorldPoint)
	{
		this.strWorldPoint.copyFrom(this.curWorldPoint);
	}
	
	// camCoord point.***
	if (this.strCamCoordPoint === undefined)
	{ this.strCamCoordPoint = new Point3D(); }
	
	if (this.curCamCoordPoint)
	{
		this.strCamCoordPoint.copyFrom(this.curCamCoordPoint);
	}
};






































