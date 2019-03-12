class decypher {
    constructor ( seed = 1, x = 5, y = 5 ) {
        Object.defineProperties( this, {
            originalSeed: { value: seed },
            clip: { value: { x, y }, configurable: true },
        } );
    }
    
    resetSeed ( seed = this.originalSeed ) {
        this.seed = seed;
    }
    
    diverseSeed () {
        if ( chapter < 554714 ) {
            let a = 1e4 * Math.sin( this.seed++ );
            return Math.floor( 1e5 * ( a - Math.floor( a ) ) );
        }
        else {
            this.seed++;
            let a = 1e2 * Math.sin( 10 * this.seed );
            let b = 1e3 * Math.cos( 13 * this.seed );
            let c = 1e4 * Math.tan( 14 * this.seed );
            a = Math.floor( 1e2 * ( a - Math.floor( a ) ) );
            b = Math.floor( 1e3 * ( b - Math.floor( b ) ) );
            c = Math.floor( 1e4 * ( c - Math.floor( c ) ) );
            return a + b + c;
        }
    }

    loadImage ( src ) {
        return new Promise( resolve => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = ( location.hostname.match( /mangashow.+me/ ) ? src + '?v=2' : src );
            image.addEventListener( 'load', () => resolve( image ) );
        } );
    }

    async restoreImage ( src, flag = 0 ) {
        const image = await this.loadImage( src );
        const canvas = document.createElement( "canvas" );
        const context = canvas.getContext( "2d" );
        const { naturalWidth: width, naturalHeight: height } = image;
        canvas.width = ( flag === 0 ? width : width / 2 );
        canvas.height = height;
        if ( this.originalSeed === 0 ) {
            context.drawImage( image, 0, 0, width, height, ( flag === 1 ? -width / 2 : 0 ), 0, width, height );
        }
        else {
            if ( location.hostname.match( /mangashow.+me/ ) ) {
                let seed = this.originalSeed / 10;
                this.resetSeed( seed );
                if ( seed > 3e4 ) Object.defineProperties( this, { clip: { value: { x: 1 , y: 6 } } } );
                else if ( seed > 2e4 ) Object.defineProperties( this, { clip: { value: { x: 1 , y: 5 } } } );
                else if ( seed > 1e4 ) Object.defineProperties( this, { clip: { value: { x: 5 , y: 1 } } } );
            }
            else this.resetSeed();
            let clip = [];
            for ( let index = 0; index < this.clip.x * this.clip.y; index++ ) {
                clip.push( { index, seed: this.diverseSeed() } );
            }
            clip.sort( ( a, b ) => ( a.seed !== b.seed ? a.seed - b.seed : a.index - b.index ) );
            const block = {
                x: Math.floor( width / this.clip.x ),
                y: Math.floor( height / this.clip.y ),
            }
            for ( const index in clip ) {
                let o = { x: index % this.clip.x, y: Math.floor( index / this.clip.x ) };
                let t = { x: clip[index].index % this.clip.x, y: Math.floor( clip[index].index / this.clip.x ) };
                let s = ( flag === 2 ? -width / 2 : 0 );
                context.drawImage( image, o.x * block.x, o.y * block.y, block.x, block.y, t.x * block.x + s, t.y * block.y, block.x, block.y );
                //context.drawImage( image, sx, sy, sw, sh, dx, dy, dw, dh );
            }
        }
        return await new Promise( resolve => { canvas.toBlob( resolve, 'image/webp', 1 ); } );
    }
}
export { decypher };