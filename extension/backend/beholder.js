"use strict";
const $client = ( function () { try { return browser; } catch ( e ) { return chrome; } } )();

class Header {
    constructor ( httpHeader ) {
        for ( const field of httpHeader ) this.write( field );
    }

    write ( { name, value } ) {
        name = name.toLowerCase();
        if ( value ) {
            switch ( name ) {
                case "cache-control":
                    this[name] = ( this[name] ? `${this[name]}, ` : "" ) + value;
                    break;
                case "set-cookie":
                    if ( !this[name] ) this[name] = [];
                    this[name].push( value );
                    break;
                default:
                    this[name] = value;
            }
        }
        else delete this[name];

        return { [name]: this[name] };
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

class Downloader {
    constructor () {
        Object.defineProperties( this, {
            api: { value: $client.downloads },
        } );
    }

    save ( download ) {
        const $api = ( () => {
            try { browser; return this.api.download; }
            catch ( e ) { return ( download ) => new Promise( resolve => this.api.download( download, resolve ) ) }
        } )();
        if ( download.blob ) {
            if ( download.blob instanceof Blob && blob.size ) {
                download.url = URL.createObjectURL( download.blob );
            }
            delete download.blob;
        }
        return $api( download ).then( () => URL.revokeObjectURL( download.url ) );
    }
}

let headerModifier = [
//    {
//        filter: ( details, header ) => ( header[ "content-type" ] ? header[ "content-type" ].match( "image" ) : false ),
//        fields: [
//            {
//                name: "Access-Control-Allow-Origin",
//                value: "*"
//            }
//        ]
//    },
    {
        filter: ( details, header ) => true ,
        fields: [
            ( { initiator, originUrl } ) => ( {
                name: "Access-Control-Allow-Origin",
                value: ( initiator || originUrl || "" )
            } ),
        ]
    },
];
$client.webRequest.onHeadersReceived.addListener( ( details ) => {
    let header = new Header( details.responseHeaders ), flag;

    for ( const modifier of headerModifier ) {
        if ( modifier.filter( details, header ) ) {
            flag = true;
            for ( const field of modifier.fields ) {
                header.write( ( field instanceof Function ? field( details, header ) : field ) );
            }
        }
    }

    if ( flag ) {
        return { responseHeaders: header.arrayform };
    }
}, { urls: [ '*://*/*' ] }, [ 'blocking', 'responseHeaders' ] );

const $downloader = new Downloader();
$client.runtime.onMessage.addListener( ( message, sender, sendResponse ) => {
    console.log( message );
    switch ( message.type ) {
        case "saveToLocal": {
            $downloader.save( message.download )
                .then( () => $client.tabs.sendMessage( sender.tab.id, { type: "ComicGrabbler.archiveSaved" } ) );
            break;
        }
    }
} )