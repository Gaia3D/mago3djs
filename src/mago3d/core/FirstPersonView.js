'use strict';

var keyFlags = {
	moveForward  : false,
	moveBackward : false,
	moveLeft     : false,
	moveRight    : false
};

function getFlagFromKeyCode(code)
{
	switch (code)
	{
	case 37 :	// Arrow-Left
	{
		//console.log("KeyDown Left");
		return 'moveLeft';
	}
	case 38 :	// Arrow-Up
	{
		//console.log("KeyDown Up");
		return 'moveForward';
	}
	case 39 :	// Arrow-Right
	{
		//console.log("KeyDown Right");
		return 'moveRight';
	}
	case 40 :	// Arrow-Down
	{
		//console.log("KeyDown Down");
		return 'moveBackward';
	}
	default :
	{
		return undefined;
	}
	}
};

function onKeyDown(event)
{
	var flag = getFlagFromKeyCode(event.keyCode);
	if ( typeof flag !== 'undefined')
	{
		keyFlags[flag] = true;
	}
};

function onKeyUp(event)
{
	var flag = getFlagFromKeyCode(event.keyCode);
	if ( typeof flag !== 'undefined')
	{
		keyFlags[flag] = false;
	}
};

/**
 * 카메라 1인칭 시점 모드
 * @class FirstPersonView
 * @constructor
 */
function FirstPersonView ()
{
	this._camera = undefined;
	this._cameraBAK = undefined;
	this._position = new Point3D();
	this._rotation = new Point3D();
	this._positionSpeed = 1.0;
	this._ratationSpeed = 1.0;
}

Object.defineProperties(FirstPersonView.prototype, {
	"camera": {
		get : function () { return this._camera; },
		set : function (value) { this._camera = value; }
	},
	"position": {
		get : function () { return this._position; },
		set : function (value) { this._position = value; }		
	},
	"rotation": {
		get : function () { return this._rotation; },
		set : function (value) { this._rotation = value; }
	},
	"positionSpeed": {
		get : function () { return this._positionSpeed; },
		set : function (value) { this._positionSpeed = value; }
	},
	"rotationSpeed": {
		get : function () { return this._ratationSpeed; },
		set : function (value) { this._ratationSpeed = value; }
	}
});

FirstPersonView.prototype.init = function ()
{
	this._position.set(0.0, 0.0, 0.0);
	this._rotation.set(0.0, 0.0, 0.0);

	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
};

FirstPersonView.prototype.release = function ()
{
	this._camera = undefined;
	this._cameraBAK = undefined;
	document.removeEventListener('keydown', onKeyDown, false);
	document.removeEventListener('keyup', onKeyUp, false);
};

FirstPersonView.prototype.move = function (vector)
{
	var position = glMatrix.vec3.fromValues(this._position.x, this._position.y, this.position.z);
	var matrix = glMatrix.mat4.create();
	glMatrix.mat4.rotateY(matrix, matrix, this._rotation.y);
	glMatrix.vec3.transformMat4(vector, vector, matrix);
	glMatrix.vec3.add(position, position, vector);
	this._position.set(position[0], position[1], position[2]);
};
FirstPersonView.prototype.update = function(manager)
{
	if (this._camera === undefined)	{ return; }
	if (keyFlags.moveForward)
	{
		//var isBlocked = manager.checkCollision(this._camera.position, this._camera.direction);
		//if (isBlocked)	{ return; }
		this._camera.moveForward(0.5);
		this.move(vec3.fromValues(0.0, 1.0, 0.0));
	}
	if (keyFlags.moveBackward)
	{
		this._camera.moveBackward(0.5);
		this.move(vec3.fromValues(0.0, -1.0, 0.0));
	}
	if (keyFlags.moveLeft)
	{
		this._camera.lookLeft(0.1);
		this.move(vec3.fromValues(-1.0, 0.0, 0.0));	
	}		
	if (keyFlags.moveRight)
	{
		this._camera.lookRight(0.1);
		this.move(vec3.fromValues(1.0, 0.0, 0.0));	
	}
};
