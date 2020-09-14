'use strict';

/**
 * ExtrusionBuilding
 * @class ExtrusionBuilding
 * @param {GeographicCoordList} geographicCoordList
 * @param {number} height
 * @param {object} options
 */
var ExtrusionBuilding = function(geographicCoordList, height, options) 
{
	if (!(this instanceof ExtrusionBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
    }
    
    if(!geographicCoordList || !(geographicCoordList instanceof GeographicCoordsList)) {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('geographicCoordList'));
    }

    if(height === undefined || height === null) {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('height'));
    }

    if(height === 0) {
        throw new Error('height must higher than 0');
    }

	MagoRenderable.call(this);
    options = options? options : {};

	this.geographicCoordList = geographicCoordList;
	this.setGeographicPosition(this.geographicCoordList.getMiddleGeographicCoords());

	this.localCoordList = makeLocalCooldList(this.geographicCoordList, this.geoLocDataManager.getCurrentGeoLocationData());

    this.height = height;
    this.color4 = defaultValue(options.color, new Color(1,1,1,1));
    this.selectedColor4 = defaultValue(options.selectedColor, new Color(1,1,0,1));

    this.attributes.isMovable = defaultValue(options.isMovable, true);
    this.attributes.isSelectable = defaultValue(options.isSelectable, true);

    this.options = {};

    this.options.renderWireframe = defaultValue(options.renderWireframe, true);
    this.options.renderShaded = defaultValue(options.renderShaded, true);
	this.options.depthMask = defaultValue(options.depthMask, true);
	
	function makeLocalCooldList ( gcList, geoLocData) {
		var tMatInv = geoLocData.getTMatrixInv();
		var lcList = [];
		for(var i=0,len=gcList.geographicCoordsArray.length;i<len;i++)
		{
			var gc = gcList.geographicCoordsArray[i];
			var wc = ManagerUtils.geographicCoordToWorldPoint(gc.longitude,gc.latitude,gc.altitude);
			var lc = tMatInv.transformPoint3D(wc);
			lcList.push(lc);
		}

		return lcList;
	}
};
ExtrusionBuilding.prototype = Object.create(MagoRenderable.prototype);
ExtrusionBuilding.prototype.constructor = ExtrusionBuilding;

ExtrusionBuilding.prototype.makeMesh = function() {
    if(!this.dirty) return;
    if (!this.geographicCoordList || this.geographicCoordList.geographicCoordsArray.length === 0)
	{ return; }
	if(!this.geoLocDataManager) {
        return;
    }
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
    
    if(!geoLocData) {
        return;
	}

	// Make the topGeoCoordsList.
	var topGeoCoordsList = this.geographicCoordList.getCopy();
	// Reassign the altitude on the geoCoordsListCopy.
	topGeoCoordsList.addAltitude(this.height);
	
	var basePoints3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, this.geographicCoordList.geographicCoordsArray, undefined);
	var topPoints3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, topGeoCoordsList.geographicCoordsArray, undefined);
	
	// Now, with basePoints3dArray & topPoints3dArray make a mesh.
	// Create a VtxProfilesList.
	var vtxProfilesList = new VtxProfilesList();
	var baseVtxProfile = vtxProfilesList.newVtxProfile();
	baseVtxProfile.makeByPoints3DArray(basePoints3dArray, undefined); 
	var topVtxProfile = vtxProfilesList.newVtxProfile();
	topVtxProfile.makeByPoints3DArray(topPoints3dArray, undefined); 
	
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	var solidMesh = vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	var surfIndepMesh = solidMesh.getCopySurfaceIndependentMesh();
	surfIndepMesh.calculateVerticesNormals();

    /*
	if (textureInfo)
	{
		var c = document.createElement("canvas");
		var ctx = c.getContext("2d");

		c.width = 8;
		c.height = 32;
		ctx.beginPath();
		ctx.fillStyle = "#262626";
		ctx.rect(0, 0, 8, 1);
		ctx.fill();
		ctx.closePath();
			
		ctx.beginPath();
		ctx.fillStyle = textureInfo.color;
		ctx.rect(0, 1, 8, 31);
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.fillStyle = "#0000ff";
		ctx.rect(2, 8, 4, 8);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		surfIndepMesh.material = new Material('test');
		surfIndepMesh.material.setDiffuseTextureUrl(c.toDataURL());

		surfIndepMesh.calculateTexCoordsByHeight(textureInfo.height);
	}
	*/
	this.objectsArray.push(surfIndepMesh);
	this.setDirty(false);
}

/**
 * @param {Array<Cesium.Cartesian3>} cartesian3Array
 * @param {number} height
 * @param {object} options
 */
ExtrusionBuilding.makeExtrusionBuildingByCartesian3Array = function(cartesian3Array, height, options) {
    var geographicCoordList = GeographicCoordsList.fromCartesians(cartesian3Array);
    var eb = new ExtrusionBuilding(geographicCoordList, height, options);

    return eb;
}

/**
 * @param {number} height
 */
ExtrusionBuilding.prototype.setHeight = function(height) {
	if(height === undefined || height === null) {
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('height'));
	}
	var model = this.geographicCoordList.getExtrudedMeshRenderableObject(height);
		
	this.height = height;
	this.objectsArray = model.objectsArray;
}

/**
 * @return {number}
 */
ExtrusionBuilding.prototype.getHeight = function() {
	return this.height;
}