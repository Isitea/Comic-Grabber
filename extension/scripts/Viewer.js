"use strict";
import { StorageManager } from './library.util.js';
import './library.extend.js';
import { HTML } from './library.HTML.js';
import { ImageGrabbler } from './ImageGrabbler.js';

function randomWrite( storage ) {
    setTimeout( () => {
        storage[ crypto.getRandomValues( new Uint8Array(1) )[0].toString( 16 ) ] = crypto.getRandomValues( new Uint8Array(1) )[0].toString( 8 );
        console.log( JSON.stringify( storage ) );
        randomWrite( storage );
    }, Math.random() * 5000 + 500 );
}
//randomWrite( ( new StorageManager( localStorage, "extTest" ) ).storage );

function getPropertyChain ( obj, chain ) {
    let value = obj;
    for ( let prop of chain.split( "." ) ) {
        if ( prop in value ) value = value[prop];
    }
    return value;
}


class ComicGrabbler {
    constructor ( grabbler, Preset ) {
        Object.defineProperties( this, {
            grabbler: { value: grabbler },
            subject: { value: {}, writable: true },
        } );
        if ( Preset.subject ) {
            this.subject = this.constructor.analyseInformation( Preset.subject );
        }
        if ( Preset.images ) {
            grabbler.grabImages( document.querySelectorAll( Preset.images ) );
        }
        
        console.log( this );
    }

    /**
     * Analyse title and sub-title of this page.
     * @param {{ title: { selector: String, propertyChain: String, exp: String }, subTitle: { selector: String, propertyChain: String, exp: String }, generalExp: String }}
     * @returns {{ title: string, subTitle: string }|null}
     */
    static analyseInformation ( { title, subTitle, generalExp } ) {
        let result = null;
        try {
            if ( title && subTitle ) {
                result = {
                    title: document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().replace( new RegExp( title.exp || "(.+)" ), "$1" ),
                    subTitle: document.querySelector( subTitle.selector ).readProperty( subTitle.propertyChain ).toFilename().replace( new RegExp( subTitle.exp || "(.+)" ), "$1" )
                };
            }
            else {
                result = document.querySelector( title.selector ).readProperty( title.propertyChain ).toFilename().match( new RegExp( generalExp ) ).groups;
            }
        } catch ( e ) { console.log( e ) }
        console.log( result );
        return result;
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

let Preset = {
    subject: {
        title: {
            selector: ".comicinfo .detail h2:first-child",
            propertyChain: ".firstChild.textContent"
        },
        subTitle: {
            selector: ".tit_area .view h3",
            propertyChain: ".textContent"
        }
    },
    images: ".view_area .wt_viewer img",
};
let comic = new ComicGrabbler( new ImageGrabbler(  ), Preset );
