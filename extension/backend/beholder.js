"use strict";
const client = ( function () {
    try {
        return browser;
    }
    catch ( e ) {
        return chrome;
    }
} )();

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
            api: { value: client.downloads },
        } );
    }

    getMedia ( url ) {
        return new Promise( ( resolve, reject ) => {
            let xhr = new XMLHttpRequest();
            xhr.open( "GET", url, true );
            xhr.responseType = "blob";
            xhr.addEventListener( "load", e => { this.downloading--; resolve( xhr.response ); } );
            xhr.addEventListener( "error", e => { console.log( e ); reject( new Blob( [ url ], { type: "plain/text" } ) ); } );
            this.downloading++;
            xhr.send();
        } );
    }

    filename ( name, type ) {
        let extension = type.split( "/" ).pop();
        if ( name.match( RegExp( `(?<name>.+)\.${extension}\$` ) ) ) {
            
        }
    }

    makeArchive ( mediaList, archiveName ) {
        let Zip = new JSZip(), list = [];
        Zip.file( 'Media origin.json', new Blob( [ JSON.stringify( mediaList ) ], { type: 'text/plain' } ) );
        for ( let media of mediaList ) {
            list.push( this.getMedia( media ).then( blob => Zip.file( media.match( /.+\/(?<uri>.+)/ ).groups.uri, blob ) ) );
        }
        Promise.all( list ).then( () => {} )
        Zip.generateAsync( { type: "blob" } )
        .then( blob => this.save( {
            url: URL.createObjectURL( blob ),
            filename: `${archiveName}.zip`.replace( /\/+/g, "/" ),
            conflictAction: "overwrite",
            retainList: archive.retainList
        } ) )
    }

    save ( info ) {
        if ( info.blob ) {
            if ( info.blob instanceof Blob && blob.size ) {
                info.url = URL.createObjectURL( info.blob );
            }
            delete info.blob;
        }
        let download;
        try {
            browser;
            download = api.download( info );
        } catch ( e ) {
            download = new Promise( resolve => this.api.download( info, resolve ) );
        }
        return download.then( () => URL.revokeObjectURL( info.url ) );
    }
}

class DownloadManager {
    constructor ( downloads ) {
        this._api = downloads;
        this.downloading = 0;
        this._path = "Downloaded images";
    }

    static ajax ( url ) {
        return new Promise( ( resolve, reject ) => {
            let xhr = new XMLHttpRequest();
            xhr.open( "GET", url, true );
            xhr.responseType = "blob";
            xhr.addEventListener( "load", event => resolve( xhr.response ) );

            xhr.send();
        } );
    }

    set setDownloadPath ( path ) {
        this._path = path;
    }

    batchDownload ( archive ) {
        this.downloading++;
        let Zip = new JSZip();
        let promises = [];
        if ( archive.downloadPath ) this.setDownloadPath = archive.downloadPath;
        Zip.file( 'Downloaded from.txt', new Blob( [ archive.downloadFrom ], { type: 'text/plain' } ) );
        for ( const item of archive.list ) {
            if ( item.blob && item.blob.size ) promises.push( Promise.resolve( Zip.file( item.name, item.blob ) ) );
            else promises.push( this.constructor.ajax( item.url ).then( blob => Zip.file( item.name, blob ) ) );
        }
        return Promise.all( promises )
            .then( () =>  Zip.generateAsync( { type: "blob" } )
            .then( blob => this.download( {
                url: URL.createObjectURL( blob ),
                filename: `${this._path}/${archive.title}/${archive.episode || archive.title}.zip`.replace( /\/+/g, "/" ),
                conflictAction: "overwrite",
                retainList: archive.retainList
            } ) ) );
    }

    download ( info ) {
        let api = this._api, retainList = info.retainList;
        delete info.retainList;
        let download = function ( info ) {
            let download, blob = info.blob;
            delete info.blob;
            try {
                browser;
                if ( blob instanceof Blob && blob.size ) {
                    info.url = URL.createObjectURL( blob );
                }
                download = api.download( info );
            }
            catch ( e ) {
                download = new Promise( ( resolve, reject ) => api.download( info, resolve ) );
            }

            return download;
        };
        return download( info )
            .then( id => new Promise( ( resolve, reject ) => {
                    function onComplete ( item ) {
                        if ( item.id === id && item.state && item.state.current === "complete" ) {
                            api.onChanged.removeListener( onComplete );
                            if ( !retainList ) api.erase( { id } );
                            resolve( info.url );
                        }
                    }
                    api.onChanged.addListener( onComplete );
                } ) )
            .then( url => {
                URL.revokeObjectURL( url );
                this.downloading--;
            } );
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
        filter: () => true ,
        fields: [
            {
                name: "Access-Control-Allow-Origin",
                value: "*"
            }
        ]
    },
];
client.webRequest.onHeadersReceived.addListener( ( details ) => {
    let header = new Header( details.responseHeaders ), flag;

    for ( const modifier of headerModifier ) {
        if ( modifier.filter( details, header ) ) {
            flag = true;
            for ( const field of modifier.fields ) {
                header.write( field );
            }
        }
    }

    if ( flag ) {
        return { responseHeaders: header.arrayform };
    }
}, { urls: [ '*://*/*' ] }, [ 'blocking', 'responseHeaders' ] );
