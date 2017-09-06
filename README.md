[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
[![Englsh](https://img.shields.io/badge/language-English-orange.svg)](#english)
[![Korean](https://img.shields.io/badge/language-Korean-blue.svg)](README.md)

# Mago3DJs
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

# 적용 사례
- 남극과학기지 웹기반 3차원 시설ㆍ기장비 관리시스템
- LiveDroneMap

## Development Environment ##
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 - [eclipse neon(필수)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [웹서버 설정](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)

### Getting Started ###

#### 설치 ####
먼저 Clone or download를 클릭하여 Mago3DJs를 받아 줍니다.

#### 환경 설정 ####
sample 폴더안에 database.json에서 원하는 데이터로 설정해줍니다.

#### 웹 서버 설정 ####
server를 실행하기 전에 Dependencies를 설치해줍니다.

#### node Setup ####
```
npm install, npm install -g gulp
```

####  서버 실행
##### Local 서버 실행
```
C:\git\repository\mago3djs>node server.js
```
##### public 서버 실행
```
C:\git\repository\mago3djs>node server.js --public true
```

#### 데이터 폴더 링크 ####
##### 데이터 폴더 생성
```
mklink /d "C:\git\repository\mago3djs\data" "C:\data"
```
##### 데이터 폴더 삭제
```
C:\git\repository\mago3djs>rmdir data
```

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).



<br><br><br>



# <a name="english"></a>Mago3DJs
Open source JavaScript library for 3D multi-block visualization

Generation 3D GIS platform that integrates and visualizes AEC (Architecture, Engineering, Construction) areas and traditional 3D spatial information (3D GIS). Integrate AEC and 3D GIS in a web browser, indoors, outdoors, indistinguishable. You can browse and collaborate on large-scale BIM (Building Information Modeling), JT (Jupiter Tessellation), and 3D GIS files without installing any programs on the web browser.

# Characteristic
- Integration of AEC and 3D GIS
- Seamless connection of indoor and outdoor spaces
- Runs on a web browser and does not require a separate plug-in or ActiveX installation
- It is developed based on open source (Cesium, Web World Wind) and has excellent openness and scalability
- Efficient management and ultra-fast rendering of high-capacity 3-D files

# Supported Format Formats

- IFC(Industry Foundation Classes)
- JT(Jupiter Tessellation)
- OBJ
- 3DS
- COLLADA

# Application example
- Antarctic Science Base Web-based 3D facility / equipment management system
- LiveDroneMap

## Development Environment ##
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 - [eclipse neon(necessary)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [web server setting](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)

### Getting Started ###

#### Install ####
First, click Clone or download to accept Mago3DJs.

#### Preferences ####
In the sample folder, set the desired data in database.json.

#### Web server settings ####
Install Dependencies before running server.

#### node Setup ####
```
npm install, npm install -g gulp
```

#### Running the server
##### Run Local Server
```
C:\git\repository\mago3djs>node server.js
```
##### public server run
```
C:\git\repository\mago3djs>node server.js --public true
```

#### Data folder link ####
##### Create Data Folder
```
mklink /d "C:\git\repository\mago3djs\data" "C:\data"
```
##### Delete data folder
```
C:\git\repository\mago3djs>rmdir data
```

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).


