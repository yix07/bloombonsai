import axios from "axios";

// Environment variables for Pinata API
const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;

/**
 * Uploads a file to Pinata (IPFS).
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} - The CID (hash) of the uploaded file.
 */
export const uploadToPinata = async (file: File): Promise<string> => {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  // Create FormData object for the file
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: pinataApiKey!,
        pinata_secret_api_key: pinataSecretApiKey!,
      },
    });

    // Return the IPFS hash (CID) from Pinata
    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
};
