# External QR Entry API Documentation

## Overview
This API endpoint allows external devices to mark visitor entries as "QR Code" by providing a visitor ID. It's designed for use with QR code scanners, mobile apps, or other external systems that need to record visitor check-ins.

## API Endpoints
```
POST/GET /api/external/qr-entry
GET/POST /api/external/qr-entry/[visitorId]
```

## Base URLs
```
https://your-domain.com/api/external/qr-entry
https://your-domain.com/api/external/qr-entry/685bcda34da2251d0ea053e0
```

## Authentication
⚠️ **No authentication required** - This endpoint is designed for external device usage without JWT tokens.

## Request Methods
- **POST** - Recommended for production use
- **GET** - For quick testing or simple integrations

## Request Parameters

### Method 1: POST Request (Body Parameter)
```json
{
  "visitorId": "685bcc814da2251d0ea053de"
}
```

### Method 2: GET Request (Query Parameter)
```
GET /api/external/qr-entry?visitorId=685bcc814da2251d0ea053de
```

### Method 3: GET/POST Request (Path Parameter) - **NEW**
```
GET /api/external/qr-entry/685bcc814da2251d0ea053de
POST /api/external/qr-entry/685bcc814da2251d0ea053de
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `visitorId` | String | Yes | Valid MongoDB ObjectId of the visitor |

### URL Format Options
| Format | URL Example | Use Case |
|--------|-------------|----------|
| **Path Parameter** | `/api/external/qr-entry/685bcda34da2251d0ea053e0` | **Recommended** - Simplest for QR scanners and external apps |
| **Query Parameter** | `/api/external/qr-entry?visitorId=685bcda34da2251d0ea053e0` | Good for GET requests with multiple parameters |
| **Body Parameter** | POST with `{"visitorId": "685bcda34da2251d0ea053e0"}` | Best for secure applications with authentication |

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "QR entry recorded successfully",
  "visitor": {
    "id": "685bcc814da2251d0ea053de",
    "name": "Scooter wale",
    "status": "Visited",
    "entryType": "QR",
    "eventName": "AI Masterclass",
    "company": "Toupto Technologies"
  }
}
```

### Already Visited Response (200)
```json
{
  "success": true,
  "message": "Visitor already checked in",
  "alreadyVisited": true,
  "visitor": {
    "id": "685bcc814da2251d0ea053de",
    "name": "Scooter wale",
    "status": "Visited",
    "entryType": "QR",
    "eventName": "AI Masterclass",
    "company": "Toupto Technologies"
  }
}
```

### Error Responses

#### Missing Visitor ID (400)
```json
{
  "success": false,
  "message": "Visitor ID is required",
  "error": "MISSING_VISITOR_ID"
}
```

#### Invalid Visitor ID Format (400)
```json
{
  "success": false,
  "message": "Invalid visitor ID format",
  "error": "INVALID_VISITOR_ID"
}
```

#### Visitor Not Found (404)
```json
{
  "success": false,
  "message": "Visitor not found",
  "error": "VISITOR_NOT_FOUND"
}
```

#### Method Not Allowed (405)
```json
{
  "message": "Method not allowed"
}
```

#### Internal Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

## What This API Does

1. **Validates** the provided visitor ID format
2. **Finds** the visitor in the database
3. **Checks** if the visitor has already been marked as "Visited"
4. **Updates** the visitor's entry type to "QR" and status to "Visited"
5. **Logs** the entry in the system for tracking
6. **Returns** updated visitor information

## Usage Examples

### JavaScript/Node.js (POST)
```javascript
const response = await fetch('https://your-domain.com/api/external/qr-entry', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    visitorId: '685bcc814da2251d0ea053de'
  })
});

const data = await response.json();
console.log(data);
```

### JavaScript/Node.js (GET - Query Parameter)
```javascript
const visitorId = '685bcc814da2251d0ea053de';
const response = await fetch(`https://your-domain.com/api/external/qr-entry?visitorId=${visitorId}`);
const data = await response.json();
console.log(data);
```

### JavaScript/Node.js (GET - Path Parameter) - **NEW**
```javascript
const visitorId = '685bcc814da2251d0ea053de';
const response = await fetch(`https://your-domain.com/api/external/qr-entry/${visitorId}`);
const data = await response.json();
console.log(data);
```

### cURL (POST)
```bash
curl -X POST "https://your-domain.com/api/external/qr-entry" \
  -H "Content-Type: application/json" \
  -d '{"visitorId": "685bcc814da2251d0ea053de"}'
