"use strict";
let script = document.createElement( "script" );
script.src = `${browser.runtime.getURL( "" ).replace( /\/$/, "" )}/app/service.js`;
script.setAttribute( "type", "module" );
document.head.appendChild( script );

let BC = new BroadcastChannel( "ComicGrabber" );
BC.addEventListener( "message", ev => console.log( ev ) );