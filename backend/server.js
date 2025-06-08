const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/clerk/beforeSignIn", (req, res) => {
  const emailAddresses = req.body.data.email_addresses;

  const email = emailAddresses[0]?.email_address;
  if (!email || !email.endsWith("@mite.ac.in")) {
    return res.status(403).json({
      message: "Only @mite.ac.in email addresses are allowed to sign in.",
    });
  }

  return res.status(200).json({ message: "Access granted" });
});

app.post("/clerk/beforeUserCreated", (req, res) => {
  const emailAddresses = req.body.data.email_addresses;

  const email = emailAddresses[0]?.email_address;
  if (!email || !email.endsWith("@mite.ac.in")) {
    return res.status(403).json({
      message: "Only @mite.ac.in email addresses are allowed to sign up.",
    });
  }

  return res.status(200).json({ message: "User creation allowed" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
