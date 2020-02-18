'use strict';

/**
 * Reference 파일에 대한 객체
 * lod1일 경우 model과 Reference파일을 참조.
 * 
 * Geometry object. The real geometry data is a model, and this referenceObject has the model's index.
 * 
 * @class NeoReference
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * 아래 문서 1.4 Reference Folder 참조
 * @link https://github.com/Gaia3D/F4DConverter/blob/master/doc/F4D_SpecificationV1.pdf
 */
var NeoReference = function() 
{
	if (!(this instanceof NeoReference)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * The object's index on motherReferenceArray.
	 * @type {Number}
	 * @default 0
	 */
	this._id = 0;

	/**
	 * The object's identifier.
	 * @type {String}
	 * @default ""
	 */
	this.objectId = "";

	/**
	 * The model's index.
	 * @type {Number}
	 * @default -1
	 */
	this._block_idx = -1;
	
	/**
	 * The model-reference transformation matrix.(do not modify).
	 * @type {Matrix4}
	 * @default Identity matrix
	 */
	this._originalMatrix4 = new Matrix4(); 

	/**
	 * The final transformation matrix. Is calculated by multiplication between model-reference-matrix and building-matrix.
	 * @type {Matrix4}
	 * @default Identity matrix
	 */
	this._matrix4 = new Matrix4(); 
	
	/**
	 * Array used to store finalTransformationMatrices, chronological transformations, or two positions mode for example.
	 * @type {Array}
	 * @default undefined
	 */
	this.tMatrixAuxArray; 
	
	/**
	 * Parameter that specifies the type of the transformation matrix. 0 = identity matrix, 1 = translation matrix, 2 = transformation matrix.
	 * @type {Number}
	 * @default 2
	 */
	this.refMatrixType = 2; 
	
	/**
	 * Position vector of the translation matrix. Use this if "refMatrixType" = 1.
	 * @type {Float32Array(3)}
	 * @default undefined
	 */
	this.refTranslationVec; 
	
	/**
	 * VBOs container.
	 * @type {VBOVertexIdxCacheKeysContainer}
	 * @default undefined
	 */
	this.vBOVertexIdxCacheKeysContainer; 

	/**
	 * Material index.
	 * @type {Number}
	 * @default undefined
	 */
	this.materialId;
	
	/**
	 * Parameter that indicates if this object has texture.
	 * @type {Boolean}
	 * @default false
	 */
	this.hasTexture = false;
	
	/**
	 * Texture object.
	 * @type {Texture}
	 * @default undefined
	 */
	this.texture; 

	/**
	 * Object's color if has not texture.
	 * @type {Color}
	 * @default undefined
	 */
	this.color4; 
	
	/**
	 * Object's aditional color. Used when object color was changed.
	 * @type {Color}
	 * @default undefined
	 */
	this.aditionalColor; 

	/**
	 * Object's movement vector in local coordinates.
	 * @type {Point3D}
	 * @default undefined
	 */
	this.moveVectorRelToBuilding; 
	
	/**
	 * Object's movement vector in world coordinates.
	 * @type {Point3D}
	 * @default undefined
	 */
	this.moveVector; 

	/**
	 * Object's current rendering phase. Parameter to avoid duplicated render on scene.
	 * @type {Boolean}
	 * @default false
	 */
	this.renderingFase = false;
	
	/**
	 * Object's translucent alpha. Used when born the reference object until adult.
	 * @type {Number}
	 * @default false
	 */
	this.blendAlpha = 0.0;
	
	/**
	 * Object's born date.
	 * @type {Number}
	 * @default undefined
	 */
	this.birthTime;
	
	/**
	 * Parameter that indicates if the object is adult. If is adult, then do no apply blendAlpha.
	 * @type {Number}
	 * @default undefined
	 */
	this.isAdult = false;
};

/**
 * Commutate the renderingFase value: true - false.
 */
NeoReference.prototype.swapRenderingFase = function() 
{
	this.renderingFase = !this.renderingFase;
};

/**
 * Returns the blending alpha value in current time.
 * 
 * @param {Number} currTime The current time.
 */
NeoReference.prototype.getBlendAlpha = function(currTime) 
{
	if (!this.isAdult)
	{
		if (this.birthTime === undefined)
		{ this.birthTime = currTime; }
	
		if (this.blendAlpha === undefined)
		{ this.blendAlpha = 0.0; }
		
		var increAlpha = (currTime - this.birthTime)*0.0001;
		this.blendAlpha += increAlpha;
		
		if (this.blendAlpha >= 1.0)
		{
			this.isAdult = true;
		}
	}
	else
	{ return 1.0; }
	
	return this.blendAlpha;
};

/**
 * _originalMatrix4와 파라미터로 받은 matrix를 4차원 행렬의 곱셈을 계산한 결과를 _matrix4에 할당
 * 
 * @param {Matrix4} matrix
 */
NeoReference.prototype.multiplyTransformMatrix = function(matrix) 
{
	this._matrix4 = this._originalMatrix4.getMultipliedByMatrix(matrix); // Original.
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.multiplyKeyTransformMatrix = function(idxKey, matrix) 
{
	// this function multiplies the originalMatrix by "matrix" and stores it in the "idxKey" position.
	if (this.tMatrixAuxArray === undefined)
	{ this.tMatrixAuxArray = []; }

	this.tMatrixAuxArray[idxKey] = this._originalMatrix4.getMultipliedByMatrix(matrix, this.tMatrixAuxArray[idxKey]);
	
	if (this.moveVectorRelToBuilding)
	{
		this.moveVector = matrix.rotatePoint3D(this.moveVectorRelToBuilding, this.moveVector); 
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.hasKeyMatrix = function(idxKey) 
{
	if (this.tMatrixAuxArray === undefined)
	{ return false; }

	if (this.tMatrixAuxArray[idxKey] === undefined)
	{ return false; }
	else
	{ return true; }
};

/**{Boolean}
 * 어떤 일을 하고 있습니까?
 * 
  * @returns {Boolean} returns if the neoReference is ready to render.
 */
NeoReference.prototype.isReadyToRender = function() 
{
	if (this.tMatrixAuxArray === undefined)
	{
		//this.multiplyKeyTransformMatrix(refMatrixIdxKey, neoBuilding.geoLocationDataAux.rotMatrix);
		// we must collect all the neoReferences that has no tMatrixAuxArray and make it.
		return false;
	}
	
	return true;
};

/**
 * Renders the content.
 */
NeoReference.prototype.solveReferenceColorOrTexture = function(magoManager, neoBuilding, shader, currentObjectsRendering) 
{
	var gl = magoManager.sceneState.gl;
	
	// Check if we are under a selected data structure.
	var selectionManager = magoManager.selectionManager;
	var referenceObjectIsSelected = false;
	if (selectionManager.parentSelected && magoManager.objectSelected === this)
	{
		referenceObjectIsSelected = true;
		
		if (magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.OBJECT) 
		{
			// Active stencil if the object is selected.
			magoManager.renderer.enableStencilBuffer(gl);
		}
	}
	
	// Check the color or texture of reference object.
	if (neoBuilding.isHighLighted)
	{
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(shader.oneColor4_loc, magoManager.highLightColor4);
	}
	else if (neoBuilding.isColorChanged)
	{
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		if (referenceObjectIsSelected) 
		{
			gl.uniform4fv(shader.oneColor4_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
		}
		else
		{
			gl.uniform4fv(shader.oneColor4_loc, [neoBuilding.aditionalColor.r, neoBuilding.aditionalColor.g, neoBuilding.aditionalColor.b, neoBuilding.aditionalColor.a] );
		}
	}
	else if (this.aditionalColor)
	{
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		if (referenceObjectIsSelected) 
		{
			gl.uniform4fv(shader.oneColor4_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
		}
		else
		{
			gl.uniform4fv(shader.oneColor4_loc, [this.aditionalColor.r, this.aditionalColor.g, this.aditionalColor.b, this.aditionalColor.a] );
		}
	}
	else
	{
		// Normal rendering.
		if (magoManager.magoPolicy.getObjectMoveMode() === CODE.moveMode.OBJECT && referenceObjectIsSelected) 
		{
			gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			gl.uniform4fv(shader.oneColor4_loc, [255.0/255.0, 0/255.0, 0/255.0, 255.0/255.0]);
		}
		else if (magoManager.magoPolicy.colorChangedObjectId === this.objectId)
		{
			gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			gl.uniform4fv(shader.oneColor4_loc, [magoManager.magoPolicy.color[0], magoManager.magoPolicy.color[1], magoManager.magoPolicy.color[2], 1.0]);
		}
		else
		{
			if (this.hasTexture) 
			{
				if (this.texture !== undefined && this.texture.texId !== undefined) 
				{
					gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
					if (shader.last_tex_id !== this.texture.texId) 
					{
						gl.activeTexture(gl.TEXTURE2);
						gl.bindTexture(gl.TEXTURE_2D, this.texture.texId);
						shader.last_tex_id = this.texture.texId;
					}
				}
				else 
				{
					gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
					gl.uniform4fv(shader.oneColor4_loc, [0.8, 0.0, 0.8, 1.0]);
				}
			}
			else 
			{
				// if no render texture, then use a color.
				gl.uniform1i(shader.bUse1Color_loc, true); //.
				if (this.color4) 
				{
					gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
					gl.uniform4fv(shader.oneColor4_loc, [this.color4.r/255.0, this.color4.g/255.0, this.color4.b/255.0, this.color4.a/255.0]);
				}
				else
				{
					gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
					gl.uniform4fv(shader.oneColor4_loc, [0.8, 0.8, 0.8, 1.0]);
				}
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * 
 * @param mag{Boolean}
 * @returns {Boolean} returns if the neoReference was rendered.
 */
NeoReference.prototype.getTriangles = function(neoBuilding, resultTrianglesArray) 
{
	if (neoBuilding === undefined || neoBuilding.motherBlocksArray === undefined)
	{ return motherBlocksArray; }
	
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }
	
	var neoReference = this;
	var block_idx = neoReference._block_idx;
	var block = neoBuilding.motherBlocksArray[block_idx];
	if (!block) 
	{
		return resultTrianglesArray;
	}
	var cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
	var refTMat = neoReference._originalMatrix4;
	var vboKey;
	var vertexMap = {};
	
	for (var n=0; n<cacheKeys_count; n++) // Original.
	{
		vboKey = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];

		var posArray = vboKey.keepedPosDataArray;
		if (posArray === undefined)
		{ return resultTrianglesArray; }
		
		var positionsCount = posArray.length/3;
		
		var idxArray = vboKey.keepedIdxDataArray;
		var indicesCount = idxArray.length;
		
		var trianglesCount = indicesCount/3;
		
		for (var i=0; i<trianglesCount; i++)
		{
			var idx_1 = idxArray[i*3];
			var idx_2 = idxArray[i*3+1];
			var idx_3 = idxArray[i*3+2];
			
			var vertex_1 = vertexMap[idx_1];
			if (vertex_1 === undefined)
			{
				var pos_1 = new Point3D(posArray[idx_1*3], posArray[idx_1*3+1], posArray[idx_1*3+2]);
				//Parameter that specifies the type of the transformation matrix. 0 = identity matrix, 1 = translation matrix, 2 = transformation matrix.
				if (neoReference.refMatrixType === 1)
				{
					pos_1.add(neoReference.refTranslationVec[0], neoReference.refTranslationVec[1], neoReference.refTranslationVec[2]);
				}
				else if (neoReference.refMatrixType === 2)
				{
					// Now, transform points with refTMat (reference transformation matrix).
					pos_1 = refTMat.transformPoint3D(pos_1, pos_1);
				}
				
				vertex_1 = new Vertex(pos_1);
				vertexMap[idx_1] = vertex_1;
			}
			
			var vertex_2 = vertexMap[idx_2];
			if (vertex_2 === undefined)
			{
				var pos_2 = new Point3D(posArray[idx_2*3], posArray[idx_2*3+1], posArray[idx_2*3+2]);
				//Parameter that specifies the type of the transformation matrix. 0 = identity matrix, 1 = translation matrix, 2 = transformation matrix.
				if (neoReference.refMatrixType === 1)
				{
					pos_2.add(neoReference.refTranslationVec[0], neoReference.refTranslationVec[1], neoReference.refTranslationVec[2]);
				}
				else if (neoReference.refMatrixType === 2)
				{
					// Now, transform points with refTMat (reference transformation matrix).
					pos_2 = refTMat.transformPoint3D(pos_2, pos_2);
				}
				vertex_2 = new Vertex(pos_2);
				vertexMap[idx_2] = vertex_2;
			}
			
			var vertex_3 = vertexMap[idx_3];
			if (vertex_3 === undefined)
			{
				var pos_3 = new Point3D(posArray[idx_3*3], posArray[idx_3*3+1], posArray[idx_3*3+2]);
				//Parameter that specifies the type of the transformation matrix. 0 = identity matrix, 1 = translation matrix, 2 = transformation matrix.
				if (neoReference.refMatrixType === 1)
				{
					pos_3.add(neoReference.refTranslationVec[0], neoReference.refTranslationVec[1], neoReference.refTranslationVec[2]);
				}
				else if (neoReference.refMatrixType === 2)
				{
					// Now, transform points with refTMat (reference transformation matrix).
					pos_3 = refTMat.transformPoint3D(pos_3, pos_3);
				}
				vertex_3 = new Vertex(pos_3);
				vertexMap[idx_3] = vertex_3;
			}
			
			var triangle = new Triangle(vertex_1, vertex_2, vertex_3);
			resultTrianglesArray.push(triangle);
		}
	}
	return resultTrianglesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * 
 * @param mag{Boolean}
 * @returns {Boolean} returns if the neoReference was rendered.
 */
NeoReference.prototype.render = function(magoManager, neoBuilding, renderType, renderTexture, shader, refMatrixIdxKey, minSizeToRender) 
{
	var neoReference = this;
	
	if (!neoReference.isReadyToRender())
	{ return false; }

	// Check if the texture is loaded.
	//if (neoReference.texture !== undefined || neoReference.materialId != -1)
	if (neoReference.hasTexture)// && neoReference.texture !== undefined)
	{
		// note: in the future use only "neoReference.materialId".
		var texFileLoadState = neoBuilding.manageNeoReferenceTexture(neoReference, magoManager);
		if (texFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
		{ return false; }
	
		if (neoReference.texture === undefined)
		{ return false; }
	
		if (neoReference.texture.texId === undefined)
		{ return false; }
	}
	
	var currentObjectsRendering = magoManager.renderer.currentObjectsRendering;
	var selectionManager;
	var selectionColor;
	var currentNode;
	var currentOctree;
	
	if (renderType === 2)
	{
		selectionManager = magoManager.selectionManager;
		selectionColor = magoManager.selectionColor;
		renderTexture = false; // reassign value for this var.
		currentNode = currentObjectsRendering.curNode;
		currentOctree = currentObjectsRendering.curOctree;
	}
	
	var gl = magoManager.sceneState.gl;
	
	var block_idx = neoReference._block_idx;
	var block = neoBuilding.motherBlocksArray[block_idx];
	
	if (block === undefined)
	{ return false; }
	
	if (magoManager.mouseLeftDown || magoManager.mouseMiddleDown)
	{ minSizeToRender = 0.5; }
	
	if (!block.isReadyToRender(neoReference, magoManager, minSizeToRender))
	{ return false; }

	// Check the color or texture of reference object.
	if (renderType === 1)
	{
		neoReference.solveReferenceColorOrTexture(magoManager, neoBuilding, shader, currentObjectsRendering);
	}
	else if (renderType === 2)
	{
		neoReference.selColor4 = selectionColor.getAvailableColor(neoReference.selColor4); 
		var idxKey = selectionColor.decodeColor3(neoReference.selColor4.r, neoReference.selColor4.g, neoReference.selColor4.b);

		selectionManager.setCandidates(idxKey, neoReference, currentOctree, neoBuilding, currentNode);
		if (neoReference.selColor4) 
		{
			gl.uniform4fv(shader.oneColor4_loc, [neoReference.selColor4.r/255.0, neoReference.selColor4.g/255.0, neoReference.selColor4.b/255.0, 1.0]);
		}
	}
	// End check color or texture of reference object.-----------------------------------------------------------------------------
	
	//Now erase the aditional information (aditionalColor & moveVector).
	this.aditionalColor = undefined;
	
	// Test external alpha.
	if (magoManager.isTrailRender === undefined || magoManager.isTrailRender === false) // check if mago is not rendering special effects.
	{
		var blendAlpha = neoReference.getBlendAlpha(magoManager.currTime);
		gl.uniform1f(shader.externalAlpha_loc, blendAlpha);
	}
	
	// End test.---
	
	var cacheKeys_count = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray.length;
	// Must applicate the transformMatrix of the reference object.

	gl.uniform1i(shader.refMatrixType_loc, neoReference.refMatrixType);

	if (neoReference.refMatrixType === 1)
	{ gl.uniform3fv(shader.refTranslationVec_loc, neoReference.refTranslationVec); }
	else if (neoReference.refMatrixType === 2)
	{ gl.uniformMatrix4fv(shader.refMatrix_loc, false, neoReference.tMatrixAuxArray[refMatrixIdxKey]._floatArrays); }
	

	if (neoReference.moveVector !== undefined) 
	{
		gl.uniform1i(shader.hasAditionalMov_loc, true);
		gl.uniform3fv(shader.aditionalMov_loc, [neoReference.moveVector.x, neoReference.moveVector.y, neoReference.moveVector.z]); //.
		shader.last_isAditionalMovedZero = false;
	}
	else 
	{
		if (!shader.last_isAditionalMovedZero)
		{
			gl.uniform1i(shader.hasAditionalMov_loc, false);
			gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.
			shader.last_isAditionalMovedZero = true;
		}
	}
	
	var vboKey;
	for (var n=0; n<cacheKeys_count; n++) // Original.
	{
		//var mesh_array = block.viArraysContainer._meshaderrays[n];
		vboKey = block.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];
		
		// Positions.
		if (!vboKey.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		if (renderType === 1)
		{
			// Normals.
			if (!vboKey.bindDataNormal(shader, magoManager.vboMemoryManager))
			{ return false; }

			// TexCoords.
			if (renderTexture && neoReference.hasTexture) 
			{
				if (block.vertexCount <= neoReference.vertexCount) 
				{
					var refVboData = neoReference.vBOVertexIdxCacheKeysContainer.vboCacheKeysArray[n];
					if (!refVboData.bindDataTexCoord(shader, magoManager.vboMemoryManager))
					{ return false; }
				}
				else 
				{
					shader.disableVertexAttribArray(shader.texCoord2_loc); 
				}
			}
			else 
			{
				shader.disableVertexAttribArray(shader.texCoord2_loc); 
			}
		}

		// Indices.
		var indicesCount;
		if (magoManager.isCameraMoving)// && !isInterior && magoManager.isCameraInsideBuilding)
		{
			indicesCount = vboKey.indicesCount;
		}
		else
		{
			if (magoManager.thereAreUrgentOctrees)
			{
				indicesCount = vboKey.bigTrianglesIndicesCount;
				if (indicesCount > vboKey.indicesCount)
				{ indicesCount = vboKey.indicesCount; }
			}
			else 
			{
				indicesCount = vboKey.indicesCount;
			}
		}
		if (!vboKey.bindDataIndice(shader, magoManager.vboMemoryManager))
		{ return false; }
		gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
		
		if (renderType === 1)
		{
			// some stadistics.
			magoManager.sceneState.trianglesRenderedCount += indicesCount/3;
		}
	}
		
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
NeoReference.prototype.deleteObjects = function(gl, vboMemManager) 
{
	// 1) Object ID.
	this._id = undefined;

	// 2) Block Idx.
	this._block_idx = undefined;

	// 3) Transformation Matrix.
	this._matrix4._floatArrays = undefined;
	this._matrix4 = undefined;
	this._originalMatrix4._floatArrays = undefined;
	this._originalMatrix4 = undefined; //

	// 5) The texture image.
	this.hasTexture = undefined;
	// no delete the texture, only break the referencing.
	this.texture = undefined; // Texture

	// 6) 1 color.
	if (this.color4)
	{ this.color4.deleteObjects(); }
	this.color4 = undefined; //new Color();

	// 7) selection color.
	if (this.selColor4)
	{ this.selColor4.deleteObjects(); }
	this.selColor4 = undefined; //new Color(); // use for selection only.

	// 8) movement of the object.
	if (this.moveVector)
	{ this.moveVector.deleteObjects(); }
	this.moveVector = undefined; // Point3D.

	this.bRendered = undefined;
	
	if (this.vBOVertexIdxCacheKeysContainer !== undefined)
	{
		this.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
		this.vBOVertexIdxCacheKeysContainer = undefined;
	}
};
