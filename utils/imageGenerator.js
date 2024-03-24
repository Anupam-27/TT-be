const sharp = require('sharp');

const generateImageVariants = async (key, originalImageBuffer) => {
    const variants = [
        { name: 'sm', width: 128, height: 128 },
        { name: 'md', width: 300, height: 300 },
        // Add more variants as needed
    ];
    try {
        const generatedImages = await Promise.all(variants.map(async (variant) => {
            const buffer = await sharp(originalImageBuffer.buffer)
                .resize(variant.width, variant.height)
                .toBuffer();

            return { name: `${key}_${variant.name}`, buffer };
        }));
        return generatedImages;
    } catch (err) {
        console.log(err)
    }
};

module.exports = { generateImageVariants }