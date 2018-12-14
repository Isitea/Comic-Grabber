"use strict";
import { HTML, StorageManager } from './CE-library.js';
HTML.extend();

let storage = new StorageManager( localStorage, "extTest" );

function randomWrite( storage ) {
    setTimeout( () => {
        storage[ crypto.getRandomValues( new Uint8Array(1) )[0].toString( 16 ) ] = crypto.getRandomValues( new Uint8Array(1) )[0].toString( 8 );
        console.log( JSON.stringify( storage ) );
        randomWrite( storage );
    }, Math.random() * 5000 + 500 );
}

//randomWrite( storage.storage );
