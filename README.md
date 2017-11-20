[![License](https://img.shields.io/badge/License-Apache%202.0-brightgreen.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
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

# 적용 사례
- 남극과학기지 웹기반 3차원 시설, 기장비 관리시스템
- LiveDroneMap

# Getting Started #

### 1. 개발환경 참고 문서 ###
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 - [eclipse neon(필수)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [웹서버 설정](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)
 - [Cesium-Custermizing](https://github.com/Gaia3D/mago3djs/wiki/Cesium-Custermizing)

### 2. 소스 설치 ###
- git을 사용하여 git clone (https://github.com/Gaia3D/mago3djs.git) 으로 소스를 C:\git\repository\mago3djs 에 설치 <br>
- eclipse를 실행 후 <code>Project Import File -> import -> General -> Projects from Folder or Archive</code>로 mago3djs를 import
- git을 사용하지 않을 경우 Download ZIP 링크를 클릭하여 설치

### 3. Node 설치 ###
- [node](https://nodejs.org/ko/download/)에 접속하여 Window Install(.msi) 64-bit를 설치
- 설치가 끝난 뒤 C:\git\repository\mago3djs 디렉토리로 이동
- mago3DJS에 필요한 node_modules를 Node Package Manager 사용하여 설치<pre><code>C:\git\repository\mago3djs> npm install</code></pre>
- gulp는 터미널에서 모듈의 멍령어를 사용하기 위해 Global로 설치<pre><code>C:\git\repository\mago3djs> npm install -g gulp</code></pre>

### 4. F4D Converter 설치
- [www.mago3d.com](http://www.mago3d.com/homepage/download.do) 에 접속
- Installer : F4D Converter 64bit (this installation requires Windows 7 or later) 설치
- Install Path: <code>C:\F4DConverter\ </code>

### 5. 데이터 변환
- 변한된 데이터(outputFolder)를 저장할 디렉토리를 생성<br>
<code>C:\data\프로젝트명 (root folder인 data 폴더 아래 프로젝트 별로 디렉토리를 생성)</code>
- 변환할 데이터를 C:\demo_data(inputFolder)에 저장
- 관리자 권한으로 Command Line Prompt(cmd.exe)를 실행한 다음 F4D Converter가 설치된 디렉토리로 이동
- 다음을 실행
<br>※ F4D Conveter argument 관련 설명은 [F4D Conveter](https://github.com/Gaia3D/F4DConverter)참조<pre><code>C:\F4DConverter>F4DConverter.exe -inputFolder C:\demo_data -outputFolder C:\data\프로젝트명 -log C:\demo_data/logTest.txt -indexing y</code></pre>
- 변환 완료된 F4D 파일들을 mago3D JS 프로젝트에서 웹 서비스로 사용할 수 있도록 Symbolic Link 생성
  - 관리자 권한으로 Command Line Prompt(cmd.exe)를 실행하고 mago3D JS 프로젝트로 이동
  <code>C:\mago3djs</code>
  <pre><code>C:\mago3djs>mklink /d "C:\git\repository\mago3djs\data" "C:\data" </code></pre>

### 6. 설정 파일 수정
두 가지의 설정파일을 추가한다. (data.json, policy.json)
#### data.json
- 크게 세가지 영역으로 나눠진다. 속성값을 저장하는 attributes, 자식 노드 정보를 저장하는 children 그외 위치 정보를 저장하는 영역
- json의 root 노드의 data_key는 data 폴더 아래 프로젝트명과 일치
<pre><code>{
    //attributes영역
    "attributes" : {
      "isPhysical" : false,
      "nodeType": "root",
      "projectType": "프로젝트 타입"
    },
    //자식 노드 영역
    "children" : [
    ],
    //위치 정보 영역
    "data_group_id" : 0,
    "data_group_name" : "데이터 그룹명",
    "data_id" : 0,
    "data_key" : "프로젝트명",
    "data_name" : "프로젝트명"
}</code></pre>
- <code>C:\data\프로젝트명</code> 에서 Rendering 할 디렉토리를 찾음
- 디렉토리명에서 F4D_이후의 글자가 고유 식별자
- data.json 파일에서 children의 data_key 값을 고유 식별자로 수정
- lattiude, longitude, height, heading, pitch, roll 값을 적당한 값으로 수정
<pre><code>//자식 노드 영역
"children" : [
   {
     "attributes" : {
     "isPhysical" : true,
     "nodeType" : "..."
     },
     "children" : [
     ],
     "data_group_id" : 0,
     "data_group_name" : "데이터 그룹명",
     "data_id" : 0,
     "data_key" : "고유 식별자",
     "data_name" : "데이터 이름",
     "latitude" : 위도 입력,
     "longitude" : 경도 입력,
     "height" : 높이 입력,
     "heading" : heading 입력,
     "pitch" : pitch 입력,
     "roll" : roll 입력
  }
]
</code></pre>

#### policy.json
  - 초기화시 로딩할 project, Init Camera Latitude, Longitude, CallBack Function, Geo Server 설정
  - 페이지 초기화시 로딩할 프로젝트 설정 key값 입력, 복수개의 프로젝트 로딩을 원하는 경우 <code> , </code>로 추가
  <pre><code>"geo_data_default_projects": [
    "data.json"
]</code></pre>

  - 웹 페이지 시작시 이동할 위치(lattiude, longitude)를 수정
  <pre><code>"geo_init_latitude": "위도 입력",
"geo_init_longitude": "경도 입력"</code></pre>

### 7. Node Server 실행
<pre><code>// private로 서버를 실행할경우
C:\git\repository\mago3djs>node server.js
// public로 서버를 실행할경우
C:\git\repository\mago3djs>node server.js --public true</code></pre>

### 8. 브라우저 확인
<pre><code>// Cesium
http:localhost/sample/cesium.html
// WorlWind
http:localhost/sample/worldwind.html</code></pre>


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


# Getting Started ###
### 1. Development Environment
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 - [eclipse neon(need)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [server settings](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)
 - [Cesium-Custermizing](https://github.com/Gaia3D/mago3djs/wiki/Cesium-Custermizing)

### 2. Source Download
- Use git to install the source to C:\git\repository\mago3djs with git clone https://github.com/Gaia3D/mago3djs.git. <br>
- Run eclipse and import mago3djs into <code> Project Import File -> import -> General -> Projects from Folder or Archive</code>.
- If you are not using git, click the Download ZIP link to install it.


### 3. Node Install ###
- [node](https://nodejs.org/ko/download/) to install Window Install (.msi) 64-bit.
- After the installation is complete, go to the C:\git\repository\mago3djs directory.
- Use node Package Manager to install node_modules for mago3DJS.<pre><code>C:\git\repository\mago3djs> npm install</code></pre>
- gulp installs globally in Terminal to use the module's mockups.<pre><code>C:\git\repository\mago3djs> npm install -g gulp</code></pre>

### 4. F4D Converter Install
- [www.mago3d.com](http://www.mago3d.com/homepage/download.do) 에 접속
- Installer : F4D Converter 64bit (this installation requires Windows 7 or later) 설치
- Install Path: <code>C:\F4DConverter\ </code>

### 5. Data Conversion
- Create a directory to store the changed data(outputFolder) <br>
<code>C:\data\projectname (Create a directory for each project under the data folder, the root folder)</code>
- Save the data to be converted to C:\demo_data(inputFolder)
- Run Command Line Prompt (cmd.exe) as an administrator and move to the directory where F4D Converter is installed
- Run
<br>※ For a description of F4D Conveter argument[F4D Conveter](https://github.com/Gaia3D/F4DConverter)<pre><code>C:\F4DConverter>F4DConverter.exe -inputFolder C:\demo_data -outputFolder C:\data\projectname -log C:\demo_data/logTest.txt -indexing y</code></pre>
- Create Symbolic Link to use transformed F4D files as web service in mago3D JS project
  - Run Command Line Prompt (cmd.exe) with administrative privileges and go to mago3D JS project
  <code>C:\mago3djs</code>
  <pre><code>C:\mago3djs>mklink /d "C:\git\repository\mago3djs\data" "C:\data" </code></pre>

### 6. Edit Configuration File
Add two configuration files. (data.json, policy.json)
#### data.json
- It is divided into three major areas. Attributes to store attribute values, children to store child node information, other area to store location information
- The data_key of the root node of json matches the project name under the data folder
<pre><code>{
    //attributes area
    "attributes" : {
      "isPhysical" : false,
      "nodeType": "root",
      "projectType": "project Type"
    },
    //Child node area
    "children" : [
    ],
    //Location information area
    "data_group_id" : 0,
    "data_group_name" : "Data group name",
    "data_id" : 0,
    "data_key" : "Project name",
    "data_name" : "Project name"
}</code></pre>
- <code>C:\data\projectname</code>to find the directory to render
- The characters after F4D_ in the directory name are unique identifiers
- Modify the data_key value of children from the data.json file to a unique identifier
- Modify latitude, longitude, height, heading, pitch, and roll values to appropriate values
<pre><code>//Child node area
"children" : [
   {
     "attributes" : {
     "isPhysical" : true,
     "nodeType" : "..."
     },
     "children" : [
     ],
     "data_group_id" : 0,
     "data_group_name" : "Data group name",
     "data_id" : 0,
     "data_key" : "Unique identifier",
     "data_name" : "Data name",
     "latitude" : Enter latitude,
     "longitude" : Enter longitude,
     "height" : Enter height,
     "heading" : Enter heading,
     "pitch" : Enter pitch,
     "roll" : Enter roll
  }
]
</code></pre>

#### policy.json
  - Project to be loaded at initialization, Init Camera Latitude, Longitude, CallBack Function, Geo Server setup
  - Enter key value to load when initializing page, <code> , </code> if you want to load multiple projects
  <pre><code>"geo_data_default_projects": [
    "data.json"
]</code></pre>

  - Fix location (lattiude, longitude) to move when web page starts
  <pre><code>"geo_init_latitude": "Enter latitude",
"geo_init_longitude": "Enter longitude"</code></pre>

### 7. Running Node Server
<pre><code>// If you run the server privately
C:\git\repository\mago3djs>node server.js
// If you run the server as public
C:\git\repository\mago3djs>node server.js --public true
</code></pre>

### 8. Browser verification
<pre><code>// Cesium
http:localhost/sample/cesium.html
// WorlWind
http:localhost/sample/worldwind.html</code></pre>

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).

<br><br>
[english](#english) <br>

<a name="japan"></a>
準備中です。
# mago3DJS
3次元マルチブロック可視化のためのオープンソースのJavaScriptライブラリ

AEC（Architecture、Engineering、Construction）領域と、伝統的な3次元空間情報（3D GIS）を統合的に管理し、可視化する次世代3次元GISプラットフォームです。室内、糸外の区別なくAECと3D GISをWebブラウザに統合されています。大容量BIM（Building Information Modelling）、JT（Jupiter Tessellation）、3D GISファイルなどを、別のプログラムをインストールすることなく、Webブラウザ上で操作してコラボレーションを行うことができます。

# 特徴
- AECと3D GISの統合
- 室内外空間のシームレスな連携
- Webブラウザ上で駆動され、別のプラグインやActiveXのインストールが不要
- オープンソース（Cesium、Web World Wind）をベースに開発され、オープンで拡張性に優れる
- 大容量3次元ファイルの効率的な管理と超高速レンダリング

# 対応フォーマット形式

- IFC(Industry Foundation Classes)
- JT(Jupiter Tessellation)
- OBJ
- 3DS
- COLLADA

# 適用事例
- 南極科学基地のWebベースの3次元設備、基装備管理システム
- LiveDroneMap


# Getting Started

### 1. 開発環境参考文書
- [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
- [eclipse neon(need)](https://www.eclipse.org/downloads/eclipse-packages/)
&emsp;&emsp;&emsp;&emsp;&emsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
- [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
- [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
- [server settings](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)
- [Cesium-Custermizing](https://github.com/Gaia3D/mago3djs/wiki/Cesium-Custermizing)


### 2. ソースインストール
- gitを使用してgit clone https://github.com/Gaia3D/mago3djs.git にソースをC:\git\repository\mago3djs にインストールします。 <br>
- eclipseを実行した後、<code>Project Import File -> import -> General -> Projects from Folder or Archive</code>で mago3djs をimport。
- gitを使用しない場合Download ZIPリンクをクリックしてインストールします。


### 3. Node のインストール ###
- [node](https://nodejs.org/ko/download/) に接続してWindow Install（.msi）64-bitをインストールします。
- インストールが終わった後、C:\git\mago3DJSディレクトリに移動します。
- mago3DJSに必要なnode_modulesをNode Package Managerを使用してインストールします。<pre><code>C:\git\repository\mago3djs> npm install</code></pre>
- gulpはモジュールを端末の全ユーザーが使用する場合に使用します。<pre><code>C:\git\repository\mago3djs> npm install -g gulp</code></pre>

### 4. F4D Converterインストール
- [www.mago3d.com](http://www.mago3d.com/homepage/download.do) 에 접속
- Installer : F4D Converter 64bit (this installation requires Windows 7 or later) 설치
- Install Path: <code>C:\F4DConverter\ </code>

### 5. データ変換
- 変わったデータ（outputFolder）を格納するディレクトリを作成し<br>
<code>C:\data\プロジェクト名（root folderであるdataフォルダの下のプロジェクトごとにディレクトリを作成）</code>
- 変換するデータをC:\demo_data(inputFolder)に保存
- 管理者権限でCommand Line Prompt（cmd.exe）を実行し、F4D Converterがインストールされてディレクトリに移動
- 次を実行し
<br>※ F4D Conveter argument 関連説明は[F4D Conveter](https://github.com/Gaia3D/F4DConverter)参照<pre><code>C:\F4DConverter>F4DConverter.exe -inputFolder C:\demo_data -outputFolder C:\data\プロジェクト名 -log C:\demo_data/logTest.txt -indexing y</code></pre>
- 変換完了F4Dファイルをmago3D JSプロジェクトでは、Webサービスとして利用できるようにSymbolic Linkを作成
  - 管理者権限でCommand Line Prompt（cmd.exe）を実行して、mago3D JSプロジェクトに移動
  <code>C:\mago3djs</code>
  <pre><code>C:\mago3djs>mklink /d "C:\git\repository\mago3djs\data" "C:\data" </code></pre>

### 6. 設定ファイルを変更する
二種類の設定ファイルを追加します。 (data.json, policy.json)
#### data.json
- 大きく3つのエリアに分けられる。属性値を格納するattributes、子ノードの情報を格納するchildrenその他の位置情報を格納する領域
- jsonのrootノードのdata_keyはdataフォルダの下のプロジェクト名と一致
<pre><code>{
    //attributes領域
    "attributes" : {
      "isPhysical" : false,
      "nodeType": "root",
      "projectType": "プロジェクトのタイプ"
    },
    //子ノードの領域
    "children" : [
    ],
    //位置情報領域
    "data_group_id" : 0,
    "data_group_name" : "データグループ名",
    "data_id" : 0,
    "data_key" : "プロジェクト名",
    "data_name" : "プロジェクト名"
}</code></pre>
- <code>C:\data\プロジェクト名</code>でRenderingするディレクトリを捜す
- ディレクトリ名でF4D_以降の文字が一意の識別子
- data.jsonファイルからchildrenのdata_key値を一意の識別子として修正
- latitude、longitude、height、heading、pitch、roll値を適切な値に変更
<pre><code>//子ノードの領域
"children" : [
   {
     "attributes" : {
     "isPhysical" : true,
     "nodeType" : "..."
     },
     "children" : [
     ],
     "data_group_id" : 0,
     "data_group_name" : "データグループ名",
     "data_id" : 0,
     "data_key" : "一意の識別子",
     "data_name" : "データ名",
     "latitude" : 緯度の入力,
     "longitude" : 硬度入力,
     "height" : 高入力,
     "heading" : heading入力,
     "pitch" : pitch入力,
     "roll" : roll入力
  }
]
</code></pre>

#### policy.json
  - 初期化時にロードすることがproject、Init Camera Latitude、Longitude、CallBack Function、Geo Server設定
  - ページの初期化時にロードすることがプロジェクトの設定のkeyの値の入力、複数のプロジェクトのロードをしたい場合は、<code> 、</code>に追加
  <pre><code>"geo_data_default_projects": [
    "data.json"
]</code></pre>

  - Webページの開始時に移動先（lattiude、longitude）を修正
  <pre><code>"geo_init_latitude": "緯度の入力",
"geo_init_longitude": "硬度入力"</code></pre>


### 7. Node Serverを実行
<pre><code>//privateでサーバーを実行する場合
C:\git\ repository\mago3djs>node server.js
//publicでサーバーを実行する場合
C：\git\repository\mago3djs>node server.js--public true</code></pre>

### 8. Browser verification
<pre><code>// Cesium
http:localhost/sample/cesium.html
// WorlWind
http:localhost/sample/worldwind.html</code></pre>

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).
