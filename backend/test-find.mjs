// Simple test to verify database access
import mongoose from 'mongoose';

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/interview-system');

    // Find using native MongoDB
    const db = mongoose.connection.db;
    const col = db.collection('interview_invites');

    // List all
    const all = await col.find({}).toArray();
    console.log('All invites from MongoDB:', all.length);
    all.forEach((inv) => {
      console.log(' -', inv.token?.substring(0, 20), inv.email);
    });

    // Search for specific one
    const token =
      'bfbc7d7cb9c8fce4e4caa77286fa8df86d925006346f9935394b9f1469605a5b';
    const found = await col.findOne({ token });
    console.log('\nSpecific token found:', !!found);
    console.log('Full token:', found?.token);
    console.log('Email:', found?.email);

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
