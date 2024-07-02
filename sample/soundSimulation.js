function SoundSimulation(magoInstance, options) {
    /*this._defaultLegends = [
        {min : 70, max : Number.MAX_SAFE_INTEGER, color : new Cesium.Color(1, 0, 0, 1)},
        {min : 65, max : 70, color : new Cesium.Color(1, 0.4, 0, 1)},
        {min : 60, max : 65, color : new Cesium.Color(1, 0.84, 0, 1)},
        {min : 55, max : 60, color : new Cesium.Color(0.04, 0.74, 0.04, 1)},
        {min : 50, max : 55, color : new Cesium.Color(0.05, 0.47, 0.89, 1)},
        {min : 0, max : 50, color : new Cesium.Color(0, 0.10, 0.89, 1)},
        {min : Number.MIN_SAFE_INTEGER, max : 0, color : new Cesium.Color(0, 0.10, 0.89, 1)},
    ];*/
    this._defaultLegends = [
        {min : 70, max : Number.MAX_SAFE_INTEGER, color : new Cesium.Color(1, 0, 0, 1)},
        {min : 65, max : 70, color : new Cesium.Color(1, 0.4, 0, 1)},
        {min : 60, max : 65, color : new Cesium.Color(1, 0.84, 0, 1)},
        {min : 55, max : 60, color : new Cesium.Color(0.04, 0.74, 0.04, 1)},
        {min : 50, max : 55, color : new Cesium.Color(0.05, 0.47, 0.89, 1)},
        {min : 0, max : 50, color : new Cesium.Color(0, 0.10, 0.89, 1)},
        {min : Number.MIN_SAFE_INTEGER, max : 0, color : new Cesium.Color(0, 0.10, 0.89, 1)},
    ];
    if (options.legends) {
        this._defaultLegends = options.legends;
    }
    this._selectedLegends = this._defaultLegends;
    this._max_legend_count = 16;
    this._minValue = options.minValue;
    this._maxValue = options.maxValue;
    this._alphaValue = options.alphaValue;
    this._weatherStation = null;
    this.init(magoInstance, options);
}
SoundSimulation.prototype.init = function(magoInstance, options) {
    var magoManager = magoInstance.getMagoManager();
    if (magoManager.weatherStation === undefined) {
        var options = {
            windDisplayMode : "NORMAL"
        };
        magoManager.weatherStation = new Mago3D.WeatherStation(magoManager, options);
    }
    this._weatherStation = magoManager.weatherStation;
    var options = {
        geoJsonIndexFilePath : options.geoJsonIndexFilePath,
        geoJsonIndexFileFolderPath : options.geoJsonIndexFileFolderPath
    };
    var soundSurfaceVolume = magoManager.weatherStation.newSoundSurfaceVolume(options);
    this.setLegendToVolumes();
}
SoundSimulation.prototype.setLegendToVolumes = function(legends) {
    if (!legends) {
        legends = this._selectedLegends;
    } else {
        this._selectedLegends = legends;
    }
    var soundSurfacesVolumesArray = this._weatherStation.soundSurfacesVolumesArray;
    soundSurfacesVolumesArray.forEach((soundSurfaceVolume) => {
        this.setLegendToVolume(soundSurfaceVolume, legends);
    })
}
SoundSimulation.prototype.setLegendToVolume = function(soundSurfaceVolume, legends) {
    var legendsClone = legends.concat();
    legendsClone.reverse();
    legendsClone.push({min : Number.MAX_SAFE_INTEGER, max : Number.MAX_SAFE_INTEGER, color : new Cesium.Color(0, 0, 0, 0)});
    var lengedValues = new Array(this._max_legend_count).fill(0);
    var legendColors = new Array(4 * this._max_legend_count).fill(0);
    legendsClone.forEach((legend, index) => {
        var value = legend.min;
        lengedValues[index] = value;
        if (value < this._minValue || value > this._maxValue) {
            return;
        }
        var color = this.createLegendColor(legend.color);
        var valueIndex = index * 4;
        var aplha = (color[0] + color[1] + color[2] == 0) ? 0 : this._alphaValue;
        legendColors[valueIndex] = color[0];
        legendColors[valueIndex + 1] = color[1];
        legendColors[valueIndex + 2] = color[2];
        legendColors[valueIndex + 3] = aplha;
    });
    soundSurfaceVolume.setLegendColors4(new Float32Array(legendColors));
    soundSurfaceVolume.setLegendValues(new Float32Array(lengedValues));
}
SoundSimulation.prototype.getMinValue = function() {
    return this._minValue;
}
SoundSimulation.prototype.setMinValue = function(value) {
    this._minValue = value;
}
SoundSimulation.prototype.getMaxValue = function() {
    return this._maxValue;
}
SoundSimulation.prototype.setMaxValue = function(value) {
    this._maxValue = value;
}
SoundSimulation.prototype.getAlphaValue = function() {
    return this._alphaValue;
}
SoundSimulation.prototype.setAlphaValue = function(value) {
    this._alphaValue = value;
}
SoundSimulation.prototype.getSelectedLegends = function() {
    return this._selectedLegends;
}
SoundSimulation.prototype.setSelectedLegends = function(legends) {
    if (legends) {
        this._selectedLegends = legends;
        return true;
    }
    return false;
}
SoundSimulation.prototype.createLegendColor = function(color) {
    return [color.red, color.green, color.blue, color.alpha];
}