const admin = require("../config/firebase");
const db = admin.firestore();
const { userSchema, signInSchema } = require("../validators/userValidators");
const { generateOTP, storeOTP } = require("../utils/otpService");
const {
  sendOTPWithFirebase,
  sendPasswordResetEmail,
} = require("../utils/firebaseAuthService");
const { sendWelcomeEmail } = require("../utils/emailService");
const auth = admin.auth();

async function generateUniqueUserId() {
  let userId;
  let isUnique = false;

  while (!isUnique) {
    userId = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const userRef = db.collection("users").doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      isUnique = true;
    }
  }

  return userId;
}

async function generateUniqueWalletId() {
  let walletId;
  let isUnique = false;

  while (!isUnique) {
    walletId = Math.floor(
      100000000000 + Math.random() * 900000000000
    ).toString();

    const usersRef = db.collection("users");
    const querySnapshot = await usersRef
      .where("userUnididId", "==", walletId)
      .get();

    const walletSnapshot = await usersRef
      .where("walletId", "==", walletId)
      .get();

    if (querySnapshot.empty && walletSnapshot.empty) {
      isUnique = true;
    }
  }

  return walletId;
}

const createUser = async (req, res, next) => {
  try {
    const { error, value } = userSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ errors: error.details.map((d) => d.message) });

    let { phone, email, password, usrname } = value;

    if (phone && !phone.startsWith("+")) {
      phone = `+91${phone}`;
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: usrname,
      phoneNumber: phone,
    });

    const userUnididId = await generateUniqueUserId();
    const walletId = await generateUniqueWalletId();
    value.userUnididId = userUnididId;
    value.walletId = walletId;
    value.dateOfCreation = new Date().toISOString();
    await db.collection("users").doc(userUnididId).set(value);
    const walletRef = db.collection("identities").doc(walletId);
    await walletRef.set({ initialized: true });

    const activityData = {
      id: userUnididId,
      action: "User Id Created",
      status: "Completed",
      description: "Welcome to UniDID!",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection("userActivities")
      .doc(userUnididId)
      .collection("activities")
      .add(activityData);

    res.status(201).json({ id: userUnididId, ...value });
  } catch (err) {
    console.error("Signup error:", err);

    res.status(500).json({ error: err.message });
  }
};

const signInUser = async (req, res, next) => {
  try {
    const { error, value } = signInSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ errors: error.details.map((d) => d.message) });

    const { identifier, password } = value;

    let userRecord;

    if (identifier.includes("@")) {
      userRecord = await auth.getUserByEmail(identifier);
    } else if (identifier.startsWith("+")) {
      userRecord = await auth.getUserByPhoneNumber(identifier);
    } else {
      const userQuery = await db
        .collection("users")
        .where("userUnididId", "==", identifier)
        .get();
      if (userQuery.empty)
        return res.status(401).json({ error: "Invalid credentials." });

      userQuery.forEach((doc) => (userRecord = { uid: doc.id, ...doc.data() }));
    }

    if (!userRecord) return res.status(401).json({ error: "User not found." });

    if (identifier.length === 12 && password) {
      const userSnapshot = await db
        .collection("users")
        .where("password", "==", password)
        .get();

      if (userSnapshot.empty) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const userData = userSnapshot.docs[0].data();

      if (userData.password !== password) {
        return res.status(401).json({ error: "Invalid credentials." });
      }
    }

    const otp = generateOTP();

    await storeOTP(userRecord.uid, otp, identifier);

    await sendOTPWithFirebase(userRecord.email, otp);

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("Sign-in error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { otpStr, email, phone, username } = req.body;
    const userIdentifier = email || username || `+91${phone}`;

    if (!userIdentifier || !otpStr) {
      return res.status(400).json({ error: "Missing user identifier or OTP." });
    }

    const otpDocRef = db.collection("otp_store").doc(userIdentifier);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ error: "OTP expired or invalid." });
    }

    const { otp: storedOTP, expiresAt } = otpDoc.data();

    if (Date.now() > expiresAt) {
      await otpDocRef.delete();
      return res.status(400).json({ error: "OTP expired." });
    }

    if (storedOTP !== otpStr) {
      return res.status(400).json({ error: "Invalid OTP." });
    }

    await otpDocRef.delete();
    const usersRef = db.collection("users");
    let userSnapshot;

    if (email) {
      userSnapshot = await usersRef.where("email", "==", email).get();
    } else if (username) {
      userSnapshot = await usersRef.where("userUnididId", "==", username).get();
    } else {
      userSnapshot = await usersRef.where("phone", "==", `+91${phone}`).get();
    }

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found." });
    }

    const userDoc = userSnapshot.docs[0];
    const { userUnididId, walletId } = userDoc.data();

    const activityData = {
      id: userUnididId,
      action: "User Id Signed-in",
      status: "Completed",
      description: "Welcome back to UniDID!",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection("userActivities")
      .doc(userUnididId)
      .collection("activities")
      .add(activityData);
    res.status(200).json({
      message: "OTP verified successfully.",
      userUnididId,
      walletId,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res
        .status(400)
        .json({ error: "Identifier (UserID, Email, or Phone) is required." });
    }

    let userQuery = db.collection("users");

    if (identifier.includes("@")) {
      userQuery = userQuery.where("email", "==", identifier);
    } else if (identifier.startsWith("+")) {
      userQuery = userQuery.where("phone", "==", identifier);
    } else {
      userQuery = userQuery.where("userUnididId", "==", identifier);
    }

    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found." });
    }

    let userData;
    userSnapshot.forEach((doc) => {
      userData = doc.data();
    });

    const otp = generateOTP();

    await storeOTP(identifier, otp, identifier);

    if (userData.email) {
      await sendOTPWithFirebase(userData.email, otp);
    } else {
      return res.status(400).json({ error: "No valid email found for user." });
    }

    res.status(200).json({ message: "New OTP sent successfully." });
  } catch (err) {
    console.error("Error resending OTP:", err);
    res.status(500).json({ error: "Server error." });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const resetLink = await auth.generatePasswordResetLink(email);

    res.status(200).json({ message: "Password reset link sent.", resetLink });
  } catch (err) {
    res.status(500).json({ error: "Error sending reset link." });
  }
};

