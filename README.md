[![License](https://img.shields.io/badge/License-Apache%202.0-brightgreen.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
[![Korean](https://img.shields.io/badge/language-Korean-blue.svg)](#korean)
[![Englsh](https://img.shields.io/badge/language-English-orange.svg)](#english)
[![Japan](https://img.shields.io/badge/language-Japan-red.svg)](#japan)

<a name="korean"></a>

# mago3DJs
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
- 남극과학기지 웹기반 3차원 시설, 기장비 관리시스템
- LiveDroneMap

## Development Environment ##
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 - [eclipse neon(필수)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [웹서버 설정](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)

## Getting Started ###

### 설치
#### Source Download ####
- 우측 상단부의 Clone or download 버튼을 클릭합니다.
- Download ZIP 링크를 클릭, C:\ 디렉토리에 저장합니다.
  - git을 사용하는 경우 git clone https://github.com/Gaia3D/mago3djs.git
- 압축 해제 후 확인합니다.
  - C:\mago3djs

#### Node install ####
- [node](https://nodejs.org/ko/download/)에 접속하여 Window Install(.msi) 64-bit를 설치합니다.
- C:\mago3djs 디렉토리로 이동합니다.
- node Setup
  - <code>C:\mago3djs> npm install</code>
  - <code>C:\mago3djs> npm install -g gulp</code>

#### 데이터 폴더 링크 ####
  - <code>mklink /d "C:\git\repository\mago3djs\data" "C:\data"</code>

####  서버 실행
##### private 서버 실행
- <code>C:\git\repository\mago3djs>node server.js</code>

##### public 서버 실행
- <code>C:\git\repository\mago3djs>node server.js --public true</code>



## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).



<br><br>


[한국어](#korean)
# <a name="english"></a>mago3DJS
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
- Antarctic Science Base Web-based 3D facility, equipment management system
- LiveDroneMap

## Development Environment ##
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 - [eclipse neon(need)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [server settings](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)

### Getting Started ###

### Install
#### Source Download ####
- Click the Clone or download button in the upper right corner.
- Click the Download ZIP link and save it in the C: \ directory.
  - If you use git git clone https://github.com/Gaia3D/mago3djs.git
- Confirm after decompression.
  - C: \ mago3djs

#### Node install ####
- [node](https://nodejs.org/en/download/) to install Window Install (.msi) 64-bit.
- Go to the C: \ mago3djs directory.
- node Setup
  - <code>C: \ mago3djs> npm install</code>
  - <code>C: \ mago3djs> npm install -g gulp</code>

#### Data folder link ####
  - <code>mklink /d "C:\git\repository\mago3djs\data" "C:\data"</code>

#### Running the server
##### Private server run
- <code>C:\git\repository\mago3djs>node server.js</code>

##### Public server run
- <code>C:\git\repository\mago3djs>node server.js --public true</code>
## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).

<br><br>
[english](#english) <br>

<a name="japan"></a>
準備中です。
# mago3DJs
3次元マルチブロック可視化のためのオープンソースのJavaScriptライブラリ

AEC（Architecture、Engineering、Construction）領域と、伝統的な3次元空間情報（3D GIS）を統合的に管理し、可視化する次世代3次元GISプラットフォームです。室内、糸外の区別なくAECと3D GISをWebブラウザに統合されています。大容量BIM（Building Information Modelling）、JT（Jupiter Tessellation）、3D GISファイルなどを、別のプログラムをインストールすることなく、Webブラウザ上ですぐに見てコラボレーションを行うことができます。

# 特徴
- AECと3D GISの統合
- 室内外空間のシームレスな連携
- Webブラウザ上で駆動され、別のプラグインやアクティブXのインストールが不要
- オープンソース（Cesium、Web World Wind）をベースに開発され、オープンで拡張性に優れ
- 初代容量3次元ファイルの効率的な管理と高速レンダリング

# 対応フォーマット形式

- IFC(Industry Foundation Classes)
- JT(Jupiter Tessellation)
- OBJ
- 3DS
- COLLADA

# 適用事例
- 南極科学基地のWebベースの3次元設備、基装備管理システム
- LiveDroneMap

## Development Environment ##
- [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
- [eclipse neon(need)](https://www.eclipse.org/downloads/eclipse-packages/)
&emsp;&emsp;&emsp;&emsp;&emsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
- [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
- [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
- [server settings](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)

## Getting Started ###

### インストール
#### Source Download ####
- 右側上部のClone or downloadボタンをクリックします。
- Download ZIPリンクをクリックして、C：\ディレクトリに保存します。
  - gitを使用している場合はgit clone https://github.com/Gaia3D/mago3djs.git
- 解凍後確認します。
  - C:\mago3djs

#### Node install ####
- [node]（https://nodejs.org/ko/download/）に接続してWindow Install（.msi）64-bitをインストールします。
- C：\ mago3djsディレクトリに移動します。
- node Setup
  - <code>C:\mago3djs> npm install</code>
  - <code>C:\mago3djs> npm install -g gulp</code>

#### データフォルダリンク ####
  - <code>mklink /d "C:\git\repository\mago3djs\data" "C:\data"</code>

####  サーバーの実行
##### privateサーバーの実行
- <code>C:\git\repository\mago3djs>node server.js</code>

##### publicサーバーの実行
- <code>C:\git\repository\mago3djs>node server.js --public true</code>

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).
