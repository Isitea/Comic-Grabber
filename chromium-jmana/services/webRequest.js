"use strict";
class Header {
    constructor ( httpHeader ) {
        for ( const field of httpHeader ) this.write( field );
        Object.defineProperties( this, { modified: { value: false, configurable: false, writable: true, enumerable: false } } );
    }

    read ( name ) {
        return this[ name.toLowerCase() ];
    }

    write ( { name, value } ) {
        this.modified = true;
        let key = name.toLowerCase();
        if ( value ) {
            switch ( key ) {
                case "cache-control":
                    this[key] = ( this[key] ? `${this[key]}, ` : "" ) + value;
                    break;
                case "set-cookie":
                    if ( !this[key] ) this[key] = [];
                    this[key].push( value );
                    break;
                default:
                    this[key] = value;
            }
        }
        else delete this[key];

        return { [key]: this[key] };
    }

    get arrayform () {
        let httpHeader = [];
        for ( const [ name, value ] of Object.entries( this ) ) {
            if ( value instanceof Array ) for ( const item of value ) httpHeader.push( { name, value: item } );
            else httpHeader.push( { name, value } );
        }

        return httpHeader;
    }
}

function onBeforeSendHeaders ( { requestHeaders, type} ) {
    const header = new Header( requestHeaders );
    let acrh, referer;
    if ( acrh = header.read( "Access-Control-Request-Headers" ) ) {
        let list = acrh.split( "," );
        let index;
        if ( ( index = list.indexOf( "creferer" ) ) > -1 ) {
            let [ ,referer ] = list.splice( index, 2 );
            header.write( { name: "referer", value: `https://${referer}/` } );
            header.write( { name: "Access-Control-Request-Headers", value: list } );
        };
    }
    else if ( referer = header.read( "creferer" ) ) {
        header.write( { name: "referer", value: `https://${referer}/` } );
        header.write( { name: "creferer" } );
        header.write( { name: referer } );
    }
    if ( header.modified ) return { requestHeaders: header.arrayform };
}

class webRequest {
    connect ( webRequest ) {
        webRequest.onBeforeSendHeaders.addListener(
            onBeforeSendHeaders,
            { urls: [ '*://*/*' ] },
            [ 'blocking', 'requestHeaders', 'extraHeaders' ]
        )
    }
    disconnect ( webRequest ) {
        webRequest.onBeforeSendHeaders.removeListener( onBeforeSendHeaders )
    }
}

export { webRequest };