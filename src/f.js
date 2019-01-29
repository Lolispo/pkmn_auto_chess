// Author: Petter Andersson
'use strict';



exports.getRandomInt = function(max){
    return Math.floor(Math.random() * Math.floor(max));
}

exports.print = function(obj, msg){
    console.log(msg + JSON.stringify(obj));
}