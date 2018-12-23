"use strict";
const $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
const $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`;
const $inform = `font-size: 12px; color: rgba( 114, 20, 214, 0.75 );`;
const $client = ( () => { try { return browser; } catch ( e ) { return chrome; } } )();
const $baseUri = chrome.runtime.getURL( "" );

function moduleLoader ( scripts ) {
    for ( const source of scripts ) {
        let script;
        console.log( `%cNow loading... ${source}`, $log );
        switch ( source.split( "." ).pop() ) {
            case "js": {
                script = document.createElement( 'script' );
                script.setAttribute( "defer", "" );
                script.type = "module";
                script.src = $baseUri + source;
                break;
            }
            case "css": {
                script = document.createElement( 'link' );
                script.rel="stylesheet";
                script.href = $baseUri + source;
                break;
            }
        }
        document.head.appendChild( script );
    }
}

class CommunicationTunnel {
    constructor () {
        Object.defineProperties( this, {
            listener: { value: [] },
        } );
        window.addEventListener(
            "message",
            //event => ( ( event.source === window ) && ( event.data.mode === "request" ) ? channel.runtime.sendMessage( event.data ) : false )
            ( { source, data: { type, event } } ) => {
                if ( source !== window ) return null;
                this.listener
                    .filter( listener => listener.type === type )
                    .forEach( ( { listener } ) => listener( event ) );
            }
        );
//        client.runtime.onMessage.addListener(
//            ( message, sender, sendResponse ) => ( sender.id === channel.runtime.id ? window.postMessage( Object.assign( { mode: "response" }, message ), "*" ) : false )
//        );
    }

    broadcast ( type, event ) {
        return window.postMessage( { type, event }, "*" );
    }

    addListener ( type, listener ) {
        if ( this.listener.findIndex( event => event.fn === listener ) > -1 ) return false;
        return this.listener.push( { type, listener } );
    }

    removeListener ( listener ) {
        let removed = [];
        while ( this.listener.findIndex( event => event.fn === listener ) > -1 ) {
            removed.push( this.listener.splice( this.listener.findIndex( event => event.fn === listener ), 1 ) );
        }
        return removed;
    }
}

console.log( `%cComic grabbler v0.0.1 Rev. 0`, `font-size: 48px; color: rgba( 117, 211, 88, 0.75 );` );
console.log( `%cLoading components`, $log );
moduleLoader( [ `scripts/comicGrabbler.js`, `ui/menu.css` ] );

const $tunnel = new CommunicationTunnel();
console.log( `%cUnder developing - extension id: ${chrome.runtime.id}`, $log.replace( /rgba\([\d\s,.]+\)/, "rgba( 114, 20, 214, 0.75 )" ) );
$tunnel.addListener( "ComicGrabbler.saveArchive", function ( download ) {
    $client.runtime.sendMessage( { type: "saveToLocal", download } );
} );
/**
 * @description Just pass through messages from extension background to front page via content script.
 */
$client.runtime.onMessage.addListener(
    ( message, sender, sendResponse ) =>
    ( ( sender.id === $client.runtime.id ) ? window.postMessage( message, "*" ) : null )
);
async function retrieveRules () {
    console.log( `%cRetrieve rules from extension storage.`, $log );
    const $memory = await new Promise( resolve => $client.storage.local.get( null, resolve ) );
    console.log( `%cSuccessfully retrieved.`, $log );
    let { keyboard, session, local, lang, rules } = $memory;
    for ( const rule of rules ) {
        if ( document.URL.match( RegExp( rule.RegExp ) ) ) {
            console.log( `%cRule matched: ${rule.name} - /${rule.RegExp}/`, $inform );
            return ( {
                keyboard,
                session,
                local,
                configuration: {
                    lang,
                    ...rule.rule
                }
            } );
        }
    }
    return ( {
        keyboard,
        session,
        local,
        configuration: {
            lang,
        }
    } );
}
retrieveRules().then(
    preset => 
    $tunnel.addListener(
        "ComicGrabbler.readyExtension",
        ( event ) => $tunnel.broadcast( "ComicGrabbler.activateExtension", preset )
    )
);
