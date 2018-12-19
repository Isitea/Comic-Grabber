"use strict";
import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.js';
import { HTML } from './library.HTML.js';

/**
 * Converts Array object to NodeList object
 * @param {Array} array 
 * @returns {NodeList}
 */
function cA2Nl ( array ) {
    let nodelist;
    { class NodeList extends Array {}; nodelist = new NodeList( ...array ); }
    Object.setPrototypeOf( nodelist, NodeList.prototype );

    return nodelist;
}

function cleanFilename ( string ) {
    return HTML.render( { div: { innerHTML: string } } )[0].textContent
        .replace( /\.\.+/g, "⋯" )
        .replace( /!+/g, "！" )
        .replace( /\?+/g, "？" )
        .replace( /\/+/g, "／" )
        .replace( /\\+/g, "＼" )
        .replace( /:+/g, "：" )
        .replace( /~+/g, "∼" )
        .replace( /<+/g, "＜" )
        .replace( />+/g, "＞" )
        .replace( /\|+/g, "｜" )
        .replace( /(！？)+！?/g, "⁉" )
        .replace( /？⁉|(？！)+/g, "⁈" )
        .replace( /[\r\n\s]+/g, " " )
        .replace( /\u200b+/g, "" )
        .replace( /^[.\s]*|[.\s]*$/g, "" )
}


function getPropertyChain ( obj, chain ) {
    let value = obj;
    for ( let prop of chain.split( "." ) ) {
        if ( prop in value ) value = value[prop];
    }
    return value;
}

class ImageGrabbler {
    constructor (  ) {
        Object.defineProperties( this, {
            captured: { writable: false, configurable: true },
        } );
    }

    /**
     * Analyse title and sub-title of this page.
     * @param {{ title: { selector: String, exp: String }, subTitle: { selector: String, exp: String }, generalExp: String }}
     * @returns {{ title: string, subTitle: string }|null}
     */
    analyseInformation ( { title, subTitle, generalExp } ) {
        let result = null;
        try {
            if ( title && subTitle ) {
                result = {
                    title: cleanFilename( getPropertyChain( document.querySelector( title.selector ), title.property ) ).replace( new RegExp( title.exp ), "$1" ),
                    subTitle: cleanFilename( getPropertyChain( document.querySelector( subTitle.selector ), subTitle.property ) ).replace( new RegExp( subTitle.exp ), "$1" )
                };
            }
            else {
                result = cleanFilename( getPropertyChain( document.querySelector( title.selector ), title.property ) ).match( new RegExp( generalExp ) ).groups;
            }
        } catch ( e ) {}

        return result;
    }

    /**
     * Make zip archive which contains images from a fetchUri extended Image object.
     * @param {Array<HTMLImageElement>} targets - Array which contains several Image Nodes to save to local.
     * @returns {Promise<JSZip>} A Promise object which represents JSZip object which contains binary data of images.
     */
    async solidateImages ( targets = this.captured ) {
        return ( await targets.reduce( async ( list, item, index ) => {
            let blob = await item.bninaryData;
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
        
        return this.captured = list.reduce( ( captureList, item ) => {
            HTML.render( {
                img: {
                    fetchUri: item.dataset.original || item.src,
                    _todo: function ( node ) {
                        item.replaceWith( node );
                        captureList.push( node );
                        return node;
                    }
                }
            } );
        }, [] );
    }
}

