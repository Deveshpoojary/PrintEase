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
const { getPageCount } = require("./utils/pageCounter");

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

app.get("/api/price-estimate", async (req, res) => {
  try {
    const { color, sides, copies, pages } = req.query;

    if (!color || !sides || !copies || !pages) {
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    // Validate values
    if (color === 'color' && sides === 'double') {
      return res.status(400).json({ error: "Double-sided color printing is not supported." });
    }

    const priceQuery = await pool.query('SELECT * FROM prices LIMIT 1');
    const { single_side_cost, double_side_cost, color_cost } = priceQuery.rows[0];

    let perPageCost = 0;
    if (color === 'color') {
      perPageCost = color_cost;
    } else if (sides === 'single') {
      perPageCost = single_side_cost;
    } else if (sides === 'double') {
      perPageCost = double_side_cost;
    }

    const totalPages = parseInt(pages);
    const totalCopies = parseInt(copies);
    const totalPrice = totalPages * totalCopies * perPageCost;

    res.json({ totalPages, totalPrice });
  } catch (err) {
    console.error("Price estimate error:", err);
    res.status(500).json({ error: "Failed to calculate price estimate" });
  }
});


// POST endpoint for print requests
app.post("/api/print-request", uploadd.array("files"), async (req, res) => {
  try {
    const { email } = req.body;
    const printOptions = JSON.parse(req.body.printOptions);
    const files = req.files;

    if (!email || !files || files.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { color, sides, copies, pages, specificPages, comments } = printOptions;

    if (color === "color" && sides === "double") {
      return res.status(400).json({ error: "Double-sided color printing is not supported." });
    }

    let totalPages = 0;

    for (const file of files) {
      try {
        const pages = await getPageCount(file.buffer, file.mimetype);
        totalPages += pages;
      } catch (err) {
        console.warn("Skipping unsupported file:", file.originalname, err.message);
        return res.status(400).json({ error: `Unsupported file: ${file.originalname}` });
      }
    }

    const priceQuery = await pool.query("SELECT * FROM prices LIMIT 1");
    const { single_side_cost, double_side_cost, color_cost } = priceQuery.rows[0];

    let perPageCost = 0;
    if (color === "color") perPageCost = color_cost;
    else if (sides === "single") perPageCost = single_side_cost;
    else if (sides === "double") perPageCost = double_side_cost;

    const totalPrice = totalPages * parseInt(copies) * perPageCost;

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
    const fileUrlsAsString = uploadedFiles.join(","); 

    const insertSQL = `
      INSERT INTO print_requests
        (email, file_url, color, sides, copies, pages, specific_pages, comments, price, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id;
    `;

    const { rows } = await pool.query(insertSQL, [
      email,
      fileUrlsAsString,
      color,
      sides,
      copies,
      pages,
      specificPages,
      comments,
      totalPrice,
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
      `SELECT id, email, file_url, color, sides, copies, pages, specific_pages, comments, price, created_at
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
    const result = await pool.query(
      `SELECT id, email, pages, copies, color, sides, specific_pages, comments, created_at, file_url
       FROM print_requests
       ORDER BY created_at DESC`
    );

    const requests = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      pages: row.pages,
      copies: row.copies,
      color: row.color,
      sides: row.sides,
      specific_pages: row.specific_pages,
      comments: row.comments,
      created_at: row.created_at,
      file_url: row.file_url, // this is expected to be an array of file names
    }));

    res.json(requests);
  } catch (err) {
    console.error('Error fetching print requests:', err.message);
    res.status(500).json({ error: 'Unable to fetch print requests' });
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
