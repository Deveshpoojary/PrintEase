require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); 
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const uploadd = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer(); // Use memory storage

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  connectionTimeoutMillis: 10000, // 10 seconds
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST endpoint for print requests
app.post("/api/print-request", uploadd.array("files"), async (req, res) => {
  try {
    const { email } = req.body;
    const printOptions = JSON.parse(req.body.printOptions);
    const files = req.files;

    if (!email || !files || files.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Extract options
    const { color, sides, copies, pages, specificPages, comments } = printOptions;

    // ⛔ Prevent double side color
    if (color === 'color' && sides === 'double') {
      return res.status(400).json({ error: "Double-sided color printing is not supported." });
    }

    // 🧮 Count total pages
    let totalPages = 0;
    for (const file of files) {
      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        totalPages += pdfData.numpages;
      } else {
        return res.status(400).json({ error: "Only PDF files are supported for page counting." });
      }
    }

    // 💸 Fetch pricing
    const priceQuery = await pool.query('SELECT * FROM prices LIMIT 1');
    const { single_side_cost, double_side_cost, color_cost } = priceQuery.rows[0];

    // 💰 Price calculation
    let perPageCost = 0;
    if (color === 'color') {
      perPageCost = color_cost;
    } else if (sides === 'single') {
      perPageCost = single_side_cost;
    } else if (sides === 'double') {
      perPageCost = double_side_cost;
    }

    const totalPrice = totalPages * copies * perPageCost;

    // ☁️ Upload to Supabase
    const uploadedFiles = [];
    for (const file of files) {
      const filename = `uploads/${Date.now()}-${file.originalname}`;
      const { data, error } = await supabase.storage
        .from("print-files")
        .upload(filename, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return res.status(500).json({ error: "File upload failed" });
      }

      const publicUrl = `https://${process.env.SUPABASE_URL.replace(
        "https://",
        ""
      )}/storage/v1/object/public/print-files/${data.path}`;
      uploadedFiles.push(publicUrl);
    }

    // 📝 Store in DB
    const insertSQL = `
      INSERT INTO print_requests
        (email, file_url, color, sides, copies, pages, specific_pages, comments, price, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id;
    `;

    const { rows } = await pool.query(insertSQL, [
      email,
      uploadedFiles,
      color,
      sides,
      copies,
      pages,
      specificPages,
      comments,
      totalPrice
    ]);

    res.json({
      success: true,
      id: rows[0].id,
      totalPages,
      totalPrice,
    });

  } catch (err) {
    console.error("Print request error:", err);
    res.status(500).json({ error: "Print request failed" });
  }
});


// Your print history endpoint here using app.get
app.get('/api/print-request/user-history', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, file_url, color, sides, copies, pages, specific_pages, comments, created_at
       FROM print_requests
       WHERE email = $1
       ORDER BY created_at DESC`,
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching print history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Admin routeto get all print-requests
app.get('/api/admin/print-requests', async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from('print-files')
      .list('uploads', { limit: 100, sortBy: { column: 'name', order: 'desc' } });

    if (error) return res.status(500).json({ error: error.message });

    const requests = data.map((file) => ({
      file_url: file.name, // only file name
      created_at: file.created_at || new Date().toISOString(), // fallback if undefined
      email: 'unknown', // you can replace this if you store email somewhere
      pages: 0,
      copies: 1,
      color: 'color',
      sides: 'single',
      specific_pages: '',
      comments: '',
    }));

    res.json(requests);
  } catch (err) {
    console.error('Error fetching files from Supabase:', err.message);
    res.status(500).json({ error: 'Unable to fetch files' });
  }
});




app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT email, COUNT(*) AS total_requests
      FROM print_requests
      GROUP BY email
      ORDER BY total_requests DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin Users Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET current pricing settings
app.get('/api/admin/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prices LIMIT 1');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching price settings:', err);
    res.status(500).json({ error: 'Failed to fetch pricing settings' });
  }
});

// POST update pricing settings
app.post('/api/admin/settings', async (req, res) => {
  const { single_side_cost, double_side_cost, color_cost } = req.body;

  try {
    await pool.query(
      `UPDATE prices
       SET single_side_cost = $1,
           double_side_cost = $2,
           color_cost = $3,
           updated_at = NOW()
       WHERE id = 1`,
      [single_side_cost, double_side_cost, color_cost]
    );

    const result = await pool.query('SELECT * FROM prices WHERE id = 1');
    res.json({ success: true, message: 'Pricing settings updated', settings: result.rows[0] });
  } catch (err) {
    console.error('Error updating pricing settings:', err);
    res.status(500).json({ error: 'Failed to update pricing settings' });
  }
});


// Clerk restrictions
app.post("/clerk/beforeSignIn", (req, res) => {
  const email = req.body.data.email_addresses?.[0]?.email_address;
  if (!email || !email.endsWith("@mite.ac.in")) {
    return res.status(403).json({
      message: "Only @mite.ac.in email addresses are allowed to sign in.",
    });
  }
  res.status(200).json({ message: "Access granted" });
});

app.post("/clerk/beforeUserCreated", (req, res) => {
  const email = req.body.data.email_addresses?.[0]?.email_address;
  if (!email || !email.endsWith("@mite.ac.in")) {
    return res.status(403).json({
      message: "Only @mite.ac.in email addresses are allowed to sign up.",
    });
  }
  res.status(200).json({ message: "User creation allowed" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
