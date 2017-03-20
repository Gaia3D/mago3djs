# Mago3DJs
웹 GIS 플랫폼(Cesium...)을 이용한 다중 블록 가시화(3D) 시스템

##  Architecture

<img src ="http://i.imgur.com/HtcQ8vC.png" width = 400>

## Development Environment
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html ) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Jasmine](https://github.com/Gaia3D/mago3djs/wiki/Test)
 - [eclipse neon(필수)](https://www.eclipse.org/downloads/eclipse-packages/)
 &emsp;&emsp;&emsp;&emsp;&emsp;&nbsp; ● [Jsdoc](https://github.com/Gaia3D/mago3djs/wiki/Documentation)
 - [node](https://nodejs.org/ko/download/) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [Gulp](https://github.com/Gaia3D/mago3djs/wiki/Build)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp; ● [eslint](https://github.com/Gaia3D/mago3djs/wiki/%EC%A0%95%EC%A0%81%EA%B2%80%EC%82%AC)
 - [웹서버 설정](https://github.com/Gaia3D/mago3djs/wiki/%EC%9B%B9%EC%84%9C%EB%B2%84-%EC%84%A4%EC%A0%95) &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&nbsp;&nbsp;&nbsp;&nbsp; ● [JQuery](https://github.com/Gaia3D/mago3djs/wiki/Third-Party)

# Getting Started

## Step 1. Download
먼저 <b>Clone or download</b>를 클릭하여 <b>Mago3DJs</b>를 받아 줍니다.

## Step 2. Environment Setting
sample 폴더안에 <b>database.json</b>에서 원하는 데이터로 설정해줍니다.

## Step 3. Setting up a web server
server를 실행하기 전에 <b>Dependencies</b>를 설치해줍니다. <br>
#### 1. node Setup <br>
&emsp;<code>node install --save-dev yargs express url compression request</code>

#### 2. Server Execution <br>
&emsp;<code>C:\git\repository\mago3djs>node server.js</code><br>
