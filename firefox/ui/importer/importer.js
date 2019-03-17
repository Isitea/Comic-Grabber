"use strict";
const $client = ( () => { try { return browser; } catch ( e ) { return chrome; } } )();
//$client.runtime.sendMessage( { type: "reset" } );

async function importRules ( ev ) {
    const text = document.querySelector( "#rulesInJson" ).value;
    let json;
    try { json = JSON.parse( text ); }
    catch ( e ) {
        return new Promise ( resolve => {
            document.querySelector( "#rulesInJson" ).classList.add( "Error" );
            setTimeout( resolve, 3000 );
        } ).then( () => document.querySelector( "#rulesInJson" ).classList.remove( "Error" ) );
    }
    try {
        browser;
        await $client.storage.local.clear();
        await $client.storage.local.set( json );
    }
    catch ( e ) {
        await new Promise( resolve => $client.storage.local.clear( resolve ) );
        await new Promise( resolve => $client.storage.local.set( json, resolve ) );
    }
    $client.runtime.reload();
    informConfigApplied();
}

function informConfigApplied () {
    const inform = document.querySelector( "#information" );
    inform.textContent = "Applied";
    setTimeout( () => inform.textContent = "", 1000 );
}

document.querySelector( "#importer" ).addEventListener( "click", importRules );
document.querySelector( "#resetter" ).addEventListener( "click", () => {
    $client.runtime.sendMessage( chrome.runtime.id, { type: "resetConfiguration" } );
    informConfigApplied();
} );
