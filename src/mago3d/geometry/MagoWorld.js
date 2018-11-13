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
	mouseAction.strX = mouseX;
	mouseAction.strY = mouseY;
	if (this.magoManager.sceneState.mouseButton === 0)
	{
		// determine worldPosition of the mouse.***
		this.magoManager.bPicking = true;
		//this.magoManager.mouse_x = mouseX;
		//this.magoManager.mouse_y = mouseY;
	}
	
	// determine world position of the X,Y.***
	mouseAction.strCamCoordPoint = this.magoManager.calculatePixelPositionCamCoord(gl, mouseAction.strX, mouseAction.strY, mouseAction.strCamCoordPoint);
	mouseAction.strWorldPoint = this.magoManager.cameraCoordPositionToWorldCoord(mouseAction.strCamCoordPoint, mouseAction.strWorldPoint);
	
	// now, copy camera to curCamera.***
	var camera = this.magoManager.sceneState.camera;
	var strCamera = mouseAction.strCamera;
	
	strCamera.copyPosDirUpFrom(camera);
	
	// copy modelViewMatrix.***
	var modelViewMatrix = this.magoManager.sceneState.modelViewMatrix;
	var modelViewMatrixInv = this.magoManager.sceneState.modelViewMatrixInv;
	mouseAction.strModelViewMatrix._floatArrays = mat4.copy(mouseAction.strModelViewMatrix._floatArrays, modelViewMatrix._floatArrays);
	mouseAction.strModelViewMatrixInv._floatArrays = mat4.copy(mouseAction.strModelViewMatrixInv._floatArrays, modelViewMatrixInv._floatArrays);

	// save the sphere pick.***
	var camRay;
	camRay = this.magoManager.getRayWorldSpace(gl, mouseX, mouseY, camRay);
	mouseAction.strWorldPoint2 = this.magoManager.globe.intersectionLineWgs84(camRay, mouseAction.strWorldPoint2);

};

