import mongoose from 'mongoose';

async function debugInvites() {
  await mongoose.connect('mongodb://localhost:27017/interview-system');
  const col = mongoose.connection.collection('interview_invites');

  const invites = await col.find({}).toArray();
  console.log('Total invites:', invites.length);

  invites.forEach((inv, i) => {
    console.log(
      `\n[${i}] Token: ${inv.token?.substring(0, 30) || 'NO TOKEN'}...`,
    );
    console.log('   Email:', inv.email);
    console.log('   Status:', inv.status);
    console.log('   Keys:', Object.keys(inv).join(', '));
  });

  const targetToken =
    'bfbc7d7cb9c8fce4e4caa77286fa8df86d925006346f9935394b9f1469605a5b';
  const found = invites.find((inv) => inv.token === targetToken);
  console.log('\n\nTarget token found:', !!found);

  await mongoose.connection.close();
}

debugInvites().catch(console.error);
