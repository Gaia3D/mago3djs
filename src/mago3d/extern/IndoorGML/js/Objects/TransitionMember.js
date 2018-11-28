
    'use strict';


    /**
     * Transition member Class. This can be thought of as simply a edge.
     * @exports TransitionMember
     * @constructor
     */
    function TransitionMember(connects, description, coordinates) {

      /**
       * Array of href.</br>
       * This means two nodes constituting an edge.
       */
      this.connects = connects;

      /**
       * information about section and floor...etc
       */
      this.description = description;

      /** Array of state members, each state member has X,Y,Z coordinates */
      this.stateMembers = coordinates;

      if(description != null){

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
    }