const getUser = async (req, res) => {
  try {
    const { userUnididId } = req.params;
    if (!userUnididId) {
      return res.status(400).json({ error: "MissinguserUnididId parameter" });
    }

    const userRef = db.collection("users").doc(userUnididId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: userDoc.data() });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const logUserActivity = async (req, res) => {
  try {
    console.log("Working in backend", req.body);
    const { userUnididId, action, description, status } = req.body;
    if (!userUnididId || !action || !status) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: userUnididId, action, or status",
        });
    }
    const activityRef = db
      .collection("userActivities")
      .doc(userUnididId)
      .collection("activities")
      .doc();

    const activityData = {
      id: activityRef.id,
      action,
      status,
      description: description || "",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await activityRef.set(activityData);

    return res.status(201).json({
      message: "Activity logged successfully",
      log: activityData,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUserActivities = async (req, res) => {
  try {
    const { userUnididId } = req.params;

    if (!userUnididId) {
      return res.status(400).json({ error: "Missing userUnididId" });
    }

    const activitiesRef = db
      .collection("userActivities")
      .doc(userUnididId)
      .collection("activities");

    const snapshot = await activitiesRef.orderBy("timestamp", "desc").get();

    if (snapshot.empty) {
      return res.status(200).json({ activities: [] });
    }

    let activities = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        action: data.action,
        description: data.description,
        status: data.status,
        timestamp: data.timestamp
          ? data.timestamp.toDate().toISOString()
          : null,
      });
    });

    res.status(200).json({ activities });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const modifyUser = async (req, res) => {
  try {
    const { userUnididId } = req.params;
    const { newsletter } = req.body;

    if (!newsletter) {
      return res.status(400).json({ error: "Newsletter email is required." });
    }

    const userRef = db.collection("users").doc(userUnididId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found." });
    }

    await userRef.update({ newsletter });
    const activityData = {
      action: "Signed up for newsletter!",
      status: "Completed",
      description:
        "You will receive updates regarding UniDID to your email from now.",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection("userActivities")
      .doc(userUnididId)
      .collection("activities")
      .add(activityData);

    await sendWelcomeEmail(newsletter);
    return res
      .status(200)
      .json({ message: "Newsletter updated successfully." });
  } catch (error) {
    console.error("Error updating newsletter:", error);
    const activityData = {
      id: userUnididId,
      action: "Not Signed up for newsletter!",
      status: "Failed",
      description: "Failed to add your email.",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection("userActivities")
      .doc(userUnididId)
      .collection("activities")
      .add(activityData);

    return res
      .status(500)
      .json({ error: "Server error while updating newsletter." });
  }
};

module.exports = {
  createUser,
  signInUser,
  forgotPassword,
  resendOTP,
  verifyOTP,
  getUser,
  logUserActivity,
  getUserActivities,
  modifyUser,
};
