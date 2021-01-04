"use strict";
import { uid } from '/lib/extendVanilla.js';

const pageUid = uid();

const $client = ( () => {
    let client;
    try {
        client = { ...browser };
        //move downloads api as dl
        if ( browser.downloads ) {
            delete client.downloads;
            client.dl = browser.downloads;
        }
        //move storage api as [area]Storage
        delete client.storage;
        for ( let area of [ "sync", "local" ] ) {
            client[ `${area}Storage` ] = browser.storage[area];
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
                    client.dl[method] = arg => new Promise( resolve => chrome.downloads[method]( arg, resolve ) );
            }
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
        catch {
            let BC = new BroadcastChannel( `ComicGrabber` );
            //let BC = new BroadcastChannel( `ComicGrabber.${pageUid}` );
            BC.addEventListener( "message", ev => console.log( ev ) );
            BC.postMessage( "TEST" );
            
            client = {
                runtime: {
                    getURL: function () {
                        try { throw new Error() }
                        catch ( { fileName } ) {
                            console.log( fileName );
                            return fileName.match( /(?<baseUrl>^.+?\/\/.+?\/)/ ).groups.baseUrl;
                        }
                    }
                }
            };
        }
    }

    return client;
} )();

export { $client, pageUid };