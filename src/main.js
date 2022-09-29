// @ts-check

const http = require('http');
const { createApi } = require('unsplash-js');
const { default: fetch } = require('node-fetch');

const unsplash = createApi({
    accessKey: 'sG81mTKqGJJUnhtkyZL2DJuBWRasksPmKBHLdovab9c',
    fetch
})

async function searchImage(query) {
    const result = await unsplash.search.getPhotos({ query: 'mountain' })

    if (!result.response) {
        throw new Error('Failed to search image.');
    }

    const image = result.response.results[0];

    if (!image) {
        throw new Error('No image found.');
    }

    return {
        description: image.description || image.alt_description,
        url: image.urls.regular,
    }
}

const server = http.createServer((req, res) => {
    async function main() {
        const result = await searchImage('mountain');
        const response = await fetch(result.url);
        response.body.pipe(res);
    }

    main();
})

const PORT = 4000;

server.listen(PORT, () => {
    console.log(`The server is listening at port ${PORT}`);
})