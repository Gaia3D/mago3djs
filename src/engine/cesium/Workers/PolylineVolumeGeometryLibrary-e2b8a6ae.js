define(["exports","./Matrix2-b06ef836","./EllipsoidTangentPlane-16e686c1","./ComponentDatatype-dc3af6a4","./PolylinePipeline-24e9fd21","./Transforms-e254a706","./when-229515d6","./RuntimeError-ffe03243"],(function(e,a,r,n,t,i,o,s){"use strict";var l=Object.freeze({ROUNDED:0,MITERED:1,BEVELED:2}),C={};function c(e,a){if(!o.defined(e))throw new s.DeveloperError("identifier is required.");o.defined(C[e])||(C[e]=!0,console.warn(o.defaultValue(a,e)))}c.geometryOutlines="Entity geometry outlines are unsupported on terrain. Outlines will be disabled. To enable outlines, disable geometry terrain clamping by explicitly setting height to 0.",c.geometryZIndex="Entity geometry with zIndex are unsupported when height or extrudedHeight are defined.  zIndex will be ignored",c.geometryHeightReference="Entity corridor, ellipse, polygon or rectangle with heightReference must also have a defined height.  heightReference will be ignored",c.geometryExtrudedHeightReference="Entity corridor, ellipse, polygon or rectangle with extrudedHeightReference must also have a defined extrudedHeight.  extrudedHeightReference will be ignored";var u=[new a.Cartesian3,new a.Cartesian3],d=new a.Cartesian3,g=new a.Cartesian3,y=new a.Cartesian3,f=new a.Cartesian3,h=new a.Cartesian3,m=new a.Cartesian3,p=new a.Cartesian3,w=new a.Cartesian3,v=new a.Cartesian3,x=new a.Cartesian3,E=new a.Cartesian3,P={},M=new a.Cartographic;function T(e,r,n,t){var i,o=e[0],s=e[1],l=a.Cartesian3.angleBetween(o,s),C=Math.ceil(l/t),c=new Array(C);if(r===n){for(i=0;i<C;i++)c[i]=r;return c.push(n),c}var u=(n-r)/C;for(i=1;i<C;i++){var d=r+i*u;c[i]=d}return c[0]=r,c.push(n),c}var b=new a.Cartesian3,B=new a.Cartesian3;var z=new a.Cartesian3(-1,0,0),S=new a.Matrix4,A=new a.Matrix4,D=new a.Matrix3,R=a.Matrix3.IDENTITY.clone(),O=new a.Cartesian3,I=new a.Cartesian4,V=new a.Cartesian3;function N(e,n,t,o,s,l,C,c){var u=O,d=I;S=i.Transforms.eastNorthUpToFixedFrame(e,s,S),u=a.Matrix4.multiplyByPointAsVector(S,z,u);var g=function(e,n,t,i){var o=new r.EllipsoidTangentPlane(t,i),s=o.projectPointOntoPlane(a.Cartesian3.add(t,e,b),b),l=o.projectPointOntoPlane(a.Cartesian3.add(t,n,B),B),C=a.Cartesian2.angleBetween(s,l);return l.x*s.y-l.y*s.x>=0?-C:C}(u=a.Cartesian3.normalize(u,u),n,e,s);D=a.Matrix3.fromRotationZ(g,D),V.z=l,S=a.Matrix4.multiplyTransformation(S,a.Matrix4.fromRotationTranslation(D,V,A),S);var y=R;y[0]=C;for(var f=0;f<c;f++)for(var h=0;h<t.length;h+=3)d=a.Cartesian3.fromArray(t,h,d),d=a.Matrix3.multiplyByVector(y,d,d),d=a.Matrix4.multiplyByPoint(S,d,d),o.push(d.x,d.y,d.z);return o}var G=new a.Cartesian3;function H(e,r,n,t,i,o,s){for(var l=0;l<e.length;l+=3){t=N(a.Cartesian3.fromArray(e,l,G),r,n,t,i,o[l/3],s,1)}return t}function L(e,a){for(var r=e.length,n=new Array(3*r),t=0,i=a.x+a.width/2,o=a.y+a.height/2,s=0;s<r;s++)n[t++]=e[s].x-i,n[t++]=0,n[t++]=e[s].y-o;return n}var j=new i.Quaternion,q=new a.Cartesian3,Q=new a.Matrix3;function F(e,r,t,o,s,C,c,u,d,g){var y,f,h=a.Cartesian3.angleBetween(a.Cartesian3.subtract(r,e,x),a.Cartesian3.subtract(t,e,E)),m=o===l.BEVELED?0:Math.ceil(h/n.CesiumMath.toRadians(5));if(y=s?a.Matrix3.fromQuaternion(i.Quaternion.fromAxisAngle(a.Cartesian3.negate(e,x),h/(m+1),j),Q):a.Matrix3.fromQuaternion(i.Quaternion.fromAxisAngle(e,h/(m+1),j),Q),r=a.Cartesian3.clone(r,q),m>0)for(var p=g?2:1,w=0;w<m;w++)r=a.Matrix3.multiplyByVector(y,r,r),f=a.Cartesian3.subtract(r,e,x),f=a.Cartesian3.normalize(f,f),s||(f=a.Cartesian3.negate(f,f)),c=N(C.scaleToGeodeticSurface(r,E),f,u,c,C,d,1,p);else f=a.Cartesian3.subtract(r,e,x),f=a.Cartesian3.normalize(f,f),s||(f=a.Cartesian3.negate(f,f)),c=N(C.scaleToGeodeticSurface(r,E),f,u,c,C,d,1,1),t=a.Cartesian3.clone(t,q),f=a.Cartesian3.subtract(t,e,x),f=a.Cartesian3.normalize(f,f),s||(f=a.Cartesian3.negate(f,f)),c=N(C.scaleToGeodeticSurface(t,E),f,u,c,C,d,1,1);return c}P.removeDuplicatesFromShape=function(e){for(var r=e.length,n=[],t=r-1,i=0;i<r;t=i++){var o=e[t],s=e[i];a.Cartesian2.equals(o,s)||n.push(s)}return n},P.angleIsGreaterThanPi=function(e,n,t,i){var o=new r.EllipsoidTangentPlane(t,i),s=o.projectPointOntoPlane(a.Cartesian3.add(t,e,b),b),l=o.projectPointOntoPlane(a.Cartesian3.add(t,n,B),B);return l.x*s.y-l.y*s.x>=0};var U=new a.Cartesian3,_=new a.Cartesian3;P.computePositions=function(e,r,i,o,s){var C=o._ellipsoid,E=function(e,a){for(var r=new Array(e.length),n=0;n<e.length;n++){var t=e[n];M=a.cartesianToCartographic(t,M),r[n]=M.height,e[n]=a.scaleToGeodeticSurface(t,t)}return r}(e,C),b=o._granularity,B=o._cornerType,z=s?function(e,a){var r=e.length,n=new Array(6*r),t=0,i=a.x+a.width/2,o=a.y+a.height/2,s=e[0];n[t++]=s.x-i,n[t++]=0,n[t++]=s.y-o;for(var l=1;l<r;l++){var C=(s=e[l]).x-i,c=s.y-o;n[t++]=C,n[t++]=0,n[t++]=c,n[t++]=C,n[t++]=0,n[t++]=c}return s=e[0],n[t++]=s.x-i,n[t++]=0,n[t++]=s.y-o,n}(r,i):L(r,i),S=s?L(r,i):void 0,A=i.height/2,D=i.width/2,R=e.length,O=[],I=s?[]:void 0,V=d,G=g,j=y,q=f,Q=h,Z=m,W=p,Y=w,k=v,J=e[0],K=e[1];q=C.geodeticSurfaceNormal(J,q),V=a.Cartesian3.subtract(K,J,V),V=a.Cartesian3.normalize(V,V),Y=a.Cartesian3.cross(q,V,Y),Y=a.Cartesian3.normalize(Y,Y);var X,$=E[0],ee=E[1];s&&(I=N(J,Y,S,I,C,$+A,1,1)),k=a.Cartesian3.clone(J,k),J=K,G=a.Cartesian3.negate(V,G);for(var ae=1;ae<R-1;ae++){var re=s?2:1;if(K=e[ae+1],J.equals(K))c("Positions are too close and are considered equivalent with rounding error.");else{V=a.Cartesian3.subtract(K,J,V),V=a.Cartesian3.normalize(V,V),j=a.Cartesian3.add(V,G,j),j=a.Cartesian3.normalize(j,j),q=C.geodeticSurfaceNormal(J,q);var ne=a.Cartesian3.multiplyByScalar(q,a.Cartesian3.dot(V,q),U);a.Cartesian3.subtract(V,ne,ne),a.Cartesian3.normalize(ne,ne);var te=a.Cartesian3.multiplyByScalar(q,a.Cartesian3.dot(G,q),_);if(a.Cartesian3.subtract(G,te,te),a.Cartesian3.normalize(te,te),!n.CesiumMath.equalsEpsilon(Math.abs(a.Cartesian3.dot(ne,te)),1,n.CesiumMath.EPSILON7)){j=a.Cartesian3.cross(j,q,j),j=a.Cartesian3.cross(q,j,j),j=a.Cartesian3.normalize(j,j);var ie=1/Math.max(.25,a.Cartesian3.magnitude(a.Cartesian3.cross(j,G,x))),oe=P.angleIsGreaterThanPi(V,G,J,C);oe?(Q=a.Cartesian3.add(J,a.Cartesian3.multiplyByScalar(j,ie*D,j),Q),Z=a.Cartesian3.add(Q,a.Cartesian3.multiplyByScalar(Y,D,Z),Z),u[0]=a.Cartesian3.clone(k,u[0]),u[1]=a.Cartesian3.clone(Z,u[1]),X=T(u,$+A,ee+A,b),O=H(t.PolylinePipeline.generateArc({positions:u,granularity:b,ellipsoid:C}),Y,z,O,C,X,1),Y=a.Cartesian3.cross(q,V,Y),Y=a.Cartesian3.normalize(Y,Y),W=a.Cartesian3.add(Q,a.Cartesian3.multiplyByScalar(Y,D,W),W),B===l.ROUNDED||B===l.BEVELED?F(Q,Z,W,B,oe,C,O,z,ee+A,s):O=N(J,j=a.Cartesian3.negate(j,j),z,O,C,ee+A,ie,re),k=a.Cartesian3.clone(W,k)):(Q=a.Cartesian3.add(J,a.Cartesian3.multiplyByScalar(j,ie*D,j),Q),Z=a.Cartesian3.add(Q,a.Cartesian3.multiplyByScalar(Y,-D,Z),Z),u[0]=a.Cartesian3.clone(k,u[0]),u[1]=a.Cartesian3.clone(Z,u[1]),X=T(u,$+A,ee+A,b),O=H(t.PolylinePipeline.generateArc({positions:u,granularity:b,ellipsoid:C}),Y,z,O,C,X,1),Y=a.Cartesian3.cross(q,V,Y),Y=a.Cartesian3.normalize(Y,Y),W=a.Cartesian3.add(Q,a.Cartesian3.multiplyByScalar(Y,-D,W),W),B===l.ROUNDED||B===l.BEVELED?F(Q,Z,W,B,oe,C,O,z,ee+A,s):O=N(J,j,z,O,C,ee+A,ie,re),k=a.Cartesian3.clone(W,k)),G=a.Cartesian3.negate(V,G)}else O=N(k,Y,z,O,C,$+A,1,1),k=J;$=ee,ee=E[ae+1],J=K}}u[0]=a.Cartesian3.clone(k,u[0]),u[1]=a.Cartesian3.clone(J,u[1]),X=T(u,$+A,ee+A,b),O=H(t.PolylinePipeline.generateArc({positions:u,granularity:b,ellipsoid:C}),Y,z,O,C,X,1),s&&(I=N(J,Y,S,I,C,ee+A,1,1)),R=O.length;var se=s?R+I.length:R,le=new Float64Array(se);return le.set(O),s&&le.set(I,R),le},e.CornerType=l,e.PolylineVolumeGeometryLibrary=P,e.oneTimeWarning=c}));
//# sourceMappingURL=PolylineVolumeGeometryLibrary-e2b8a6ae.js.map