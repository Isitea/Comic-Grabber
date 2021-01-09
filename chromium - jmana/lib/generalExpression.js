"use strict";
let regex = /^(?<title>.+?|(?:[\(\[]?단편[\]?\)]?.+?))\s*(?<episode>(?:\d[.\d\s\-\∼\~화권전후편상중하]+|(?:번외|특별).+)|(?:\#\d+)|(stage\s*\d+))?$/i

export { regex };