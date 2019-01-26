"use strict";
import '/extension/scripts/library.extend.js';
import { HTML } from '/extension/scripts/library.HTML.js';
const $client = ( () => { try { return browser; } catch ( e ) { return chrome; } } )();
//$client.runtime.sendMessage( { type: "reset" } );
let [ i ] = HTML.render( {
    form: {
        className: "rule",
        _child: [
            {
                fieldset: {
                    _child: [ { legend: { textContent: "Name" } }, { input: { type: "text", name: "name" } } ]
                }
            },
            {
                fieldset: {
                    _child: [ { legend: { textContent: "Site match rule" } }, { input: { type: "text", name: "RegExp" } } ]
                }
            },
            {
                fieldset: {
                    _child: [ { legend: { textContent: "Next Button" } }, { input: { type: "text", name: "HTTPMod" } } ]
                }
            },
        ]
    }
} );
document.querySelector( "#rules" ).appendChild( i );