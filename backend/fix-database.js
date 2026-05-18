const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

async function fixDatabase() {
  await mongoose.connect('mongodb://localhost:27017/interview-system');
  const db = mongoose.connection;
  const col = db.collection('interview_invites');

  // Update interview ID to be an ObjectId
  const docId = new ObjectId('69f65d386668afb0e4558300');
  const interviewId = new ObjectId('69f65d376668afb0e45582fe');

  await col.updateOne({ _id: docId }, { $set: { interviewId: interviewId } });

  const doc = await col.findOne({ _id: docId });
  console.log('Updated:', JSON.stringify(doc, null, 2));

  // Now test findOne with token
  const byToken = await col.findOne({
    token: 'bfbc7d7cb9c8fce4e4caa77286fa8df86d925006346f9935394b9f1469605a5b',
  });
  console.log(
    'Found by token:',
    !!byToken,
    byToken ? byToken.token : 'not found',
  );

  await mongoose.connection.close();
}

fixDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
