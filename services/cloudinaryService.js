const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} url - The Cloudinary URL
 * @returns {string|null} - The extracted public ID or null if extraction fails
 */
const extractCloudinaryPublicId = (url) => {
  try {
    if (!url.includes("/upload/")) return null;
    const parts = url.split("/upload/")[1];
    const publicIdWithExt = parts.split(".")[0];
    return publicIdWithExt;
  } catch {
    return null;
  }
};

/**
 * Archives an image by moving it to an archive folder
 * @param {string} publicId - The public ID of the image to archive
 * @param {string} sourceFolder - The source folder (e.g., "thumbnails")
 * @returns {Promise<object>} - The result of the rename operation
 */
const archiveImage = async (publicId, sourceFolder) => {
  if (!publicId) {
    throw new Error("Public ID is required for archiving");
  }
  
  try {
    // Create archive path by replacing the source folder with archive/source
    const archivePath = publicId.replace(sourceFolder, `archive/${sourceFolder}`);
    
    // Rename the image to move it to the archive folder
    const result = await cloudinary.uploader.rename(publicId, archivePath, { overwrite: true });
    console.log(`📁 Archived image from ${publicId} to ${archivePath}`);
    return result;
  } catch (error) {
    console.warn(`⚠️ Image archiving failed for ${publicId}: ${error.message}`);
    throw error;
  }
};

/**
 * Ensures that a folder exists in Cloudinary
 * @param {string} folder - The folder path to create
 * @returns {Promise<void>}
 */
const ensureFolderExists = async (folder) => {
  try {
    await cloudinary.api.create_folder(folder);
    console.log(`📁 Ensured folder exists: ${folder}`);
  } catch (err) {
    if (err.http_code !== 409) {
      console.warn(`⚠️ Folder creation failed for ${folder}:`, err.message);
    }
  }
};

/**
 * Deletes an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<object>} - The result of the delete operation
 */
const deleteImage = async (publicId) => {
  if (!publicId) {
    throw new Error("Public ID is required for deletion");
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    
    if (result.result === 'ok') {
      console.log(`✅ Image deleted successfully: ${publicId}`);
    } else {
      console.warn(`⚠️ Image deletion returned unexpected result:`, result);
    }
    
    return result;
  } catch (error) {
    console.error(`Error deleting image ${publicId}:`, error);
    throw error;
  }
};

/**
 * Processes an image buffer to optimize it for Cloudinary
 * @param {Buffer} buffer - The original image buffer
 * @param {string} type - The type of image (thumbnail or content)
 * @returns {Promise<Buffer>} - The processed image buffer
 */
const processImageBuffer = async (buffer, type = "content") => {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    console.log(
      `Processing ${type} image: ${metadata.width}x${metadata.height}, ${buffer.length} bytes, format: ${metadata.format}`,
    );

    // Define target settings based on image type
    const settings = type === "thumbnail" 
      ? { width: 1200, height: 800, quality: 90 } 
      : { width: 1920, quality: 90 };

    // Process the image
    let processedBuffer = await sharp(buffer)
      .resize({
        width: settings.width,
        height: settings.height,
        fit: settings.height ? "cover" : "inside",
        withoutEnlargement: true,
      })
      .jpeg({ 
        quality: settings.quality, 
        progressive: true,
        force: false // Don't force JPEG if the original is in a better format
      })
      .toBuffer();

    // Check if the processed image is still too large (> 9.5MB)
    if (processedBuffer.length > 9.5 * 1024 * 1024) {
      console.log(`Image still too large (${processedBuffer.length} bytes), applying stronger compression`);

      // Apply stronger compression
      processedBuffer = await sharp(processedBuffer).jpeg({ quality: 60, progressive: true }).toBuffer();

      // If still too large, resize further
      if (processedBuffer.length > 9.5 * 1024 * 1024) {
        console.log(`Image still too large after compression, reducing dimensions`);

        const newWidth = type === "thumbnail" ? 800 : 1200;
        processedBuffer = await sharp(processedBuffer)
          .resize({ width: newWidth })
          .jpeg({ quality: 60, progressive: true })
          .toBuffer();
      }
    }

    console.log(`Image processed: ${processedBuffer.length} bytes (${Math.round(processedBuffer.length / 1024)}KB)`);
    return processedBuffer;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

/**
 * Uploads an image buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image buffer to upload
 * @param {string} folder - The folder to upload to
 * @param {string} filename - The filename to use
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
const uploadToCloudinary = async (fileBuffer, folder, filename) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Process the image to reduce its size
      const type = folder === "thumbnails" ? "thumbnail" : "content";
      const processedBuffer = await processImageBuffer(fileBuffer, type);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename,
          resource_type: "auto",
          transformation: [
            { quality: "auto:best" }, 
            { fetch_format: "auto" },
            { flags: "progressive" }
          ],
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            return reject(error);
          }
          console.log("✅ Cloudinary upload success:", result.secure_url);
          resolve(result);
        },
      );

      if (!processedBuffer) {
        console.error("⚠️ No processed buffer provided to upload stream");
        return reject(new Error("Missing processed file buffer"));
      }

      uploadStream.end(processedBuffer);
    } catch (error) {
      console.error("Error processing image before upload:", error);
      reject(error);
    }
  });
};

module.exports = {
  uploadToCloudinary,
  extractCloudinaryPublicId,
  archiveImage,
  ensureFolderExists,
  deleteImage,
  processImageBuffer
};
