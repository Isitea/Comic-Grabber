"use strict";
import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.js';
import { HTML } from './library.HTML.js';

class ImageGrabbler {
    constructor (  ) {
        Object.defineProperties( this, {
            captured: { writable: false, configurable: true },
        } );
    }

    /**
     * Make zip archive which contains images from a fetchUri extended Image object.
     * @param {Array<HTMLImageElement>} targets - Array which contains several Image Nodes to save to local.
     * 
     * @returns {Promise<JSZip>} A Promise object which represents JSZip object which contains binary data of images.
     */
    async solidateImages ( targets = this.captured ) {
        return ( await targets.reduce( async ( list, item, index ) => {
            let blob = await item.binaryData;
            ( await list ).push( {
                blob,
                name: `${index.toString().padStart( 3, "0" )}.${ blob.type.match( /image\/(?<extension>\w+);?/ ).groups.extension.replace( /jpeg/gi, 'jpg' ) }`
            } );
            return list;
        }, [] ) ).reduce( ( zip, { blob, name } ) => zip.file( name, blob ), new JSZip() );
    }

    /**
     * Replace Image object with Image object which loads image using fetchUri method.
     * @param {Node} anchor - Base Node object for searching Image object.
     * @param {NodeList} anchor - Image objects
     * 
     * @returns {Array<HTMLImageElement>} - Image objects which load image using fetchUri method.
     */
    grabImages ( anchor ) {
        let list;
        if ( !( anchor instanceof Node || anchor instanceof NodeList ) ) return false;
        if ( anchor instanceof Node ) { list = [ ...anchor.querySelectorAll( "img" ) ]; }
        else if ( anchor instanceof NodeList ) { list = [ ...anchor ]; }
        else return false;
        
        Object.defineProperty( this, "captured", { value: list.reduce( ( captureList, item ) => {
            item.replaceWith( ...HTML.render( {
                img: {
                    fetchUri: item.dataset.original || item.src,
                    _todo: function ( node ) {
                        captureList.push( node );
                        return node;
                    }
                }
            } ) );
            
            return captureList;
        }, [] ) } );
        
        return this.captured;
    }
}

export { ImageGrabbler }