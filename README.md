# mago3djs

## 1. mago3djs란?
웹 GIS 플랫폼(Cesium...)을 이용한 다중 블록 가시화(3D) 시스템

## 2. mago3djsArchitecture

<img src ="http://i.imgur.com/CMJ0fKA.png" width = 400>

| tool | description |
| :------------ | :-----------:
| Test     | used TestRunner(**Karma**) and used Test([**Jasmine**](https://github.com/Gaia3D/mago3djs/wiki/Test))         
| Documentation    | used [**jsdoc**](https://github.com/Gaia3D/mago3djs/wiki/Documentation)    
| Build     | used [**Gulp**](https://github.com/Gaia3D/mago3djs/wiki/Build)  |
| 정적검사(lint) | used [**eslint**]() |


-----------

## mago3djs 개발 환경
 - [java8](http://www.oracle.com/technetwork/java/javase/downloads/index.html )
 - [eclipse neon(필수)](https://www.eclipse.org/downloads/eclipse-packages/)
 - [node](https://nodejs.org/ko/download/)
 - [apache 2.4.25 Win64](https://www.apachelounge.com/download/)

## 디렉토리
- data : f4d 데이터가 저장됨
- build : gulp를 이용해서 project를 build 하면 자동 생성되는 디렉토리
  - build/mago3d : Javascript 파일을 압축 혹은 통합한 min 파일이 저장됩니다.
  - build/documentaion : jsdoec으로 자동 생성됩니다.
- external : 외부 Javascript library를 저장합니다.
 - external/jasmine : jasmine 테스트 라이브러리
- node_modules : node package
- src
  - src/engine/cesium : cesium customizing source
  - src/mago3d : Javascript 소스
  - src/mago3d/images 이미지 폴더
- test : 테스트 소스 jasmine은 spec 이란 이름을 사용하지만 범용적으로 test 라고합니다.



## 웹서버 설정
### 1. node
#### Steps:
1. <b> node Setup</b> <br>
<code>npm install --save-dev yargs, express, url</code><br>
2. <b>Server Execution </b>  
<code>C:\git\repository\mago3djs>node server.js</code>

### 2. apache

#### Steps:
1. <b> apache Setup</b> <br>
<code>"C:\git\repository\conf</code> httpd.conf 설정<br>
아파치 홈 디렉토리 ServerRoot <code>"c:/apache"
ServerName localhost:80</code><br>
DocumentRoot <code>"C:\git\repository\mago3djs"</code>
2. <b>Server Execution</b><br>
<code>C:\apache\bin</code> httpd.exe 실행
