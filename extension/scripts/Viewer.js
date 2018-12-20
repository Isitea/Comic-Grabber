"use strict";
import { StorageManager } from './library.util.js';
import { ImageGrabbler } from './library.extention.js';

function randomWrite( storage ) {
    setTimeout( () => {
        storage[ crypto.getRandomValues( new Uint8Array(1) )[0].toString( 16 ) ] = crypto.getRandomValues( new Uint8Array(1) )[0].toString( 8 );
        console.log( JSON.stringify( storage ) );
        randomWrite( storage );
    }, Math.random() * 5000 + 500 );
}
//randomWrite( ( new StorageManager( localStorage, "extTest" ) ).storage );

let grabbler = new ImageGrabbler();

class ComicGrabbler {
    constructor ( Preset ) {
        if ( Preset ) {
            Object.defineProperty( this, "subject", { value: grabbler.analyseInformation( Preset ), writable: true, configurable: false } ) ;
            let { title, subTitle } = grabbler.analyseInformation( Preset );
        }
    }

    saveToLocal () {
        let zip = grabbler.solidateImages();
        zip.file( 'Downloaded from.txt', new Blob( [ document.URL ], { type: 'text/plain' } ) );
        
    }
}