define(["exports","./Check-24483042","./when-54335d57","./Math-d6182036"],function(e,i,R,V){"use strict";function I(e,t,n){this.x=R.defaultValue(e,0),this.y=R.defaultValue(t,0),this.z=R.defaultValue(n,0)}I.fromSpherical=function(e,t){R.defined(t)||(t=new I);var n=e.clock,a=e.cone,r=R.defaultValue(e.magnitude,1),i=r*Math.sin(a);return t.x=i*Math.cos(n),t.y=i*Math.sin(n),t.z=r*Math.cos(a),t},I.fromElements=function(e,t,n,a){return R.defined(a)?(a.x=e,a.y=t,a.z=n,a):new I(e,t,n)},I.fromCartesian4=I.clone=function(e,t){if(R.defined(e))return R.defined(t)?(t.x=e.x,t.y=e.y,t.z=e.z,t):new I(e.x,e.y,e.z)},I.packedLength=3,I.pack=function(e,t,n){return n=R.defaultValue(n,0),t[n++]=e.x,t[n++]=e.y,t[n]=e.z,t},I.unpack=function(e,t,n){return t=R.defaultValue(t,0),R.defined(n)||(n=new I),n.x=e[t++],n.y=e[t++],n.z=e[t],n},I.packArray=function(e,t){var n=e.length,a=3*n;if(R.defined(t)){if(!Array.isArray(t)&&t.length!==a)throw new i.DeveloperError("If result is a typed array, it must have exactly array.length * 3 elements");t.length!==a&&(t.length=a)}else t=new Array(a);for(var r=0;r<n;++r)I.pack(e[r],t,3*r);return t},I.unpackArray=function(e,t){var n=e.length;R.defined(t)?t.length=n/3:t=new Array(n/3);for(var a=0;a<n;a+=3){var r=a/3;t[r]=I.unpack(e,a,t[r])}return t},I.fromArray=I.unpack,I.maximumComponent=function(e){return Math.max(e.x,e.y,e.z)},I.minimumComponent=function(e){return Math.min(e.x,e.y,e.z)},I.minimumByComponent=function(e,t,n){return n.x=Math.min(e.x,t.x),n.y=Math.min(e.y,t.y),n.z=Math.min(e.z,t.z),n},I.maximumByComponent=function(e,t,n){return n.x=Math.max(e.x,t.x),n.y=Math.max(e.y,t.y),n.z=Math.max(e.z,t.z),n},I.magnitudeSquared=function(e){return e.x*e.x+e.y*e.y+e.z*e.z},I.magnitude=function(e){return Math.sqrt(I.magnitudeSquared(e))};var n=new I;I.distance=function(e,t){return I.subtract(e,t,n),I.magnitude(n)},I.distanceSquared=function(e,t){return I.subtract(e,t,n),I.magnitudeSquared(n)},I.normalize=function(e,t){var n=I.magnitude(e);return t.x=e.x/n,t.y=e.y/n,t.z=e.z/n,t},I.dot=function(e,t){return e.x*t.x+e.y*t.y+e.z*t.z},I.multiplyComponents=function(e,t,n){return n.x=e.x*t.x,n.y=e.y*t.y,n.z=e.z*t.z,n},I.divideComponents=function(e,t,n){return n.x=e.x/t.x,n.y=e.y/t.y,n.z=e.z/t.z,n},I.add=function(e,t,n){return n.x=e.x+t.x,n.y=e.y+t.y,n.z=e.z+t.z,n},I.subtract=function(e,t,n){return n.x=e.x-t.x,n.y=e.y-t.y,n.z=e.z-t.z,n},I.multiplyByScalar=function(e,t,n){return n.x=e.x*t,n.y=e.y*t,n.z=e.z*t,n},I.divideByScalar=function(e,t,n){return n.x=e.x/t,n.y=e.y/t,n.z=e.z/t,n},I.negate=function(e,t){return t.x=-e.x,t.y=-e.y,t.z=-e.z,t},I.abs=function(e,t){return t.x=Math.abs(e.x),t.y=Math.abs(e.y),t.z=Math.abs(e.z),t};var r=new I;I.lerp=function(e,t,n,a){return I.multiplyByScalar(t,n,r),a=I.multiplyByScalar(e,1-n,a),I.add(r,a,a)};var u=new I,o=new I;I.angleBetween=function(e,t){I.normalize(e,u),I.normalize(t,o);var n=I.dot(u,o),a=I.magnitude(I.cross(u,o,u));return Math.atan2(a,n)};var a=new I;I.mostOrthogonalAxis=function(e,t){var n=I.normalize(e,a);return I.abs(n,n),t=n.x<=n.y?n.x<=n.z?I.clone(I.UNIT_X,t):I.clone(I.UNIT_Z,t):n.y<=n.z?I.clone(I.UNIT_Y,t):I.clone(I.UNIT_Z,t)},I.projectVector=function(e,t,n){var a=I.dot(e,t)/I.dot(t,t);return I.multiplyByScalar(t,a,n)},I.equals=function(e,t){return e===t||R.defined(e)&&R.defined(t)&&e.x===t.x&&e.y===t.y&&e.z===t.z},I.equalsArray=function(e,t,n){return e.x===t[n]&&e.y===t[n+1]&&e.z===t[n+2]},I.equalsEpsilon=function(e,t,n,a){return e===t||R.defined(e)&&R.defined(t)&&V.CesiumMath.equalsEpsilon(e.x,t.x,n,a)&&V.CesiumMath.equalsEpsilon(e.y,t.y,n,a)&&V.CesiumMath.equalsEpsilon(e.z,t.z,n,a)},I.cross=function(e,t,n){var a=e.x,r=e.y,i=e.z,u=t.x,o=t.y,d=t.z,s=r*d-i*o,h=i*u-a*d,l=a*o-r*u;return n.x=s,n.y=h,n.z=l,n},I.midpoint=function(e,t,n){return n.x=.5*(e.x+t.x),n.y=.5*(e.y+t.y),n.z=.5*(e.z+t.z),n},I.fromDegrees=function(e,t,n,a,r){return e=V.CesiumMath.toRadians(e),t=V.CesiumMath.toRadians(t),I.fromRadians(e,t,n,a,r)};var d=new I,s=new I,h=new I(40680631590769,40680631590769,40408299984661.445);I.fromRadians=function(e,t,n,a,r){n=R.defaultValue(n,0);var i=R.defined(a)?a.radiiSquared:h,u=Math.cos(t);d.x=u*Math.cos(e),d.y=u*Math.sin(e),d.z=Math.sin(t),d=I.normalize(d,d),I.multiplyComponents(i,d,s);var o=Math.sqrt(I.dot(d,s));return s=I.divideByScalar(s,o,s),d=I.multiplyByScalar(d,n,d),R.defined(r)||(r=new I),I.add(s,d,r)},I.fromDegreesArray=function(e,t,n){var a=e.length;R.defined(n)?n.length=a/2:n=new Array(a/2);for(var r=0;r<a;r+=2){var i=e[r],u=e[r+1],o=r/2;n[o]=I.fromDegrees(i,u,0,t,n[o])}return n},I.fromRadiansArray=function(e,t,n){var a=e.length;R.defined(n)?n.length=a/2:n=new Array(a/2);for(var r=0;r<a;r+=2){var i=e[r],u=e[r+1],o=r/2;n[o]=I.fromRadians(i,u,0,t,n[o])}return n},I.fromDegreesArrayHeights=function(e,t,n){var a=e.length;R.defined(n)?n.length=a/3:n=new Array(a/3);for(var r=0;r<a;r+=3){var i=e[r],u=e[r+1],o=e[r+2],d=r/3;n[d]=I.fromDegrees(i,u,o,t,n[d])}return n},I.fromRadiansArrayHeights=function(e,t,n){var a=e.length;R.defined(n)?n.length=a/3:n=new Array(a/3);for(var r=0;r<a;r+=3){var i=e[r],u=e[r+1],o=e[r+2],d=r/3;n[d]=I.fromRadians(i,u,o,t,n[d])}return n},I.ZERO=Object.freeze(new I(0,0,0)),I.UNIT_X=Object.freeze(new I(1,0,0)),I.UNIT_Y=Object.freeze(new I(0,1,0)),I.UNIT_Z=Object.freeze(new I(0,0,1)),I.prototype.clone=function(e){return I.clone(this,e)},I.prototype.equals=function(e){return I.equals(this,e)},I.prototype.equalsEpsilon=function(e,t,n){return I.equalsEpsilon(this,e,t,n)},I.prototype.toString=function(){return"("+this.x+", "+this.y+", "+this.z+")"};var b=new I,E=new I;function l(e,t,n,a,r){var i=e.x,u=e.y,o=e.z,d=t.x,s=t.y,h=t.z,l=i*i*d*d,f=u*u*s*s,c=o*o*h*h,m=l+f+c,y=Math.sqrt(1/m),p=I.multiplyByScalar(e,y,b);if(m<a)return isFinite(y)?I.clone(p,r):void 0;var g=n.x,M=n.y,x=n.z,w=E;w.x=p.x*g*2,w.y=p.y*M*2,w.z=p.z*x*2;var v,_,C,z,S,q,O,T=(1-y)*I.magnitude(e)/(.5*I.magnitude(w)),A=0;do{A=(v=l*(S=(_=1/(1+(T-=A)*g))*_)+f*(q=(C=1/(1+T*M))*C)+c*(O=(z=1/(1+T*x))*z)-1)/(-2*(l*(S*_)*g+f*(q*C)*M+c*(O*z)*x))}while(Math.abs(v)>V.CesiumMath.EPSILON12);return R.defined(r)?(r.x=i*_,r.y=u*C,r.z=o*z,r):new I(i*_,u*C,o*z)}function f(e,t,n){this.longitude=R.defaultValue(e,0),this.latitude=R.defaultValue(t,0),this.height=R.defaultValue(n,0)}f.fromRadians=function(e,t,n,a){return n=R.defaultValue(n,0),R.defined(a)?(a.longitude=e,a.latitude=t,a.height=n,a):new f(e,t,n)},f.fromDegrees=function(e,t,n,a){return e=V.CesiumMath.toRadians(e),t=V.CesiumMath.toRadians(t),f.fromRadians(e,t,n,a)};var c=new I,m=new I,y=new I,p=new I(1/6378137,1/6378137,1/6356752.314245179),g=new I(1/40680631590769,1/40680631590769,1/40408299984661.445),M=V.CesiumMath.EPSILON1;function x(e,t,n,a){t=R.defaultValue(t,0),n=R.defaultValue(n,0),a=R.defaultValue(a,0),e._radii=new I(t,n,a),e._radiiSquared=new I(t*t,n*n,a*a),e._radiiToTheFourth=new I(t*t*t*t,n*n*n*n,a*a*a*a),e._oneOverRadii=new I(0===t?0:1/t,0===n?0:1/n,0===a?0:1/a),e._oneOverRadiiSquared=new I(0===t?0:1/(t*t),0===n?0:1/(n*n),0===a?0:1/(a*a)),e._minimumRadius=Math.min(t,n,a),e._maximumRadius=Math.max(t,n,a),e._centerToleranceSquared=V.CesiumMath.EPSILON1,0!==e._radiiSquared.z&&(e._squaredXOverSquaredZ=e._radiiSquared.x/e._radiiSquared.z)}function w(e,t,n){this._radii=void 0,this._radiiSquared=void 0,this._radiiToTheFourth=void 0,this._oneOverRadii=void 0,this._oneOverRadiiSquared=void 0,this._minimumRadius=void 0,this._maximumRadius=void 0,this._centerToleranceSquared=void 0,this._squaredXOverSquaredZ=void 0,x(this,e,t,n)}f.fromCartesian=function(e,t,n){var a=R.defined(t)?t.oneOverRadii:p,r=R.defined(t)?t.oneOverRadiiSquared:g,i=l(e,a,r,R.defined(t)?t._centerToleranceSquared:M,m);if(R.defined(i)){var u=I.multiplyComponents(i,r,c),u=I.normalize(u,u),o=I.subtract(e,i,y),d=Math.atan2(u.y,u.x),s=Math.asin(u.z),h=V.CesiumMath.sign(I.dot(o,e))*I.magnitude(o);return R.defined(n)?(n.longitude=d,n.latitude=s,n.height=h,n):new f(d,s,h)}},f.toCartesian=function(e,t,n){return I.fromRadians(e.longitude,e.latitude,e.height,t,n)},f.clone=function(e,t){if(R.defined(e))return R.defined(t)?(t.longitude=e.longitude,t.latitude=e.latitude,t.height=e.height,t):new f(e.longitude,e.latitude,e.height)},f.equals=function(e,t){return e===t||R.defined(e)&&R.defined(t)&&e.longitude===t.longitude&&e.latitude===t.latitude&&e.height===t.height},f.equalsEpsilon=function(e,t,n){return n=R.defaultValue(n,0),e===t||R.defined(e)&&R.defined(t)&&Math.abs(e.longitude-t.longitude)<=n&&Math.abs(e.latitude-t.latitude)<=n&&Math.abs(e.height-t.height)<=n},f.ZERO=Object.freeze(new f(0,0,0)),f.prototype.clone=function(e){return f.clone(this,e)},f.prototype.equals=function(e){return f.equals(this,e)},f.prototype.equalsEpsilon=function(e,t){return f.equalsEpsilon(this,e,t)},f.prototype.toString=function(){return"("+this.longitude+", "+this.latitude+", "+this.height+")"},Object.defineProperties(w.prototype,{radii:{get:function(){return this._radii}},radiiSquared:{get:function(){return this._radiiSquared}},radiiToTheFourth:{get:function(){return this._radiiToTheFourth}},oneOverRadii:{get:function(){return this._oneOverRadii}},oneOverRadiiSquared:{get:function(){return this._oneOverRadiiSquared}},minimumRadius:{get:function(){return this._minimumRadius}},maximumRadius:{get:function(){return this._maximumRadius}}}),w.clone=function(e,t){if(R.defined(e)){var n=e._radii;return R.defined(t)?(I.clone(n,t._radii),I.clone(e._radiiSquared,t._radiiSquared),I.clone(e._radiiToTheFourth,t._radiiToTheFourth),I.clone(e._oneOverRadii,t._oneOverRadii),I.clone(e._oneOverRadiiSquared,t._oneOverRadiiSquared),t._minimumRadius=e._minimumRadius,t._maximumRadius=e._maximumRadius,t._centerToleranceSquared=e._centerToleranceSquared,t):new w(n.x,n.y,n.z)}},w.fromCartesian3=function(e,t){return R.defined(t)||(t=new w),R.defined(e)&&x(t,e.x,e.y,e.z),t},w.WGS84=Object.freeze(new w(6378137,6378137,6356752.314245179)),w.UNIT_SPHERE=Object.freeze(new w(1,1,1)),w.MOON=Object.freeze(new w(V.CesiumMath.LUNAR_RADIUS,V.CesiumMath.LUNAR_RADIUS,V.CesiumMath.LUNAR_RADIUS)),w.prototype.clone=function(e){return w.clone(this,e)},w.packedLength=I.packedLength,w.pack=function(e,t,n){return n=R.defaultValue(n,0),I.pack(e._radii,t,n),t},w.unpack=function(e,t,n){t=R.defaultValue(t,0);var a=I.unpack(e,t);return w.fromCartesian3(a,n)},w.prototype.geocentricSurfaceNormal=I.normalize,w.prototype.geodeticSurfaceNormalCartographic=function(e,t){var n=e.longitude,a=e.latitude,r=Math.cos(a),i=r*Math.cos(n),u=r*Math.sin(n),o=Math.sin(a);return R.defined(t)||(t=new I),t.x=i,t.y=u,t.z=o,I.normalize(t,t)},w.prototype.geodeticSurfaceNormal=function(e,t){if(!I.equalsEpsilon(e,I.ZERO,V.CesiumMath.EPSILON14))return R.defined(t)||(t=new I),t=I.multiplyComponents(e,this._oneOverRadiiSquared,t),I.normalize(t,t)};var v=new I,_=new I;w.prototype.cartographicToCartesian=function(e,t){var n=v,a=_;this.geodeticSurfaceNormalCartographic(e,n),I.multiplyComponents(this._radiiSquared,n,a);var r=Math.sqrt(I.dot(n,a));return I.divideByScalar(a,r,a),I.multiplyByScalar(n,e.height,n),R.defined(t)||(t=new I),I.add(a,n,t)},w.prototype.cartographicArrayToCartesianArray=function(e,t){var n=e.length;R.defined(t)?t.length=n:t=new Array(n);for(var a=0;a<n;a++)t[a]=this.cartographicToCartesian(e[a],t[a]);return t};var C=new I,z=new I,S=new I;w.prototype.cartesianToCartographic=function(e,t){var n=this.scaleToGeodeticSurface(e,z);if(R.defined(n)){var a=this.geodeticSurfaceNormal(n,C),r=I.subtract(e,n,S),i=Math.atan2(a.y,a.x),u=Math.asin(a.z),o=V.CesiumMath.sign(I.dot(r,e))*I.magnitude(r);return R.defined(t)?(t.longitude=i,t.latitude=u,t.height=o,t):new f(i,u,o)}},w.prototype.cartesianArrayToCartographicArray=function(e,t){var n=e.length;R.defined(t)?t.length=n:t=new Array(n);for(var a=0;a<n;++a)t[a]=this.cartesianToCartographic(e[a],t[a]);return t},w.prototype.scaleToGeodeticSurface=function(e,t){return l(e,this._oneOverRadii,this._oneOverRadiiSquared,this._centerToleranceSquared,t)},w.prototype.scaleToGeocentricSurface=function(e,t){R.defined(t)||(t=new I);var n=e.x,a=e.y,r=e.z,i=this._oneOverRadiiSquared,u=1/Math.sqrt(n*n*i.x+a*a*i.y+r*r*i.z);return I.multiplyByScalar(e,u,t)},w.prototype.transformPositionToScaledSpace=function(e,t){return R.defined(t)||(t=new I),I.multiplyComponents(e,this._oneOverRadii,t)},w.prototype.transformPositionFromScaledSpace=function(e,t){return R.defined(t)||(t=new I),I.multiplyComponents(e,this._radii,t)},w.prototype.equals=function(e){return this===e||R.defined(e)&&I.equals(this._radii,e._radii)},w.prototype.toString=function(){return this._radii.toString()},w.prototype.getSurfaceNormalIntersectionWithZAxis=function(e,t,n){t=R.defaultValue(t,0);var a=this._squaredXOverSquaredZ;if(R.defined(n)||(n=new I),n.x=0,n.y=0,n.z=e.z*(1-a),!(Math.abs(n.z)>=this._radii.z-t))return n};var q=[.14887433898163,.43339539412925,.67940956829902,.86506336668898,.97390652851717,0],O=[.29552422471475,.26926671930999,.21908636251598,.14945134915058,.066671344308684,0];function T(e,t,n){for(var a=.5*(t+e),r=.5*(t-e),i=0,u=0;u<5;u++){var o=r*q[u];i+=O[u]*(n(a+o)+n(a-o))}return i*=r}function A(e,t,n,a){this.west=R.defaultValue(e,0),this.south=R.defaultValue(t,0),this.east=R.defaultValue(n,0),this.north=R.defaultValue(a,0)}w.prototype.surfaceArea=function(e){for(var t=e.west,n=e.east,a=e.south,r=e.north;n<t;)n+=V.CesiumMath.TWO_PI;var i=this._radiiSquared,u=i.x,o=i.y,d=i.z,s=u*o;return T(a,r,function(e){var a=Math.cos(e),r=Math.sin(e);return Math.cos(e)*T(t,n,function(e){var t=Math.cos(e),n=Math.sin(e);return Math.sqrt(s*r*r+d*(o*t*t+u*n*n)*a*a)})})},Object.defineProperties(A.prototype,{width:{get:function(){return A.computeWidth(this)}},height:{get:function(){return A.computeHeight(this)}}}),A.packedLength=4,A.pack=function(e,t,n){return n=R.defaultValue(n,0),t[n++]=e.west,t[n++]=e.south,t[n++]=e.east,t[n]=e.north,t},A.unpack=function(e,t,n){return t=R.defaultValue(t,0),R.defined(n)||(n=new A),n.west=e[t++],n.south=e[t++],n.east=e[t++],n.north=e[t],n},A.computeWidth=function(e){var t=e.east,n=e.west;return t<n&&(t+=V.CesiumMath.TWO_PI),t-n},A.computeHeight=function(e){return e.north-e.south},A.fromDegrees=function(e,t,n,a,r){return e=V.CesiumMath.toRadians(R.defaultValue(e,0)),t=V.CesiumMath.toRadians(R.defaultValue(t,0)),n=V.CesiumMath.toRadians(R.defaultValue(n,0)),a=V.CesiumMath.toRadians(R.defaultValue(a,0)),R.defined(r)?(r.west=e,r.south=t,r.east=n,r.north=a,r):new A(e,t,n,a)},A.fromRadians=function(e,t,n,a,r){return R.defined(r)?(r.west=R.defaultValue(e,0),r.south=R.defaultValue(t,0),r.east=R.defaultValue(n,0),r.north=R.defaultValue(a,0),r):new A(e,t,n,a)},A.fromCartographicArray=function(e,t){for(var n=Number.MAX_VALUE,a=-Number.MAX_VALUE,r=Number.MAX_VALUE,i=-Number.MAX_VALUE,u=Number.MAX_VALUE,o=-Number.MAX_VALUE,d=0,s=e.length;d<s;d++)var h=e[d],n=Math.min(n,h.longitude),a=Math.max(a,h.longitude),u=Math.min(u,h.latitude),o=Math.max(o,h.latitude),l=0<=h.longitude?h.longitude:h.longitude+V.CesiumMath.TWO_PI,r=Math.min(r,l),i=Math.max(i,l);return i-r<a-n&&(n=r,(a=i)>V.CesiumMath.PI&&(a-=V.CesiumMath.TWO_PI),n>V.CesiumMath.PI&&(n-=V.CesiumMath.TWO_PI)),R.defined(t)?(t.west=n,t.south=u,t.east=a,t.north=o,t):new A(n,u,a,o)},A.fromCartesianArray=function(e,t,n){t=R.defaultValue(t,w.WGS84);for(var a=Number.MAX_VALUE,r=-Number.MAX_VALUE,i=Number.MAX_VALUE,u=-Number.MAX_VALUE,o=Number.MAX_VALUE,d=-Number.MAX_VALUE,s=0,h=e.length;s<h;s++)var l=t.cartesianToCartographic(e[s]),a=Math.min(a,l.longitude),r=Math.max(r,l.longitude),o=Math.min(o,l.latitude),d=Math.max(d,l.latitude),f=0<=l.longitude?l.longitude:l.longitude+V.CesiumMath.TWO_PI,i=Math.min(i,f),u=Math.max(u,f);return u-i<r-a&&(a=i,(r=u)>V.CesiumMath.PI&&(r-=V.CesiumMath.TWO_PI),a>V.CesiumMath.PI&&(a-=V.CesiumMath.TWO_PI)),R.defined(n)?(n.west=a,n.south=o,n.east=r,n.north=d,n):new A(a,o,r,d)},A.clone=function(e,t){if(R.defined(e))return R.defined(t)?(t.west=e.west,t.south=e.south,t.east=e.east,t.north=e.north,t):new A(e.west,e.south,e.east,e.north)},A.equalsEpsilon=function(e,t,n){return n=R.defaultValue(n,0),e===t||R.defined(e)&&R.defined(t)&&Math.abs(e.west-t.west)<=n&&Math.abs(e.south-t.south)<=n&&Math.abs(e.east-t.east)<=n&&Math.abs(e.north-t.north)<=n},A.prototype.clone=function(e){return A.clone(this,e)},A.prototype.equals=function(e){return A.equals(this,e)},A.equals=function(e,t){return e===t||R.defined(e)&&R.defined(t)&&e.west===t.west&&e.south===t.south&&e.east===t.east&&e.north===t.north},A.prototype.equalsEpsilon=function(e,t){return A.equalsEpsilon(this,e,t)},A.validate=function(e){},A.southwest=function(e,t){return R.defined(t)?(t.longitude=e.west,t.latitude=e.south,t.height=0,t):new f(e.west,e.south)},A.northwest=function(e,t){return R.defined(t)?(t.longitude=e.west,t.latitude=e.north,t.height=0,t):new f(e.west,e.north)},A.northeast=function(e,t){return R.defined(t)?(t.longitude=e.east,t.latitude=e.north,t.height=0,t):new f(e.east,e.north)},A.southeast=function(e,t){return R.defined(t)?(t.longitude=e.east,t.latitude=e.south,t.height=0,t):new f(e.east,e.south)},A.center=function(e,t){var n=e.east,a=e.west;n<a&&(n+=V.CesiumMath.TWO_PI);var r=V.CesiumMath.negativePiToPi(.5*(a+n)),i=.5*(e.south+e.north);return R.defined(t)?(t.longitude=r,t.latitude=i,t.height=0,t):new f(r,i)},A.intersection=function(e,t,n){var a=e.east,r=e.west,i=t.east,u=t.west;a<r&&0<i?a+=V.CesiumMath.TWO_PI:i<u&&0<a&&(i+=V.CesiumMath.TWO_PI),a<r&&u<0?u+=V.CesiumMath.TWO_PI:i<u&&r<0&&(r+=V.CesiumMath.TWO_PI);var o=V.CesiumMath.negativePiToPi(Math.max(r,u)),d=V.CesiumMath.negativePiToPi(Math.min(a,i));if(!((e.west<e.east||t.west<t.east)&&d<=o)){var s=Math.max(e.south,t.south),h=Math.min(e.north,t.north);if(!(h<=s))return R.defined(n)?(n.west=o,n.south=s,n.east=d,n.north=h,n):new A(o,s,d,h)}},A.simpleIntersection=function(e,t,n){var a=Math.max(e.west,t.west),r=Math.max(e.south,t.south),i=Math.min(e.east,t.east),u=Math.min(e.north,t.north);if(!(u<=r||i<=a))return R.defined(n)?(n.west=a,n.south=r,n.east=i,n.north=u,n):new A(a,r,i,u)},A.union=function(e,t,n){R.defined(n)||(n=new A);var a=e.east,r=e.west,i=t.east,u=t.west;a<r&&0<i?a+=V.CesiumMath.TWO_PI:i<u&&0<a&&(i+=V.CesiumMath.TWO_PI),a<r&&u<0?u+=V.CesiumMath.TWO_PI:i<u&&r<0&&(r+=V.CesiumMath.TWO_PI);var o=V.CesiumMath.convertLongitudeRange(Math.min(r,u)),d=V.CesiumMath.convertLongitudeRange(Math.max(a,i));return n.west=o,n.south=Math.min(e.south,t.south),n.east=d,n.north=Math.max(e.north,t.north),n},A.expand=function(e,t,n){return R.defined(n)||(n=new A),n.west=Math.min(e.west,t.longitude),n.south=Math.min(e.south,t.latitude),n.east=Math.max(e.east,t.longitude),n.north=Math.max(e.north,t.latitude),n},A.contains=function(e,t){var n=t.longitude,a=t.latitude,r=e.west,i=e.east;return i<r&&(i+=V.CesiumMath.TWO_PI,n<0&&(n+=V.CesiumMath.TWO_PI)),(r<n||V.CesiumMath.equalsEpsilon(n,r,V.CesiumMath.EPSILON14))&&(n<i||V.CesiumMath.equalsEpsilon(n,i,V.CesiumMath.EPSILON14))&&a>=e.south&&a<=e.north};var P=new f;function N(e,t){this.x=R.defaultValue(e,0),this.y=R.defaultValue(t,0)}A.subsample=function(e,t,n,a){t=R.defaultValue(t,w.WGS84),n=R.defaultValue(n,0),R.defined(a)||(a=[]);var r=0,i=e.north,u=e.south,o=e.east,d=e.west,s=P;s.height=n,s.longitude=d,s.latitude=i,a[r]=t.cartographicToCartesian(s,a[r]),r++,s.longitude=o,a[r]=t.cartographicToCartesian(s,a[r]),r++,s.latitude=u,a[r]=t.cartographicToCartesian(s,a[r]),r++,s.longitude=d,a[r]=t.cartographicToCartesian(s,a[r]),r++,s.latitude=i<0?i:0<u?u:0;for(var h=1;h<8;++h)s.longitude=-Math.PI+h*V.CesiumMath.PI_OVER_TWO,A.contains(e,s)&&(a[r]=t.cartographicToCartesian(s,a[r]),r++);return 0===s.latitude&&(s.longitude=d,a[r]=t.cartographicToCartesian(s,a[r]),r++,s.longitude=o,a[r]=t.cartographicToCartesian(s,a[r]),r++),a.length=r,a},A.MAX_VALUE=Object.freeze(new A(-Math.PI,-V.CesiumMath.PI_OVER_TWO,Math.PI,V.CesiumMath.PI_OVER_TWO)),N.fromElements=function(e,t,n){return R.defined(n)?(n.x=e,n.y=t,n):new N(e,t)},N.fromCartesian3=N.clone=function(e,t){if(R.defined(e))return R.defined(t)?(t.x=e.x,t.y=e.y,t):new N(e.x,e.y)},N.fromCartesian4=N.clone,N.packedLength=2,N.pack=function(e,t,n){return n=R.defaultValue(n,0),t[n++]=e.x,t[n]=e.y,t},N.unpack=function(e,t,n){return t=R.defaultValue(t,0),R.defined(n)||(n=new N),n.x=e[t++],n.y=e[t],n},N.packArray=function(e,t){var n=e.length,a=2*n;if(R.defined(t)){if(!Array.isArray(t)&&t.length!==a)throw new i.DeveloperError("If result is a typed array, it must have exactly array.length * 2 elements");t.length!==a&&(t.length=a)}else t=new Array(a);for(var r=0;r<n;++r)N.pack(e[r],t,2*r);return t},N.unpackArray=function(e,t){var n=e.length;R.defined(t)?t.length=n/2:t=new Array(n/2);for(var a=0;a<n;a+=2){var r=a/2;t[r]=N.unpack(e,a,t[r])}return t},N.fromArray=N.unpack,N.maximumComponent=function(e){return Math.max(e.x,e.y)},N.minimumComponent=function(e){return Math.min(e.x,e.y)},N.minimumByComponent=function(e,t,n){return n.x=Math.min(e.x,t.x),n.y=Math.min(e.y,t.y),n},N.maximumByComponent=function(e,t,n){return n.x=Math.max(e.x,t.x),n.y=Math.max(e.y,t.y),n},N.magnitudeSquared=function(e){return e.x*e.x+e.y*e.y},N.magnitude=function(e){return Math.sqrt(N.magnitudeSquared(e))};var U=new N;N.distance=function(e,t){return N.subtract(e,t,U),N.magnitude(U)},N.distanceSquared=function(e,t){return N.subtract(e,t,U),N.magnitudeSquared(U)},N.normalize=function(e,t){var n=N.magnitude(e);return t.x=e.x/n,t.y=e.y/n,t},N.dot=function(e,t){return e.x*t.x+e.y*t.y},N.cross=function(e,t){return e.x*t.y-e.y*t.x},N.multiplyComponents=function(e,t,n){return n.x=e.x*t.x,n.y=e.y*t.y,n},N.divideComponents=function(e,t,n){return n.x=e.x/t.x,n.y=e.y/t.y,n},N.add=function(e,t,n){return n.x=e.x+t.x,n.y=e.y+t.y,n},N.subtract=function(e,t,n){return n.x=e.x-t.x,n.y=e.y-t.y,n},N.multiplyByScalar=function(e,t,n){return n.x=e.x*t,n.y=e.y*t,n},N.divideByScalar=function(e,t,n){return n.x=e.x/t,n.y=e.y/t,n},N.negate=function(e,t){return t.x=-e.x,t.y=-e.y,t},N.abs=function(e,t){return t.x=Math.abs(e.x),t.y=Math.abs(e.y),t};var L=new N;N.lerp=function(e,t,n,a){return N.multiplyByScalar(t,n,L),a=N.multiplyByScalar(e,1-n,a),N.add(L,a,a)};var W=new N,k=new N;N.angleBetween=function(e,t){return N.normalize(e,W),N.normalize(t,k),V.CesiumMath.acosClamped(N.dot(W,k))};var B=new N;N.mostOrthogonalAxis=function(e,t){var n=N.normalize(e,B);return N.abs(n,n),t=n.x<=n.y?N.clone(N.UNIT_X,t):N.clone(N.UNIT_Y,t)},N.equals=function(e,t){return e===t||R.defined(e)&&R.defined(t)&&e.x===t.x&&e.y===t.y},N.equalsArray=function(e,t,n){return e.x===t[n]&&e.y===t[n+1]},N.equalsEpsilon=function(e,t,n,a){return e===t||R.defined(e)&&R.defined(t)&&V.CesiumMath.equalsEpsilon(e.x,t.x,n,a)&&V.CesiumMath.equalsEpsilon(e.y,t.y,n,a)},N.ZERO=Object.freeze(new N(0,0)),N.UNIT_X=Object.freeze(new N(1,0)),N.UNIT_Y=Object.freeze(new N(0,1)),N.prototype.clone=function(e){return N.clone(this,e)},N.prototype.equals=function(e){return N.equals(this,e)},N.prototype.equalsEpsilon=function(e,t,n){return N.equalsEpsilon(this,e,t,n)},N.prototype.toString=function(){return"("+this.x+", "+this.y+")"},e.Cartesian2=N,e.Cartesian3=I,e.Cartographic=f,e.Ellipsoid=w,e.Rectangle=A});