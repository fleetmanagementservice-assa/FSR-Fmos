/**
 * GOOGLE APPS SCRIPT - GOOGLE DRIVE FILE UPLOADER FOR FSR MANAGEMENT SYSTEM
 * 
 * 1. Buka https://script.google.com/
 * 2. Buat project baru bernama "FSR Drive Uploader"
 * 3. Hapus semua kode default dan tempelkan seluruh kode ini.
 * 4. Klik ikon Save (Simpan).
 * 5. Klik "Deploy" > "New deployment" (Penerapan baru).
 * 6. Pilih tipe: "Web app" (Aplikasi web).
 * 7. Konfigurasikan:
 *    - Description: "FSR Attachment Uploader"
 *    - Execute as: "Me" (Saya - fleetmanagementservice.assa1700@gmail.com)
 *    - Who has access: "Anyone" (Siapa saja)  <-- SANGAT PENTING!
 * 8. Klik "Deploy". Google akan meminta persetujuan otorisasi (Authorize Access), setujui semua langkahnya.
 * 9. Salin URL Aplikasi Web yang diberikan (Web app URL), lalu paste ke menu Master Data > "Konfigurasi Drive" di aplikasi FSR Anda.
 */

// ID Folder Google Drive Target Anda
const TARGET_FOLDER_ID = "1Y5SIYTgTzwdolNFd2NomT3QDhT-km3R4";

function doPost(e) {
  // Atur header CORS untuk mengizinkan request dari aplikasi FSR
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No POST body content received."
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
    }

    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64Data;
    var filename = data.filename;
    var mimeType = data.mimeType || "application/octet-stream";
    
    // Hilangkan metadata header base64 jika ada (misal: "data:image/png;base64,")
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }
    
    // Decode data base64 menjadi bytes
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);
    
    // Akses folder Google Drive berdasarkan ID
    var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    
    // Buat file baru di dalam folder tersebut
    var file = folder.createFile(blob);
    
    // Atur hak akses agar siapa saja yang memiliki link dapat melihat file tersebut
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // Abaikan jika ada batasan domain korporat (GSuite/Workspace Admin restriction)
    }
    
    var fileUrl = file.getUrl();
    // Menggunakan Direct Download URL agar dapat dirender sebagai gambar langsung di aplikasi FSR
    var downloadUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      message: "File berhasil diunggah ke Google Drive!"
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Terjadi kesalahan server: " + error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
  }
}

function doGet(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script Web App untuk FSR Anda telah aktif!",
    targetFolderId: TARGET_FOLDER_ID,
    uploaderEmail: Session.getActiveUser().getEmail()
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders(headers);
}

function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}
