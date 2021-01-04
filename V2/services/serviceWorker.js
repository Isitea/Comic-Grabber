"use strict";

async function main () {
    self.addEventListener( "install", e => {
        caches.open( "externalLibrary" ).then( cache => cache.add( "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js" ) );
    } );
    self.addEventListener( "fetch", e => e.respondWith( caches.match( e.request.url ).then( response => ( response || fetch( e.request ) ) ) ) );;

    return { message: "Service worker started" };
}

main()
    .then( ( { message } ) => console.log( message ) )
    .catch( error => console.log( "Something goes wrong with a service worker.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );