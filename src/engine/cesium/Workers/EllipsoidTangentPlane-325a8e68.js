define(["exports","./Cartesian2-8646c5a1","./Check-24483042","./when-54335d57","./Transforms-79117a7b","./IntersectionTests-5394f658","./Plane-13ae4b1b"],function(e,p,n,x,s,o,a){"use strict";function y(e,n,t){this.minimum=p.Cartesian3.clone(x.defaultValue(e,p.Cartesian3.ZERO)),this.maximum=p.Cartesian3.clone(x.defaultValue(n,p.Cartesian3.ZERO)),t=x.defined(t)?p.Cartesian3.clone(t):p.Cartesian3.midpoint(this.minimum,this.maximum,new p.Cartesian3),this.center=t}y.fromPoints=function(e,n){if(x.defined(n)||(n=new y),!x.defined(e)||0===e.length)return n.minimum=p.Cartesian3.clone(p.Cartesian3.ZERO,n.minimum),n.maximum=p.Cartesian3.clone(p.Cartesian3.ZERO,n.maximum),n.center=p.Cartesian3.clone(p.Cartesian3.ZERO,n.center),n;for(var t=e[0].x,i=e[0].y,a=e[0].z,r=e[0].x,s=e[0].y,o=e[0].z,m=e.length,l=1;l<m;l++)var c=e[l],u=c.x,d=c.y,f=c.z,t=Math.min(u,t),r=Math.max(u,r),i=Math.min(d,i),s=Math.max(d,s),a=Math.min(f,a),o=Math.max(f,o);var h=n.minimum;h.x=t,h.y=i,h.z=a;var C=n.maximum;return C.x=r,C.y=s,C.z=o,n.center=p.Cartesian3.midpoint(h,C,n.center),n},y.clone=function(e,n){if(x.defined(e))return x.defined(n)?(n.minimum=p.Cartesian3.clone(e.minimum,n.minimum),n.maximum=p.Cartesian3.clone(e.maximum,n.maximum),n.center=p.Cartesian3.clone(e.center,n.center),n):new y(e.minimum,e.maximum,e.center)},y.equals=function(e,n){return e===n||x.defined(e)&&x.defined(n)&&p.Cartesian3.equals(e.center,n.center)&&p.Cartesian3.equals(e.minimum,n.minimum)&&p.Cartesian3.equals(e.maximum,n.maximum)};var m=new p.Cartesian3;y.intersectPlane=function(e,n){m=p.Cartesian3.subtract(e.maximum,e.minimum,m);var t=p.Cartesian3.multiplyByScalar(m,.5,m),i=n.normal,a=t.x*Math.abs(i.x)+t.y*Math.abs(i.y)+t.z*Math.abs(i.z),r=p.Cartesian3.dot(e.center,i)+n.distance;return 0<r-a?s.Intersect.INSIDE:r+a<0?s.Intersect.OUTSIDE:s.Intersect.INTERSECTING},y.prototype.clone=function(e){return y.clone(this,e)},y.prototype.intersectPlane=function(e){return y.intersectPlane(this,e)},y.prototype.equals=function(e){return y.equals(this,e)};var r=new s.Cartesian4;function t(e,n){e=(n=x.defaultValue(n,p.Ellipsoid.WGS84)).scaleToGeodeticSurface(e);var t=s.Transforms.eastNorthUpToFixedFrame(e,n);this._ellipsoid=n,this._origin=e,this._xAxis=p.Cartesian3.fromCartesian4(s.Matrix4.getColumn(t,0,r)),this._yAxis=p.Cartesian3.fromCartesian4(s.Matrix4.getColumn(t,1,r));var i=p.Cartesian3.fromCartesian4(s.Matrix4.getColumn(t,2,r));this._plane=a.Plane.fromPointNormal(e,i)}Object.defineProperties(t.prototype,{ellipsoid:{get:function(){return this._ellipsoid}},origin:{get:function(){return this._origin}},plane:{get:function(){return this._plane}},xAxis:{get:function(){return this._xAxis}},yAxis:{get:function(){return this._yAxis}},zAxis:{get:function(){return this._plane.normal}}});var i=new y;t.fromPoints=function(e,n){return new t(y.fromPoints(e,i).center,n)};var l=new o.Ray,c=new p.Cartesian3;t.prototype.projectPointOntoPlane=function(e,n){var t=l;t.origin=e,p.Cartesian3.normalize(e,t.direction);var i=o.IntersectionTests.rayPlane(t,this._plane,c);if(x.defined(i)||(p.Cartesian3.negate(t.direction,t.direction),i=o.IntersectionTests.rayPlane(t,this._plane,c)),x.defined(i)){var a=p.Cartesian3.subtract(i,this._origin,i),r=p.Cartesian3.dot(this._xAxis,a),s=p.Cartesian3.dot(this._yAxis,a);return x.defined(n)?(n.x=r,n.y=s,n):new p.Cartesian2(r,s)}},t.prototype.projectPointsOntoPlane=function(e,n){x.defined(n)||(n=[]);for(var t=0,i=e.length,a=0;a<i;a++){var r=this.projectPointOntoPlane(e[a],n[t]);x.defined(r)&&(n[t]=r,t++)}return n.length=t,n},t.prototype.projectPointToNearestOnPlane=function(e,n){x.defined(n)||(n=new p.Cartesian2);var t=l;t.origin=e,p.Cartesian3.clone(this._plane.normal,t.direction);var i=o.IntersectionTests.rayPlane(t,this._plane,c);x.defined(i)||(p.Cartesian3.negate(t.direction,t.direction),i=o.IntersectionTests.rayPlane(t,this._plane,c));var a=p.Cartesian3.subtract(i,this._origin,i),r=p.Cartesian3.dot(this._xAxis,a),s=p.Cartesian3.dot(this._yAxis,a);return n.x=r,n.y=s,n},t.prototype.projectPointsToNearestOnPlane=function(e,n){x.defined(n)||(n=[]);var t=e.length;n.length=t;for(var i=0;i<t;i++)n[i]=this.projectPointToNearestOnPlane(e[i],n[i]);return n};var u=new p.Cartesian3;t.prototype.projectPointOntoEllipsoid=function(e,n){x.defined(n)||(n=new p.Cartesian3);var t=this._ellipsoid,i=this._origin,a=this._xAxis,r=this._yAxis,s=u;return p.Cartesian3.multiplyByScalar(a,e.x,s),n=p.Cartesian3.add(i,s,n),p.Cartesian3.multiplyByScalar(r,e.y,s),p.Cartesian3.add(n,s,n),t.scaleToGeocentricSurface(n,n),n},t.prototype.projectPointsOntoEllipsoid=function(e,n){var t=e.length;x.defined(n)?n.length=t:n=new Array(t);for(var i=0;i<t;++i)n[i]=this.projectPointOntoEllipsoid(e[i],n[i]);return n},e.AxisAlignedBoundingBox=y,e.EllipsoidTangentPlane=t});