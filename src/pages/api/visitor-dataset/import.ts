import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'fs';
import os from 'os';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { connectToDatabase, dbName } from '@/lib/mongodb';

function extractUserFromToken(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return {
      userId: decoded.userId,
      ownerId: decoded.ownerId,
      username: decoded.username
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    const userInfo = extractUserFromToken(req.headers.authorization);

    // Parse the multipart form data
    const form = formidable({
      uploadDir: os.tmpdir(), // Use OS-specific temp directory
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
    });

    const [fields, files] = await form.parse(req);
    
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!uploadedFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = uploadedFile.filepath;
    const fileName = uploadedFile.originalFilename || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    let parsedData: any[] = [];

    try {
      if (fileExtension === 'csv') {
        // Parse CSV file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parseResult = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => {
            // Normalize header names to match database fields
            const headerMap: { [key: string]: string } = {
              'name': 'fullName',
              'full name': 'fullName',
              'fullname': 'fullName',
              'email': 'email',
              'email address': 'email',
              'phone': 'phoneNumber',
              'phone number': 'phoneNumber',
              'phonenumber': 'phoneNumber',
              'mobile': 'phoneNumber',
              'company': 'company',
              'organization': 'company',
              'city': 'city',
              'state': 'state',
              'country': 'country',
              'pincode': 'pincode',
              'pin code': 'pincode',
              'postal code': 'pincode',
              'zip code': 'pincode',
              'zip': 'pincode'
            };
            return headerMap[header.toLowerCase()] || header;
          }
        });
        
        if (parseResult.errors.length > 0) {
          console.error('CSV parsing errors:', parseResult.errors);
        }
        
        parsedData = parseResult.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('Excel file must have at least a header row and one data row');
        }
        
        const headers = (jsonData[0] as string[]).map(header => {
          const headerMap: { [key: string]: string } = {
            'name': 'fullName',
            'full name': 'fullName',
            'fullname': 'fullName',
            'email': 'email',
            'email address': 'email',
            'phone': 'phoneNumber',
            'phone number': 'phoneNumber',
            'phonenumber': 'phoneNumber',
            'mobile': 'phoneNumber',
            'company': 'company',
            'organization': 'company',
            'city': 'city',
            'state': 'state',
            'country': 'country',
            'pincode': 'pincode',
            'pin code': 'pincode',
            'postal code': 'pincode',
            'zip code': 'pincode',
            'zip': 'pincode'
          };
          return headerMap[header?.toLowerCase()] || header;
        });
        
        parsedData = (jsonData.slice(1) as any[][]).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header && row[index] !== undefined && row[index] !== null && row[index] !== '') {
              obj[header] = row[index];
            }
          });
          return obj;
        });
      } else {
        return res.status(400).json({ message: 'Unsupported file format. Please upload CSV or Excel files.' });
      }

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      if (parsedData.length === 0) {
        return res.status(400).json({ message: 'No valid data found in the file' });
      }

      // Process and validate the data
      const processedData = parsedData
        .filter(row => row.fullName || row.email || row.phoneNumber) // At least one of these fields must be present
        .map(row => {
          const currentTime = new Date();
          return {
            ownerId: userInfo.ownerId,
            fullName: row.fullName || '',
            email: row.email || '',
            phoneNumber: row.phoneNumber || '',
            company: row.company || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || '',
            pincode: row.pincode || '',
            createdAt: currentTime,
            updatedAt: currentTime,
            // Include any extra fields that might be in the import data
            ...Object.keys(row).reduce((acc, key) => {
              if (!['fullName', 'email', 'phoneNumber', 'company', 'city', 'state', 'country', 'pincode'].includes(key)) {
                acc[key] = row[key];
              }
              return acc;
            }, {} as any)
          };
        });

      if (processedData.length === 0) {
        return res.status(400).json({ message: 'No valid records found to import' });
      }

      // Insert the data into the database
      const result = await db.collection('visitordataset').insertMany(processedData);

      console.log(`✅ [Import API] Successfully imported ${result.insertedCount} records`);

      return res.status(200).json({
        message: `Successfully imported ${result.insertedCount} records`,
        imported: result.insertedCount,
        total: parsedData.length,
        skipped: parsedData.length - processedData.length
      });

    } catch (fileError) {
      // Clean up the uploaded file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw fileError;
    }

  } catch (error: any) {
    console.error('❌ [Import API] Error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    
    return res.status(500).json({ 
      message: 'Failed to import data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    });
  }
} 