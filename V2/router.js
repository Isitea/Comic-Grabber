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

    class moduleManager {
        constructor ( baseUri ) {
            this.baseUri = baseUri;
            this.loaded = [];
        }

        load ( source = "" ) {
            let script;
            switch ( source.split( "." ).pop() ) {
                case "js": {
                    script = document.createElement( 'script' );
                    script.setAttribute( "defer", "" );
                    script.type = "module";
                    script.src = this.baseUri + source;
                    break;
                }
                case "css": {
                    script = document.createElement( 'link' );
                    script.rel="stylesheet";
                    script.href = this.baseUri + source;
                    break;
                }
            }
            logger.log( `Attaching... ${source}` );
            document.head.appendChild( script );

            return script;
        }
        
        unload ( item = null ) {
            let index;
            if ( item === null ) {
                this.loaded.forEach( item => item.remove() );
                this.loaded = [];
                logger.log( `Detaching every script` );
            } else if ( index = this.loaded.indexOf( item ) >= 0 ) {
                item.remove();
                this.loaded.splice( index, 1 );
                logger.log( `Dettaching... ${( item.src || item.rel ).replace( this.baseUri, "" )}` );
            }
        }
    }

    function moduleWrapper ( script ) {
        return URL.createObjectURL( new Blob( [ script ], { type: "text/javascript" } ) );
    }

    function searchSiteModule ( moduleList, uri = document.URL ) {
        let siteModule = "/modules/universal.js";
        for ( const module of moduleList ) {
            if ( uri.match( module.matchPattern ) ) {
                siteModule = moduleWrapper( module.uri || module.content );
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
            uri: "/module/marumaru.js",//for Dev.
            content: ""
        }
    ];
    let pageModule = new ( await import( searchSiteModule( moduleList ) ) ).module( document );
    pageModule.removeAds();
    console.log( pageModule.getTitle() );
    console.log( pageModule.grabImages() );

    let mManager = new moduleManager( $baseUri );
    //mManager.load();

    return 0;
}

main();
