const { ImageKit } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadFile(buffer) {
  if (!buffer) {
    throw new Error("Image buffer is required");
  }

  const result = await imagekit.files.upload({
    file: buffer.toString("base64"),
    fileName: `image-${Date.now()}.jpg`,
    useUniqueFileName: true,
  });

  return result;
}

module.exports = uploadFile;
