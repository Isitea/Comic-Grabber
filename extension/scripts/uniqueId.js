"use strict";
const uniqueSeed = new Uint8Array( 12 );

function secureRandom () {
    let randomValue = 0;
    for ( let i = 0; i < 5; i++ ) {
        crypto.getRandomValues( uniqueSeed );
        randomValue += Number( uniqueSeed.join( "" ) ) / Number( uniqueSeed.reverse().join( "" ) );
    }
    
    return randomValue.toString( 32 ).substr( 2 );
}

export { secureRandom };