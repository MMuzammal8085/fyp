/**
 * Setup test data for interview testing
 * Run with: node setup-test-data.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-system';
const ELEVENLABS_AGENT_ID =
  process.env.ELEVENLABS_AGENT_ID || 'agent_9901kq0bpa3qfd7ba2tc0smerwfn';

async function setupTestData() {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection;

    // Generate test token
    const testToken = crypto.randomBytes(32).toString('hex');
    const testRoomId = crypto.randomBytes(8).toString('hex');

    console.log('\n--- Creating Test Interview ---');
    const interviewsCollection = db.collection('interviews');
    const interviewResult = await interviewsCollection.insertOne({
      job_title: 'Senior Software Engineer',
      description:
        'We are looking for an experienced software engineer with strong backend skills.',
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const interviewId = interviewResult.insertedId.toString();
    console.log('✓ Test interview created:', interviewId);

    console.log('\n--- Creating Test Interview Invite ---');
    const invitesCollection = db.collection('interview_invites');
    const inviteResult = await invitesCollection.insertOne({
      interviewId: interviewId,
      email: 'candidate@test.com',
      token: testToken,
      roomId: testRoomId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✓ Test invite created:', inviteResult.insertedId.toString());

    console.log('\n========== TEST DATA CREATED ==========');
    console.log('Interview ID:', interviewId);
    console.log('Interview Token:', testToken);
    console.log('Candidate Email:', 'candidate@test.com');
    console.log('\nInterview URL:');
    console.log(`  http://localhost:5174/interview/join?token=${testToken}`);
    console.log('\nAgent ID:', ELEVENLABS_AGENT_ID);
    console.log('=========================================\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

setupTestData();
