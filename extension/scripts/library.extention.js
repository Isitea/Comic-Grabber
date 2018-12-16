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

class ImageGrabbler {
    constructor (  ) {
        
    }

    grabImages ( anchor ) {
        let list, xhrList = [];
        if ( !( anchor instanceof Node || anchor instanceof NodeList ) ) return false;
        if ( anchor instanceof Node ) { list = [ ...anchor.querySelectorAll( "img" ) ]; }
        else if ( anchor instanceof NodeList ) { list = [ ...anchor ]; }
        else return false;
        
        for ( const originalItem of list ) {
            HTML.render( {
                img: {
                    xhrUri: originalItem.dataset.original || originalItem.src,
                    _todo: function ( node ) {
                        originalItem.replaceWith( node );
                        xhrList.push( node );
                        return node;
                    }
                }
            } );
        }
        cA2Nl( xhrList );
    }
}

