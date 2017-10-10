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
- git을 사용하여 git clone (https://github.com/Gaia3D/mago3djs.git) 으로 소스를 C:\git\repository\mago3djs 에 설치합니다. <br>
- eclipse를 실행 후 <code>Project Import File -> import -> General -> Projects from Folder or Archive</code>로 mago3djs를 import합니다.
- git을 사용하지 않을 경우 Download ZIP 링크를 클릭하여 설치합니다.

### 3. Node 설치 ###
- [node](https://nodejs.org/ko/download/)에 접속하여 Window Install(.msi) 64-bit를 설치합니다.
- 설치가 끝난 뒤 C:\git\repository\mago3djs 디렉토리로 이동합니다.
- mago3DJS에 필요한 node_modules를 Node Package Manager 사용하여 설치합니다.
<pre><code>C:\git\repository\mago3djs> npm install</code></pre>
- gulp는 터미널에서 모듈의 멍령어를 사용하기 위해 Global로 설치합니다.
<pre><code>C:\git\repository\mago3djs> npm install -g gulp</code></pre>

### 4. 데이터 ###
#### 데이터 변환
- [www.mago3d.com](http://www.mago3d.com/homepage/download.do) 에 접속합니다.
- Installer : F4D Converter 64bit (this installation requires Windows 7 or later) 다운로드합니다.
- C:\F4DConverter 에 설치합니다.
- 관리자 권한으로 Command Line Prompt 실행합니다.
- F4D Conveter 설치 Directory 로 이동합니다.
- 변환 데이터 저장 폴더(outputFolder)를 C:\data 에 생성합니다.
- inputFolder에 변환할 데이터를 놓고, 다음을 실행합니다.
<pre><code>C:\F4DConverter>F4DConverter.exe -inputFolder D:\demo_data -outputFolder C:\data -log D:\demo_data/logTest.txt -indexing y</code></pre>
>F4D Conveter argument 관련 설명은 [F4D Conveter](https://github.com/Gaia3D/F4DConverter)참조

- C:\data 폴더에 F4D_xxxx 폴더들과, objectIndexFile.ihe 파일 생성을 확인합니다. 파일이 생성되지 않은 경우 로그파일(logTest.txt)를 확인합니다.

#### 데이터 폴더 링크
- Data가 제대로 생성되었으면 데이터 폴더 링크를 만들어줍니다.
<pre><code>mklink /d "C:\git\repository\mago3djs\data" "C:\data"</code></pre>

#### data.json 수정
- C:\data 에서 표시할 데이터 디렉토리를 찾습니다.
- C:\data\F4d_xxxx에 xxxx가 data_key가 되고 data_name은 data이름.
<pre><code>{
  ...
    "xxxx": { // data unique key
    "data_key": "data unique key",
    "data_name": "data name",
    "latitude": "latitude",
    "longitude": "longitude",
    "height": "height",
    "heading": "heading",
    "pitch": "pitch",
    "roll": "roll"
    }
}
</code></pre>

### 5. 실행
#### node server 를 실행
- private로 서버를 실행할경우
<pre><code>C:\git\repository\mago3djs>node server.js </code></pre>
- public로 서버를 실행할경우
<pre><code>C:\git\repository\mago3djs>node server.js --public true</code></pre>

#### 브라우저 확인
- Cesium
<pre><code>http:localhost/sample/cesium.html</code></pre>
- WorlWind
<pre><code>http:localhost/sample/worldwind.html</code></pre>


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
- Run eclipse and import mago3djs into <code> Project Import File -> import -> General -> Projects from Folder or Archive </code>.
- If you are not using git, click the Download ZIP link to install it.


### 3. Node install ###
- [node](https://nodejs.org/ko/download/) to install Window Install (.msi) 64-bit.
- After the installation is complete, go to the C:\git\repository\mago3djs directory.
- Use node Package Manager to install node_modules for mago3DJS.
<pre><code>C:\git\repository\mago3djs> npm install</code></pre>
- gulp installs globally in Terminal to use the module's mockups.
<pre><code>C:\git\repository\mago3djs> npm install -g gulp</code></pre>

### 4. Data
- Access [www.mago3d.com](http://www.mago3d.com/homepage/download.do).
- Installer: F4D Converter 64bit (this installation requires Windows 7 or later).
- Install to C: \ F4DConverter.
- Run Command Line Prompt with administrator privileges.
- Go to the F4D Conveter installation directory.
- Create the conversion data save folder (outputFolder) in C: \ data.
- Place the data to be converted in the inputFolder, and do the following:
<pre><code>C:\F4DConverter>F4DConverter.exe -inputFolder D:\demo_data -outputFolder C:\data -log D:\demo_data/logTest.txt -indexing y</code></pre>
> For a description of F4D Conveter argument, refer to [F4D Conveter](https://github.com/Gaia3D/F4DConverter)

- Check the creation of F4D_xxxx folders and objectIndexFile.ihe file in C: \ data folder. If the file is not generated, check the log file (logTest.txt).

#### Data folder link
- If the data is properly created, it creates a data folder link.
<pre><code>mklink /d "C:\git\repository\mago3djs\data" "C:\data"</code></pre>

#### Edit data.json
- Find the data directory to display in C: \ data.
- C:\data\F4d_xxxx where xxxx is the data_key and data_name is the data name.
<pre><code>{
  ...
    "xxxx": { // data unique key
    "data_key": "data unique key",
    "data_name": "data name",
    "latitude": "latitude",
    "longitude": "longitude",
    "height": "height",
    "heading": "heading",
    "pitch": "pitch",
    "roll": "roll"
    }
}
</code></pre>

### 5. Execute
#### run the node server
- When running the server as private
<pre><code> C:\git\repository mago3djs>node server.js </code></pre>
- If you run the server as public
<pre><code> C:\git\repository\mago3djs>node server.js --public true</code></pre>

#### Browser Confirmation
- Cesium
<pre> <code>http:localhost/sample/cesium.html</code></pre>
- WorlWind
<pre> <code>http:localhost/sample/worldwind.html</code></pre>

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
- eclipseを実行した後、<code> Project Import File  - > import  - > General  - > Projects from Folder or Archive </code>で mago3djs をimportします。
- gitを使用しない場合Download ZIPリンクをクリックしてインストールします。


### 3. Node のインストール ###
- [node](https://nodejs.org/ko/download/) に接続してWindow Install（.msi）64-bitをインストールします。
- インストールが終わった後、C:\git\mago3DJSディレクトリに移動します。
-  mago3DJSに必要なnode_modulesをNode Package Managerを使用してインストールします。
<pre><code>C:\git\repository\mago3djs> npm install</code></pre>
- gulpはモジュールを端末の全ユーザーが使用する場合に使用します。
<pre><code>C:\git\repository\mago3djs> npm install -g gulp</code></pre>

### 4.データ###
#### データ変換
- [www.mago3d.com](http://www.mago3d.com/homepage/download.do)に接続します。
- Installer：F4D Converter 64bit（this installation requires Windows 7 or later）ダウンロードします。
- C：\ F4DConverterにインストールします。
- 管理者権限でコマンドラインプロンプトを実行します。
- F4D Conveterインストールディレクトリに移動します。
- 変換データ格納フォルダ（outputFolder）をC：\ dataに作成します。
- inputFolderに変換するデータを置き、以下を実行します。
<pre><code>C:\F4DConverter>F4DConverter.exe -inputFolder D:\demo_data -outputFolder C:\data -log D:\demo_data/logTest.txt -indexing y</code></pre>
> F4D Conveter argument関連の説明は、[F4D Conveter](https://github.com/Gaia3D/F4DConverter)を参照

- C：\ dataフォルダにF4D_xxxxフォルダと、objectIndexFile.iheファイルの作成を確認します。ファイルが生成されていない場合は、ログファイル（logTest.txt）を確認します。

#### データフォルダへのリンク
- Dataが正常に作成されている場合、データフォルダーのリンクを作成します。
<pre><code>mklink /d "C：\git\repository\mago3djs\data" "C：\data"</code></pre>

#### data.json 修正
- C：\dataに表示するデータのディレクトリを検索します。
- C：\data\F4d_xxxx の xxxx は data_key になっており data_name は data の名前になります。
<pre><code>{
  ...
    "xxxx": { // data unique key
    "data_key": "data unique key",
    "data_name": "data name",
    "latitude": "latitude",
    "longitude": "longitude",
    "height": "height",
    "heading": "heading",
    "pitch": "pitch",
    "roll": "roll"
    }
}
</code></pre>

### 5. 実行
#### node serverを実行
- privateでサーバーを実行する場合
<pre><code> C:\git\ repository\mago3djs>node server.js</code></pre>
- publicでサーバーを実行する場合
<pre><code> C：\git\repository\mago3djs>node server.js--public true</code></pre>

####ブラウザチェック
- Cesium
<pre><code>http：localhost/sample/cesium.html</code></pre>
- WorlWind
<pre><code>http：localhost/sample/worldwind.html</code></pre>

## LICENSE ##
[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).
