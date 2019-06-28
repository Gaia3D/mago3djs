'use strict';

/**
 * Under implementation
 * Top class on Mago3D.
 * Handling mouse event and send it to MouseAction
 * @class MagoWorld
 * @param {MagoManager} magoManager
 */
var MagoWorld = function(magoManager) 
{
	if (!(this instanceof MagoWorld)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.magoManager = magoManager;
	
	// Set the start position of the camera.***
	/*
	var camera = this.magoManager.sceneState.camera;
	var rotMat = new Matrix4();
	var angRad = 45 * Math.PI/180;
	var rotAxis = new Point3D();
	rotAxis.set(1, 0, 1);
	rotAxis.unitary();
	rotMat.rotationAxisAngRad(angRad, rotAxis.x, rotAxis.y, rotAxis.z);
	camera.transformByMatrix4(rotMat);

	this.updateModelViewMatrixByCamera(camera);
	*/
};

/**
 * 시각화 준비 함수
 */
MagoWorld.prototype.prepareVisibles = function()
{
	// 1rst, do terrain frustum culling.
	// TODO:
};

/**
 * 첫 번째 시야를 그릴 준비
 */
MagoWorld.prototype.renderScene = function()
{
	//this.renderTest();
	var gl = this.magoManager.sceneState.gl;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	this.magoManager.start(undefined, true, 0, 1);
};

/**
 * 첫 번째 시야를 그릴 준비
 * @TODO : 리팩토링 필요
 */
MagoWorld.prototype.renderTest = function()
{
	var gl = this.magoManager.sceneState.gl;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	this.magoManager.start(undefined, true, 0, 1);
	
};

/**
 * 카메라를 지구의 특정 위치에 위치시키는 함수
 * @param {Number} longitude 
 * @param {Number} latitude
 * @param {Number} altitude 
 */
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
	
	// calculate camDir & camUp.
	camDir.set(-matrixAux[8], -matrixAux[9], -matrixAux[10]);
	camUp.set(matrixAux[4], matrixAux[5], matrixAux[6]); // tangent north direction.
	
	this.updateModelViewMatrixByCamera(camera);
};

/**
 * 마우스 꾹 누르는 동작을 핸들링
 * @param {type}event 
 */
MagoWorld.prototype.mousedown = function(event)
{
	this.magoManager.sceneState.mouseButton = event.button;
	MagoWorld.updateMouseStartClick(event.clientX, event.clientY, this.magoManager);
	this.magoManager.isCameraMoving = true;
	this.magoManager.mouse_x = event.clientX;
	this.magoManager.mouse_y = event.clientY;
	
};

/**
 * 마우스 클릭 위치를 최신으로 갱신
 * @param {Number} mouseX 최신 마우스 클릭 위치의 x 좌표
 * @param {Number} mouseY 최신 마우스 클릭 위치의 y 좌표
 * @param {MagoManager} magoManager
 * 
 */

MagoWorld.updateMouseClick = function(mouseX, mouseY, magoManager)
{
	var mouseAction = magoManager.sceneState.mouseAction;
	mouseAction.curX = mouseX;
	mouseAction.curY = mouseY;
};

/**
 * 마우스를 드래그하기 시작하는 시점을 저장
 * @param {Number} mouseX the x coordi of the start point 
 * @param {Number} mouseY the y coordi of the start point
 * @param {MagoManager} magoManager
 */
