'use strict';

/**
 * point geometry.
 * This class is analog to "Mesh" class, but vectorMesh is for points, lines, polylines data type.
 * @class VectorMesh
 */
var PointMesh = function(options) 
{
	if (!(this instanceof PointMesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// This class is analog to "Mesh" class, but "PointMesh" is for points.

	this.name;
	this.id;
	this.size = 1.0;
	this.color4;
	this.opacity = 1.0;
	
	this.vertexList;

	this.vboKeysContainer;
	
	if (options)
	{
		if (options.size)
		{ this.size = options.size; }
		
		if (options.color)
		{ this.color4 = options.color; }
        
		if (options.opacity)
		{ this.opacity = options.opacity; }
	}
};

/**
 * Render the VectorMesh as child. equal render
 * @param {MagoManager}magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 * @param glPrimitive
 * @TODO : 누가 이 gl primitive의 type 정체를 안다면 좀 달아주세요ㅠㅠ 세슘 쪽인거 같은데ㅠㅠ
 */
PointMesh.prototype.renderAsChild = function (magoManager, shader, renderType, glPrimitive, isSelected, options) 
{
	var gl = magoManager.getGl();
    
	gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]); //.
	gl.uniform1f(shader.fixPointSize_loc, this.size);
    
	if (renderType === 2)
	{
		var selectionManager = magoManager.selectionManager;
		var selectionColor = magoManager.selectionColor;

		var selColor = selectionColor.getAvailableColor(undefined); 
		var idxKey = selectionColor.decodeColor3(selColor.r, selColor.g, selColor.b);

		selectionManager.setCandidateGeneral(idxKey, this);
		gl.uniform4fv(shader.oneColor4_loc, [selColor.r/255.0, selColor.g/255.0, selColor.b/255.0, 1.0]);
	}
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);

};

