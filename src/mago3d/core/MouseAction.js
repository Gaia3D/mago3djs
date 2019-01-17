'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class MouseAction
 */
var MouseAction = function() 
{
	if (!(this instanceof MouseAction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// start (onMouseDown point).***
	this.strX;
	this.strY;
	this.strLinealDepth;
	this.strCamCoordPoint;
	this.strWorldPoint;
	this.strWorldPoint2;
	this.strModelViewMatrix = new Matrix4();
	this.strModelViewMatrixInv = new Matrix4();
	
	// For objects selection in oneFrustum.***
	this.strWorldPointAux;
	this.strLocationAux;
	
	// cameraStatus.***
	this.strCamera = new Camera();
	this.strCameraTarget = new Float32Array([0.0, 0.0, 0.0]);
	
	// Camera rotation.***
	this.camRotPoint = new Point3D();
	this.camRotAxis = new Point3D();
	
};

MouseAction.prototype.clearStartPositionsAux = function()
{
	if(this.strWorldPointAux)
	{
		this.strWorldPointAux.deleteObjects();
	}
	this.strWorldPointAux = undefined;
		
	if(this.strLocationAux)
	{
		this.strLocationAux.deleteObjects();
	}
	this.strLocationAux = undefined;
};

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
	
	if(this.strWorldPointAux === undefined)
		var hola = 0;
	
	this.strLocationAux = ManagerUtils.pointToGeographicCoord(this.strWorldPointAux, undefined, magoManager);
};

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






































