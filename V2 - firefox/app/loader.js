"use strict";
const uidBox = new Uint8Array( 16 );
function uid () {
    crypto.getRandomValues( uidBox );
    
    return uidBox.reduce( ( result, number ) => result + number.toString( 16 ).padStart( 2, "0" ), "" );
}

async function main () {
    const pageUid = uid();
    let locale = browser.runtime.getURL( `_locales/${browser.i18n.getMessage( "locale" )}/messages.json`);
    let i82n = await fetch( locale ).then( response => response.json() );
    let BC = new BroadcastChannel( `ComicGrabber.${pageUid}` );
    BC.addEventListener( "message", ev => console.log( ev ) );

    let script = document.createElement( "script" );
    script.src = `${browser.runtime.getURL( "" ).replace( /\/$/, "" )}/app/service.js?${pageUid}`;
    script.setAttribute( "type", "module" );
    document.head.appendChild( script );

    return "Firefox module loader activated";
}

main().then( msg => console.log( msg ) );