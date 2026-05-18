const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-system';

async function updateTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection;
    const invitesCollection = db.collection('interview_invites');
    
    // Update the invite with createdBy field
    const result = await invitesCollection.updateOne(
      { token: 'bfbc7d7cb9c8fce4e4caa77286fa8df86d925006346f9935394b9f1469605a5b' },
      { $set: { createdBy: 'test-hr@example.com' } }
    );
    
    console.log('✓ Updated invite with createdBy field');
    
    // Verify
    const invite = await invitesCollection.findOne(
      { token: 'bfbc7d7cb9c8fce4e4caa77286fa8df86d925006346f9935394b9f1469605a5b' }
    );
    
    console.log('\nUpdated invite:');
    console.log('  Token:', invite.token);
    console.log('  Email:', invite.email);
    console.log('  createdBy:', invite.createdBy);
    console.log('  InterviewId:', invite.interviewId);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateTestData();
