# Cloudinary Setup Instructions

This application uses Cloudinary for image uploads. Follow these steps to set up Cloudinary:

1. Create a free account at [Cloudinary](https://cloudinary.com)
2. From your dashboard, get your:
   - Cloud Name
   - API Key
   - API Secret

3. Create a new Upload Preset:
   - Go to Settings > Upload > Upload presets
   - Click "Add upload preset"
   - Set Signing Mode to "Unsigned" (for client-side uploads)
   - Name it "bdgenai_upload" (as used in the code)
   - Save the preset

4. Create or modify your `.env.local` file with the following variables:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Restart your development server for the changes to take effect.

## Usage

The `FileUpload` component can now be used anywhere in your application where you need to upload images. It provides a simple interface for selecting and uploading images.

```jsx
<FileUpload
  onChange={(url) => {
    // Handle the uploaded image URL
    console.log(url);
  }}
  endpoint="groupImage" // Optional, just for categorization
>
  {/* Optional custom UI */}
  <div className="custom-upload-button">
    Click to upload
  </div>
</FileUpload>
``` 