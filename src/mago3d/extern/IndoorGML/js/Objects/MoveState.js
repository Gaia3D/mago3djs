define([],function() {
  'use strict';

  /**
   * Status variables that are used for moving the movement in {@link IndoorNavigation}.
   * @exports MoveState
   * @constructor
   */
  function MoveState(){
    /**
     * The starting point of the current movement.</br>
     * href is acting as a key role in {@link CellSpaceMember}, {@link Coordinate}, connects in {@link TransitionMember} and you can get coordinate from each objects.
     *
     */
  	this.srcHref = null;

    /**
     * The ending point of the current movement.</br>
     * href is acting as a key role in {@link CellSpaceMember}, {@link Coordinate}, connects in {@link TransitionMember} and you can get coordinate from each objects.
     */
  	this.dstHref = null;

    /**
    * T comes from parameter equations in space.</br>
    * To find the position where the camera moves, use srcHref and dstHref to get the coordinates of the two points and derive the equation of the line from this.</br>
    * When the coordinate of src is $P_{0}(x_{0}, y_{0}, z_{0})$ and the coordinate of dst is $P_{1}(x_{1}, y_{1}, z_{1})$,
    * the equation of the straight line connecting two points is $$\frac{x-x_{0}}{x_{1}-x_{0}} = \frac{y-y_{0}}{y_{1}-y_{0}} = \frac{z-z_{0}}{z_{1}-z_{0}}$$ </br>
    * And the above equation is expressed by a parameter equation for the parameter $T$, it becomes $x = (x_{1}-x_{0})T + x_{0}$, $y = (y_{1}-y_{0})T + y_{0}$, $z = (z_{1}-z_{0})T + z0$.</br>
    * If $T = 0$, the equation returns the coordinates of src. </br>
    * If $T = 1$, the equation returns the coordinates of src. </br>
    * In the same context, if $T = 0.5$, the equation returns the coordinates of the middle point between src and dst.</br>
    * In this way, we use the value of MoveState to find the coordinates the camera will move.
    */
  	this.T = 0;
  }

  return MoveState;
});
