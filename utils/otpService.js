const admin = require("../config/firebase");
const db = admin.firestore();

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const storeOTP = async (id, otp, identifier) => {
  await db
    .collection("otp_store")
    .doc(identifier)
    .set({
      otp,
      expiresAt: Date.now() + 300000,
      identifier: identifier,
    });
};

const cleanupExpiredOTPs = async () => {
  const otpStoreRef = db.collection("otp_store");
  const otpUsers = await otpStoreRef.listDocuments();

  for (const userRef of otpUsers) {
    const otpsRef = userRef.collection("otps");
    const expiredOTPs = await otpsRef.where("expiresAt", "<", Date.now()).get();

    const batch = db.batch();
    expiredOTPs.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();
  }
};

module.exports = { generateOTP, storeOTP, cleanupExpiredOTPs };
