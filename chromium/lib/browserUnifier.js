"use strict";

// Immediately Invoked Function Expression (IIFE) to create and return the client object.
// This helps encapsulate the logic and prevent polluting the global scope.
const $client = ( () => {
    let client;

    // --- Browser Environment Detection and API Unification ---
    try {
        // Attempt to access the 'browser' object, which indicates a Firefox environment.
        client = { ...browser };

        // Unify the downloads API: Move it to 'client.dl' and ensure it uses Promises.
        if (browser.downloads) {
            // Remove the original downloads object from the client.
            delete client.downloads;
            // Assign the browser's downloads object to 'client.dl'.
            // Firefox's downloads API already returns Promises, so no further wrapping is needed.
            client.dl = browser.downloads;
        }

        // Unify the storage API: Move area-specific storage to 'client.[area]Storage'.
        if ( browser.storage ) {
            // Remove the original storage object from the client.
            delete client.storage;
            // Iterate through storage areas ('sync', 'local') and assign them to area-specific properties.
            for (const area of ["sync", "local"]) {
                client[ `${area}Storage` ] = browser.storage[area];
            }
        }
    } catch (firefoxError) {
        // If accessing 'browser' fails, it's likely a Chromium environment.
        try {
            // Attempt to access the 'chrome' object, which indicates a Chromium environment.
            client = { ...chrome };

            // Unify the downloads API: Move it to 'client.dl' and wrap methods to return Promises.
            if (chrome.downloads) {
                // Remove the original downloads object from the client.
                delete client.downloads;

                // Create a new object for the unified downloads API.
                client.dl = {
                    // Wrap getFileIcon to return a Promise.
                    getFileIcon: ( downloadId, { size = 32 } ) => new Promise( resolve => chrome.downloads.getFileIcon( downloadId, { size }, resolve ) )
                };

                // Directly assign methods that don't need promise wrapping (e.g., events).
                for (const method of ["open", "setShelfEnabled", "show", "showDefaultFolder", "onChanged", "onDeterminingFilename"])
                    client.dl[method] = chrome.downloads[method];

                // Wrap methods that use callbacks to return Promises and handle errors.
                for (const method of ["acceptDanger", "cancel", "download", "erase", "pause", "removeFile", "resume", "search"])
                    client.dl[method] = arg => new Promise( ( resolve, reject ) => {
                        chrome.downloads[method]( arg, function ( msg ) {
                            // Check for runtime errors after the operation.
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError.message); // Reject the promise with the error message.
                            } else {
                                resolve(msg); // Resolve the promise with the result.
                            }
                        } );
                    } );
            }

            // Unify the storage API: Move area-specific storage and wrap methods to return Promises.
            if (chrome.storage) {
                // Remove the original storage object from the client.
                delete client.storage;

                // Iterate through storage areas ('sync', 'local').
                for (const area of ["sync", "local"]) {
                    // Create a new object for the unified area-specific storage API.
                    client[ `${area}Storage` ] = {
                        // Wrap clear to return a Promise.
                        clear: () => new Promise( resolve => chrome.storage[area].clear( resolve ) ),
                        // Directly assign onChanged as it's an event listener.
                        onChanged: chrome.storage[area].onChanged,
                    };

                    // Wrap methods that use callbacks to return Promises.
                    for (const method of ["getBytesInUse", "get", "set", "remove"])
                        client[ `${area}Storage` ][method] = arg => new Promise( resolve => chrome.storage[area][method]( arg, resolve ) );
                }
            }
        } catch (chromiumError) {
            // If both 'browser' and 'chrome' access fail, it's likely a standalone script or other environment.
            // In this case, create a pseudo-client using BroadcastChannel for communication.

            // Determine the base URI to use as a unique identifier.
            const { baseUri } = ( () => {
                try { throw new Error() }
                // Extract the base URI from the error's fileName.
                catch ({ fileName }) { return fileName.match(/(?<baseUri>^.+?\/\/.+?\/)/).groups; }
            } )();

            // Use the base URI as a unique page identifier for the BroadcastChannel.
            const pageUid = window[baseUri];

            // Create a pseudo-client using EventTarget for message handling.
            let pseudoClient = new EventTarget();
            // Add convenience methods for add/remove listener.
            pseudoClient.addListener = ( listener ) => pseudoClient.addEventListener( "message", listener );
            pseudoClient.removeListener = ( listener ) => pseudoClient.removeEventListener( "message", listener );

            // Create a BroadcastChannel for inter-context communication.
            let BC = new BroadcastChannel( `ComicGrabber.${pageUid}` );
            // Forward messages from the BroadcastChannel to the pseudo-client's event target.
            BC.addEventListener( "message", ( { data } ) => pseudoClient.dispatchEvent( Object.assign( new Event( "message" ), data ) ) );

            // Function to fetch i18n messages via BroadcastChannel.
            function geti18n ( resolve ) {
                // Listen for the i18n response and resolve the promise.
                BC.addEventListener( "message", ( { data } ) => resolve( pseudoClient.i18n = data ), { once: true } );
                // Post a message to request i18n data.
                BC.postMessage( { action: "i18n" } );
            }

            // Function to fetch the manifest via BroadcastChannel.
            function getManifest ( resolve ) {
                // Listen for the manifest response and resolve the promise.
                BC.addEventListener( "message", ( { data } ) => resolve( pseudoClient.manifest = data ), { once: true } );
                // Post a message to request manifest data.
                BC.postMessage( { action: "manifest" } );
            }

            // Construct the pseudo-client object.
            client = {
                runtime: {
                    // Provide a basic getURL implementation.
                    getURL: ( uri = "" ) => baseUri + uri,
                    // Use the pseudo-client as the onMessage event target.
                    onMessage: pseudoClient,
                    // Provide a method to get the manifest (once fetched).
                    getManifest: () => pseudoClient.manifest,
                    // Implement sendMessage using BroadcastChannel with promise resolution.
                    sendMessage: msg => new Promise( function ( response ) {
                        // Function to handle responses and ensure the correct message is processed.
                        function uniqueResponse ( { data } ) {
                            if ( data.message == msg.message ) {
                                // If the message matches, process the data and resolve the promise.
                                delete data.message;
                                response( data.data );
                            }
                            else {
                                // If the message doesn't match, re-attach the listener for the next message.
                                BC.addEventListener( "message", uniqueResponse, { once: true } );
                            }
                        }
                        // Listen for the unique response.
                        BC.addEventListener( "message", uniqueResponse, { once: true } );
                        // Post the message to the BroadcastChannel.
                        BC.postMessage( msg );
                    } ),
                },
                i18n: {
                    // Provide a basic getMessage implementation using fetched i18n data.
                    getMessage: key => pseudoClient.i18n[key].message
                }
            };
            // Add a 'complete' promise that resolves after fetching i18n and manifest data.
            client.complete = new Promise( geti18n ).then( () => new Promise( getManifest ) );
        }
    }

    // Return the constructed client object.
    return client;
} )();

// Export the unified client object.
export { $client };