const cloudinary = require("cloudinary").v2
const { processImageBuffer } = require("./imageProcessor")

const uploadToCloudinary = async (fileBuffer, folder, filename) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Process the image to reduce its size
      const type = folder === "thumbnails" ? "thumbnail" : "content"
      const processedBuffer = await processImageBuffer(fileBuffer, type)

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename,
          resource_type: "auto",
          transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error)
            return reject(error)
          }
          console.log("✅ Cloudinary upload success:", result.secure_url)
          resolve(result)
        },
      )

      if (!processedBuffer) {
        console.error("⚠️ No processed buffer provided to upload stream")
        return reject(new Error("Missing processed file buffer"))
      }

      uploadStream.end(processedBuffer)
    } catch (error) {
      console.error("Error processing image before upload:", error)
      reject(error)
    }
  })
}

module.exports = uploadToCloudinary
