"use strict";
const $log =  `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
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
console.log( `%cUnder developing - extention id: ${chrome.runtime.id}`, $log.replace( /rgba\([\d\s,.]+\)/, "rgba( 114, 20, 214, 0.75 )" ) );
$tunnel.addListener( "ComicGrabbler.saveArchive", function ( download ) {
    $client.runtime.sendMessage( { type: "saveToLocal", download } );
} );
$client.runtime.onMessage.addListener(
    ( message, sender, sendResponse ) =>
    ( ( sender.id === $client.runtime.id ) ? window.postMessage( message, "*" ) : null )
);

/** Variable declaration(Preset) for test */
{
    let Preset = {
        lang: "ko-kr",
        savePath: "Downloaded comicsT",
        saveOnLoad: false,
        moveOnSave: true,
        onConflict: "overwrite",
        moveNext: ".next a",
        movePrev: ".pre a",
        subject: {
            title: {
                selector: ".comicinfo .detail h2:first-child",
                propertyChain: ".firstChild.textContent"
            },
            subTitle: {
                selector: ".tit_area .view h3",
                propertyChain: ".textContent"
            }
        },
        images: ".view_area .wt_viewer img",
    };
    $tunnel.addListener( "ComicGrabbler.readyExtention", ( event ) => {
        if ( document.URL.match( /comic.naver.com/ ) ) {
            $tunnel.broadcast( "ComicGrabbler.activateExtention", Preset );
        }
    } );
}

