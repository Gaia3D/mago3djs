'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class MagoWorld
 */
var MagoWorld = function(magoManager) 
{
	if (!(this instanceof MagoWorld)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.magoManager = magoManager;
};

MagoWorld.prototype.prepareVisibles = function()
{
	// 1rst, do terrain frustum culling.***
	
};

MagoWorld.prototype.renderScene = function()
{
	this.renderTest();
};

MagoWorld.prototype.renderTest = function()
{
	var gl = this.magoManager.sceneState.gl;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	this.magoManager.start(undefined, true, 0, 1);
	
};

MagoWorld.prototype.goto = function(longitude, latitude, altitude)
{
	var resultCartesian;
	resultCartesian = Globe.geographicToCartesianWgs84(longitude, latitude, altitude, resultCartesian);
	
	var camera = this.magoManager.sceneState.camera;
	var camPos = camera.position;
	var camDir = camera.direction;
	var camUp = camera.up;
	
	var matrixAux;
	matrixAux = this.magoManager.globe.transformMatrixAtCartesianPointWgs84(resultCartesian[0], resultCartesian[1], resultCartesian[2], matrixAux);
	
	camPos.set(resultCartesian[0], resultCartesian[1], resultCartesian[2]);
	
	// calculate camDir & camUp.***
	camDir.set(-matrixAux[8], -matrixAux[9], -matrixAux[10]);
	camUp.set(matrixAux[4], matrixAux[5], matrixAux[6]); // tangent north direction.***
	
	this.updateModelViewMatrixByCamera(camera);
	
	//var modelViewMatrix = this.magoManager.sceneState.modelViewMatrix;
	//modelViewMatrix._floatArrays = mat4.lookAt(modelViewMatrix._floatArrays, [camPos.x, camPos.y, camPos.z], [0.0, 0.0, 0.0], [camUp.x, camUp.y, camUp.z]);
	
	var hola = 0;
	
};

MagoWorld.prototype.mousedown = function(event)
{
	this.magoManager.sceneState.mouseButton = event.button;
	this.updateMouseCurrent(event.clientX, event.clientY);
	this.magoManager.isCameraMoving = true;
};

MagoWorld.prototype.updateMouseCurrent = function(mouseX, mouseY)
{
	var gl = this.magoManager.sceneState.gl;
	var mouseAction = this.magoManager.sceneState.mouseAction;
	
	// if button = 1 (middleButton), then rotate camera.***
	mouseAction.curX = mouseX;
	mouseAction.curY = mouseY;
	if (this.magoManager.sceneState.mouseButton === 0)
	{
		// determine worldPosition of the mouse.***
		this.magoManager.bPicking = true;
		//this.magoManager.mouse_x = mouseX;
		//this.magoManager.mouse_y = mouseY;
	}
	
	// determine world position of the X,Y.***
	mouseAction.curCamCoordPoint = this.magoManager.calculatePixelPositionCamCoord(gl, mouseAction.curX, mouseAction.curY, mouseAction.curCamCoordPoint);
	mouseAction.curWorldPoint = this.magoManager.cameraCoordPositionToWorldCoord(mouseAction.curCamCoordPoint, mouseAction.curWorldPoint);
	
	// now, copy camera to curCamera.***
	var camera = this.magoManager.sceneState.camera;
	var curCamera = mouseAction.curCamera;
	
	curCamera.copyPosDirUpFrom(camera);
	
	// copy modelViewMatrix.***
	var modelViewMatrix = this.magoManager.sceneState.modelViewMatrix;
	var modelViewMatrixInv = this.magoManager.sceneState.modelViewMatrixInv;
	mouseAction.curModelViewMatrix._floatArrays = mat4.copy(mouseAction.curModelViewMatrix._floatArrays, modelViewMatrix._floatArrays);
	mouseAction.curModelViewMatrixInv._floatArrays = mat4.copy(mouseAction.curModelViewMatrixInv._floatArrays, modelViewMatrixInv._floatArrays);
	
	
	// save the sphere pick.***
	var camRay;
	camRay = this.magoManager.getRayWorldSpace(gl, mouseX, mouseY, camRay);
	mouseAction.curWorldPoint2 = this.magoManager.globe.intersectionLineWgs84(camRay, mouseAction.curWorldPoint2);

};

MagoWorld.prototype.updateModelViewMatrixByCamera = function(camera, target)
{
	var mouseAction = this.magoManager.sceneState.mouseAction;
	
	var camera = this.magoManager.sceneState.camera;
	var camPos = camera.position;
	var camDir = camera.direction;
	var camUp = camera.up;
	var far = camera.frustum.far[0];
	
	var camRay;
	var camTarget;

	camTarget = new Float32Array(3);
	camTarget[0] = camPos.x + camDir.x * far;
	camTarget[1] = camPos.y + camDir.y * far;
	camTarget[2] = camPos.z + camDir.z * far;
	
	// test comprovation.***
	var posModul = camPos.getModul();
	var targetModul = Math.sqrt(camTarget[0]*camTarget[0], camTarget[1]*camTarget[1], camTarget[2]*camTarget[2]);
	
	if (posModul < targetModul)
	{ var hola = 0; }

	var modelViewMatrix = this.magoManager.sceneState.modelViewMatrix;
	modelViewMatrix._floatArrays = mat4.lookAt(modelViewMatrix._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget[0], camTarget[1], camTarget[2]], [camUp.x, camUp.y, camUp.z]);
};

