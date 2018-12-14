"use strict";
( function moduleLoader ( scripts ) {
    for ( const source of scripts ) {
        let script = document.createElement( 'script' );
        script.setAttribute( "defer", "" );
        script.type="module";
        script.src = source;
        document.head.appendChild( script );
    }
} ) ( [ chrome.runtime.getURL( "scripts/Viewer.js" ) ] );

class CommunicationTunnel {
    constructor ( channel ) {
        window.addEventListener( "message", event => ( ( event.source === window ) && ( event.data.mode === "request" ) ? channel.runtime.sendMessage( event.data ) : false ) );
        channel.runtime.onMessage.addListener( ( message, sender, sendResponse ) => ( sender.id === channel.runtime.id ? window.postMessage( Object.assign( { mode: "response" }, message ), "*" ) : false ) );
    }
}

let browserAPI = ( () => {
    try { return browser; }
    catch ( e ) { return chrome; }
} )();
new CommunicationTunnel( browserAPI );

