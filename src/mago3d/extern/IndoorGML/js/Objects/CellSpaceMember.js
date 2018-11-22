

    'use strict';

    /**
     * Objects storing CellSpaceMember in IndoorGML
     * @exports CellSpaceMember
     * @constructor
     * @param {string} description description of CellSpaceMember
     * @param {string} href href of CellSpaceMember
     * @param {string} id id of CellSpaceMember
     * @param {Array} surfaceMember Array of {@link SurfaceMember}
     */
    function CellSpaceMember(description, href, id, surfaceMember) {

      /** Description contains information about section and floor ... etc */
    	this.description = description;

      /** Duality.</br> This will work as a key of cell that distinguse one cell to this other. */
    	this.href = href;

    	this.id = id;

      /** Array of surface members */
    	this.surfaceMember = surfaceMember;

      /**
       * This means what role it plays.</br>
       * This value will be parsed from description.</br>
       * If description doesn't mention usage, this remains empty.
       */
      this.usage = "";
      if(description.indexOf("Usage=") != -1){
        var usageStart = description.indexOf("Usage=") + 6;
        this.usage = description.substring(usageStart, description.indexOf(":", usageStart));
      }

      /**
       * This is the section value to which the current cell belongs.</br>
       * This value will be parsed from description.</br>
       * If description doesn't mention section, this remains empty.</br>
       * You can change this value to information about the cells that your IndoorGML file contains.
       */
      this.section = "";
      if(description.indexOf("Section=") != -1){
        var sectionStart = description.indexOf("Section=") + 8;
        this.section = description.substring(sectionStart, description.indexOf(":", sectionStart));
      }

      /**
       * This is the floor value to which the current cell belongs.</br>
       * This value will be parsed from description.</br>
       * If description doesn't mention floor, this remains empty.</br>
       * You can change this value to information about the cells that your IndoorGML file contains.
       */
      this.floor = "";
      if(description.indexOf("Floor=") != -1){
        var floorStart = description.indexOf("Floor=") + 6;
        this.floor = description.substring(floorStart);
      }
    }

