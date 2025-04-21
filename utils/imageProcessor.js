const sharp = require("sharp")

/**
 * Compresses and resizes an image buffer to meet Cloudinary's file size limits
 * @param {Buffer} buffer - The original image buffer
 * @param {string} type - The type of image (thumbnail or content)
 * @returns {Promise<Buffer>} - The processed image buffer
 */
async function processImageBuffer(buffer, type = "content") {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata()
    console.log(
      `Processing ${type} image: ${metadata.width}x${metadata.height}, ${buffer.length} bytes, format: ${metadata.format}`,
    )

    // Define target settings based on image type
    const settings = type === "thumbnail" ? { width: 1200, height: 800, quality: 80 } : { width: 1600, quality: 80 }

    // Process the image
    let processedBuffer = await sharp(buffer)
      .resize({
        width: settings.width,
        height: settings.height,
        fit: settings.height ? "cover" : "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: settings.quality, progressive: true })
      .toBuffer()

    // Check if the processed image is still too large (> 9.5MB)
    if (processedBuffer.length > 9.5 * 1024 * 1024) {
      console.log(`Image still too large (${processedBuffer.length} bytes), applying stronger compression`)

      // Apply stronger compression
      processedBuffer = await sharp(processedBuffer).jpeg({ quality: 60, progressive: true }).toBuffer()

      // If still too large, resize further
      if (processedBuffer.length > 9.5 * 1024 * 1024) {
        console.log(`Image still too large after compression, reducing dimensions`)

        const newWidth = type === "thumbnail" ? 800 : 1200
        processedBuffer = await sharp(processedBuffer)
          .resize({ width: newWidth })
          .jpeg({ quality: 60, progressive: true })
          .toBuffer()
      }
    }

    console.log(`Image processed: ${processedBuffer.length} bytes (${Math.round(processedBuffer.length / 1024)}KB)`)
    return processedBuffer
  } catch (error) {
    console.error("Error processing image:", error)
    throw error
  }
}

module.exports = { processImageBuffer }
