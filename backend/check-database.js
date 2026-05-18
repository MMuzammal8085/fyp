/**
 * Debug script to check what's in the database
 */

const mongoose = require('mongoose');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-system';

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection;

    // List collections
    const collections = await db.db.listCollections().toArray();
    console.log('\n--- Collections in database ---');
    collections.forEach((col) => console.log('  -', col.name));

    // Check interview_invites collection
    console.log('\n--- interview_invites collection ---');
    const invitesCollection = db.collection('interview_invites');
    const count = await invitesCollection.countDocuments();
    console.log('Total documents:', count);

    const invites = await invitesCollection.find({}).toArray();
    console.log('Invites:');
    invites.forEach((invite) => {
      console.log('  Token:', invite.token);
      console.log('  Email:', invite.email);
      console.log('  InterviewId:', invite.interviewId);
      console.log('  createdBy:', invite.createdBy);
      console.log('  ---');
    });

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
