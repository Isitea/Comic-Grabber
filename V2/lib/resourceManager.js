"use strict";
import { HTML, logger } from "/lib/extendVanilla.js";
const log = logger.log;

class resourceManager {
    constructor ( baseUri ) {
        this.baseUri = baseUri;
        this.loaded = [];
    }

    load ( source = "", type ) {
        if ( document.querySelector( `script[src*=${source.replace( /([/.])/g, "\\$1" )}], link[href*=${source.replace( /([/.])/g, "\\$1" )}]` ) ) return "Already attached"
        let script, uri;
        if ( source.match( /^https?|^blob:/ ) ) uri = source;
        else uri = this.baseUri + source;
        switch ( type || source.split( "." ).pop() ) {
            case "js": {
                [ script ] = HTML.render( { script: { src: uri } } );
                break;
            }
            case "css": {
                [ script ] = HTML.render( { link: { rel: "stylesheet", href: uri } } );
                break;
            }
        }
        
        log( `Attaching... ${uri.replace( this.baseUri, "" )}` );
        this.loaded.push( script );
        document.head.appendChild( script );

        return "Successfully attached";
    }
    
    unload ( item = null ) {
        let index;
        if ( item === null ) {
            log( `Detaching every script` );
            item = /\/.+/;
        }
        if ( index = this.loaded.indexOf( item ) >= 0 ) {
            item.remove();
            this.loaded.splice( index, 1 );
            log( `Detaching... ${( item.src || item.href ).replace( this.baseUri, "" )}` );
        } 
        else if ( item instanceof RegExp || typeof item == "string" ) {
            let pattern = new RegExp( item );
            this.loaded = this.loaded.reduce( ( result, current ) => {
                let uri = current.src || current.href;
                if ( uri.replace( this.baseUri, "" ).match( pattern ) ) {
                    current.remove();
                    log( `Detaching... ${( current.src || current.href ).replace( this.baseUri, "" )}` );
                }
                else result.push( current );

                return result;
            }, [] );
        }
    }
}

export { resourceManager };