const admin = require("../config/firebase");
const db = admin.firestore();
const identitiesCollection = db.collection("identities");

const createIdentity = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const identityData = req.body;

    if (!walletId || !identityData) {
      return res
        .status(400)
        .json({ error: "Missing walletId or identity data" });
    }
    identityData.dateAdded = new Date().toISOString();

    const walletRef = db
      .collection("identities")
      .doc(walletId)
      .collection("identityRecords");

    const newIdentityRef = await walletRef.add(identityData);

    res
      .status(201)
      .json({ message: "Identity added successfully", id: newIdentityRef.id });
  } catch (error) {
    console.error("Error adding identity:", error);

    res.status(500).json({ error: "Server error" });
  }
};

const getIdentities = async (req, res, next) => {
  try {
    const { walletId } = req.params;

    if (!walletId) {
      return res.status(400).json({ error: "Missing walletId" });
    }

    const identityRecordsRef = db
      .collection("identities")
      .doc(walletId)
      .collection("identityRecords");
    const snapshot = await identityRecordsRef.get();

    if (snapshot.empty) {
      return res.status(200).json({ identities: [] });
    }

    let identities = [];
    snapshot.forEach((doc) => identities.push({ id: doc.id, ...doc.data() }));
    res.status(200).json(identities);
  } catch (error) {
    console.error("Error fetching identities:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getIdentity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await identitiesCollection.doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Identity not found" });
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
};

const deleteIdentity = async (req, res, next) => {
  try {
    const { walletId, id } = req.params;
    await db
      .collection("identities")
      .doc(walletId)
      .collection("identityRecords")
      .doc(id)
      .delete();

    res.status(200).json({ message: "Identity deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIdentity,
  getIdentities,
  getIdentity,
  deleteIdentity,
};
