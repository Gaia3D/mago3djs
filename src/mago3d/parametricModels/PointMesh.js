'use strict';

/**
 * point geometry.
 * This class is analog to "Mesh" class, but pointMesh is for points data type.
 * @class VectorMesh
 */
var PointMesh = function(options) 
{
	if (!(this instanceof PointMesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// This class is analog to "Mesh" class, but "PointMesh" is for points.
	this.owner = undefined; // default.
	this.name;
	this.id;
	this.size = 1.0;
	this.color4;
	this.strokeColor4;
	this.opacity = 1.0;
	
	this.vertexList;

	this.vboKeysContainer;
	
	if (options)
	{
		if (options.size)
		{ this.size = options.size; }
		
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
		//strokeColor
		if (options.strokeColor)
		{ 
			// Check if "color" is hexCode or class Color.
			if (typeof options.strokeColor === "string")
			{
				var color = Color.fromHexCode(options.strokeColor, undefined);
				this.strokeColor4 = color; 
			}
			else
			{ this.strokeColor4 = options.strokeColor; } 
		}
        
		if (options.opacity)
		{ 
			this.opacity = options.opacity; 

			// Check the opacity value and set magoRenderable.attributes.opaque = value.
		}
	}
};

/**
 * Render the VectorMesh as child. equal render
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param {Number} glPrimitive
 */
/*
PointMesh.prototype.render = function (magoManager, shader, renderType, glPrimitive, options) 
{
	var gl = magoManager.getGl();
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);
};
*/

/**
 * Render the PointMesh as child. equal render
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param {Number} glPrimitive
 */
PointMesh.prototype.renderAsChild = function (magoManager, shader, renderType, glPrimitive, isSelected, options) 
{
	var gl = magoManager.getGl();
    
	gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]); //.
	gl.uniform1f(shader.fixPointSize_loc, this.size);

	if (isSelected)
	{
		gl.uniform1f(shader.fixPointSize_loc, this.size*2);
	}

	var strokeColor = this.strokeColor4;
	if (strokeColor)
	{ gl.uniform4fv(shader.uStrokeColor_loc, new Float32Array([strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a])); }

	// seletionColor4.***
	if (magoManager.isCameraMoved && !magoManager.isCameraMoving )
	{
		var selectionManager = magoManager.selectionManager;
		var selectionColor = magoManager.selectionColor;

		var selColor = selectionColor.getAvailableColor(undefined); 
		var idxKey = selectionColor.decodeColor3(selColor.r, selColor.g, selColor.b);
		var owner = this;
		if (this.owner)
		{ owner = this.owner; }
		selectionManager.setCandidateGeneral(idxKey, owner);
		gl.uniform4fv(shader.uSelColor4_loc, [selColor.r/255.0, selColor.g/255.0, selColor.b/255.0, 1.0]);
	}

	//var glPrimitive = gl.POINTS;
	//this.render(magoManager, shader, renderType, glPrimitive, undefined);
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);

};

/**
 * Clear the data of this feature
 * @param {VBOMemManager} vboMemManager 
 */
PointMesh.prototype.deleteObjects = function(vboMemManager)
{
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
		this.vboKeysContainer = undefined;
	}
};

