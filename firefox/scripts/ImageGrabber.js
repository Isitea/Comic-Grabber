"use strict";
import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.js';
import { HTML } from './library.HTML.js';

class ImageGrabber {
    constructor (  ) {
        Object.defineProperties( this, {
            captured: { value: [] },
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
            let blob = await item.binaryData, type;
            if ( type = blob.type.match( /image\/(\w+);?/ ) ) {
                ( await list ).push( {
                    blob,
                    name: `${index.toString().padStart( 3, "0" )}.${ type[1].replace( /jpeg/gi, 'jpg' ) }`
                } );
            }
            else {
                console.log( blob, item.src );
            }
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
        const renderer = uri => {
            return HTML.render( {
                img: {
                    fetchUri: uri,
                    _todo: node => {
                        this.captured.push( node );
                        node.addEventListener( "error", () => {
                            let index;
                            if ( index = this.captured.indexOf( node ) > -1 ) this.captured.splice( index, 1 );
                            //node.parentNode.removeChild( node );
                        } );
                        return node;
                    }
                }
            } );
        }
        let list;
        if ( ( anchor instanceof Node || anchor instanceof NodeList ) ) {
            if ( anchor instanceof Node ) { list = [ ...anchor.querySelectorAll( "img" ) ]; }
            else if ( anchor instanceof NodeList ) { list = [ ...anchor ]; }
            for ( const item of list ) {
                item.replaceWith( ...renderer( item.dataset.original || item.src ) );
            }
        }
        else if ( anchor instanceof Array ) {
            for ( const uri of anchor ) {
                renderer( uri );
            }
        }
        
        return this.captured;
    }
}

export { ImageGrabber }