"use strict";
const $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
const $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`;
const $inform = `font-size: 12px; color: rgba( 255, 127, 196, 1 );`;
const $client = ( () => { try { return browser; } catch ( e ) { return chrome; } } )();
const $baseUri = $client.runtime.getURL( "" );

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
    /**
     * @param {*} client - Browser specific global object like 'chrome' in Chrome or 'browser' in Firefox.
     */
    constructor () {
        Object.defineProperties( this, {
            listener: { value: [] },
        } );
        window.addEventListener(
            "message",
            ( { source, data: { type, event } = {} } ) => {
                if ( source !== window ) return null;
                this.listener
                    .filter( listener => listener.type === type )
                    .forEach( ( { listener } ) => listener( event ) );
            }
        );
    }

    /**
     * Post message to content script using Window.postMessage.
     * @param {String} type - Event type
     * @param {Object} event - Transferable data
     */
    broadcast ( type, event ) {
        return window.postMessage( { type, event }, "*" );
    }

    /**
     * Add event handler.
     * @param {String} type 
     * @param {Function} listener 
     */
    addListener ( type, listener ) {
        if ( this.listener.findIndex( event => event.fn === listener ) > -1 ) return false;
        return this.listener.push( { type, listener } );
    }

    /**
     * Remove event handler.
     * @param {Function} listener 
     */
    removeListener ( listener ) {
        let removed = [];
        while ( this.listener.findIndex( event => event.fn === listener ) > -1 ) {
            removed.push( this.listener.splice( this.listener.findIndex( event => event.fn === listener ), 1 ) );
        }
        return removed;
    }
}

console.log( `%cComic grabber v0.0.1 Build 11`, `font-size: 48px; color: rgba( 117, 211, 88, 0.75 );` );
//console.log( `%cUnder developing - extension id: ${chrome.runtime.id}`, $log.replace( /rgba\([\d\s,.]+\)/, "rgba( 114, 20, 214, 0.75 )" ) );
const $tunnel = new CommunicationTunnel();
const $URI = decodeURI( document.URL );
$tunnel.addListener( "ComicGrabber.saveArchive", function ( download ) {
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
    let { keyboard, session, local, generalExpression, lang, rules } = $memory;
    for ( const rule of rules ) {
        console.log( `%cRule test: ${rule.name} - /${rule.RegExp}/: ${$URI}`, $inform );
        if ( $URI.match( RegExp( rule.RegExp ) ) ) {
            console.log( `%cRule matched: ${rule.name} - /${rule.RegExp}/`, $inform );
            return ( {
                matched: true,
                keyboard,
                session,
                local,
                generalExpression,
                configuration: {
                    lang,
                    ...rule.rule
                },
                $delay: rule.$delay,
                $await: rule.$await,
            } );
        }
    }
    return { matched: false };
}
retrieveRules().then(
    ( { matched, $await, $delay, ...configuration } ) => {
        if ( matched ) {
            console.log( `%cLoading components...`, $log );
            moduleLoader( [ `scripts/ComicGrabber.js`, `ui/menu.css` ] );
            $tunnel.addListener(
                "ComicGrabber.readyExtension",
                async ( event ) => {
                    if ( $await ) {
                        console.log( `%cWait WebWorker response`, $inform );
                        let webWorker = new Worker( URL.createObjectURL( new Blob( [ $await ], { type: "plain/text" } ) ) );
                        await new Promise( resolve => {
                            webWorker.addEventListener( "message", resolve );
                            webWorker.postMessage( document.URL );
                        } );
                        console.log( `%cResume procedure`, $inform );
                    }
                    if ( $delay ) {
                        console.log( `%cWait ${$delay} seconds`, $inform );
                        await new Promise( resolve => setTimeout( resolve, $delay ) );
                        console.log( `%cResume procedure`, $inform );
                    }
                    $tunnel.broadcast( "ComicGrabber.activateExtension", configuration );
                }
            );
        }
        else {
            console.log( `%cNo rule matched.\nWaiting user action...`, $log );
        }
    }
);
