/**
 * @module utils
 */
define([
  "./GMLDataContainer",
], function(
  GMLDataContainer,
) {
  'use strict';


  /**
   * @alias module:utils
   * @param {GMLDataContainer} GMLDataContainer
   */
  function utils(GMLDataContainer) {

    /**
     * This value will from {@link GMLDataContainer} and this value contain geometry data for target building.
     */
    this.gmlDataContainer = GMLDataContainer;
  }

  utils.prototype.saveTextFileForSketchUp = function(faceCount) {
    var str = String();

    // Loop through cell space members and creating geometry instances
    for (var i = 0; i < this.gmlDataContainer.cellSpaceMembers.length; i++) {
      for (var j = 0; j < this.gmlDataContainer.cellSpaceMembers[i].surfaceMember.length; j++) {
        var arr = Cesium.Cartesian3.unpackArray(this.gmlDataContainer.cellSpaceMembers[i].surfaceMember[j].coordinates);
        str += "pts = [];"
        for (var k = 0; k < arr.length; k++) {
          str += "pts[" + k + "]=[" + arr[k].x + "," + arr[k].y + "," + arr[k].z + "]; ";
        }
        str += "draw_face(entities, pts); "
      }

      if (i % faceCount == 0) {
        saveFile("text_file_" + i, str);
        str = new String();
      }
    }

    saveFile("text_fil_last", str);
  }


  utils.prototype.saveFile = function(fileName, str) {
    var textToSave = str;
    var textToSaveAsBlob = new Blob([textToSave], {
      type: "text/plain"
    });
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var fileNameToSaveAs = fileName;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = this.destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);

    downloadLink.click();
  }

  utils.prototype.destroyClickedElement = function(event) {
    document.body.removeChild(event.target);
  }



  return utils;

});
