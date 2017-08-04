'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class GeometryModifier
 */
var GeometryModifier = function() 
{
	if (!(this instanceof GeometryModifier)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param f4dPoint3d 변수
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 */
GeometryModifier.prototype.setPoint3d = function(f4dPoint3d, px, py, pz) 
{
	f4dPoint3d.x = px;
	f4dPoint3d.y = py;
	f4dPoint3d.z = pz;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 * @param f4dPoint3d 변수
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @retuns dx*dx + dy*dy + dz*dz
 */
GeometryModifier.prototype.point3dSquareDistTo = function(f4dPoint3d, px, py, pz) 
{
	var dx = f4dPoint3d.x - px;
	var dy = f4dPoint3d.y - py;
	var dz = f4dPoint3d.z - pz;

	return dx*dx + dy*dy + dz*dz;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param matrix4 변수
 * @param float32array 변수
 */
GeometryModifier.prototype.Matrix4SetByFloat32Array = function(matrix4, float32array) 
{
	for (var i = 0; i < 16; i++) 
	{
		matrix4._floatArrays[i] = float32array[i];
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param matrix4 변수
 * @param point3d 변수
 * @returns transformedPoint3d
 */
GeometryModifier.prototype.Matrix4TransformPoint3D = function(matrix4, point3d) 
{
	var transformedPoint3d = new Point3D();
	//		t.x= q.x*m[0][0] + q.y*m[1][0] + q.z*m[2][0] + m[3][0];
	//		t.y= q.x*m[0][1] + q.y*m[1][1] + q.z*m[2][1] + m[3][1];
	//		t.z= q.x*m[0][2] + q.y*m[1][2] + q.z*m[2][2] + m[3][2];

	// Note: idx = 4*col+row;.***
	//_floatArrays

	// Old version.*************************************************************************************************************************
	//transformedPoint3d.x = point3d.x*matrix4.get(0,0) + point3d.y*matrix4.get(1,0) + point3d.z*matrix4.get(2,0) + matrix4.get(3,0);
	//transformedPoint3d.y = point3d.x*matrix4.get(0,1) + point3d.y*matrix4.get(1,1) + point3d.z*matrix4.get(2,1) + matrix4.get(3,1);
	//transformedPoint3d.z = point3d.x*matrix4.get(0,2) + point3d.y*matrix4.get(1,2) + point3d.z*matrix4.get(2,2) + matrix4.get(3,2);
	//--------------------------------------------------------------------------------------------------------------------------------------

	// New version. Acces directly to the array.**********************************************************************************************************************
	transformedPoint3d.x = point3d.x*matrix4._floatArrays[0] + point3d.y*matrix4._floatArrays[4] + point3d.z*matrix4._floatArrays[8] + matrix4._floatArrays[12];
	transformedPoint3d.y = point3d.x*matrix4._floatArrays[1] + point3d.y*matrix4._floatArrays[5] + point3d.z*matrix4._floatArrays[9] + matrix4._floatArrays[13];
	transformedPoint3d.z = point3d.x*matrix4._floatArrays[2] + point3d.y*matrix4._floatArrays[6] + point3d.z*matrix4._floatArrays[10] + matrix4._floatArrays[14];
	//----------------------------------------------------------------------------------------------------------------------------------------------------------------

	return transformedPoint3d;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param matrixA 변수
 * @param matrixB 변수
 * @retuns resultMat
 */
GeometryModifier.prototype.Matrix4GetMultipliedByMatrix = function(matrixA, matrixB) 
{
	//CKK_Matrix4 operator*(const CKK_Matrix4 &A)
	//{
	//	// Copied From Carve.***
	//	CKK_Matrix4 c;
	//	for (int i = 0; i < 4; i++) {
	//		for (int j = 0; j < 4; j++) {
	//			c.m[i][j] = 0.0;
	//			for (int k = 0; k < 4; k++) {
	//				c.m[i][j] += A.m[k][j] * m[i][k];
	//			}
	//		}
	//	}
	//	return c;
	//}

	var resultMat = new Matrix4();
	for (var i = 0; i < 4; i++)
	{
		for (var j = 0; j < 4; j++)
		{
			// Note: idx = 4*col+row;.***
			//var idx = matrixA.getIndexOfArray(i, j); // Old.***
			var idx = 4*i + j;
			resultMat._floatArrays[idx] = 0.0;
			for (var k = 0; k < 4; k++)
			{
				resultMat._floatArrays[idx] += matrixB._floatArrays[4*k + j] * matrixA._floatArrays[4*i + k];
			}
		}
	}
	return resultMat;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param reference 변수
 * @param matrix 변수
 */
GeometryModifier.prototype.referenceMultiplyTransformMatrix = function(reference, matrix) 
{
	//var multipliedMat = reference._matrix4.getMultipliedByMatrix(matrix); // Original.***
	var multipliedMat = this.Matrix4GetMultipliedByMatrix(reference._matrix4, matrix); // Original.***
	reference._matrix4 = multipliedMat;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param compRefList 변수
 * @param matrix 변수
 */
GeometryModifier.prototype.compoundReferencesListMultiplyReferencesMatrices = function(compRefList, matrix) 
{
	var compRefsCount = compRefList._compoundRefsArray.length;
	for (var i = 0; i < compRefsCount; i++)
	{
		var compRef = compRefList._compoundRefsArray[i];
		var refsCount = compRef._referencesList.length;
		for (var j = 0; j < refsCount; j++)
		{
			var reference = compRef._referencesList[j];
			//reference.multiplyTransformMatrix(matrix);// Old.***
			this.referenceMultiplyTransformMatrix(reference, matrix);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param compRefList 변수
 * @param eyeX 변수
 * @param eyeY 변수
 * @param eyeZ 변수
 * @returns visibleCompRefObjectsArray
 */
GeometryModifier.prototype.compoundReferencesListGetVisibleCompRefObjectsList = function(compRefList, eyeX, eyeY, eyeZ) 
{
	/*
	// https://gist.github.com/72lions/4528834
	var _appendBuffer = function(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};
*/

	var visibleCompRefObjectsArray = new CompoundReferencesList();
	visibleCompRefObjectsArray._myBlocksList = compRefList._myBlocksList;

	var ocCullingBox = compRefList._ocCulling._ocCulling_box;
	var indicesVisiblesArrayInterior = this.occlusionCullingOctreeCellGetIndicesVisiblesForEye(ocCullingBox, eyeX, eyeY, eyeZ);
	if (indicesVisiblesArrayInterior)
	{
		var indicesCount = indicesVisiblesArrayInterior.length;
		for (var i = 0; i < indicesCount; i++)
		{
			visibleCompRefObjectsArray._compoundRefsArray.push(compRefList._compoundRefsArray[indicesVisiblesArrayInterior[i]]);
		}

	}

	var infiniteOcCullingBox = compRefList._ocCulling._infinite_ocCulling_box;
	var indicesVisiblesArrayExterior = this.occlusionCullingOctreeCellGetIndicesVisiblesForEye(infiniteOcCullingBox, eye_x, eye_y, eye_z);
	if (indicesVisiblesArrayExterior)
	{
		var indicesCount = indicesVisiblesArrayExterior.length;
		for (var i = 0; i < indicesCount; i++)
		{
			visibleCompRefObjectsArray._compoundRefsArray.push(compRefList._compoundRefsArray[indicesVisiblesArrayExterior[i]]);
		}
	}

	if (visibleCompRefObjectsArray && visibleCompRefObjectsArray.length == 0) { return null; }

	return visibleCompRefObjectsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param compRefListContainer 변수
 * @param eyeX 변수
 * @param eyeY 변수
 * @param eyeZ 변수
 * @returns visibleCompRefObjectsArrayTotal
 */
GeometryModifier.prototype.compoundReferencesListContainerGetVisibleCompRefObjectsList = function(compRefListContainer, eyeX, eyeY, eyeZ) 
{
	var visibleCompRefObjectsArrayTotal = [];
	var compRefList = undefined;
	var compRefListsCount = compRefListContainer.compRefsListArray.length;
	for (var i = 0; i < compRefListsCount; i++)
	{
		compRefList = compRefListContainer.compRefsListArray[i];
		var visibleCompRefObjectsArray = this.compoundReferencesListGetVisibleCompRefObjectsList(compRefList, eyeX, eyeY, eyeZ);
		if (visibleCompRefObjectsArray != null)
		{ visibleCompRefObjectsArrayTotal.push(visibleCompRefObjectsArray); }
	}
	return visibleCompRefObjectsArrayTotal;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param buildingProject 변수
 * @param eyeX 변수
 * @param eyeY 변수
 * @param eyeZ 변수
 * @returns totalVisibleCompRefLists
 */
GeometryModifier.prototype.bRbuildingProjectGetVisibleCompRefLists = function(buildingProject, eyeX, eyeY, eyeZ) 
{
	// 1rst, check if the eye is in the building.***
	var InteriorCompRefListContainer = buildingProject._interiorCompRefList_Container;
	var interior_visibleCompRefLists = this.compoundReferencesListContainerGetVisibleCompRefObjectsList(InteriorCompRefListContainer, eye_x, eye_y, eye_z);

	var compRefListContainer = buildingProject._compRefList_Container;
	var visibleCompRefLists = this.compoundReferencesListContainerGetVisibleCompRefObjectsList(compRefListContainer, eyeX, eyeY, eyeZ);

	var totalVisibleCompRefLists = visibleCompRefLists.concat(interior_visibleCompRefLists);

	return totalVisibleCompRefLists;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 * @param minX 변수
 * @param maxX 변수
 * @param minY 변수
 * @param maxY 변수
 * @param minZ 변수
 * @param maxZ 변수
 */
GeometryModifier.prototype.occlusionCullingOctreeCellSetDimensions = function(ocCullOctreeCell, minX, maxX, minY, maxY, minZ, maxZ) 
{
	ocCullOctreeCell.minX = minX;
	ocCullOctreeCell.maxX = maxX;
	ocCullOctreeCell.minY = minY;
	ocCullOctreeCell.maxY = maxY;
	ocCullOctreeCell.minZ = minZ;
	ocCullOctreeCell.maxZ = maxZ;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 */
GeometryModifier.prototype.occlusionCullingOctreeCellSetSizesSubBoxes = function(ocCullOctreeCell) 
{
	// Bottom                      Top
	// |----------|----------|     |----------|----------|
	// |          |          |     |          |          |       Y
	// |    3     |    2     |	   |    7     |    6     |       ^
	// |          |          |     |          |          |       |
	// |----------|----------|     |----------|----------|       |
	// |          |          |     |          |          |       |
	// |     0    |     1    |     |    4     |    5     |       |
	// |          |          |     |          |          |       -----------------> X
	// |----------|----------|     |----------|----------|

	if (ocCullOctreeCell._subBoxesArray.length > 0)
	{
		var halfX = (ocCullOctreeCell.maxX + ocCullOctreeCell.minX)/2.0;
		var halfY = (ocCullOctreeCell.maxY + ocCullOctreeCell.minY)/2.0;
		var halfZ = (ocCullOctreeCell.maxZ + ocCullOctreeCell.minZ)/2.0;

		// Old.***************************************************************************************************************************************************
		//ocCullOctreeCell._subBoxesArray[0].setDimensions(ocCullOctreeCell.minX, halfX,   ocCullOctreeCell.minY, halfY,   ocCullOctreeCell.minZ, halfZ);
		//ocCullOctreeCell._subBoxesArray[1].setDimensions(halfX, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, halfY,   ocCullOctreeCell.minZ, halfZ);
		//ocCullOctreeCell._subBoxesArray[2].setDimensions(halfX, ocCullOctreeCell.maxX,   halfY, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, halfZ);
		//ocCullOctreeCell._subBoxesArray[3].setDimensions(ocCullOctreeCell.minX, halfX,   halfY, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, halfZ);

		//ocCullOctreeCell._subBoxesArray[4].setDimensions(ocCullOctreeCell.minX, halfX,   ocCullOctreeCell.minY, halfY,   halfZ, ocCullOctreeCell.maxZ);
		//ocCullOctreeCell._subBoxesArray[5].setDimensions(halfX, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, halfY,   halfZ, ocCullOctreeCell.maxZ);
		//ocCullOctreeCell._subBoxesArray[6].setDimensions(halfX, ocCullOctreeCell.maxX,   halfY, ocCullOctreeCell.maxY,   halfZ, ocCullOctreeCell.maxZ);
		//ocCullOctreeCell._subBoxesArray[7].setDimensions(ocCullOctreeCell.minX, halfX,   halfY, ocCullOctreeCell.maxY,   halfZ, ocCullOctreeCell.maxZ);

		// New version.*********************************************************************************************************************************************
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[0], ocCullOctreeCell.minX, halfX,   ocCullOctreeCell.minY, halfY,   ocCullOctreeCell.minZ, halfZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[1], halfX, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, halfY,   ocCullOctreeCell.minZ, halfZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[2], halfX, ocCullOctreeCell.maxX,   halfY, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, halfZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[3], ocCullOctreeCell.minX, halfX,   halfY, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, half_z);

		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[4], ocCullOctreeCell.minX, halfX,   ocCullOctreeCell.minY, halfY,   halfZ, ocCullOctreeCell.maxZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[5], halfX, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, halfY,   halfZ, ocCullOctreeCell.maxZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[6], halfX, ocCullOctreeCell.maxX,   halfY, ocCullOctreeCell.maxY,   halfZ, ocCullOctreeCell.maxZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[7], ocCullOctreeCell.minX, halfX,   halfY, ocCullOctreeCell.maxY,   halfZ, ocCullOctreeCell.maxZ);
		//-------------------------------------------------------------------------------------------------------------------------------------------------------------

		for (var i = 0; i < ocCullOctreeCell._subBoxesArray.length; i++)
		{
			//ocCullOctreeCell._subBoxesArray[i].setSizesSubBoxes(); // Old.***
			this.occlusionCullingOctreeCellSetSizesSubBoxes(ocCullOctreeCell._subBoxesArray[i]);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 * @param x 변수
 * @param y 변수
 * @param z 변수
 * @returns intersects
 */
GeometryModifier.prototype.occlusionCullingOctreeCellIntersectsWithPoint3D = function(ocCullOctreeCell, x, y, z) 
{
	var intersects = false;

	if (x > ocCullOctreeCell.minX && x < ocCullOctreeCell.maxX) 
	{
		if (y > ocCullOctreeCell.minY && y < ocCullOctreeCell.maxY) 
		{
			if (z > ocCullOctreeCell.minZ && z < ocCullOctreeCell.maxZ) 
			{
				intersects = true;
			}
		}
	}

	return intersects;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 * @param x 변수
 * @param y 변수
 * @param z 변수
 * @returns intersectedSubBox
 */
GeometryModifier.prototype.occlusionCullingOctreeCellGetIntersectedSubBoxByPoint3D = function(ocCullOctreeCell, x, y, z) 
{
	var intersectedSubBox = null;

	if (ocCullOctreeCell._ocCulling_Cell_owner == null)
	{
		// This is the mother_cell.***
		if (!this.occlusionCullingOctreeCellIntersectsWithPoint3D(ocCullOctreeCell, x, y, z))
		{
			return null;
		}
	}

	var subBoxesCount = ocCullOctreeCell._subBoxesArray.length;
	if (subBoxesCount > 0)
	{
		var centerX = (ocCullOctreeCell.minX + ocCullOctreeCell.maxX)/2.0;
		var centerY = (ocCullOctreeCell.minY + ocCullOctreeCell.maxY)/2.0;
		var centerZ = (ocCullOctreeCell.minZ + ocCullOctreeCell.maxZ)/2.0;

		var intersectedSubBoxAux = null;
		var intersectedSubBoxIdx = undefined;

		if (x < centerX)
		{
			// Here are the boxes number 0, 3, 4, 7.***
			if (y < centerY)
			{
				// Here are 0, 4.***
				if (z < centerZ) { intersectedSubBoxIdx = 0; }
				else { intersectedSubBoxIdx = 4; }
			}
			else
			{
				// Here are 3, 7.***
				if (z < centerZ) { intersectedSubBoxIdx = 3; }
				else { intersectedSubBoxIdx = 7; }
			}
		}
		else
		{
			// Here are the boxes number 1, 2, 5, 6.***
			if (y<center_y)
			{
				// Here are 1, 5.***
				if (z<center_z) { intersectedSubBoxIdx = 1; }
				else { intersectedSubBoxIdx = 5; }
			}
			else
			{
				// Here are 2, 6.***
				if (z<center_z) { intersectedSubBoxIdx = 2; }
				else { intersectedSubBoxIdx = 6; }
			}
		}

		intersectedSubBoxAux = ocCullOctreeCell._subBoxesArray[intersectedSubBoxIdx];
		intersectedSubBox = this.occlusionCullingOctreeCellGetIntersectedSubBoxByPoint3D(intersectedSubBoxAux, x, y, z);

	}
	else
	{
		intersectedSubBox = ocCullOctreeCell;
	}

	return intersectedSubBox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 * @param eyeX 변수
 * @param eyeY 변수
 * @param eyeZ 변수
 * @returns indicesVisiblesArray
 */
GeometryModifier.prototype.occlusionCullingOctreeCellGetIndicesVisiblesForEye = function(ocCullOctreeCell, eyeX, eyeY, eyeZ) 
{
	var indicesVisiblesArray = null;
	var intersectedSubBox = this.occlusionCullingOctreeCellGetIntersectedSubBoxByPoint3D(ocCullOctreeCell, eyeX, eyeY, eyeZ);

	if (intersectedSubBox != null && intersectedSubBox._indicesArray.length > 0)
	{
		indicesVisiblesArray = intersectedSubBox._indicesArray;
	}

	return indicesVisiblesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 * @param expansionDist 변수
 */
GeometryModifier.prototype.occlusionCullingOctreeCellExpandBox = function(ocCullOctreeCell, expansionDist) 
{
	ocCullOctreeCell.minX -= expansionDist;
	ocCullOctreeCell.maxX += expansionDist;
	ocCullOctreeCell.minY -= expansionDist;
	ocCullOctreeCell.maxY += expansionDist;
	ocCullOctreeCell.minZ -= expansionDist;
	ocCullOctreeCell.maxZ += expansionDist;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param vtArraysCacheKeys_container 변수
 * @returns vtCacheKey
 */
GeometryModifier.prototype.vertexTexcoordsArraysCacheKeysContainerNewVertexTexcoordsArraysCacheKey = function(vtArraysCacheKeys_container) 
{
	var vtCacheKey = new VertexTexcoordsArraysCacheKeys();
	vtArraysCacheKeys_container._vtArrays_cacheKeys_array.push(vtCacheKey);
	return vtCacheKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param blockList 변수
 * @param idx 변수
 * @returns block
 */
GeometryModifier.prototype.blocksListGetBlock = function(blockList, idx) 
{
	var block = null;

	if (idx >= 0 && idx < blockList.blocksArray.length) 
	{
		block = blockList.blocksArray[idx];
	}
	return block;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param blockListContainer 변수
 * @param blocksListName 변수
 * @returns blocksList
 */
GeometryModifier.prototype.blocksListsContainerNewBlocksList = function(blockListContainer, blocksListName) 
{
	var blocksList = new BlocksList();
	blocksList.name = blocksListName;
	blockListContainer.blocksListsArray.push(blocksList);
	return blocksList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param blockListContainer 변수
 * @param blocksListName 변수
 * @returns blocksList
 */
GeometryModifier.prototype.blocksListsContainerGetBlockList = function(blockListContainer, blocksListName) 
{
	var blocksListsCount = blockListContainer.blocksListsArray.length;
	var found = false;
	var i = 0;
	var blocksList = null;
	while (!found && i < blocksListsCount)
	{
		var currentBlocksList = blockListContainer.blocksListsArray[i];
		if (currentBlocksList.name == blocksListName)
		{
			found = true;
			blocksList = currentBlocksList;
		}
		i++;
	}
	return blocksList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param buildingProject 변수
 */
GeometryModifier.prototype.bRbuildingProjectCreateDefaultBlockReferencesLists = function(buildingProject) 
{
	// Create 5 BlocksLists: "Blocks1", "Blocks2", "Blocks3", Blocks4" and "BlocksBone".***

	// Old.*********************************************************
	//this._blocksList_Container.newBlocksList("Blocks1");
	//this._blocksList_Container.newBlocksList("Blocks2");
	//this._blocksList_Container.newBlocksList("Blocks3");
	//this._blocksList_Container.newBlocksList("Blocks4");
	//this._blocksList_Container.newBlocksList("BlocksBone");
	//----------------------------------------------------------------

	this.f4dBlocksListsContainerNewBlocksList(buildingProject._blocksList_Container, "Blocks1");
	this.f4dBlocksListsContainerNewBlocksList(buildingProject._blocksList_Container, "Blocks2");
	this.f4dBlocksListsContainerNewBlocksList(buildingProject._blocksList_Container, "Blocks3");
	this.f4dBlocksListsContainerNewBlocksList(buildingProject._blocksList_Container, "Blocks4");
	this.f4dBlocksListsContainerNewBlocksList(buildingProject._blocksList_Container, "BlocksBone");
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param buildingProjectsList 변수
 * @returns brBuildingProject
 */
GeometryModifier.prototype.bRbuildingProjectsListNewBRProject = function(buildingProjectsList) 
{
	//var titol = "holes a tothom"
	//var brBuildingProject = new BRBuildingProject({Titol : titol});
	var brBuildingProject = new BRBuildingProject();

	// Create the blocks lists default.***
	this.bRbuildingProjectCreateDefaultBlockReferencesLists(brBuildingProject);

	buildingProjectsList._BR_buildingsArray.push(brBuildingProject);
	return brBuildingProject;
};
