"use strict";
const uidBox = new Uint8Array( 16 );
function uid () {
    crypto.getRandomValues( uidBox );
    
    return uidBox.reduce( ( result, number ) => result + number.toString( 16 ).padStart( 2, "0" ), "" );
}

async function main () {
    const pageUid = uid();
    let locale = browser.runtime.getURL( `_locales/${browser.i18n.getMessage( "locale" )}/messages.json`);
    let i18n = await fetch( locale ).then( response => response.json() );
    let BC = new BroadcastChannel( `ComicGrabber.${pageUid}` );
    BC.addEventListener( "message", ( { data } ) => {
        switch ( data.action ) {
            case "manifest": {
                BC.postMessage( browser.runtime.getManifest() );
                break;
            }
            case "i18n": {
                BC.postMessage( i18n );
                break;
            }
            default: {
                browser.runtime.sendMessage( data );
                break;
            }
        }
    } );
    browser.runtime.onMessage.addListener( msg => BC.postMessage( msg ) );

    let script = document.createElement( "script" );
    script.src = `${browser.runtime.getURL( "" ).replace( /\/$/, "" )}/app/service.js#${pageUid}`;
    script.setAttribute( "type", "module" );
    document.head.appendChild( script );

    return "Firefox module loader activated";
}

main().then( msg => console.log( msg ) );