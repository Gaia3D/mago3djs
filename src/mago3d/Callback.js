'use strict';

function selectedObjectCallback(functionName, projectId, blockId, objectId, latitude, longitude, elevation, heading, pitch, roll) {
    window[functionName](projectId, blockId, objectId, latitude, longitude, elevation, heading, pitch, roll);
}