const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generateTestQRCodes() {
  console.log('🏗️  Generating test QR codes for scanner testing...');

  // Sample visitor IDs for testing
  const testVisitorIds = [
    '685bcfea4da2251d0ea053e1', // From your sample data
    '507f1f77bcf86cd799439011', // Test ID 1
    '507f191e810c19729de860ea', // Test ID 2
    '507f191e810c19729de860eb', // Test ID 3
    '507f191e810c19729de860ec'  // Test ID 4
  ];

  const qrCodesDir = path.join(__dirname, '..', 'public', 'qr-codes');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(qrCodesDir)) {
    fs.mkdirSync(qrCodesDir, { recursive: true });
  }

  console.log('📁 QR codes will be saved to:', qrCodesDir);

  for (let i = 0; i < testVisitorIds.length; i++) {
    const visitorId = testVisitorIds[i];
    
    try {
      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(visitorId, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to buffer and save as PNG
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `visitor-${visitorId}.png`;
      const filepath = path.join(qrCodesDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      console.log(`✅ Generated QR code ${i + 1}/5: ${filename}`);
      console.log(`   Visitor ID: ${visitorId}`);
      
    } catch (error) {
      console.error(`❌ Error generating QR code for ${visitorId}:`, error.message);
    }
  }

  // Generate an HTML file to display all QR codes for easy testing
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test QR Codes - Visitrack Scanner</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .qr-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .qr-code {
            max-width: 100%;
            height: auto;
            border: 2px solid #ddd;
            border-radius: 5px;
        }
        .visitor-id {
            font-family: monospace;
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            word-break: break-all;
        }
        .instructions {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Test QR Codes for Visitrack Scanner</h1>
        <p>Use these QR codes to test the Quick Scanner functionality</p>
    </div>

    <div class="instructions">
        <h3>📱 How to test:</h3>
        <ol>
            <li>Open the Visitrack admin panel</li>
            <li>Navigate to "Quick Scanner" page</li>
            <li>Click "Start Scanning"</li>
            <li>Point your camera at any of the QR codes below</li>
            <li>The scanner should automatically detect and process the visitor ID</li>
        </ol>
        <p><strong>Note:</strong> Make sure you have test visitor data in your database with these IDs.</p>
    </div>

    <div class="qr-grid">
        ${testVisitorIds.map((id, index) => `
        <div class="qr-card">
            <h3>Test Visitor ${index + 1}</h3>
            <img src="./qr-codes/visitor-${id}.png" alt="QR Code for ${id}" class="qr-code">
            <div class="visitor-id">
                <strong>Visitor ID:</strong><br>
                ${id}
            </div>
        </div>
        `).join('')}
    </div>

    <div class="instructions" style="margin-top: 30px;">
        <h3>🛠️ Development Notes:</h3>
        <ul>
            <li>QR codes contain plain visitor IDs</li>
            <li>Scanner extracts ID and calls <code>/api/scanner/qr-entry</code></li>
            <li>Visitor entry type is updated to "QR" and status to "Visited"</li>
            <li>All scan activities are logged in the entry logs</li>
        </ul>
    </div>
</body>
</html>
  `;

  const htmlPath = path.join(__dirname, '..', 'public', 'test-qr-codes.html');
  fs.writeFileSync(htmlPath, htmlContent);

  console.log('\n🎉 QR code generation completed!');
  console.log('\n📄 Files created:');
  console.log(`   • ${testVisitorIds.length} QR code images in /public/qr-codes/`);
  console.log('   • Test page: /public/test-qr-codes.html');
  console.log('\n🔗 Access test page at: http://localhost:3000/test-qr-codes.html');
  console.log('🔗 Scanner page at: http://localhost:3000/admin/scanner');
  
  console.log('\n💡 Pro tip: You can also test by scanning these QR codes with your phone camera!');
}

// Check if qrcode package is installed
try {
  require('qrcode');
  generateTestQRCodes().catch(console.error);
} catch (error) {
  console.log('❌ QRCode package not found. Installing...');
  console.log('Run: npm install qrcode');
  console.log('Then run this script again.');
} 