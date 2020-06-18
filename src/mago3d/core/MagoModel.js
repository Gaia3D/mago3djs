'use strict';

/**
 * This is the model from f4d. Is the minimum independent project.
 * @class MagoModel
 * 
 * @param {object} model model object.
 */
var MagoModel = function(model) 
{
	if (!(this instanceof MagoModel)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	if (isEmpty(model.dataId))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataId'));
	}

	if (isEmpty(model.dataKey))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataKey'));
	}

	if (isEmpty(model.dataGroupId))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
	}

	if (isEmpty(model.longitude) || isEmpty(model.latitude))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('longitude', 'latitude'));
	}
	/*
	if (!seed || (seed instanceof BuildingSeed && !seed.hasOwnProperty('bBox'))) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('BuildingSeed'));
	}
*/
	this.ready = false;
	this.id = model.dataId;
	this.layerId = model.dataGroupId;
	this.layerKey = model.dataGroupKey;
	this.key = model.dataKey;
	this.name = model.dataName;
	this.dataType = model.dataType;
	this.mappingType = defaultValue(model.mappingType, MagoModel.MAPPING_TYPE.ORIGIN);
	this.reference = defaultValue(model.reference, false);
    
	this.geographicCoord = new GeographicCoord(model.longitude, model.latitude, defaultValue(model.altitude, 0));
	this.rotationsDegree = new Point3D(defaultValue(model.pitch, 0), defaultValue(model.roll, 0), defaultValue(model.heading, 0));
	this.bbox = new BoundingBox();

	this.style = Object.assign({}, MagoModel.DEFAULT_STYLE, model.style||{});

	this._buildingSeed; 
};

Object.defineProperties(MagoModel.prototype, {
	buildingSeed: {
		get: function()
		{
			return this._buildingSeed;
		},
		set: function(seed)
		{
			if (!(seed instanceof BuildingSeed))
			{
				return;
			}
			this._buildingSeed = seed;
			if (this._buildingSeed.geographicCoord === undefined)
			{ this._buildingSeed.geographicCoord = new GeographicCoord(); }
		
			if (this._buildingSeed.rotationsDegree === undefined)
			{ this._buildingSeed.rotationsDegree = new Point3D(); }
			// now calculate the geographic coord of the center of the bbox.
			if (this._buildingSeed.geographicCoordOfBBox === undefined) 
			{ this._buildingSeed.geographicCoordOfBBox = new GeographicCoord(); }
		
			//값
			this._calculate();

			this.ready = true;
		}
	}
});
/**
 * 기존의 makenode와 같은 역할
 * @private
 */
MagoModel.prototype._calculate = function() 
{
	var longitude = this.geographicCoord.longitude;
	var latitude = this.geographicCoord.latitude;
	var altitude = this.geographicCoord.altitude;
	this.buildingSeed.geographicCoord.setLonLatAlt(longitude, latitude, altitude);
	//x : pitch, y : roll, z : heading
	this.buildingSeed.rotationsDegree.set(this.rotationsDegree.x, this.rotationsDegree.y, this.rotationsDegree.z);

	var tMatrix = this.getTmatrix();

	// now calculate the geographicCoord of the center of the bBox.
	var bboxCenterPoint = this.buildingSeed.bBox.getCenterPoint(bboxCenterPoint);
	var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
	this.buildingSeed.geographicCoordOfBBox = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, this.buildingSeed.geographicCoordOfBBox); // original.

	// Set the altitude as the original. This method has little error
	this.buildingSeed.geographicCoordOfBBox.altitude = this.buildingSeed.geographicCoord.altitude;

	// now, calculate the bbox.
	this.bbox.copyFrom(this.buildingSeed.bBox);

	// calculate the geographicCoordOfTheBBox.***
	if (tMatrix !== undefined)
	{
		var mappingType = this.mappingType.toLowerCase();

		switch (mappingType)
		{
		case MagoModel.MAPPING_TYPE.BOUNDINGBOXCENTER : {
			this.bbox.geographicCoord = new GeographicCoord();
			this.bbox.geographicCoord.setLonLatAlt(longitude, latitude, height);
			break;
		}
		case MagoModel.MAPPING_TYPE.ORIGIN : 
		default : {
			bboxCenterPoint = this.bbox.getCenterPoint(bboxCenterPoint);
			var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
			this.bbox.geographicCoord = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, this.bbox.geographicCoord);
		}
		}
	}
};
/**
 * @private
 */
MagoModel.prototype.getTmatrix = function() 
{
	var geoCoord = this.geographicCoord;
	var rotateInfo = this.rotationsDegree;

	// calculate the transformation matrix at (longitude, latitude, height).
	var worldCoordPosition = ManagerUtils.geographicCoordToWorldPoint(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, worldCoordPosition);
	return ManagerUtils.calculateTransformMatrixAtWorldPosition(worldCoordPosition, rotateInfo.heading, rotateInfo.pitch, rotateInfo.roll, undefined);
};

MagoModel.DEFAULT_STYLE = {
	visible: true
};
MagoModel.MAPPING_TYPE = {
	ORIGIN            : 'origin',
	BOUNDINGBOXCENTER : 'boundingboxcenter'
};