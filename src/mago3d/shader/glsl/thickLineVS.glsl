attribute vec3 prev;
attribute vec3 current;
attribute vec3 next;
attribute float order;
uniform float thickness;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 viewport;

const float C = 0.1;
const float far = 149.6e+9;
float logc = 2.0 / log( C * far + 1.0 );

const float NEAR = -1.0;

// based on https://weekly-geekly.github.io/articles/331164/index.html

vec2 project(vec4 p){
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;
}

void main(){
	
	vec4 vCurrent = modelViewMatrix * vec4(current, 1.0);
	vec4 vPrev = modelViewMatrix * vec4(prev, 1.0);
	vec4 vNext = modelViewMatrix * vec4(next, 1.0);
	
	/*Clip near plane*/
	if(vCurrent.z > NEAR) {
		if(vPrev.z < NEAR){
			/*to the begining path view*/
			vCurrent = vPrev + (vCurrent - vPrev) * (NEAR - vPrev.z) / (vCurrent.z - vPrev.z);
		}else if(vNext.z < NEAR){
			/*to the end path view*/
			vPrev = vPrev + (vCurrent - vPrev) * (NEAR - vPrev.z) / (vCurrent.z - vPrev.z);
			vCurrent = vNext + (vCurrent - vNext) * (NEAR - vNext.z) / (vCurrent.z - vNext.z);
		}
	} else if( vPrev.z > NEAR) {
		/*to the end path view*/
		vPrev = vPrev + (vCurrent - vPrev) * (NEAR - vPrev.z) / (vCurrent.z - vPrev.z);
	} else if( vNext.z > NEAR) {
		/*to the begining path view*/
		vNext = vNext + (vCurrent - vNext) * (NEAR - vNext.z) / (vCurrent.z - vNext.z);
	}
	
	vec4 dCurrent = projectionMatrix * vCurrent;
	vec2 _next = project(projectionMatrix * vNext);
	vec2 _prev = project(projectionMatrix * vPrev);
	vec2 _current = project(dCurrent);
	if(_prev == _current){
		if(_next == _current){
			_next = _current + vec2(1.0, 0.0);
			_prev = _current - _next;
		}else{
			_prev = _current + normalize(_current - _next);
		}
	}
	if(_next == _current){
		_next = _current + normalize(_current - _prev);
	}
	
	vec2 sNext = _next,
		 sCurrent = _current,
		 sPrev = _prev;
	vec2 dirNext = normalize(sNext - sCurrent);
	vec2 dirPrev = normalize(sPrev - sCurrent);
	float dotNP = dot(dirNext, dirPrev);
	
	vec2 normalNext = normalize(vec2(-dirNext.y, dirNext.x));
	vec2 normalPrev = normalize(vec2(dirPrev.y, -dirPrev.x));
	
	float d = thickness * 0.5 * sign(order);
	
	vec2 m;
	if(dotNP >= 0.99991){
		m = sCurrent - normalPrev * d;
	}else{
		vec2 dir = normalPrev + normalNext;
		m = sCurrent + dir * d / (dirNext.x * dir.y - dirNext.y * dir.x);
		
		if( dotNP > 0.5 && dot(dirNext + dirPrev, m - sCurrent) < 0.0 ){
			float occw = order * sign(dirNext.x * dirPrev.y - dirNext.y * dirPrev.x);
			if(occw == -1.0){
				m = sCurrent + normalPrev * d;
			}else if(occw == 1.0){
				m = sCurrent + normalNext * d;
			}else if(occw == -2.0){
				m = sCurrent + normalNext * d;
			}else if(occw == 2.0){
				m = sCurrent + normalPrev * d;
			}
		}else if(distance(sCurrent, m) > min(distance(sCurrent, sNext), distance(sCurrent, sPrev))){
			m = sCurrent + normalNext * d;
		}
	}
	gl_Position = vec4((2.0 * m / viewport - 1.0) * dCurrent.w, dCurrent.z, dCurrent.w);
	gl_Position.z = ( log( C * gl_Position.w + 1.0 ) * logc - 1.0 ) * gl_Position.w;
}