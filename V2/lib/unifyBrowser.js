"use strict";

const $client = ( () => {
    let client;
    try {
        client = { ...browser };
        delete client.storage;
        for ( let area of [ "sync", "local" ] ) {
            client[ `${area}Storage` ] = {
                getBytesInUse: arg => browser.storage[area].getBytesInUse( arg ),
                get: arg => browser.storage[area].get( arg ),
                set: arg => browser.storage[area].set( arg ),
                remove: arg => browser.storage[area].remove( arg ),
                clear: () => browser.storage[area].clear(),
                onChanged: browser.storage[area].onChanged,
                download: arg => browser.downloads.download( arg )
            }
        }
    }
    catch {
        client = { ...chrome };
        delete client.storage;
        for ( let area of [ "sync", "local" ] ) {
            client[ `${area}Storage` ] = {
                getBytesInUse: arg => new Promise( resolve => chrome.storage[area].getBytesInUse( arg, resolve ) ),
                get: arg => new Promise( resolve => chrome.storage[area].get( arg, resolve ) ),
                set: arg => new Promise( resolve => chrome.storage[area].set( arg, resolve ) ),
                remove: arg => new Promise( resolve => chrome.storage[area].remove( arg, resolve ) ),
                clear: () => new Promise( resolve => chrome.storage[area].clear( resolve ) ),
                onChanged: chrome.storage[area].onChanged,
                download: new Promise( resolve => chrome.downloads.download( arg, resolve ) )
            }
        }
    }

    return client;
} )();

export { $client };