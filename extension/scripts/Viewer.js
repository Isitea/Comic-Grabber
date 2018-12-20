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
    constructor ( Preset = {} ) {
        Object.defineProperty( this, "subject", { writable: true, configurable: false } ) ;
        if ( Preset.pattern ) {
            this.subject = grabbler.analyseInformation( Preset.pattern );
        }
        if ( this.subject !== null && Preset.storage ) {}
    }

    async saveToLocal ( { localPath, onConflict } ) {
        let zip = await grabbler.solidateImages();
        zip.file( 'Downloaded from.txt', new Blob( [ document.URL ], { type: 'text/plain' } ) );
        let blob = await zip.generateAsync( { type: "blob" } );
        return {
            blob,
            url: URL.createObjectURL( blob ),
            filename: `${localPath}${this.subject.title}/${this.subject.subTitle}.zip`,
            conflictAction: onConflict
        }
    }
}