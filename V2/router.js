"use strict";
{
    const logger = ( function ( $log, $alert, $inform ) {
        const $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`;
        const $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`;
        const $inform = `font-size: 12px; color: rgba( 114, 20, 214, 0.75 );`;

        return {
            log: ( text ) => console.log( `%c${text}`, $log ),
            alert: ( text ) => console.log( `%c${text}`, $alert ),
            inform: ( text ) => console.log( `%c${text}`, $inform ),
        };
    } )();

    const $client = ( () => { try { return browser; } catch { return chrome; } } )();
    const $baseUri = $client.runtime.getURL( "" );

    function moduleLoader ( scripts ) {
        for ( const source of scripts ) {
            let script;
            console.log( `%cNow loading... ${source}`, $log );
            switch ( source.split( "." ).pop() ) {
                case "js": {
                    script = document.createElement( 'script' );
                    script.setAttribute( "defer", "" );
                    script.type = "module";
                    script.src = $baseUri + source;
                    break;
                }
                case "css": {
                    script = document.createElement( 'link' );
                    script.rel="stylesheet";
                    script.href = $baseUri + source;
                    break;
                }
            }
            document.head.appendChild( script );
        }
    }
}