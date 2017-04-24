'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class GeometryModifier
 */
var GeometryModifier = function() {
	if(!(this instanceof GeometryModifier)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param f4d_point3d 변수
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 */
GeometryModifier.prototype.setPoint3d = function(f4d_point3d, px, py, pz) {
	f4d_point3d.x = px;
	f4d_point3d.y = py;
	f4d_point3d.z = pz;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param f4d_point3d 변수
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @retuns dx*dx + dy*dy + dz*dz
 */
GeometryModifier.prototype.point3dSquareDistTo = function(f4d_point3d, px, py, pz) {
	var dx = f4d_point3d.x - px;
	var dy = f4d_point3d.y - py;
	var dz = f4d_point3d.z - pz;

	return dx*dx + dy*dy + dz*dz;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param matrix4 변수
 * @param float32array 변수
 */
GeometryModifier.prototype.Matrix4SetByFloat32Array = function(matrix4, float32array) {
	for(var i=0; i<16; i++) {
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
GeometryModifier.prototype.Matrix4TransformPoint3D = function(matrix4, point3d) {
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
GeometryModifier.prototype.Matrix4GetMultipliedByMatrix = function(matrixA, matrixB) {
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
	for(var i=0; i<4; i++)
	{
		for(var j=0; j<4; j++)
		{
			// Note: idx = 4*col+row;.***
			//var idx = matrixA.getIndexOfArray(i, j); // Old.***
			var idx = 4*i+j;
			resultMat._floatArrays[idx] = 0.0;
			for(var k=0; k<4; k++)
			{
				resultMat._floatArrays[idx] += matrixB._floatArrays[4*k+j] * matrixA._floatArrays[4*i+k];
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
GeometryModifier.prototype.referenceMultiplyTransformMatrix = function(reference, matrix) {
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
GeometryModifier.prototype.compoundReferencesListMultiplyReferencesMatrices = function(compRefList, matrix) {
	var compRefs_count = compRefList._compoundRefsArray.length;
	for(var i=0; i<compRefs_count; i++)
	{
		var compRef = compRefList._compoundRefsArray[i];
		var refs_count = compRef._referencesList.length;
		for(var j=0; j<refs_count; j++)
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
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 * @returns visibleCompRefObjectsArray
 */
GeometryModifier.prototype.compoundReferencesListGetVisibleCompRefObjectsList = function(compRefList, eye_x, eye_y, eye_z) {
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

	var ocCulling_box = compRefList._ocCulling._ocCulling_box;
	var indicesVisiblesArray_interior = this.occlusionCullingOctreeCellGetIndicesVisiblesForEye(ocCulling_box, eye_x, eye_y, eye_z);
	if(indicesVisiblesArray_interior)
	{
		var indicesCount = indicesVisiblesArray_interior.length;
		for(var i=0; i<indicesCount; i++)
		{
			visibleCompRefObjectsArray._compoundRefsArray.push(compRefList._compoundRefsArray[indicesVisiblesArray_interior[i]]);
		}

	}

	var infinite_ocCulling_box = compRefList._ocCulling._infinite_ocCulling_box;
	var indicesVisiblesArray_exterior = this.occlusionCullingOctreeCellGetIndicesVisiblesForEye(infinite_ocCulling_box, eye_x, eye_y, eye_z);
	if(indicesVisiblesArray_exterior)
	{
		var indicesCount = indicesVisiblesArray_exterior.length;
		for(var i=0; i<indicesCount; i++)
		{
			visibleCompRefObjectsArray._compoundRefsArray.push(compRefList._compoundRefsArray[indicesVisiblesArray_exterior[i]]);
		}
	}

	if(visibleCompRefObjectsArray && visibleCompRefObjectsArray.length == 0)return null;

	return visibleCompRefObjectsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param compRefList_container 변수
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 * @returns visibleCompRefObjectsArray_Total
 */
GeometryModifier.prototype.compoundReferencesListContainerGetVisibleCompRefObjectsList = function(compRefList_container, eye_x, eye_y, eye_z) {
	var visibleCompRefObjectsArray_Total = [];
	var compRefList = undefined;
	var compRefLists_count = compRefList_container.compRefsListArray.length;
	for(var i=0; i<compRefLists_count; i++)
	{
		compRefList = compRefList_container.compRefsListArray[i];
		var visibleCompRefObjectsArray = this.compoundReferencesListGetVisibleCompRefObjectsList(compRefList, eye_x, eye_y, eye_z);
		if(visibleCompRefObjectsArray != null)
			visibleCompRefObjectsArray_Total.push(visibleCompRefObjectsArray);
	}
	return visibleCompRefObjectsArray_Total;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param buildingProject 변수
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_Z 변수
 * @returns total_visibleCompRefLists
 */
GeometryModifier.prototype.bRbuildingProjectGetVisibleCompRefLists = function(buildingProject, eye_x, eye_y, eye_z) {
	// 1rst, check if the eye is in the building.***
	var InteriorCompRefList_container = buildingProject._interiorCompRefList_Container;
	var interior_visibleCompRefLists = this.compoundReferencesListContainerGetVisibleCompRefObjectsList(InteriorCompRefList_container, eye_x, eye_y, eye_z);

	var compRefList_container = buildingProject._compRefList_Container;
	var visibleCompRefLists = this.compoundReferencesListContainerGetVisibleCompRefObjectsList(compRefList_container, eye_x, eye_y, eye_z);

	var total_visibleCompRefLists = visibleCompRefLists.concat(interior_visibleCompRefLists);

	return total_visibleCompRefLists;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 * @param min_x 변수
 * @param max_x 변수
 * @param min_y 변수
 * @param max_y 변수
 * @param min_z 변수
 * @param max_z 변수
 */
GeometryModifier.prototype.occlusionCullingOctreeCellSetDimensions = function(ocCullOctreeCell, min_x, max_x, min_y, max_y, min_z, max_z) {
	ocCullOctreeCell.minX = min_x;
	ocCullOctreeCell.maxX = max_x;
	ocCullOctreeCell.minY = min_y;
	ocCullOctreeCell.maxY = max_y;
	ocCullOctreeCell.minZ = min_z;
	ocCullOctreeCell.maxZ = max_z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param ocCullOctreeCell 변수
 */
GeometryModifier.prototype.occlusionCullingOctreeCellSetSizesSubBoxes = function(ocCullOctreeCell) {
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

	if(ocCullOctreeCell._subBoxesArray.length > 0)
	{
		var half_x= (ocCullOctreeCell.maxX + ocCullOctreeCell.minX)/2.0;
		var half_y= (ocCullOctreeCell.maxY + ocCullOctreeCell.minY)/2.0;
		var half_z= (ocCullOctreeCell.maxZ + ocCullOctreeCell.minZ)/2.0;

		// Old.***************************************************************************************************************************************************
		//ocCullOctreeCell._subBoxesArray[0].setDimensions(ocCullOctreeCell.minX, half_x,   ocCullOctreeCell.minY, half_y,   ocCullOctreeCell.minZ, half_z);
		//ocCullOctreeCell._subBoxesArray[1].setDimensions(half_x, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, half_y,   ocCullOctreeCell.minZ, half_z);
		//ocCullOctreeCell._subBoxesArray[2].setDimensions(half_x, ocCullOctreeCell.maxX,   half_y, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, half_z);
		//ocCullOctreeCell._subBoxesArray[3].setDimensions(ocCullOctreeCell.minX, half_x,   half_y, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, half_z);

		//ocCullOctreeCell._subBoxesArray[4].setDimensions(ocCullOctreeCell.minX, half_x,   ocCullOctreeCell.minY, half_y,   half_z, ocCullOctreeCell.maxZ);
		//ocCullOctreeCell._subBoxesArray[5].setDimensions(half_x, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, half_y,   half_z, ocCullOctreeCell.maxZ);
		//ocCullOctreeCell._subBoxesArray[6].setDimensions(half_x, ocCullOctreeCell.maxX,   half_y, ocCullOctreeCell.maxY,   half_z, ocCullOctreeCell.maxZ);
		//ocCullOctreeCell._subBoxesArray[7].setDimensions(ocCullOctreeCell.minX, half_x,   half_y, ocCullOctreeCell.maxY,   half_z, ocCullOctreeCell.maxZ);

		// New version.*********************************************************************************************************************************************
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[0], ocCullOctreeCell.minX, half_x,   ocCullOctreeCell.minY, half_y,   ocCullOctreeCell.minZ, half_z);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[1], half_x, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, half_y,   ocCullOctreeCell.minZ, half_z);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[2], half_x, ocCullOctreeCell.maxX,   half_y, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, half_z);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[3], ocCullOctreeCell.minX, half_x,   half_y, ocCullOctreeCell.maxY,   ocCullOctreeCell.minZ, half_z);

		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[4], ocCullOctreeCell.minX, half_x,   ocCullOctreeCell.minY, half_y,   half_z, ocCullOctreeCell.maxZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[5], half_x, ocCullOctreeCell.maxX,   ocCullOctreeCell.minY, half_y,   half_z, ocCullOctreeCell.maxZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[6], half_x, ocCullOctreeCell.maxX,   half_y, ocCullOctreeCell.maxY,   half_z, ocCullOctreeCell.maxZ);
		this.occlusionCullingOctreeCellSetDimensions(ocCullOctreeCell._subBoxesArray[7], ocCullOctreeCell.minX, half_x,   half_y, ocCullOctreeCell.maxY,   half_z, ocCullOctreeCell.maxZ);
		//-------------------------------------------------------------------------------------------------------------------------------------------------------------

		for(var i=0; i<ocCullOctreeCell._subBoxesArray.length; i++)
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
GeometryModifier.prototype.occlusionCullingOctreeCellIntersectsWithPoint3D = function(ocCullOctreeCell, x, y, z) {
	var intersects = false;

	if(x>ocCullOctreeCell.minX && x<ocCullOctreeCell.maxX) {
		if(y>ocCullOctreeCell.minY && y<ocCullOctreeCell.maxY) {
			if(z>ocCullOctreeCell.minZ && z<ocCullOctreeCell.maxZ) {
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
GeometryModifier.prototype.occlusionCullingOctreeCellGetIntersectedSubBoxByPoint3D = function(ocCullOctreeCell, x, y, z) {
	var intersectedSubBox = null;

	if(ocCullOctreeCell._ocCulling_Cell_owner == null)
	{
		// This is the mother_cell.***
		if(!this.occlusionCullingOctreeCellIntersectsWithPoint3D(ocCullOctreeCell, x, y, z))
		{
			return null;
		}
	}

	var subBoxes_count = ocCullOctreeCell._subBoxesArray.length;
	if(subBoxes_count > 0)
	{
		var center_x = (ocCullOctreeCell.minX + ocCullOctreeCell.maxX)/2.0;
		var center_y = (ocCullOctreeCell.minY + ocCullOctreeCell.maxY)/2.0;
		var center_z = (ocCullOctreeCell.minZ + ocCullOctreeCell.maxZ)/2.0;

		var intersectedSubBox_aux = null;
		var intersectedSubBox_idx = undefined;

		if(x<center_x)
		{
			// Here are the boxes number 0, 3, 4, 7.***
			if(y<center_y)
			{
				// Here are 0, 4.***
				if(z<center_z) intersectedSubBox_idx = 0;
				else intersectedSubBox_idx = 4;
			}
			else
			{
				// Here are 3, 7.***
				if(z<center_z) intersectedSubBox_idx = 3;
				else intersectedSubBox_idx = 7;
			}
		}
		else
		{
			// Here are the boxes number 1, 2, 5, 6.***
			if(y<center_y)
			{
				// Here are 1, 5.***
				if(z<center_z) intersectedSubBox_idx = 1;
				else intersectedSubBox_idx = 5;
			}
			else
			{
				// Here are 2, 6.***
				if(z<center_z) intersectedSubBox_idx = 2;
				else intersectedSubBox_idx = 6;
			}
		}

		intersectedSubBox_aux = ocCullOctreeCell._subBoxesArray[intersectedSubBox_idx];
		intersectedSubBox = this.occlusionCullingOctreeCellGetIntersectedSubBoxByPoint3D(intersectedSubBox_aux, x, y, z);

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
 * @param x 변수
 * @param y 변수
 * @param z 변수
 * @returns indicesVisiblesArray
 */
GeometryModifier.prototype.occlusionCullingOctreeCellGetIndicesVisiblesForEye = function(ocCullOctreeCell, eye_x, eye_y, eye_z) {
	var indicesVisiblesArray = null;
	var intersectedSubBox = this.occlusionCullingOctreeCellGetIntersectedSubBoxByPoint3D(ocCullOctreeCell, eye_x, eye_y, eye_z);

	if(intersectedSubBox != null && intersectedSubBox._indicesArray.length > 0)
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
GeometryModifier.prototype.occlusionCullingOctreeCellExpandBox = function(ocCullOctreeCell, expansionDist) {
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
 * @returns vt_cacheKey
 */
GeometryModifier.prototype.vertexTexcoordsArraysCacheKeysContainerNewVertexTexcoordsArraysCacheKey = function(vtArraysCacheKeys_container) {
	var vt_cacheKey = new VertexTexcoordsArraysCacheKeys();
	vtArraysCacheKeys_container._vtArrays_cacheKeys_array.push(vt_cacheKey);
	return vt_cacheKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param blockList 변수
 * @param idx 변수
 * @returns block
 */
GeometryModifier.prototype.blocksListGetBlock = function(blockList, idx) {
	var block = null;

	if(idx >= 0 && idx <blockList.blocksArray.length) {
		block = blockList.blocksArray[idx];
	}
	return block;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param blockList_container 변수
 * @param blocksList_name 변수
 * @returns blocksList
 */
GeometryModifier.prototype.blocksListsContainerNewBlocksList = function(blockList_container, blocksList_name) {
	var blocksList = new BlocksList();
	blocksList.name = blocksList_name;
	blockList_container.blocksListsArray.push(blocksList);
	return blocksList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param blockList_container 변수
 * @param blockList_name 변수
 * @returns blocksList
 */
GeometryModifier.prototype.blocksListsContainerGetBlockList = function(blockList_container, blockList_name) {
	var blocksLists_count = blockList_container.blocksListsArray.length;
	var found = false;
	var i=0;
	var blocksList = null;
	while(!found && i<blocksLists_count)
	{
		var current_blocksList = blockList_container.blocksListsArray[i];
		if(current_blocksList.name == blockList_name)
		{
			found = true;
			blocksList =current_blocksList;
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
GeometryModifier.prototype.bRbuildingProjectCreateDefaultBlockReferencesLists = function(buildingProject) {
	// Create 5 BlocksLists: "Blocks1", "Blocks2", "Blocks3", Blocks4" and "BlocksBone".***

	// Old.*********************************************************
	//this._blocksList_Container.newBlocksList("Blocks1");
	//this._blocksList_Container.newBlocksList("Blocks2");
	//this._blocksList_Container.newBlocksList("Blocks3");
	//this._blocksList_Container.newBlocksList("Blocks4");
	//this._blocksList_Container.newBlocksList("BlocksBone");
	//----------------------------------------------------------------

	this.f4dBlocksListsContainer_newBlocksList(buildingProject._blocksList_Container, "Blocks1");
	this.f4dBlocksListsContainer_newBlocksList(buildingProject._blocksList_Container, "Blocks2");
	this.f4dBlocksListsContainer_newBlocksList(buildingProject._blocksList_Container, "Blocks3");
	this.f4dBlocksListsContainer_newBlocksList(buildingProject._blocksList_Container, "Blocks4");
	this.f4dBlocksListsContainer_newBlocksList(buildingProject._blocksList_Container, "BlocksBone");
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof GeometryModifier
 *
 * @param buildingProjectsList 변수
 * @returns br_buildingProject
 */
GeometryModifier.prototype.bRbuildingProjectsListNewBRProject = function(buildingProjectsList) {
	//var titol = "holes a tothom"
	//var br_buildingProject = new BRBuildingProject({Titol : titol});
	var br_buildingProject = new BRBuildingProject();

	// Create the blocks lists default.***
	this.bRbuildingProjectCreateDefaultBlockReferencesLists(br_buildingProject);

	buildingProjectsList._BR_buildingsArray.push(br_buildingProject);
	return br_buildingProject;
};
