"use strict";
async function main () {
    const logger = ( function (
            $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`,
            $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`,
            $inform = `font-size: 12px; color: rgba( 114, 20, 214, 0.75 );`
        ) {

        return {
            log: ( text ) => console.log( `%c${text}`, $log ),
            alert: ( text ) => console.log( `%c${text}`, $alert ),
            inform: ( text ) => console.log( `%c${text}`, $inform ),
        };
    } )();

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
                    onChanged: browser.storage[area].onChanged
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
                    onChanged: chrome.storage[area].onChanged
                }
            }
        }

        return client;
    } )();
    const $baseUri = $client.runtime.getURL( "" );
    const $locale = $client.i18n.getMessage;

    function moduleWrapper ( script ) {
        return URL.createObjectURL( new Blob( [ script ], { type: "text/javascript" } ) );
    }

    function searchSiteModule ( moduleList, uri = document.URL ) {
        let siteModule = "/modules/universal.js";
        for ( const module of moduleList ) {
            if ( uri.match( module.matchPattern ) ) {
                siteModule = module.uri || moduleWrapper( module.content );
                break;
            }
        }

        return siteModule;
    }

    logger.inform( `Comic grabber v2 ( http://isitea.net )` );
    let moduleList;
    //let moduleList = ( await $client.localStorage.get( "modules" ) ).modules;
    //Test structure
    moduleList = [
        {
            moduleName: "marumaru",
            buildDate: "2020-12-24 18:00",
            matchPattern: "marumaru.*\\.\\w{2,4}",
            uri: "/modules/marumaru.js",//for Dev.
            content: ""
        }
    ];
    let pageModule = new ( await import( searchSiteModule( moduleList ) ) ).pageModule( document );
    pageModule?.removeAds();
    console.log( await pageModule.getInfo() );
    console.log( await pageModule.grabImages() );

    return 0;
}

main();
