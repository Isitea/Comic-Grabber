"use strict";
import 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.js';

async function readHash () {
    let zipReader = new JSZip();
    let siteContents = JSON.parse( await ( await zipReader.loadAsync( location.hash, { base64: true } ) ).file( "grabbedImageList" ).async( "string" ) );
    document.querySelector( "#reference a" ).href = siteContents.reference;
    document.querySelector( "#subTitle" ).textContent = siteContents.subTitle;
    document.querySelector( "#title" ).textContent = siteContents.title;
    const container = document.querySelector( "#imageContainer" );
    for ( const uri of siteContents.images ) {
        const img = document.createElement( "img" );
        img.src = uri;
        container.appendChild( img );
    }
}

window.addEventListener( "DOMContentLoaded", readHash );