MagoWorld.prototype.updateModelViewMatrixByCamera = function(camera)
{
	var camera = this.magoManager.sceneState.camera;
	var camPos = camera.position;
	var camDir = camera.direction;
	var camUp = camera.up;
	var far = camera.frustum.far[0];
	
	var tergetX = camPos.x + camDir.x * far;
	var tergetY = camPos.y + camDir.y * far;
	var tergetZ = camPos.z + camDir.z * far;
	
	// test comprovation (posModul must be small than tergetModul).***
	var posModul = camPos.getModul();
	var targetModul = Math.sqrt(tergetX*tergetX, tergetY*tergetY, tergetZ*tergetZ);
	
	if (posModul < targetModul)
	{ var hola = 0; }
	// End test comprobation.-------------------------------------------

	var modelViewMatrix = this.magoManager.sceneState.modelViewMatrix;																	
	modelViewMatrix._floatArrays = Matrix4.lookAt(modelViewMatrix._floatArrays, [camPos.x, camPos.y, camPos.z], 
																			[tergetX, tergetY, tergetZ], 
																			[camUp.x, camUp.y, camUp.z]);

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

	if(isNaN(camHeght))
		return;

	// Lineal increment.***
	//delta *= camHeght * 0.003;
	
	// Squared increment.***
	delta *= (camHeght*camHeght) * 0.00001 + camHeght * 0.001;
	delta += 1;
	
	var maxDelta = 200000;
	if(delta < -maxDelta)
		delta = -maxDelta;
	
	if(delta > maxDelta)
		delta = maxDelta;
	
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
		var strCamera = mouseAction.strCamera; // camera of onMouseDown.***
		var camera = this.magoManager.sceneState.camera;
		
		// now, calculate the angle and the rotationAxis.***
		var strWorldPoint = mouseAction.strWorldPoint;
		var strEarthRadius = strWorldPoint.getModul();
		var nowX = event.clientX;
		var nowY = event.clientY;
		if (nowX === mouseAction.strX && nowY === mouseAction.strY)
		{ return; }
		
		var nowPoint;
		var camRay, camRayCamCoord;
		
		camRayCamCoord = this.magoManager.getRayCamSpace(nowX, nowY, camRayCamCoord);
		
		// now calculate rayWorldCoord.***
		if (this.pointSC === undefined)
		{ this.pointSC = new Point3D(); }
		
		this.pointSC.set(camRayCamCoord[0], camRayCamCoord[1], camRayCamCoord[2]);

		// now, must transform this posCamCoord to world coord.***
		var mv_inv = mouseAction.strModelViewMatrixInv;
		this.pointSC2 = mv_inv.rotatePoint3D(this.pointSC, this.pointSC2); // rayWorldSpace.***
		this.pointSC2.unitary(); // rayWorldSpace.***
		camRay = new Line();
		camRay.setPointAndDir(strCamera.position.x, strCamera.position.y, strCamera.position.z,       this.pointSC2.x, this.pointSC2.y, this.pointSC2.z);// original.***
		// end calculate camRayWorldCoord.---------------
		
		var nowWorldPoint;
		nowWorldPoint = this.magoManager.globe.intersectionLineWgs84(camRay, nowWorldPoint, strEarthRadius);

		if (nowWorldPoint === undefined)
			return;

		var strPoint = new Point3D(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z);
		var nowPoint = new Point3D(nowWorldPoint[0], nowWorldPoint[1], nowWorldPoint[2]);
		
		var rotAxis;
		rotAxis = strPoint.crossProduct(nowPoint, rotAxis);
		rotAxis.unitary();
		if (rotAxis.isNAN())
		{ return; }
		
		var angRad = strPoint.angleRadToVector(nowPoint);
		if (angRad === 0 || isNaN(angRad))
		{ return; }
		
		// recalculate position and direction of the camera.***
		camera.copyPosDirUpFrom(strCamera);
	
		var rotMat = new Matrix4();
		rotMat.rotationAxisAngRad(-angRad, rotAxis.x, rotAxis.y, rotAxis.z);
		camera.transformByMatrix4(rotMat);

		this.updateModelViewMatrixByCamera(camera);
	}
	else if (this.magoManager.sceneState.mouseButton === 1)
	{
		// middle button pressed.***
		var strCamera = mouseAction.strCamera;
		var camera = this.magoManager.sceneState.camera;
		camera.copyPosDirUpFrom(strCamera);
		var camPos = camera.position;
		var camDir = camera.direction;
		var camUp = camera.up;
		
		// 1rst, determine the point of rotation.***
		var rotPoint = mouseAction.strWorldPoint;
		
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
		var increX = nowX - mouseAction.strX;
		var increY = nowY - mouseAction.strY;
		
		var zRotAngRad = increX * 0.003;
		var xRotAngRad = increY * 0.003;
		
		if (zRotAngRad === 0 && xRotAngRad == 0)
		{ return; }
		
		if (this.rotMatX === undefined)
		{ this.rotMatX = new Matrix4(); }
		
		if (this.rotMatZ === undefined)
		{ this.rotMatZ = new Matrix4(); }
		
		if (this.rotMat === undefined)
		{ this.rotMat = new Matrix4(); }
	
		this.rotMatX.rotationAxisAngRad(-xRotAngRad, xAxis.x, xAxis.y, xAxis.z);
		this.rotMatZ.rotationAxisAngRad(-zRotAngRad, pivotPointNormal[0], pivotPointNormal[1], pivotPointNormal[2]);
		this.rotMat = this.rotMatX.getMultipliedByMatrix(this.rotMatZ, this.rotMat);
		
		var translationVec_1 = new Point3D(-rotPoint.x, -rotPoint.y, -rotPoint.z);
		var translationVec_2 = new Point3D(rotPoint.x, rotPoint.y, rotPoint.z);
		
		camera.translate(translationVec_1);
		camera.transformByMatrix4(this.rotMat);
		camera.translate(translationVec_2);
		
		this.updateModelViewMatrixByCamera(camera);
	}
};

MagoWorld.prototype.keydown = function(event)
{
	var hola = 0;
};




























