'use strict';

/**
 * vector geometry.
 * This class is analog to "Mesh" class, but VectorMeshWind is for points, lines, polylines data type.
 * @class VectorMeshWind
 */
var VectorMeshWind = function(options) 
{
	if (!(this instanceof VectorMeshWind)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// This class is analog to "Mesh" class, but "VectorMeshWind" is for points, lines, polylines data type.

	this.name;
	this.id;
	this.thickness = 1.0;
	this.color4;
	
	this.vertexList;

	this.vboKeysContainer;
	
	if (options)
	{
		if (options.thickness)
		{ this.thickness = options.thickness; }
		
		if (options.color)
		{ 
			// Check if "color" is hexCode or class Color.
			if (typeof options.color === "string")
			{
				var color = Color.fromHexCode(options.color, undefined);
				this.color4 = color; 
			}
			else
			{ this.color4 = options.color; } 
		}
	}
};

//http://wscg.zcu.cz/WSCG2007/Papers_2007/journal/B17-full.pdf // about polilines clamp to terrain.***
//https://github.com/CesiumGS/cesium/issues/8319 // about polilines clamp to terrain.***

/**
 * Render the VectorMeshWind as child. equal render
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
VectorMeshWind.prototype.renderAsChild = function (magoManager, shader, renderType, glPrimitive, isSelected, options) 
{
	var depthMask = true;
	var gl = magoManager.getGl();
	
	if (options)
	{
		if (options.depthMask !== undefined)
		{
			depthMask = options.depthMask;
		}
	}

	//---------------------------------------------------------------------------
	gl.depthMask(depthMask);
	this.render(magoManager, shader, renderType, glPrimitive, isSelected);
	gl.depthMask(true);
	//---------------------------------------------------------------------------

};

/**
 * Render the VectorMeshWind
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
VectorMeshWind.prototype.render = function(magoManager, shader, options)
{
	if (this.vboKeysContainer === undefined)
	{ return; }
	
	var vbo = this.vboKeysContainer.getVboKey(0);
	var gl = magoManager.getGl();
	var animationState = 1; // 0= paused, 1= play.
	var animationSpeed = 1; // 1 = default.***

	if (options)
	{
		if (options.animationState !== undefined)
		{ animationState = options.animationState; }
		if (options.animationSpeed !== undefined)
		{ animationSpeed = options.animationSpeed; }
	}
	
	gl.disableVertexAttribArray(shader.color4_loc);

	var sceneState = magoManager.sceneState;
	var projMat = sceneState.projectionMatrix;
	var viewMat = sceneState.modelViewMatrix;
	var drawingBufferWidth = sceneState.drawingBufferWidth;
	var drawingBufferHeight = sceneState.drawingBufferHeight;
	
	if (this.thickness === undefined)
	{ this.thickness = 2.0; }
	
	gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);

	var vboPos = vbo.vboBufferPos;
	var dim = vboPos.dataDimensions; // in this case dimensions = 4.
	if (!vboPos.isReady(gl, magoManager.vboMemoryManager))
	{
		return;
	}
	
	if (vbo.vboBufferCol)
	{
		if (!vbo.bindDataColor(shader, magoManager.vboMemoryManager) )
		{
			return;
		}
		gl.uniform1i(shader.colorType_loc, 1);
		gl.enableVertexAttribArray(shader.color4_loc);
	}
	else 
	{
		gl.uniform1i(shader.colorType_loc, 0);
		gl.disableVertexAttribArray(shader.color4_loc);
	}

	//var time = magoManager.getCurrentTime();
	//if(!this.lastTime)
	//this.lastTime = time;
	//var diffTime = time - this.lastTime;

	if (this.phase === undefined)
	{
		this.phase = vbo.vertexCount-4;
		this.currElemIdx = vbo.vertexCount-4;
		this.vertexToDrawCount = 200;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vboPos.key);
	gl.vertexAttribPointer(shader.prev_loc, dim, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(shader.current_loc, dim, gl.FLOAT, false, 16, 32);
	gl.vertexAttribPointer(shader.next_loc, dim, gl.FLOAT, false, 16, 64);

	// now, bind indicesData (vbo.dataCustom).
	vbo.bindDataCustom(shader, magoManager.vboMemoryManager, "indices");

	//gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbo.vertexCount-4);
	var maxVertexDrawCount = vbo.vertexCount-4 < 400 ? vbo.vertexCount-4 : 400;

	if (animationState === 1)
	{
		if (this.phase < 0)
		{
			this.currElemIdx = 0;
			this.vertexToDrawCount = maxVertexDrawCount + this.phase;
		}
		else
		{
			this.currElemIdx = this.phase;
			var remanentVertexCount = (vbo.vertexCount-4) - this.currElemIdx;
			if (remanentVertexCount > maxVertexDrawCount)
			{
				this.vertexToDrawCount = maxVertexDrawCount;
			}
			else
			{
				this.vertexToDrawCount = remanentVertexCount;
			}
		}
	}

	if (this.vertexToDrawCount < 4)
	{
		this.phase -= animationSpeed;
		if (this.phase <= -maxVertexDrawCount + 1)
		{
			this.finished = true;
		}
		return;
	}
	gl.uniform1i(shader.uElemIndex_loc, this.currElemIdx);
	gl.uniform1i(shader.uTotalPointsCount_loc, this.vertexToDrawCount);
	gl.drawArrays(gl.TRIANGLE_STRIP, this.currElemIdx, this.vertexToDrawCount);

	if (animationState === 1)
	{
		//this.phase -= 1; // original.***
		this.phase -= animationSpeed; 
		if (this.phase <= -maxVertexDrawCount + 1)
		{
			this.finished = true;
		}
	}
};

/**
 * Clear the data of this feature
 * @param {VBOMemManager} vboMemManager 
 */
VectorMeshWind.prototype.deleteObjects = function(vboMemManager)
{
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
		this.vboKeysContainer = undefined;
	}

	this.name = undefined;
	this.id = undefined;
	this.thickness = undefined;
	if (this.color4)
	{
		this.color4.deleteObjects();
		this.color4 = undefined;
	}
	
	if (this.vertexList)
	{
		this.vertexList.deleteObjects();
		this.vertexList = undefined;
	}
};