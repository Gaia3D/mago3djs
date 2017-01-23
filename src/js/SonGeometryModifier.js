
/**
 * 어떤 일을 하고 있습니까?
 */
var f4d_geometryModifier = function()
  {
	 
  };
  
  /**
   * 어떤 일을 하고 있습니까?
   * @param f4d_point3d = 변수
   * @param px = 변수
   * @param py = 변수
   * @param pz = 변수
   */
  // f4d_point3d.*************************************************************************
  f4d_geometryModifier.prototype.set_point3d = function(f4d_point3d, px, py, pz)
  {
  	f4d_point3d.x = px;
	f4d_point3d.y = py;
	f4d_point3d.z = pz;
  };
  
  /**
   * 어떤 일을 하고 있습니까?
   * @param f4d_point3d = 변수
   * @param px = 변수
   * @param py = 변수
   * @param pz = 변수
   * @retuns dx*dx + dy*dy + dz*dz
   */
  f4d_geometryModifier.prototype.point3d_squareDistTo = function(f4d_point3d, px, py, pz)
  {
	  var dx = f4d_point3d.x - px;
	  var dy = f4d_point3d.y - py;
	  var dz = f4d_point3d.z - pz;
	  
	  return dx*dx + dy*dy + dz*dz;
  };
  // End f4d_point3D.---------------------------------------------------------------------
  
  // f4d_Matrix4.**********************************************************************************
  
  /**
   * 어떤 일을 하고 있습니까?
   * @param matrix4 = 변수
   * @param float32array = 변수
   */
  f4d_geometryModifier.prototype.Matrix4_setByFloat32Array = function(matrix4, float32array)
	{
		for(var i=0; i<16; i++)
		{
			matrix4._floatArrays[i] = float32array[i];
		}
	};
	  
	  /**
	   * 어떤 일을 하고 있습니까?
	   * @param matrix4 = 변수
	   * @param point3d = 변수
	   * @returns transformedPoint3d 
	   */
	f4d_geometryModifier.prototype.Matrix4_transformPoint3D = function(matrix4, point3d)
	{
		var transformedPoint3d = new f4d_point3d();
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
	   * @param matrixA = 변수
	   * @param matrixB = 변수
	   * @retuns resultMat
	   */
	f4d_geometryModifier.prototype.Matrix4_getMultipliedByMatrix = function(matrixA, matrixB)
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
		
		
		var resultMat = new f4d_Matrix4();
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
	// End f4d_Matrix4.----------------------------------------------------------------------------
	
	// f4d_reference.*********************************************************************************************************
	  
	  /**
	   * 어떤 일을 하고 있습니까?
	   * @param reference = 변수
	   * @param matrix = 변수
	   */
	f4d_geometryModifier.prototype.f4dReference_multiplyTransformMatrix = function(reference, matrix)
	{
		//var multipliedMat = reference._matrix4.getMultipliedByMatrix(matrix); // Original.***
		var multipliedMat = this.Matrix4_getMultipliedByMatrix(reference._matrix4, matrix); // Original.***
		reference._matrix4 = multipliedMat;
	};
	// End f4d_reference.-----------------------------------------------------------------------------------------------------
	
	// f4d_compoundReferencesList.***********************************************************************************************
	  
	  /**
	   * 어떤 일을 하고 있습니까?
	   * @param compRefList = 변수
	   * @param matrix = 변수
	   */
	f4d_geometryModifier.prototype.f4dCompoundReferencesList_multiplyReferencesMatrices = function(compRefList, matrix)
	{
		var compRefs_count = compRefList._compoundRefsArray.length;
		for(var i=0; i<compRefs_count; i++)
		{
			var compRef = compRefList._compoundRefsArray[i];
			var refs_count = compRef._referencesList.length;
			for(var j=0; j<refs_count; j++)
			{
				var reference = compRef._referencesList[j];
				//reference.multiplyTransformMatrix(matrix);// Old.***
				this.f4dReference_multiplyTransformMatrix(reference, matrix);
			}
		}
	};
	  
	  /**
	   * 어떤 일을 하고 있습니까?
	   * @param compRefList = 변수
	   * @param eye_x = 변수
	   * @param eye_y = 변수
	   * @param eye_z = 변수
	   * @returns visibleCompRefObjectsArray
	   */
	f4d_geometryModifier.prototype.f4dCompoundReferencesList_getVisibleCompRefObjectsList = function(compRefList, eye_x, eye_y, eye_z)
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
		
		var visibleCompRefObjectsArray = new f4d_CompoundReferencesList();
		visibleCompRefObjectsArray._myBlocksList = compRefList._myBlocksList;
		
		var ocCulling_box = compRefList._ocCulling._ocCulling_box;
		var indicesVisiblesArray_interior = this.f4dOcclusionCullingOctreeCell_getIndicesVisiblesForEye(ocCulling_box, eye_x, eye_y, eye_z);
		if(indicesVisiblesArray_interior)
		{
			var indices_count = indicesVisiblesArray_interior.length;
			for(var i=0; i<indices_count; i++)
			{
				visibleCompRefObjectsArray._compoundRefsArray.push(compRefList._compoundRefsArray[indicesVisiblesArray_interior[i]]);
			}
			
		}
		
		var infinite_ocCulling_box = compRefList._ocCulling._infinite_ocCulling_box;
		var indicesVisiblesArray_exterior = this.f4dOcclusionCullingOctreeCell_getIndicesVisiblesForEye(infinite_ocCulling_box, eye_x, eye_y, eye_z);
		if(indicesVisiblesArray_exterior)
		{
			var indices_count = indicesVisiblesArray_exterior.length;
			for(var i=0; i<indices_count; i++)
			{
				visibleCompRefObjectsArray._compoundRefsArray.push(compRefList._compoundRefsArray[indicesVisiblesArray_exterior[i]]);
			}
		}

		if(visibleCompRefObjectsArray && visibleCompRefObjectsArray.length == 0)return null;

		return visibleCompRefObjectsArray;
	};
	// End f4d_compoundReferencesList.------------------------------------------------------------------------------------------------
	
	// f4d_CompoundReferencesList_Container.*****************************************************************************************************
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param compRefList_container = 변수
    * @param eye_x = 변수
    * @param eye_y = 변수
    * @param eye_z = 변수
    * @returns visibleCompRefObjectsArray_Total
	*/
	f4d_geometryModifier.prototype.f4dCompoundReferencesListContainer_getVisibleCompRefObjectsList = function(compRefList_container, eye_x, eye_y, eye_z)
	{
		var visibleCompRefObjectsArray_Total = [];
		var compRefList = undefined;
		var compRefLists_count = compRefList_container._compRefsList_Array.length;
		for(var i=0; i<compRefLists_count; i++)
		{
			compRefList = compRefList_container._compRefsList_Array[i];
			var visibleCompRefObjectsArray = this.f4dCompoundReferencesList_getVisibleCompRefObjectsList(compRefList, eye_x, eye_y, eye_z);
			if(visibleCompRefObjectsArray != null)
				visibleCompRefObjectsArray_Total.push(visibleCompRefObjectsArray);
		}
		return visibleCompRefObjectsArray_Total;
	};
	// End f4d_CompoundReferencesList_Container.-------------------------------------------------------------------------------------------------
	  
	  /**
	   * 어떤 일을 하고 있습니까?
	   * @param buildingProject = 변수
	   * @param eye_x = 변수
	   * @param eye_y = 변수
	   * @param eye_Z = 변수
	   * @returns total_visibleCompRefLists
	   */
	// f4d_BR_buildingProject.************************************************************************************************************************
	f4d_geometryModifier.prototype.f4dBRbuildingProject_getVisibleCompRefLists = function(buildingProject, eye_x, eye_y, eye_z)
	  {
		  // 1rst, check if the eye is in the building.***
		  var InteriorCompRefList_container = buildingProject._interiorCompRefList_Container;
		  var interior_visibleCompRefLists = this.f4dCompoundReferencesListContainer_getVisibleCompRefObjectsList(InteriorCompRefList_container, eye_x, eye_y, eye_z);
			
			//-----------------------------------------
		  var compRefList_container = buildingProject._compRefList_Container;
		  var visibleCompRefLists = this.f4dCompoundReferencesListContainer_getVisibleCompRefObjectsList(compRefList_container, eye_x, eye_y, eye_z);
		  
		  var total_visibleCompRefLists = visibleCompRefLists.concat(interior_visibleCompRefLists);

		  return total_visibleCompRefLists;

	  };
	// End f4d_BR_buildingProject.---------------------------------------------------------------------------------------------------------------------
	
	// f4d_OcclusionCullingOctree_Cell.*************************************************************************************************
	  
    /**
	 * 어떤 일을 하고 있습니까?
	 * @param ocCullOctreeCell = 변수
	 * @param min_x = 변수
	 * @param max_x = 변수
	 * @param min_y = 변수
	 * @param max_y = 변수
	 * @param min_z = 변수
	 * @param max_z = 변수
	 */
	f4d_geometryModifier.prototype.f4dOcclusionCullingOctreeCell_setDimensions = function(ocCullOctreeCell, min_x, max_x, min_y, max_y, min_z, max_z)
	{
		ocCullOctreeCell._minX = min_x;
		ocCullOctreeCell._maxX = max_x;
		ocCullOctreeCell._minY = min_y;
		ocCullOctreeCell._maxY = max_y;
		ocCullOctreeCell._minZ = min_z;
		ocCullOctreeCell._maxZ = max_z;
	};
	  
    /**
	 * 어떤 일을 하고 있습니까?
	 * @param ocCullOctreeCell = 변수
	 */
	f4d_geometryModifier.prototype.f4dOcclusionCullingOctreeCell_setSizesSubBoxes = function(ocCullOctreeCell)
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
		
		if(ocCullOctreeCell._subBoxesArray.length > 0)
		{
			var half_x= (ocCullOctreeCell._maxX + ocCullOctreeCell._minX)/2.0;
			var half_y= (ocCullOctreeCell._maxY + ocCullOctreeCell._minY)/2.0;
			var half_z= (ocCullOctreeCell._maxZ + ocCullOctreeCell._minZ)/2.0;
			
			// Old.***************************************************************************************************************************************************
			//ocCullOctreeCell._subBoxesArray[0].set_dimensions(ocCullOctreeCell._minX, half_x,   ocCullOctreeCell._minY, half_y,   ocCullOctreeCell._minZ, half_z);
			//ocCullOctreeCell._subBoxesArray[1].set_dimensions(half_x, ocCullOctreeCell._maxX,   ocCullOctreeCell._minY, half_y,   ocCullOctreeCell._minZ, half_z);
			//ocCullOctreeCell._subBoxesArray[2].set_dimensions(half_x, ocCullOctreeCell._maxX,   half_y, ocCullOctreeCell._maxY,   ocCullOctreeCell._minZ, half_z);
			//ocCullOctreeCell._subBoxesArray[3].set_dimensions(ocCullOctreeCell._minX, half_x,   half_y, ocCullOctreeCell._maxY,   ocCullOctreeCell._minZ, half_z);

			//ocCullOctreeCell._subBoxesArray[4].set_dimensions(ocCullOctreeCell._minX, half_x,   ocCullOctreeCell._minY, half_y,   half_z, ocCullOctreeCell._maxZ);
			//ocCullOctreeCell._subBoxesArray[5].set_dimensions(half_x, ocCullOctreeCell._maxX,   ocCullOctreeCell._minY, half_y,   half_z, ocCullOctreeCell._maxZ);
			//ocCullOctreeCell._subBoxesArray[6].set_dimensions(half_x, ocCullOctreeCell._maxX,   half_y, ocCullOctreeCell._maxY,   half_z, ocCullOctreeCell._maxZ);
			//ocCullOctreeCell._subBoxesArray[7].set_dimensions(ocCullOctreeCell._minX, half_x,   half_y, ocCullOctreeCell._maxY,   half_z, ocCullOctreeCell._maxZ);
			
			// New version.*********************************************************************************************************************************************
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[0], ocCullOctreeCell._minX, half_x,   ocCullOctreeCell._minY, half_y,   ocCullOctreeCell._minZ, half_z);
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[1], half_x, ocCullOctreeCell._maxX,   ocCullOctreeCell._minY, half_y,   ocCullOctreeCell._minZ, half_z);
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[2], half_x, ocCullOctreeCell._maxX,   half_y, ocCullOctreeCell._maxY,   ocCullOctreeCell._minZ, half_z);
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[3], ocCullOctreeCell._minX, half_x,   half_y, ocCullOctreeCell._maxY,   ocCullOctreeCell._minZ, half_z);
			
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[4], ocCullOctreeCell._minX, half_x,   ocCullOctreeCell._minY, half_y,   half_z, ocCullOctreeCell._maxZ);
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[5], half_x, ocCullOctreeCell._maxX,   ocCullOctreeCell._minY, half_y,   half_z, ocCullOctreeCell._maxZ);
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[6], half_x, ocCullOctreeCell._maxX,   half_y, ocCullOctreeCell._maxY,   half_z, ocCullOctreeCell._maxZ);
			this.f4dOcclusionCullingOctreeCell_setDimensions(ocCullOctreeCell._subBoxesArray[7], ocCullOctreeCell._minX, half_x,   half_y, ocCullOctreeCell._maxY,   half_z, ocCullOctreeCell._maxZ);
			//-------------------------------------------------------------------------------------------------------------------------------------------------------------
			
			for(var i=0; i<ocCullOctreeCell._subBoxesArray.length; i++)
			{
				//ocCullOctreeCell._subBoxesArray[i].set_sizesSubBoxes(); // Old.***
				this.f4dOcclusionCullingOctreeCell_setSizesSubBoxes(ocCullOctreeCell._subBoxesArray[i]);
			}
			
		}
		
	};
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param ocCullOctreeCell = 변수
    * @param x = 변수
    * @param y = 변수
    * @param z = 변수
    * @returns intersects
    */
	f4d_geometryModifier.prototype.f4dOcclusionCullingOctreeCell_intersectsWithPoint3D = function(ocCullOctreeCell, x, y, z)
	{
		var intersects = false;
		
		if(x>ocCullOctreeCell._minX && x<ocCullOctreeCell._maxX)
		{
			if(y>ocCullOctreeCell._minY && y<ocCullOctreeCell._maxY)
			{
				if(z>ocCullOctreeCell._minZ && z<ocCullOctreeCell._maxZ)
				{
					intersects = true;
				}
			}
		}
		
		return intersects;
	};
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param ocCullOctreeCell = 변수
    * @param x = 변수
    * @param y = 변수
    * @param z = 변수
    * @returns intersectedSubBox
    */
	f4d_geometryModifier.prototype.f4dOcclusionCullingOctreeCell_getIntersectedSubBox_byPoint3D = function(ocCullOctreeCell, x, y, z)
	{
		var intersectedSubBox = null;
		
		if(ocCullOctreeCell._ocCulling_Cell_owner == null)
		{
			// This is the mother_cell.***
			if(!this.f4dOcclusionCullingOctreeCell_intersectsWithPoint3D(ocCullOctreeCell, x, y, z))
			{
				return null;
			}
		}
		
		var subBoxes_count = ocCullOctreeCell._subBoxesArray.length;
		if(subBoxes_count > 0)
		{
			var center_x = (ocCullOctreeCell._minX + ocCullOctreeCell._maxX)/2.0;
			var center_y = (ocCullOctreeCell._minY + ocCullOctreeCell._maxY)/2.0;
			var center_z = (ocCullOctreeCell._minZ + ocCullOctreeCell._maxZ)/2.0;
			
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
			intersectedSubBox = this.f4dOcclusionCullingOctreeCell_getIntersectedSubBox_byPoint3D(intersectedSubBox_aux, x, y, z);
			
		}
		else
		{
			intersectedSubBox = ocCullOctreeCell;
		}
		
		return intersectedSubBox;
	};
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param ocCullOctreeCell = 변수
    * @param x = 변수
    * @param y = 변수
    * @param z = 변수
    * @returns indicesVisiblesArray
    */	
	f4d_geometryModifier.prototype.f4dOcclusionCullingOctreeCell_getIndicesVisiblesForEye = function(ocCullOctreeCell, eye_x, eye_y, eye_z)
	{
		var indicesVisiblesArray = null;
		var intersectedSubBox = this.f4dOcclusionCullingOctreeCell_getIntersectedSubBox_byPoint3D(ocCullOctreeCell, eye_x, eye_y, eye_z);
		
		if(intersectedSubBox != null && intersectedSubBox._indicesArray.length > 0)
		{
			indicesVisiblesArray = intersectedSubBox._indicesArray;
		}
		
		return indicesVisiblesArray;
	};
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param ocCullOctreeCell = 변수
    * @param expansionDist = 변수
    */	
	f4d_geometryModifier.prototype.f4dOcclusionCullingOctreeCell_expandBox = function(ocCullOctreeCell, expansionDist)
	{
		ocCullOctreeCell._minX -= expansionDist;
		ocCullOctreeCell._maxX += expansionDist;
		ocCullOctreeCell._minY -= expansionDist;
		ocCullOctreeCell._maxY += expansionDist;
		ocCullOctreeCell._minZ -= expansionDist;
		ocCullOctreeCell._maxZ += expansionDist;
	};
	// End f4d_OcclusionCullingOctree_Cell.---------------------------------------------------------------------------------------------
	
	
	// f4d_VertexTexcoordsArrays_cacheKeys_Container.*****************************************************************************************
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param vtArraysCacheKeys_container = 변수
    * @returns vt_cacheKey
    */
	f4d_geometryModifier.prototype.f4dVertexTexcoordsArraysCacheKeysContainer_newVertexTexcoordsArraysCacheKey = function(vtArraysCacheKeys_container)
	  {
		  var vt_cacheKey = new f4d_VertexTexcoordsArrays_cacheKeys();
		  vtArraysCacheKeys_container._vtArrays_cacheKeys_array.push(vt_cacheKey);
		  return vt_cacheKey;
	  };
	// End f4d_VertexTexcoordsArrays_cacheKeys_Container.-------------------------------------------------------------------------------------
	
	
	// f4d_BlocksList.**********************************************************************************************************************
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param blockList = 변수
    * @param idx = 변수
    * @returns block 
    */
	f4d_geometryModifier.prototype.f4dBlocksList_getBlock = function(blockList, idx)
	  {
		  var block = null;
		  
		  if(idx >= 0 && idx <blockList._blocksArray.length)
		  {
			  block = blockList._blocksArray[idx];
		  }
		  return block;
	  };
	// End f4d_BlocksList.------------------------------------------------------------------------------------------------------------------
	
	// f4d_BlocksLists_Container.************************************************************************************************************
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param blockList_container = 변수
    * @param blocksList_name = 변수
    * @returns f4d_blocksList
    */
	 f4d_geometryModifier.prototype.f4dBlocksListsContainer_newBlocksList = function(blockList_container, blocksList_name)
	  {
		  var f4d_blocksList = new f4d_BlocksList();
		  f4d_blocksList._name = blocksList_name;
		  blockList_container._BlocksListsArray.push(f4d_blocksList);
		  return f4d_blocksList;
	  };
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param blockList_container = 변수
    * @param blockList_name = 변수
    * @returns blocksList
    */	  
	  f4d_geometryModifier.prototype.f4dBlocksListsContainer_getBlockList = function(blockList_container, blockList_name)
	  {
		var blocksLists_count = blockList_container._BlocksListsArray.length;
		var found = false;
		var i=0;
		var blocksList = null;
		while(!found && i<blocksLists_count)
		{
			var current_blocksList = blockList_container._BlocksListsArray[i];
			if(current_blocksList._name == blockList_name)
			{
				found = true;
				blocksList =current_blocksList;
			}
			i++;
		}
		return blocksList;
	  };
	// End f4d_BlocksLists_Container.--------------------------------------------------------------------------------------------------------
	
	
	// f4d_BR_buildingProject.**************************************************************************************************************
	  
  /**
    * 어떤 일을 하고 있습니까?
    * @param buildingProject = 변수
    */	  
	  f4d_geometryModifier.prototype.f4dBRbuildingProject_createDefaultBlockReferencesLists = function(buildingProject)
	  {
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
	// End f4d_BR_buildingProject.----------------------------------------------------------------------------------------------------------
	
	// f4d_BR_buildingProjectsList.***********************************************************************************************************
	  
	  /**
	    * 어떤 일을 하고 있습니까?
	    * @param buildingProjectsList = 변수
	    * @returns br_buildingProject
	    */
	f4d_geometryModifier.prototype.f4dBRbuildingProjectsList_newBRProject = function(buildingProjectsList)
	  {
		//var titol = "holes a tothom"
		  //var br_buildingProject = new f4d_BR_buildingProject({Titol : titol});
		  var br_buildingProject = new f4d_BR_buildingProject();
		  
		  // Create the blocks lists default.***
		  this.f4dBRbuildingProject_createDefaultBlockReferencesLists(br_buildingProject);
		  
		  buildingProjectsList._BR_buildingsArray.push(br_buildingProject);
		  return br_buildingProject;
	  };
	// End f4d_BR_buildingProjectsList.-------------------------------------------------------------------------------------------------------
	
	
//# sourceURL=sonGeometryModifier.js
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	