MagoWorld.prototype.mouseup = function(event)
{
	this.magoManager.sceneState.mouseButton = -1;
	this.magoManager.bPicking = false;
	this.magoManager.isCameraMoving = false;
};

MagoWorld.prototype.mousewheel = function(event)
{
	var delta = event.wheelDelta / 10;
	
	var mouseAction = this.magoManager.sceneState.mouseAction;
	
	// move camera.***
	var camera = this.magoManager.sceneState.camera;
	var camPos = camera.position;
	var camDir = camera.direction;
	var camUp = camera.up;
	
	var camHeght = camera.getCameraElevation();
	var deltaA;
	var deltaB;
	
	// under building...
	if (camHeght > 20000)
	{
		deltaA = camHeght*camHeght * 0.000000001;
		deltaB = camHeght * 0.01;
	}
	if (camHeght > 16000)
	{
		deltaA = camHeght*camHeght * 0.000000001;
		deltaB = camHeght * 0.001;
	}
	else if (camHeght > 14000)
	{
		deltaA = camHeght*camHeght * 0.000000001;
		deltaB = camHeght * 0.001;
	}
	else if (camHeght > 10000)
	{
		deltaA = camHeght*camHeght * 0.0000000001;
		deltaB = camHeght * 0.0001;
	}
	else if (camHeght > 6000)
	{
		deltaA = camHeght*camHeght * 0.00000000001;
		deltaB = camHeght * 0.0000001;
	}
	else 
	{
		deltaA = camHeght*camHeght * 0.00000000001;
		deltaB = camHeght * 0.00000001;
	}
	delta *= deltaA + deltaB + 1;
	camPos.add(camDir.x * delta,  camDir.y * delta,  camDir.z * delta);
	
	this.updateModelViewMatrixByCamera(camera);
};

