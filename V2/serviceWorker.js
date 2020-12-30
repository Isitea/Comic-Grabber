"use strict";

async function main () {
    self.addEventListener( "install", e => {
        caches.open( "externalLibrary" ).then( cache => cache.add( "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js" ) );
    } );
    self.addEventListener( "fetch", e => e.respondWith( caches.match( e.request.url ).then( response => ( response || fetch( e.request ) ) ) ) );;

    return { message: "Scheduled task completed successfully. Waiting user action." };
}

main()
    .then( ( { message } ) => console.log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );