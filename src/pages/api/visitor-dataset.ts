import { NextApiRequest, NextApiResponse } from 'next';
import { VisitorDataset } from '@/types/visitor';
import jwt from 'jsonwebtoken';
import { connectToDatabase, dbName } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const { db } = await connectToDatabase();

    switch (method) {
      case 'GET':
        // Check for authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.substring(7);
        let decoded: any;
        
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          console.log('🔍 Center DB Debug - decoded token:', decoded);
        } catch (error) {
          return res.status(401).json({ message: 'Invalid token' });
        }

        const ownerId = decoded.ownerId;

        const { email: getEmail, all } = req.query;
        
        // If 'all' parameter is provided, get all visitor dataset records for the owner
        if (all === 'true') {
          const page = parseInt((req.query.page as string) || '1');
          const limit = parseInt((req.query.limit as string) || '50');
          const search = req.query.search as string;
          
          const skip = (page - 1) * limit;
          
          console.log('🔍 Center DB Debug - ownerId:', ownerId, '| Type:', typeof ownerId);
          console.log('🔍 Center DB Debug - search:', search);
          
          // First, let's check if there's ANY data in the collection
          const allRecordsCount = await db.collection('visitordataset').countDocuments({});
          console.log('🔍 Center DB Debug - Total records in collection:', allRecordsCount);
          
          // Let's also see all unique ownerIds in the collection
          const uniqueOwners = await db.collection('visitordataset').distinct('ownerId');
          console.log('🔍 Center DB Debug - Unique ownerIds in collection:', uniqueOwners);
          console.log('🔍 Center DB Debug - OwnerIds types:', uniqueOwners.map((id: any) => ({ id, type: typeof id })));
          
          // Check if there's any data for this user with string conversion
          const ownerIdAsString = String(ownerId);
          const dataWithStringOwnerId = await db.collection('visitordataset').countDocuments({ ownerId: ownerIdAsString });
          console.log('🔍 Center DB Debug - Records with ownerId as string:', dataWithStringOwnerId);
          
          // Check for any records that might have been imported recently
          const recentRecords = await db.collection('visitordataset')
            .find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
          console.log('🔍 Center DB Debug - Recent records:', recentRecords.map((r: any) => ({ 
            id: r._id, 
            ownerId: r.ownerId, 
            ownerIdType: typeof r.ownerId, 
            fullName: r.fullName,
            createdAt: r.createdAt 
          })));
          
          // Build search query - ensure ownerId is handled as string for consistency
          const ownerIdQuery = String(ownerId);
          let searchQuery: any = { ownerId: ownerIdQuery };
          
          if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            searchQuery.$and = [
              { ownerId: ownerIdQuery }, // Ensure ownerId filter is always applied
              {
                $or: [
                  { fullName: searchRegex },
                  { email: searchRegex },
                  { phoneNumber: searchRegex },
                  { company: searchRegex },
                  { city: searchRegex },
                  { state: searchRegex },
                  { country: searchRegex }
                ]
              }
            ];
          }

          console.log('🔍 Center DB Debug - searchQuery:', JSON.stringify(searchQuery));

          // Get total count
          const totalCount = await db.collection('visitordataset').countDocuments(searchQuery);
          console.log('🔍 Center DB Debug - totalCount:', totalCount);

          // Get paginated data
          const visitorDataset = await db.collection('visitordataset')
            .find(searchQuery)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

          console.log('🔍 Center DB Debug - visitorDataset length:', visitorDataset.length);
          console.log('🔍 Center DB Debug - first record:', visitorDataset[0]);

          return res.status(200).json({
            visitorDataset,
            pagination: {
              current: page,
              total: Math.ceil(totalCount / limit),
              count: totalCount,
              limit
            }
          });
        }

        // Original single visitor lookup
        if (!getEmail || typeof getEmail !== 'string') {
          return res.status(400).json({ message: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(getEmail)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }

        const visitorData = await db.collection('visitordataset').findOne({ 
          email: getEmail,
          ownerId: ownerId 
        });
        
        if (!visitorData) {
          return res.status(404).json({ message: 'Visitor data not found' });
        }

        return res.status(200).json(visitorData);

      case 'POST':
        // Create or update visitor data
        const {
          ownerId: postOwnerId,
          fullName,
          email,
          phoneNumber,
          company,
          city,
          state,
          country,
          pincode
        } = req.body;

        // Validate required fields
        if (!postOwnerId || !fullName || !email || !phoneNumber) {
          return res.status(400).json({ 
            message: 'Owner ID, full name, email, and phone number are required' 
          });
        }

        // Validate email format
        const postEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!postEmailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }

        const visitorDatasetRecord = {
          ownerId: postOwnerId,
          fullName,
          email,
          phoneNumber,
          company: company || '',
          city: city || '',
          state: state || '',
          country: country || '',
          pincode: pincode || '',
          updatedAt: new Date()
        };

        // Check if visitor data already exists for this owner
        const existingVisitor = await db.collection('visitordataset').findOne({ 
          email,
          ownerId: postOwnerId 
        });

        if (existingVisitor) {
          // Update existing visitor data
          await db.collection('visitordataset').updateOne(
            { email, ownerId: postOwnerId },
            { 
              $set: visitorDatasetRecord
            }
          );

          console.log('✅ Visitor dataset updated:', email, 'for owner:', postOwnerId);
          return res.status(200).json({ 
            message: 'Visitor data updated successfully',
            data: visitorDatasetRecord
          });
        } else {
          // Create new visitor data
          const newVisitorDatasetRecord = {
            ...visitorDatasetRecord,
            createdAt: new Date()
          };
          
          const result = await db.collection('visitordataset').insertOne(newVisitorDatasetRecord);

          console.log('✅ Visitor dataset created:', email);
          return res.status(201).json({ 
            message: 'Visitor data created successfully',
            data: { ...newVisitorDatasetRecord, _id: result.insertedId }
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in visitor-dataset API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 