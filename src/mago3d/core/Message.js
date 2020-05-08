'use strict';

var Messages = {};

Messages.CONSTRUCT_ERROR = "이 객체는 new를 사용하여 생성해야 합니다.";
Messages.REQUIRED_EMPTY_ERROR = function(...empties) {
    return empties.join(',') +  ' 항목은 필수요소 입니다.'
}