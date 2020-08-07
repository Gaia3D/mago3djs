'use strict';

/**
 * vector geometry.
 * This class is analog to "Mesh" class, but vectorMesh is for points, lines, polylines data type.
 * @class VectorExtrudedMesh
 */
var VectorExtrudedMesh = function(options) 
{
	if (!(this instanceof VectorExtrudedMesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// This class is analog to "Mesh" class, but "VectorMesh" is for points, lines, polylines data type.

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
 * Render the VectorMesh as child. equal render
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
VectorExtrudedMesh.prototype.renderAsChild = function (magoManager, shader, renderType, glPrimitive, isSelected, options) 
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
 * Render the VectorMesh
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
VectorExtrudedMesh.prototype.render = function(magoManager, shader, renderType, glPrimitive, isSelected)
{
	if (this.vboKeysContainer === undefined)
	{ return; }
	
	var vbo = this.vboKeysContainer.getVboKey(0);
	var gl = magoManager.getGl();

	//gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	//gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//gl.disable(gl.CULL_FACE);
	gl.enable(gl.CULL_FACE);
	
	gl.enableVertexAttribArray(shader.prev_loc);
	gl.enableVertexAttribArray(shader.current_loc);
	gl.enableVertexAttribArray(shader.next_loc);
	
	gl.disableVertexAttribArray(shader.color4_loc);

	var sceneState = magoManager.sceneState;
	var projMat = sceneState.projectionMatrix;
	var viewMat = sceneState.modelViewMatrix;
	var drawingBufferWidth = sceneState.drawingBufferWidth;
	var drawingBufferHeight = sceneState.drawingBufferHeight;
	
	if (this.thickness === undefined)
	{ this.thickness = 2.0; }
	
	//gl.uniform4fv(shader.oneColor4_loc, [0.5, 0.7, 0.9, 1.0]);
	gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]);
	gl.uniform2fv(shader.viewport_loc, [drawingBufferWidth[0], drawingBufferHeight[0]]);
	gl.uniform1f(shader.thickness_loc, this.thickness);

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
		//gl.enableVertexAttribArray(shader.color4_loc);
	}
	else 
	{
		gl.uniform1i(shader.colorType_loc, 0);
		gl.disableVertexAttribArray(shader.color4_loc);
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, vboPos.key);
	gl.vertexAttribPointer(shader.prev_loc, dim, gl.FLOAT, false, 8, 0);
	gl.vertexAttribPointer(shader.current_loc, dim, gl.FLOAT, false, 8, 16);
	gl.vertexAttribPointer(shader.next_loc, dim, gl.FLOAT, false, 8, 48);

	//gl.disable(gl.DEPTH_TEST);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vbo.vertexCount-4);
	//gl.drawArrays(gl.LINE_STRIP, 0, vbo.vertexCount-4);

	//gl.enable(gl.CULL_FACE);
	//gl.enable(gl.DEPTH_TEST);
	
};

/**
 * Clear the data of this feature
 * @param {VBOMemManager} vboMemManager 
 */
VectorExtrudedMesh.prototype.deleteObjects = function(vboMemManager)
{
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
		this.vboKeysContainer = undefined;
	}
};