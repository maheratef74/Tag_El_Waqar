// --- CONFIGURATION START ---

// 1. Cloudinary Settings
const CLOUDINARY_CLOUD_NAME = 'dgc6xjtqj'; // Replace with your Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset'; // Replace with your Unsigned Upload Preset
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// 2. Google Apps Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSVCxX32ItOtPKRYFrNU_SR6SY6R6Zwq1qz3rrg-4jlySvkqKx9I8IOckHHDE-B5E_9A/exec";

// --- CONFIGURATION END ---

// Helper: Upload to Cloudinary
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    // folder is often supported in unsigned presets if "cols" mode is on, 
    // but strict unsigned presets might ignore or reject it if not configured.
    // Let's keep it simple first.
    // formData.append('folder', 'season4_submissions');

    // IMPORTANT: Do NOT send 'api_key' or 'signature' for unsigned uploads on the client side.

    console.log(`Uploading to ${CLOUDINARY_URL} with preset: ${CLOUDINARY_UPLOAD_PRESET}`);

    const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary Error Details:", errorData);
        throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
}

// Form Submission Logic
const form = document.getElementById('competitionForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Form submitted. Starting validation...");

        // Validate inputs
        const photoFile = document.getElementById('photo').files[0];
        const certFile = document.getElementById('cert').files[0];

        if (!photoFile || !certFile) {
            Swal.fire({
                title: 'نقص بيانات',
                text: 'يرجى رفع الصور المطلوبة',
                icon: 'warning'
            });
            return;
        }

        // Show Loading
        Swal.fire({
            title: 'جارٍ التسجيل...',
            text: 'يتم رفع ملفاتك الآن، يرجى الانتظار',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            console.log("Starting Cloudinary Uploads...");

            // 1. Upload Images to Cloudinary

            // Upload Photo
            console.log("Uploading Photo...");
            const photoUrl = await uploadToCloudinary(photoFile);
            console.log("Photo URL:", photoUrl);

            // Upload Cert
            console.log("Uploading Cert...");
            const certUrl = await uploadToCloudinary(certFile);
            console.log("Cert URL:", certUrl);

            // 2. Prepare Data
            const formData = {
                name: document.getElementById('name').value,
                age: document.getElementById('age').value,
                dob: document.getElementById('dob').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
                parts: document.getElementById('level').value, // Changed from level to parts to match Google Script
                photoUrl: photoUrl,
                certUrl: certUrl,
                submittedAt: new Date().toISOString()
            };
            console.log("Form Data Prepared:", formData);

            // 3. Send to Google Sheets
            console.log("Sending to Google Sheet...");
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            console.log("Request sent to Google Sheet (no-cors mode, so no response body available).");

            // Success
            Swal.fire({
                title: 'تم التسجيل بنجاح!',
                text: 'بالتوفيق',
                icon: 'success',
                confirmButtonText: 'حسناً'
            }).then(() => {
                document.getElementById('competitionForm').reset();
                location.reload();
            });

        } catch (error) {
            console.error("Error during submission:", error);

            Swal.fire({
                title: 'خطأ في الرفع',
                text: 'حدثت مشكلة أثناء رفع الصور: ' + error.message,
                icon: 'error'
            });
        }
    });
} else {
    console.error("Form element 'competitionForm' not found in DOM");
}