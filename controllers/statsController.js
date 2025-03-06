const admin = require("firebase-admin");
const db = admin.firestore();

const getOverallStats = async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const totalUsers = usersSnapshot.size;

    const identitySnapshot = await db.collectionGroup("identityRecords").get();
    const totalIdentities = identitySnapshot.size;

    let governmentIds = 0;
    let socialIds = 0;
    let educationalIds = 0;
    let othersIds = 0;
    let filesUploaded = 0;

    identitySnapshot.forEach((doc) => {
      const data = doc.data();

      const category = data.category ? data.category : "";
      if (category === "Government IDs") {
        governmentIds++;
      } else if (category === "Socials") {
        socialIds++;
      } else if (category === "Educational IDs") {
        socialIds++;
      } else {
        if (category === "Others") {
          othersIds++;
        }
      }

      if (data.uploadedFile) {
        filesUploaded++;
      }
    });

    const stats = {
      totalUsers,
      totalIdentities,
      governmentIds,
      socialIds,
      educationalIds,
      othersIds,
      filesUploaded,
    };

    return res.status(200).json({ stats });
  } catch (error) {
    console.error("Error fetching overall stats:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
const getUserRegistrationStats = async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const registrationStats = {};

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.dateOfCreation) {
        let dateObj;
        if (typeof data.dateOfCreation.toDate === "function") {
          dateObj = data.dateOfCreation.toDate();
        } else {
          dateObj = new Date(data.dateOfCreation);
        }
        const formattedDate = dateObj.toISOString().split("T")[0];
        registrationStats[formattedDate] =
          (registrationStats[formattedDate] || 0) + 1;
      }
    });

    const statsArray = Object.keys(registrationStats)
      .map((date) => ({ date, count: registrationStats[date] }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ registrationStats: statsArray });
  } catch (error) {
    console.error("Error fetching registration stats:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const logFunctionActivity = async (req, res) => {
  try {
    const { fun, status } = req.body;
    const logRef = db.collection("systemLogs").doc();
    const logData = {
      id: logRef.id,
      timeStamp: admin.firestore.FieldValue.serverTimestamp(),
      fun: fun,
      Status: status,
    };

    await logRef.set(logData);

    return res
      .status(201)
      .json({ message: "Log created successfully", log: logData });
  } catch (error) {
    console.error("Error posting function activity log:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const getFunctionLogs = async (req, res) => {
  try {
    const snapshot = await db
      .collection("systemLogs")
      .orderBy("timeStamp", "desc")
      .get();

    const logs = [];
    snapshot.forEach((doc) => {
      logs.push(doc.data());
    });

    return res.status(200).json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getOverallStats,
  getUserRegistrationStats,
  logFunctionActivity,
  getFunctionLogs,
};
