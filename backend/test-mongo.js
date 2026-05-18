const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/interview-system');
  const col = mongoose.connection.collection('interview_invites');
  const doc = await col.findOne({
    token: 'bfbc7d7cb9c8fce4e4caa77286fa8df86d925006346f9935394b9f1469605a5b',
  });
  console.log('Found in MongoDB:', !!doc);
  if (doc) {
    console.log('Document:', JSON.stringify(doc, null, 2));
  }
  await mongoose.connection.close();
})();
