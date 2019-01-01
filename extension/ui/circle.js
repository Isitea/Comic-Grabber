"use strict";
function drawTest ( canvas ) {
    let context = canvas.getContext( "2d" );
    context.strokeStyle = "rgba( 0, 255, 0, 1 )";
    context.lineWidth = 4;
    let counter = 0;
    let drawer = () => {
        context.clearRect( 0, 0, canvas.width, canvas.height );
        context.beginPath();
        context.arc( canvas.width / 2, canvas.height / 2, ( canvas.height - context.lineWidth ) / 2 + 1, -0.5 * Math.PI, ( counter / 100 * 2 - 0.5 ) * Math.PI );
        context.stroke();
        context.closePath();
        counter += 1;
        if ( counter <= 100 && counter > 0 ) setTimeout( drawer, 100 );
    };
    drawer();
}
drawTest( document.querySelector( ".load-progress" ) )

`https://extension.isitea.net/shareImages#${await ( new JSZip() ).file( "grabbedImageList", new Blob( [ JSON.stringify( { title: this.$memory.title, subTitle: this.$memory.subTitle, reference: document.URL, images: list } ) ], { type: "plain/text" } ) ).generateAsync( { type: "base64", compression: "DEFLATE", compressionOptions: { level: 9 } } )}`