MagoWorld.updateMouseStartClick = function(mouseX, mouseY, magoManager)
{
	var gl = magoManager.sceneState.gl;
	var mouseAction = magoManager.sceneState.mouseAction;
	
	MagoWorld.updateMouseClick(mouseX, mouseY, magoManager);
	
	var date = new Date();
	mouseAction.strTime = date.getTime();
	
	// if button = 1 (middleButton), then rotate camera.
	mouseAction.strX = mouseX;
	mouseAction.strY = mouseY;
	if (magoManager.sceneState.mouseButton === 0)
	{
		magoManager.bPicking = true;
	}
	
	// determine world position of the X,Y.
	mouseAction.strLinealDepth = ManagerUtils.calculatePixelLinearDepth(gl, mouseAction.strX, mouseAction.strY, magoManager.depthFboAux, magoManager);
	mouseAction.strCamCoordPoint = ManagerUtils.calculatePixelPositionCamCoord(gl, mouseAction.strX, mouseAction.strY, mouseAction.strCamCoordPoint, magoManager.depthFboAux, undefined, magoManager);
	mouseAction.strWorldPoint = ManagerUtils.cameraCoordPositionToWorldCoord(mouseAction.strCamCoordPoint, mouseAction.strWorldPoint, magoManager);
	
	// now, copy camera to curCamera.
	var camera = magoManager.sceneState.camera;
	var strCamera = mouseAction.strCamera;
	
	strCamera.copyPosDirUpFrom(camera);
	
	// copy modelViewMatrix.
	var modelViewMatrix = magoManager.sceneState.modelViewMatrix;
	var modelViewMatrixInv = magoManager.sceneState.modelViewMatrixInv;
	mouseAction.strModelViewMatrix._floatArrays = glMatrix.mat4.copy(mouseAction.strModelViewMatrix._floatArrays, modelViewMatrix._floatArrays);
	mouseAction.strModelViewMatrixInv._floatArrays = glMatrix.mat4.copy(mouseAction.strModelViewMatrixInv._floatArrays, modelViewMatrixInv._floatArrays);

	// save the sphere pick.
	if (magoManager.globe !== undefined)
	{
		var camRay;
		camRay = ManagerUtils.getRayWorldSpace(gl, mouseX, mouseY, camRay, magoManager); // rayWorldSpace.
		mouseAction.strWorldPoint2 = magoManager.globe.intersectionLineWgs84(camRay, mouseAction.strWorldPoint2);
	}
};

/**
 * 만약 마우스 핸들링으로 화면이 바뀌었을 경우, 다음 함수가 활성화 된다
 * @param {Camera} camera
 */
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
	
	var modelViewMatrix = this.magoManager.sceneState.modelViewMatrix;																	
	modelViewMatrix._floatArrays = Matrix4.lookAt(modelViewMatrix._floatArrays, [camPos.x, camPos.y, camPos.z], 
		[tergetX, tergetY, tergetZ], 
		[camUp.x, camUp.y, camUp.z]);

};

/**
 * 마우스를 꾹 눌렀다가 땔 때의 동작을 감지
 * @param {type}event 
 * 
 */
MagoWorld.prototype.mouseup = function(event)
{
	var magoManager = this.magoManager;
	magoManager.sceneState.mouseButton = -1;
	magoManager.bPicking = false;
	magoManager.isCameraMoving = false;
	
	// Check time to check if is a "click".***
	/*
	var date = new Date();
	var currTime = date.getTime();
	var mouseAction = magoManager.sceneState.mouseAction;
	var durationTime = currTime - mouseAction.strTime;
	if (durationTime < 200)
	{
		// Check if mouse moved.***
		var mouseAction = this.magoManager.sceneState.mouseAction;

		// now, calculate the angle and the rotationAxis.
		var xMoved = event.clientX - mouseAction.strX;
		if (Math.abs(xMoved) > 2)
		{ return; }
		
		var yMoved = event.clientY - mouseAction.strY;
		if (Math.abs(yMoved) > 2)
		{ return; }
		
		// Considere as "click".***
		magoManager.bPicking = true;
		magoManager.managePickingProcess();
	}
	*/
};

/**
 * 마우스 클릭 동작을 감지
 * @param {type}event 
 */
MagoWorld.prototype.mouseclick = function(event)
{
	if (event.button === 0)
	{
		var mouseX = event.clientX;
		var mouseY = event.clientY;
		this.magoManager.mouseActionLeftClick(mouseX, mouseY);
	}
};

/**
 * 마우스 휠 동작을 감지
 * @param {type}event 
 */
MagoWorld.prototype.mousewheel = function(event)
{
	var delta = event.wheelDelta / 10;
	
	var mouseAction = this.magoManager.sceneState.mouseAction;
	
	// move camera.
	var camera = this.magoManager.sceneState.camera;
	var camPos = camera.position;
	var camDir = camera.direction;
	var camUp = camera.up;
	
	var camHeght = camera.getCameraElevation();

	if (isNaN(camHeght))
	{ return; }

	// Lineal increment.
	//delta *= camHeght * 0.003;
	
	// Squared increment.
	delta *= (camHeght*camHeght) * 0.00001 + camHeght * 0.001;
	delta += 1;
	
	//var maxDelta = 200000;
	var maxDelta = 0.5*camHeght;
	if (maxDelta > 200000)
	{ maxDelta = 200000; }
	
	if (delta < -maxDelta)
	{ delta = -maxDelta; }
	
	if (delta > maxDelta)
	{ delta = maxDelta; }
	
	camPos.add(camDir.x * delta,  camDir.y * delta,  camDir.z * delta);
	
	this.updateModelViewMatrixByCamera(camera);
};

/**
 * 어떻게 화면을 변화시키는지를 처리할 수 있다. 마우스 왼쪽 또는 마우스 휠로 회전 가능.
 */
