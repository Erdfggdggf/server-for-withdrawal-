const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the static HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Enable CORS for frontend requests
app.use((req, res, next) => {
  const origin = process.env.FRONTEND_URL || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.send();
  }
  next();
});

const MPAY_API_KEY = "aoJw4jz9TkFOQ62ZyoQsJQ0TKfwzr67JzTrtIZG3s85liR4Ft697DMFeLq7N";

app.post('/api/withdraw', async (req, res) => {
  try {
    const { amount, receiverNumber, channelCode } = req.body;

    // Validate: minimum 10
    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: "Minimum withdrawal amount is 10" });
    }
    if (!receiverNumber) {
      return res.status(400).json({ success: false, message: "Receiver number is required" });
    }

    const fetch = (await import('node-fetch')).default;

    // Call M-Pay API with your API key
    const mpayResponse = await fetch("https://app.mpayafrica.site/api/v1/withdraw", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MPAY_API_KEY}`,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        Amount: amount.toString(),
        ReceiverNumber: receiverNumber,
        ChannelCode: channelCode,
      }).toString()
    });

    const mpayData = await mpayResponse.json();

    // If M-Pay returns success, respond to frontend
    if (mpayData.success) {
      res.status(200).json({
        success: true,
        status: mpayData.status || "QUEUED",
        reference: mpayData.reference,
        amount: mpayData.amount || amount
      });
    } else {
      res.status(400).json({
        success: false,
        message: mpayData.message || "Failed to process withdrawal"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