MagoWorld.prototype.mousemove = function(event)
{
	var mouseAction = this.magoManager.sceneState.mouseAction;
	if (this.magoManager.sceneState.mouseButton === 0)
	{
		// left button pressed.***
		var gl = this.magoManager.sceneState.gl;
		var sceneState = this.magoManager.sceneState;
		var curCamera = mouseAction.curCamera;
		var camera = this.magoManager.sceneState.camera;
		
		// now, calculate the angle and the rotationAxis.***
		var curWorldPoint = mouseAction.curWorldPoint;
		var currEarthRadius = curWorldPoint.getModul();
		var nowX = event.clientX;
		var nowY = event.clientY;
		if (nowX === mouseAction.curX && nowY === mouseAction.curY)
		{ return; }
		
		var nowPoint;
		var camRay, camRayCamCoord;
		
		camRayCamCoord = this.magoManager.getRayCamSpace(nowX, nowY, camRayCamCoord);
		
		// now calculate rayWorldCoord.***
		if (this.pointSC === undefined)
		{ this.pointSC = new Point3D(); }
		
		this.pointSC.set(camRayCamCoord[0], camRayCamCoord[1], camRayCamCoord[2]);

		// now, must transform this posCamCoord to world coord.***
		var mv_inv = mouseAction.curModelViewMatrixInv;
		this.pointSC2 = mv_inv.rotatePoint3D(this.pointSC, this.pointSC2); // rayWorldSpace.***
		this.pointSC2.unitary(); // rayWorldSpace.***
		camRay = new Line();
		camRay.setPointAndDir(curCamera.position.x, curCamera.position.y, curCamera.position.z,       this.pointSC2.x, this.pointSC2.y, this.pointSC2.z);// original.***
		// end calculate camRayWorldCoord.---------------
		
		var nowWorldPoint;
		nowWorldPoint = this.magoManager.globe.intersectionLineWgs84(camRay, nowWorldPoint, currEarthRadius);
		
		if (nowWorldPoint === undefined)
		{
			return;
		}

		var curPoint = new Point3D(curWorldPoint.x, curWorldPoint.y, curWorldPoint.z);
		var nowPoint = new Point3D(nowWorldPoint[0], nowWorldPoint[1], nowWorldPoint[2]);
		
		var rotAxis;
		rotAxis = curPoint.crossProduct(nowPoint, rotAxis);
		rotAxis.unitary();
		if (rotAxis.isNAN())
		{ return; }
		
		var angRad = curPoint.angleRadToVector(nowPoint);
		if (angRad === 0 || isNaN(angRad))
		{ return; }
		
		// recalculate position and direction of the camera.***
		
		camera.copyPosDirUpFrom(curCamera);
		
		var matAux = mat4.create(); // create as identity.***
		matAux = mat4.rotate( matAux, matAux, -angRad, [rotAxis.x, rotAxis.y, rotAxis.z] );
		camera.transformByMatrix4(matAux);
		
		this.updateModelViewMatrixByCamera(camera);
		
	}
	else if (this.magoManager.sceneState.mouseButton === 1)
	{
		// middle button pressed.***
		var curCamera = mouseAction.curCamera;
		var camera = this.magoManager.sceneState.camera;
		camera.copyPosDirUpFrom(curCamera);
		var camPos = camera.position;
		var camDir = camera.direction;
		var camUp = camera.up;
		
		// 1rst, determine the point of rotation.***
		var rotPoint = mouseAction.curWorldPoint;
		
		// now determine the rotation axis.***
		// the rotation axis are the camRight & normalToSurface.***
		if (this.magoManager.globe === undefined)
		{ this.magoManager.globe = new Globe(); }
		
		var pivotPointNormal;
		pivotPointNormal = this.magoManager.globe.normalAtCartesianPointWgs84(rotPoint.x, rotPoint.y, rotPoint.z, pivotPointNormal);
		
		var xAxis = camera.getCameraRight();
		
		// now determine camZRot & camXRot angles.***
		var nowX = event.clientX;
		var nowY = event.clientY;
		var increX = nowX - mouseAction.curX;
		var increY = nowY - mouseAction.curY;
		
		var zRotAngRad = increX * 0.003;
		var xRotAngRad = increY * 0.003;
		
		if (zRotAngRad === 0 && xRotAngRad == 0)
		{ return; }
		
		if (this.rotMatX === undefined)
		{ this.rotMatX = mat4.create(); }
		
		if (this.rotMatZ === undefined)
		{ this.rotMatZ = mat4.create(); }
		
		if (this.rotMat === undefined)
		{ this.rotMat = mat4.create(); }
		
		this.rotMatX = mat4.identity(this.rotMatX);
		this.rotMatZ = mat4.identity(this.rotMatZ);
		this.rotMat = mat4.identity(this.rotMat);
		
		//ManagerUtils.calculateSplited3fv = function(point3fv, resultSplitPoint3fvHigh, resultSplitPoint3fvLow)
		
		this.rotMatX = mat4.fromRotation(this.rotMatX, -xRotAngRad, [xAxis.x, xAxis.y, xAxis.z]);
		this.rotMatZ = mat4.fromRotation(this.rotMatZ, -zRotAngRad, pivotPointNormal);
		this.rotMat = mat4.multiply(this.rotMat, this.rotMatZ, this.rotMatX);
		var translateMat_1 = mat4.create();
		var translateMat_2 = mat4.create();
		translateMat_1 = mat4.fromTranslation(translateMat_1, [-rotPoint.x, -rotPoint.y, -rotPoint.z]);
		translateMat_2 = mat4.fromTranslation(translateMat_2, [rotPoint.x, rotPoint.y, rotPoint.z]);
		
		var totalMatPrev = mat4.create();
		totalMatPrev = mat4.multiply(totalMatPrev, translateMat_2, this.rotMat);
		
		var totalMat = mat4.create();
		totalMat = mat4.multiply(totalMat, totalMatPrev, translateMat_2);
		
		camera.transformByMatrix4(translateMat_1);
		camera.transformByMatrix4(this.rotMat);
		camera.transformByMatrix4(translateMat_2);
		
		this.updateModelViewMatrixByCamera(camera);
	}
};

MagoWorld.prototype.keydown = function(event)
{
	var hola = 0;
};




