MagoWorld.prototype.mousemove = function(event)
{
	var mouseAction = this.magoManager.sceneState.mouseAction;
	if (this.magoManager.sceneState.mouseButton === 0)
	{
		// left button pressed.
		var gl = this.magoManager.sceneState.gl;
		var sceneState = this.magoManager.sceneState;
		var strCamera = mouseAction.strCamera; // camera of onMouseDown.
		var camera = this.magoManager.sceneState.camera;
		
		// now, calculate the angle and the rotationAxis.
		var strWorldPoint = mouseAction.strWorldPoint;
		var strEarthRadius = strWorldPoint.getModul();
		var nowX = event.clientX;
		var nowY = event.clientY;
		if (nowX === mouseAction.strX && nowY === mouseAction.strY)
		{ return; }
		
		var nowPoint;
		var camRay, camRayCamCoord;
		
		camRayCamCoord = ManagerUtils.getRayCamSpace(nowX, nowY, camRayCamCoord, this.magoManager);
		
		// Now calculate rayWorldCoord.
		if (this.pointSC === undefined)
		{ this.pointSC = new Point3D(); }
		
		this.pointSC.set(camRayCamCoord[0], camRayCamCoord[1], camRayCamCoord[2]);

		// Now, must transform this posCamCoord to world coord, but with the "mouseAction.strModelViewMatrixInv".
		var mv_inv = mouseAction.strModelViewMatrixInv;
		this.pointSC2 = mv_inv.rotatePoint3D(this.pointSC, this.pointSC2); // rayWorldSpace.
		this.pointSC2.unitary(); // rayWorldSpace.
		camRay = new Line();
		camRay.setPointAndDir(strCamera.position.x, strCamera.position.y, strCamera.position.z,       this.pointSC2.x, this.pointSC2.y, this.pointSC2.z);// original.
		// end calculate camRayWorldCoord.---------------
		
		var nowWorldPoint;
		nowWorldPoint = this.magoManager.globe.intersectionLineWgs84(camRay, nowWorldPoint, strEarthRadius);

		if (nowWorldPoint === undefined)
		{ return; }

		var strPoint = new Point3D(strWorldPoint.x, strWorldPoint.y, strWorldPoint.z); // copy point3d.
		var nowPoint = new Point3D(nowWorldPoint[0], nowWorldPoint[1], nowWorldPoint[2]);
		
		var rotAxis;
		rotAxis = strPoint.crossProduct(nowPoint, rotAxis);
		rotAxis.unitary();
		if (rotAxis.isNAN())
		{ return; }
		
		var angRad = strPoint.angleRadToVector(nowPoint);
		if (angRad === 0 || isNaN(angRad))
		{ return; }
		
		// recalculate position and direction of the camera.
		camera.copyPosDirUpFrom(strCamera);
	
		var rotMat = new Matrix4();
		rotMat.rotationAxisAngRad(-angRad, rotAxis.x, rotAxis.y, rotAxis.z);
		camera.transformByMatrix4(rotMat);

		this.updateModelViewMatrixByCamera(camera);
	}
	else if (this.magoManager.sceneState.mouseButton === 1)
	{
		// middle button pressed.
		var strCamera = mouseAction.strCamera;
		var camera = this.magoManager.sceneState.camera;
		camera.copyPosDirUpFrom(strCamera);
		var camPos = camera.position;
		var camDir = camera.direction;
		var camUp = camera.up;
		
		// 1rst, determine the point of rotation.
		var rotPoint = mouseAction.strWorldPoint;
		
		// now determine the rotation axis.
		// the rotation axis are the camRight & normalToSurface.
		if (this.magoManager.globe === undefined)
		{ this.magoManager.globe = new Globe(); }
		
		var pivotPointNormal;
		pivotPointNormal = this.magoManager.globe.normalAtCartesianPointWgs84(rotPoint.x, rotPoint.y, rotPoint.z, pivotPointNormal);
		
		var xAxis = camera.getCameraRight();
		
		// now determine camZRot & camXRot angles.
		var nowX = event.clientX;
		var nowY = event.clientY;
		var increX = nowX - mouseAction.strX;
		var increY = nowY - mouseAction.strY;
		
		var zRotAngRad = increX * 0.003;
		var xRotAngRad = increY * 0.003;
		
		if (zRotAngRad === 0 && xRotAngRad === 0)
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

/**
 *
 *
 * @param {*} event
 */
MagoWorld.prototype.keydown = function(event)
{
	// TODO: keydown()
	console.log("keydown");
};




























