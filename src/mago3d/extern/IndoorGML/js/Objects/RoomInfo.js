define([
  "./Coordinate"
],function(
  Coordinate
) {
  'use strict';

  /**
   * Storing data about room parsed from cellSpaceMember and edges.
   * @exports RoomInfo
   * @constructor
   *
   * @param {string} usage usage data is from {@link module:GMLDataContainer.cellSpaceMembers}
   * @param {string} section section data is from {@link module:GMLDataContainer.cellSpaceMembers}
   * @param {string} floor floor data is from {@link module:GMLDataContainer.cellSpaceMembers}
   * @param {number} x this data is from {@link Coordinate} of {@link module:GMLDataContainer.edges}
   * @param {number} y this data is from {@link Coordinate} of {@link module:GMLDataContainer.edges}
   * @param {number} z this data is from {@link Coordinate} of {@link module:GMLDataContainer.edges}
   * @param {string} href this data is from {@link Coordinate} of {@link module:GMLDataContainer.edges}
   */
  function RoomInfo(usage, section, floor, x, y, z, href){

    /**
     * This means what role it plays.</br>
     * This value will be parsed from description.</br>
     * If description doesn't mention usage, this remains empty.
     */
  	this.usage = usage;


    /**
     * This is the section value to which the current room belongs.</br>
     * This value will be parsed from description.</br>
     * If description doesn't mention section, this remains empty.</br>
     * You can change this value to information about the cells that your IndoorGML file contains.
     */
    this.section = section;


    /**
     * This is the floor value to which the current room belongs.</br>
     * This value will be parsed from description.</br>
     * If description doesn't mention floor, this remains empty.</br>
     * You can change this value to information about the cells that your IndoorGML file contains.
     */
    this.floor = floor;


    /**
     * It is a coordinate representing the present room.
     */
    this.coordinate = new Coordinate(x, y, z, href);
  }

  return RoomInfo;
});
