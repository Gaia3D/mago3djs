![Build Status](https://travis-ci.org/Gaia3D/mago3djs.svg?branch=master)
[![License](https://img.shields.io/badge/License-Apache%202.0-brightgreen.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
[![Greenkeeper badge](https://badges.greenkeeper.io/Gaia3D/mago3djs.svg)](https://greenkeeper.io/)

[![Korean](https://img.shields.io/badge/language-Korean-blue.svg)](#korean)
[![Englsh](https://img.shields.io/badge/language-English-orange.svg)](#english)
[![Japan](https://img.shields.io/badge/language-Japan-red.svg)](#japan) 

<a name="korean"></a>

# mago3DJS
3차원 다중 블록 가시화를 위한 오픈소스 자바스크립트 라이브러리

AEC(Architecture, Engineering, Construction) 영역과 전통적인 3차원 공간정보(3D GIS)를 통합적으로 관리 및 가시화하는 차세대 3차원 GIS 플랫폼입니다. 실내,실 외 구별없이 AEC와 3D GIS를 웹 브라우저에서 통합해 줍니다. 대용량 BIM(Building Information Modelling), JT(Jupiter Tessellation), 3D GIS 파일 등을 별도의 프로그램 설치 없이 웹 브라우저 상에서 바로 살펴보고 협업작업을 진행할 수 있습니다.

# 특징
- AEC와 3D GIS의 통합
- 실내외 공간의 끊김없는 연계
- 웹브라우저 상에서 구동되며, 별도의 플러그인이나 엑티브엑스 설치가 필요 없음
- 오픈소스(Cesium, Web World Wind)를 기반으로 개발되어 개방성과 확장성이 뛰어남
- 초대용량 3차원 파일의 효율적 관리 및 초고속 렌더링

# 지원 포맷 형식

- IFC(Industry Foundation Classes)
- JT(Jupiter Tessellation)
- OBJ
- 3DS
- COLLADA
- CityGML
- LAS(PointCloud)

# 적용 사례
- 남극과학기지 웹기반 3차원 시설, 기장비 관리시스템
- LiveDroneMap

# 설치 
### 1. 소스 설치 ###
- git을 사용하여 git clone (https://github.com/Gaia3D/mago3djs.git) 으로 소스를 설치 
<br>
<br>
<code>git clone https://github.com/Gaia3D/mago3djs.git</code>
<br>
<br>
- git을 사용하지 않을 경우 Download ZIP 링크를 클릭하여 설치

### 2. Node 설치 ###
- [node](https://nodejs.org/ko/download/)에 접속하여 Window Install(.msi) 64-bit를 설치
- 설치가 끝난 뒤 mago3djs를 다운받은 디렉토리로 이동
- mago3D JS에 필요한 node_modules를 Node Package Manager 사용하여 설치<pre><code>~/mago3djs> npm install</code></pre>
- gulp는 터미널에서 모듈의 명령어를 사용하기 위해 Global로 설치<pre><code>~/mago3djs> npm install -g gulp</code></pre>
### 3. F4D Converter 설치 및 변환 ###
- [F4D Converter](https://github.com/Gaia3D/F4DConverter) 

# Getting Started #
### 1. 빌드 ###
- gulp를 이용하여 빌드 실행 <pre><code>gulp</code></pre>
- 혹은 <pre><code>npm run build</code></pre>

### 2. Node 서버 실행 ###
- <pre><code>node server.js</code></pre>
- port 변경 시(기본값 80) :   <pre><code>node server.js --port 8080</code></pre>
- public으로 실행 시(기본값 false) : <pre><code>node server.js --public true</code></pre>

### 3. 샘플 페이지 실행 ###
- 브라우저에서 샘플페이지 실행  (http://localhost/)

<br/>

# Basic Code #

html에 빌드한 js파일을 import
```html
<script src="/build/mago3d/mago3d.js"></script>
```
minified version을 사용할 때 : 

```html
<script src="/build/mago3d/mago3d.min.js"></script>
```

<br/>

어플리케이션 엔트리 포인트
```js
var mago3d = new Mago3D.Mago3d('renderDivId');
```


<br/>
<br/>

## 개발환경 참고 문서 ##
 -  [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC) &nbsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&emsp;&nbsp; ● [웹서버 설정](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) 
 - [Cesium-Custermizing](https://github.com/Gaia3D/mago3djs/wiki/Cesium-Custermizing)

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).