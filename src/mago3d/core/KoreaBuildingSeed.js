'use strict';

/**
 * This is the KoreaBuildingSeed. 
 * When tile loaded, this instance remove
 * 
 * @constructor
 * @class KoreaBuildingSeed
 * 
 * @param {object} option 
*/
var KoreaBuildingSeed = function(option)
{
	this.status = KoreaBuildingSeed.STATUS.UNLOAD;

	this._scheme = {
		type: function(value) 
		{
			return "FeatureCollection" === value;
		}, 
		features: function(value) 
		{
			return Array.isArray(value);                    
		}
	};

	this.url = option.url;
	this.format = option.format;
	this.x = option.x;
	this.y = option.y;
	this.z = option.z;
	this.magoManager = option.magoManager;
	this.masterId = option.masterId;

	var extent = SmartTile.getGeographicExtentOfTileLXY(this.z, this.x, this.y, undefined, CODE.imageryType.CRS84);
	this.geographicCoord = extent.getMidPoint();

	this.geographicCoord.latitude = -this.geographicCoord.latitude;
};
KoreaBuildingSeed.STATUS = {
	UNLOAD  : 0,
	LOADING : 1,
	LOADEND : 2
};

KoreaBuildingSeed.prototype.load = function() 
{
	var that = this;
	that.status = KoreaBuildingSeed.STATUS.LOADING;
	var responseType = (that.format === 'pbf')? 'arraybuffer' : 'json';
	loadWithXhr(that.url, undefined, undefined, responseType).then(function(res) 
	{
		var geojson = res;
		if (that.format === 'pbf') 
		{
			geojson = geobuf.geobuf.decode(new Pbf(res));
		}
        
		that.mergeFeatureCollection(geojson);
	}, function(err) 
	{

	});
};

/**
 * Load Korea Building Master's FeatureCollection.
 * @param {object} featureCollection 한국건물 마스터 geojson
 */
KoreaBuildingSeed.getDividedFeaturesArray = function(features, maxFeaturesCount) 
{
	var featuresCount = features.length;
	var resultFeaturesArrayArray = [];
	var currentFeaturesArray = [];
	var counter = 0;
	var started = false;
	for (var i=0; i<featuresCount; i++)
	{
		currentFeaturesArray.push(features[i]);

		if (counter >= maxFeaturesCount)
		{
			resultFeaturesArrayArray.push(currentFeaturesArray);
			currentFeaturesArray = [];
			counter = 0;
			started = true;
		}

		counter++;
	}

	if (!started)
	{
		resultFeaturesArrayArray.push(currentFeaturesArray);
	}
	else if (currentFeaturesArray.length > 0)
	{
		resultFeaturesArrayArray.push(currentFeaturesArray);
	}

	return resultFeaturesArrayArray;
};

/**
 * Load Korea Building Master's FeatureCollection.
 * @param {object} featureCollection 한국건물 마스터 geojson
 */
KoreaBuildingSeed.prototype.mergeFeatureCollection = function(featureCollection) 
{
	if (!validateWithScheme(featureCollection, this._scheme)) 
	{
		throw Error("Invalid data.");
	}

	var features = featureCollection.features;

	var maxFeaturesCount = 200;
	var featuresArray =  KoreaBuildingSeed.getDividedFeaturesArray(features, maxFeaturesCount);
	var featuresCount = featuresArray.length;
	for (var k=0; k<featuresCount; k++)
	{
		var dividedFeatures = featuresArray[k];
		var renderables = [];
		for (var i=0, len=dividedFeatures.length; i<len; i++) 
		{
			renderables.push(new KoreaBuilding(dividedFeatures[i]));
		}

		var merged = new MergedObject(this.magoManager);
		merged.attributes.isDeletableByFrustumCulling = true;

		var self = this;
		merged.initialize(renderables).then(function(a, b, c) 
		{
			merged.masterId = self.masterId;

			self.magoManager.modeler.addObject(merged, 15);
			self.status = KoreaBuildingSeed.STATUS.LOADEND;
		});
	}
};

/**
 * Load Korea Building Master's FeatureCollection.
 * @param {object} featureCollection 한국건물 마스터 geojson
 */
KoreaBuildingSeed.prototype.mergeFeatureCollection_original = function(featureCollection) 
{
	 if (!validateWithScheme(featureCollection, this._scheme)) 
	 {
		 throw Error("Invalid data.");
	 }
 
	 var features = featureCollection.features;
	 var renderables = [];
	 for (var i=0, len=features.length; i<len; i++) 
	 {
		 renderables.push(new KoreaBuilding(features[i]));
	 }
 
	 var merged = new MergedObject(this.magoManager);
 
	 var self = this;
	 merged.initialize(renderables).then(function(a, b, c) 
	 {
		 merged.masterId = self.masterId;
 
		 self.magoManager.modeler.addObject(merged, 15);
		 self.status = KoreaBuildingSeed.STATUS.LOADEND;
	 });
};

