"use strict";
import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.js';
import { HTML } from './library.HTML.js';

/**
 * Converts Array object to NodeList object
 * @param {Array} array 
 * @returns {NodeList}
 */
function cATN ( array ) {
    let nodelist;
    { class NodeList extends Array {}; nodelist = new NodeList( ...array ); }
    Object.setPrototypeOf( nodelist, NodeList.prototype );

    return nodelist;
}

class ImageGrabbler {
    constructor (  ) {
        
    }

    grabImages ( ancestorNode ) {
        let list, xhrList = [];
        if ( !( ancestorNode instanceof Node || ancestorNode instanceof NodeList ) ) return false;
        if ( ancestorNode instanceof Node ) { list = [ ...ancestorNode.querySelectorAll( "img" ) ]; }
        else if ( ancestorNode instanceof NodeList ) { list = [ ...ancestorNode ]; }
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
        cATN( xhrList );
    }
}