```

### cURL (GET - Query Parameter)
```bash
curl "https://your-domain.com/api/external/qr-entry?visitorId=685bcc814da2251d0ea053de"
```

### cURL (GET - Path Parameter) - **NEW**
```bash
curl "https://your-domain.com/api/external/qr-entry/685bcc814da2251d0ea053de"
```

### Python
```python
import requests
import json

url = "https://your-domain.com/api/external/qr-entry"
payload = {"visitorId": "685bcc814da2251d0ea053de"}

response = requests.post(url, json=payload)
data = response.json()
print(data)
```

### PHP
```php
<?php
$url = 'https://your-domain.com/api/external/qr-entry';
$data = array('visitorId' => '685bcc814da2251d0ea053de');

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
$response = json_decode($result, true);
print_r($response);
?>
```

## Integration Examples

### QR Code Scanner App
```javascript
// When QR code is scanned
function onQRCodeScanned(visitorId) {
  markVisitorEntry(visitorId);
}

async function markVisitorEntry(visitorId) {
  try {
    // Method 1: POST with body parameter
    const response = await fetch('/api/external/qr-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId })
    });
    
    // Method 2: GET with path parameter (simpler for QR scanners)
    // const response = await fetch(`/api/external/qr-entry/${visitorId}`);
    
    const result = await response.json();
    
    if (result.success) {
      if (result.alreadyVisited) {
        showMessage(`${result.visitor.name} already checked in!`);
      } else {
        showMessage(`Welcome ${result.visitor.name}! Check-in successful.`);
      }
    } else {
      showError(result.message);
    }
  } catch (error) {
    showError('Network error. Please try again.');
  }
}
```

### Mobile App Integration
```dart
// Flutter/Dart example
Future<void> scanQRCode(String visitorId) async {
  final response = await http.post(
    Uri.parse('https://your-domain.com/api/external/qr-entry'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'visitorId': visitorId}),
  );
  
  final data = jsonDecode(response.body);
  
  if (data['success']) {
    // Show success message
    print('Check-in successful for ${data['visitor']['name']}');
  } else {
    // Show error message
    print('Error: ${data['message']}');
  }
}
```

## Response Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Entry recorded or visitor already visited |
| 400 | Bad Request - Missing or invalid visitor ID |
| 404 | Not Found - Visitor not found in database |
| 405 | Method Not Allowed - Only GET and POST are supported |
| 500 | Internal Server Error - Server-side error |

## CORS Support
This API includes CORS headers to allow cross-origin requests from web applications and mobile apps.

## Rate Limiting
⚠️ **Note**: This API currently has no rate limiting. Consider implementing rate limiting for production use.

## Security Considerations
- This API does not require authentication for ease of use with external devices
- Consider implementing API key authentication for enhanced security
- Monitor usage to prevent abuse
- Validate visitor IDs to prevent injection attacks

## Testing
You can test this API using the provided cURL commands or any HTTP client. Make sure to use a valid visitor ID from your database.

## Sample Visitor Data
```json
{
  "_id": "685bcc814da2251d0ea053de",
  "eventId": "685bc0fa4da2251d0ea053d5",
  "eventName": "AI Masterclass",
  "eventLocation": "Sola",
  "eventStartDate": "2025-08-01",
  "eventEndDate": "2025-08-10",
  "ownerId": "685bc0194da2251d0ea053d3",
  "fullName": "Scooter wale",
  "email": "visitrackoffical@gmail.com",
  "phoneNumber": "9727772798",
  "company": "Toupto Technologies",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "country": "India",
  "pincode": "382488",
  "source": "Website",
  "entryType": "Manual",
  "visitorRegistrationDate": "2025-06-25",
  "status": "Registration",
  "createdAt": "2025-01-08T10:30:00.000Z",
  "updatedAt": "2025-01-08T10:30:00.000Z"
}
```

After calling the API, the `entryType` will be changed to `"QR"` and `status` to `"Visited"`.

## **Expected Response Fields**
The API returns these specific fields in the visitor object:

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Visitor ID (MongoDB ObjectId) | `"685bcc814da2251d0ea053de"` |
| `name` | Visitor's full name | `"Scooter wale"` |
| `status` | Current visitor status | `"Visited"` |
| `entryType` | Entry method used | `"QR"` |
| `eventName` | Name of the event | `"AI Masterclass"` |
| `company` | Visitor's company name | `"Toupto Technologies"` |

## Support
For technical support or questions about this API, please contact the development team or refer to the main application documentation. 