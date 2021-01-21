"use strict";
const $client = ( () => {
    let client;
    try {
        client = { ...browser };
        //move downloads api as dl
        if ( browser.downloads ) {
            delete client.downloads;
            client.dl = browser.downloads;
        }
        if ( browser.storage ) {
            //move storage api as [area]Storage
            delete client.storage;
            for ( let area of [ "sync", "local" ] ) {
                client[ `${area}Storage` ] = browser.storage[area];
            }
        }
    }
    catch {
        try {
            client = { ...chrome };
            //move downloads api and change return values in promise.
            if ( chrome.downloads ) {
                delete client.downloads;
                client.dl = {
                    getFileIcon: ( downloadId, { size = 32 } ) => new Promise( resolve => chrome.downloads.getFileIcon( downloadId, { size }, resolve ) )
                };
                for ( let method of [ "open", "setShelfEnabled", "show", "showDefaultFolder", "onChanged" ] )
                    client.dl[method] = chrome.downloads[method];
                for ( let method of [ "acceptDanger", "cancel", "download", "erase", "pause", "removeFile", "resume", "search" ] )
                    client.dl[method] = arg => new Promise( ( resolve, reject ) => {
                        chrome.downloads[method]( arg, function ( msg ) {
                            if ( chrome.runtime.lastError ) reject( chrome.runtime.lastError.message );
                            else resolve( msg );
                        } );
                    } );
            }
            if ( chrome.storage ) {
                //move storage api and change return values in promise.
                delete client.storage;
                for ( let area of [ "sync", "local" ] ) {
                    client[ `${area}Storage` ] = {
                        clear: () => new Promise( resolve => chrome.storage[area].clear( resolve ) ),
                        onChanged: chrome.storage[area].onChanged,
                    };
                    for ( let method of [ "getBytesInUse", "get", "set", "remove" ] ) 
                        client[ `${area}Storage` ][method] = arg => new Promise( resolve => chrome.storage[area][method]( arg, resolve ) );
                }
            }
        }
        catch {
            const { baseUri, pageUid } = ( () => {
                try { throw new Error() }
                catch ( { fileName } ) { return fileName.match( /(?<baseUri>^.+?\/\/.+?\/).*\#(?<pageUid>.+)/ ).groups; }
            } )();

            let pseudoClient = new EventTarget();
            pseudoClient.addListener = ( listener ) => pseudoClient.addEventListener( "message", listener );
            pseudoClient.removeListener = ( listener ) => pseudoClient.removeEventListener( "message", listener );
            let BC = new BroadcastChannel( `ComicGrabber.${pageUid}` );
            BC.addEventListener( "message", ( { data } ) => pseudoClient.dispatchEvent( Object.assign( new Event( "message" ), data ) ) );

            function geti18n ( resolve ) {
                BC.addEventListener( "message", ( { data } ) => resolve( pseudoClient.i18n = data ), { once: true } );
                BC.postMessage( { action: "i18n" } );
            }
            function getManifest ( resolve ) {
                BC.addEventListener( "message", ( { data } ) => resolve( pseudoClient.manifest = data ), { once: true } );
                BC.postMessage( { action: "manifest" } );
            }
            
            client = {
                runtime: {
                    getURL: ( uri = "" ) => baseUri + uri,
                    onMessage: pseudoClient,
                    getManifest: () => pseudoClient.manifest,
                    sendMessage: msg => BC.postMessage( msg ),
                },
                i18n: {
                    getMessage: key => pseudoClient.i18n[key].message
                }
            };
            client.complete = new Promise( geti18n ).then( () => new Promise( getManifest ) );
        }
    }

    return client;
} )();

export { $client };