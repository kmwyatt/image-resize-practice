// @ts-check

const fs = require('fs');
const path = require('path');
const http = require('http');
const { createApi } = require('unsplash-js');
const { default: fetch } = require('node-fetch');
const sharp = require('sharp');
const { pipeline } = require('stream');
const { promisify } = require('util');

const unsplash = createApi({
    accessKey: 'sG81mTKqGJJUnhtkyZL2DJuBWRasksPmKBHLdovab9c',
    fetch,
});

async function searchImage(query) {
    const result = await unsplash.search.getPhotos({ query });

    if (!result.response) {
        throw new Error('Failed to search image.');
    }

    const image = result.response.results[0];

    if (!image) {
        // throw new Error('No image found.');
        return;
    }

    return {
        description: image.description || image.alt_description,
        url: image.urls.regular,
    };
}

async function getCachedOrSearchedImage(query) {
    const imageFilePath = path.resolve(__dirname, `../images/${query}`);
    console.log(imageFilePath);

    if (fs.existsSync(imageFilePath)) {
        return {
            message: `Returning cached image: ${query}`,
            stream: fs.createReadStream(imageFilePath),
        };
    }

    const result = await searchImage(query);

    if (!result) {
        return;
    }

    const response = await fetch(result.url);

    await promisify(pipeline)(
        response.body,
        fs.createWriteStream(imageFilePath),
    );
    return {
        message: `Returning new image: ${query}`,
        stream: fs.createReadStream(imageFilePath),
    };
}

function convertURLToQueryKeyword(url) {
    return url.slice(1);
}

const server = http.createServer((req, res) => {
    async function main() {
        if (!req.url) {
            res.statusCode = 400;
            res.end('Needs URL.');
            return;
        }

        const query = convertURLToQueryKeyword(req.url);
        const result = await getCachedOrSearchedImage(query);
        if (!result) {
            return;
        }

        const { message, stream } = result;

        try {
            console.log(message);
            stream.pipe(res);
        } catch {
            res.statusCode(400);
            res.end();
        }
    }

    main();
});

const PORT = 4000;

server.listen(PORT, () => {
    console.log(`The server is listening at port ${PORT}`);
});
