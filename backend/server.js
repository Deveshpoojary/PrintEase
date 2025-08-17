require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const dns = require('dns');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const uploadd = multer({ storage: multer.memoryStorage() });
const { getPageCount } = require("./utils/pageCounter");
const Stripe = require("stripe");
const crypto = require("crypto");
const { requireAuth } = require('@clerk/express');


dns.setDefaultResultOrder('ipv4first'); 

const app = express();
app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // from .env stripe secret key

const upload = multer(); // Use memory storage

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  connectionTimeoutMillis: 10000, // 10 seconds
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);



const SLOT_DURATION_MIN = 10;
const DEFAULT_CAPACITY = 5;

// Snap HH:MM to 10-minute grid
function snapToGrid(timeHHMM) {
  // input "HH:MM"
  const [h, m] = timeHHMM.split(':').map(Number);
  const snapped = Math.floor(m / SLOT_DURATION_MIN) * SLOT_DURATION_MIN;
  const mm = String(snapped).padStart(2, '0');
  const hh = String(h).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Build timestamptz in UTC from date + time (treat input as local)
function buildStartAt(dateStr, timeStr) {
  // Interpret dateStr as YYYY-MM-DD and timeStr as HH:MM (local), let Postgres handle zone with '::timestamptz'
  // We send "YYYY-MM-DD HH:MM:00" and rely on server TZ; if you want strict zone, pass timezone explicitly.
  return `${dateStr} ${timeStr}:00`;
}

function generateOtp() {
  // 6-digit numeric, no leading zeros lost because we pad
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

/**
 * GET /api/slots/availability?date=YYYY-MM-DD&time=HH:MM
 * Returns { capacity, remaining }
 */
app.get('/api/slots/availability', async (req, res) => {
  try {
    const { date, time } = req.query;
    if (!date || !time) return res.status(400).json({ error: 'date and time are required' });

    const snapped = snapToGrid(time);
    const startAt = buildStartAt(date, snapped);

    const { rows } = await pool.query(
      `
      SELECT capacity, booked_count
      FROM slots
      WHERE start_at = $1::timestamptz
      `,
      [startAt]
    );

    if (rows.length === 0) {
      // slot not created yet -> capacity full available
      return res.json({ capacity: DEFAULT_CAPACITY, remaining: DEFAULT_CAPACITY });
    }

    const { capacity, booked_count } = rows[0];
    return res.json({ capacity, remaining: Math.max(0, capacity - booked_count) });
  } catch (err) {
    console.error('availability error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/book-slot
 * body: { date, time, name, usn, email, phone, notes }
 * returns: { booking_id, slot_id, otp, capacity, remaining }
 */
app.post('/api/book-slot',  async (req, res) => {
  const client = await pool.connect();
  try {
    const { date, time, usn, phone, notes,email,name } = req.body;

    // ✅ name + email come from Clerk, not user input
    // const clerkUser = req.auth.sessionClaims;
    // const email = clerkUser.email || clerkUser.primaryEmail || 'unknown@user.com';
    // const name = clerkUser.fullName || clerkUser.username || 'Unknown User';

    if (!date || !time || !usn || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const snapped = snapToGrid(time);
    const startAt = buildStartAt(date, snapped);

    await client.query('BEGIN');

    // create/find slot
    let slotRow;
    const { rows } = await client.query(
      `SELECT id, capacity, booked_count
       FROM slots
       WHERE start_at = $1::timestamptz
       FOR UPDATE`,
      [startAt]
    );

    if (rows.length === 0) {
      const insert = await client.query(
        `INSERT INTO slots (start_at, duration_minutes, capacity, booked_count)
         VALUES ($1::timestamptz, $2, $3, 0)
         ON CONFLICT (start_at) DO NOTHING
         RETURNING id, capacity, booked_count`,
        [startAt, SLOT_DURATION_MIN, DEFAULT_CAPACITY]
      );
      slotRow = insert.rows.length ? insert.rows[0] : (await client.query(
        `SELECT id, capacity, booked_count
         FROM slots
         WHERE start_at = $1::timestamptz
         FOR UPDATE`,
        [startAt]
      )).rows[0];
    } else {
      slotRow = rows[0];
    }

    if (slotRow.booked_count >= slotRow.capacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This slot is full. Please select another time.' });
    }

    const otp = generateOtp();

    const bookingInsert = await client.query(
      `INSERT INTO bookings
         (slot_id, name, usn, email, phone, notes, otp, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'booked')
       RETURNING id, created_at`,
      [slotRow.id, name, usn, email, phone, notes || '', otp]
    );

    const updated = await client.query(
      `UPDATE slots
       SET booked_count = booked_count + 1
       WHERE id = $1
       RETURNING capacity, booked_count`,
      [slotRow.id]
    );

    await client.query('COMMIT');

    res.json({
      booking_id: bookingInsert.rows[0].id,
      slot_id: slotRow.id,
      otp,
      capacity: updated.rows[0].capacity,
      remaining: Math.max(0, updated.rows[0].capacity - updated.rows[0].booked_count),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('book-slot error:', err);
    res.status(500).json({ error: 'Unable to book the slot' });
  } finally {
    client.release();
  }
});


/**
 * POST /api/checkin
 * body: { otp }
 * returns: { booking_id, status, checked_in_at }
 */
// app.post('/api/checkin', async (req, res) => {
//   try {
//     const { otp } = req.body;
//     if (!otp) return res.status(400).json({ error: 'OTP is required' });

//     const { rows } = await pool.query(
//       `UPDATE bookings
//        SET status = 'checked_in', checked_in_at = NOW()
//        WHERE otp = $1 AND status = 'booked'
//        RETURNING id, checked_in_at, status`,
//       [otp]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ error: 'Invalid OTP or already checked in' });
//     }

//     res.json({
//       booking_id: rows[0].id,
//       status: rows[0].status,
//       checked_in_at: rows[0].checked_in_at
//     });
//   } catch (err) {
//     console.error('checkin error:', err);
//     res.status(500).json({ error: 'Unable to check in' });
//   }
// });

app.post('/api/complete', async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required' });

    const { rows } = await pool.query(
      `UPDATE bookings
       SET status = 'completed'
       WHERE otp = $1 AND status IN ('booked','checked_in')
       RETURNING id, status`,
      [otp]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid OTP or already completed' });
    }

    res.json({
      booking_id: rows[0].id,
      status: rows[0].status,
      completed_at: rows[0].completed_at
    });
  } catch (err) {
    console.error('complete error:', err);
    res.status(500).json({ error: 'Unable to complete booking' });
  }
});

// (Optional) Admin: list bookings for a date
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const params = [];
    let where = '';
    if (date) {
      where = 'WHERE DATE(s.start_at) = $1';
      params.push(date);
    }
    const { rows } = await pool.query(
      `
      SELECT b.id as booking_id, b.name, b.usn, b.email, b.phone, b.status, b.otp,
             s.start_at, s.duration_minutes,
             b.created_at, b.checked_in_at
      FROM bookings b
      JOIN slots s ON s.id = b.slot_id
      ${where}
      ORDER BY s.start_at ASC, b.created_at ASC
      `,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('admin bookings error:', err);
    res.status(500).json({ error: 'Unable to load bookings' });
  }
});


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
// app.post("/api/print-request", uploadd.array("files"), async (req, res) => {
//   try {
//     const { email } = req.body;
//     const printOptions = JSON.parse(req.body.printOptions);
//     const files = req.files;

//     if (!email || !files || files.length === 0) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const { color, sides, copies, pages, specificPages, comments } = printOptions;

//     if (color === "color" && sides === "double") {
//       return res.status(400).json({ error: "Double-sided color printing is not supported." });
//     }

//     let totalPages = 0;

//     for (const file of files) {
//       try {
//         const pages = await getPageCount(file.buffer, file.mimetype);
//         totalPages += pages;
//       } catch (err) {
//         console.warn("Skipping unsupported file:", file.originalname, err.message);
//         return res.status(400).json({ error: `Unsupported file: ${file.originalname}` });
//       }
//     }

//     const priceQuery = await pool.query("SELECT * FROM prices LIMIT 1");
//     const { single_side_cost, double_side_cost, color_cost } = priceQuery.rows[0];

//     let perPageCost = 0;
//     if (color === "color") perPageCost = color_cost;
//     else if (sides === "single") perPageCost = single_side_cost;
//     else if (sides === "double") perPageCost = double_side_cost;

//     const totalPrice = totalPages * parseInt(copies) * perPageCost;

//     const uploadedFiles = [];
//     for (const file of files) {
//       const filename = `uploads/${Date.now()}-${file.originalname}`;
//       const { data, error } = await supabase.storage
//         .from("print-files")
//         .upload(filename, file.buffer, {
//           contentType: file.mimetype,
//         });

//       if (error) {
//         console.error("Supabase upload error:", error);
//         return res.status(500).json({ error: "File upload failed" });
//       }

//       const publicUrl = `https://${process.env.SUPABASE_URL.replace(
//         "https://",
//         ""
//       )}/storage/v1/object/public/print-files/${data.path}`;
//       uploadedFiles.push(publicUrl);
//     }
//     const fileUrlsAsString = uploadedFiles.join(","); 

//     const insertSQL = `
//       INSERT INTO print_requests
//         (email, file_url, color, sides, copies, pages, specific_pages, comments, price, created_at)
//       VALUES
//         ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
//       RETURNING id;
//     `;

//     const { rows } = await pool.query(insertSQL, [
//       email,
//       fileUrlsAsString,
//       color,
//       sides,
//       copies,
//       pages,
//       specificPages,
//       comments,
//       totalPrice,
//     ]);

//     res.json({
//       success: true,
//       id: rows[0].id,
//       totalPages,
//       totalPrice,
//     });
//   } catch (err) {
//     console.error("Print request error:", err);
//     res.status(500).json({ error: "Print request failed" });
//   }
// });


// Create Stripe session (NO DB insert here)
app.post("/api/create-stripe-session", uploadd.array("files"), async (req, res) => {
  try {
    const { email, name } = req.body;
    const printOptions = JSON.parse(req.body.printOptions || "{}");
    const files = req.files;

    if (!email || !name || !files || files.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { color, sides, copies, pages, specificPages, comments } = printOptions;
    if (color === "color" && sides === "double") {
      return res.status(400).json({ error: "Double-sided color printing not supported." });
    }

    let totalPages = 0;
    for (const file of files) {
      const pageCount = await getPageCount(file.buffer, file.mimetype);

      if (specificPages && specificPages.trim() !== "") {
        const ranges = specificPages.split(",").map(r => r.trim());
        let count = 0;
        ranges.forEach(range => {
          if (range.includes("-")) {
            const [start, end] = range.split("-").map(Number);
            count += Math.max(0, end - start + 1);
          } else {
            count += 1;
          }
        });
        totalPages += count;
      } else {
        totalPages += pageCount;
      }
    }

    const priceQuery = await pool.query("SELECT * FROM prices LIMIT 1");
    const { single_side_cost, double_side_cost, color_cost } = priceQuery.rows[0];

    let perPageCost = sides === "single" ? single_side_cost : double_side_cost;
    if (color === "color") perPageCost = color_cost;

    const totalPrice = totalPages * parseInt(copies) * perPageCost;

    const uploadedFiles = [];
    for (const file of files) {
      const filename = `uploads/${Date.now()}-${file.originalname}`;
      const { data, error } = await supabase.storage
        .from("print-files")
        .upload(filename, file.buffer, { contentType: file.mimetype });

      if (error) return res.status(500).json({ error: "File upload failed" });

      const publicUrl = `https://${process.env.SUPABASE_URL.replace(
        "https://", ""
      )}/storage/v1/object/public/print-files/${data.path}`;
      uploadedFiles.push(publicUrl);
    }

    const fileUrlsAsString = uploadedFiles.join(",");
    const orderId = `ORD-${Date.now()}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "inr",
          product_data: { name: "PrintEase Order" },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `http://localhost:3000/cancel`,
      metadata: {
        name,
        email,
        fileUrls: fileUrlsAsString || "",
        color,
        sides,
        copies,
        pages: totalPages.toString(),
        specificPages: specificPages || "",
        comments: comments || "",
        price: totalPrice.toString(),
        order_id: orderId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error("Stripe session creation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Verify payment and INSERT into DB
app.get("/api/verify-payment", async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const md = session.metadata;
    if (!md || !md.fileUrls) {
      return res.status(400).json({ error: "Missing order metadata" });
    }

    const totalPrice = parseFloat(md.price);

    // 1️⃣ Check if order already exists
    const existingOrder = await pool.query(
      "SELECT * FROM orders WHERE order_id = $1",
      [md.order_id]
    );

    if (existingOrder.rows.length > 0) {
      // If already exists, just update status
      await pool.query(
        "UPDATE orders SET status = 'completed', payment_session_id = $1, payment_intent_id = $2 WHERE order_id = $3",
        [session.id, session.payment_intent, md.order_id]
      );
      return res.json({ success: true, message: "Order already exists, status updated." });
    }

    // 2️⃣ Insert into print_requests
    const insertPrintReqSQL = `
      INSERT INTO print_requests
        (name, email, file_url, color, sides, copies, pages, specific_pages, comments, price, created_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      RETURNING id;
    `;
    const { rows } = await pool.query(insertPrintReqSQL, [
      md.name,
      md.email,
      md.fileUrls,
      md.color,
      md.sides,
      md.copies,
      md.pages,
      md.specificPages,
      md.comments,
      totalPrice,
    ]);

    const printRequestId = rows[0].id;

    // 3️⃣ Insert into orders
    const insertOrderSQL = `
      INSERT INTO orders 
        (print_request_id, user_name, user_email, amount, status, payment_session_id, payment_intent_id, order_id, created_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;
    await pool.query(insertOrderSQL, [
      printRequestId,
      md.name,
      md.email,
      totalPrice,
      "completed",
      session.id,
      session.payment_intent,
      md.order_id,
    ]);

    res.json({ success: true, message: "Payment verified & data inserted." });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});




// Get order details by order ID
app.get('/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Your print history endpoint here using app.get
// API: Get user print history + slot bookings
app.get('/api/print-request/user-history', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Fetch print requests
    const printResult = await pool.query(
      `SELECT id, name, email, file_url, color, sides, copies, pages, specific_pages, comments, price, status, created_at
       FROM print_requests
       WHERE email = $1
       ORDER BY created_at DESC`,
      [email]
    );

    // Fetch user bookings with slot info
    const bookingResult = await pool.query(
  `SELECT 
      b.id AS booking_id,
      b.email,
      b.notes,
      b.status,
      b.otp,  -- ✅ include OTP
      b.created_at AS booking_created_at,
      s.id AS slot_id,
      s.start_at,
      s.duration_minutes
   FROM bookings b
   JOIN slots s ON b.slot_id = s.id
   WHERE b.email = $1
   ORDER BY b.created_at DESC`,
  [email]
);


    res.json({
      printHistory: printResult.rows,
      bookings: bookingResult.rows,
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch user history' });
  }
});



// Get all print requests
app.get('/api/admin/print-requests', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, pages, copies, color, sides, specific_pages, comments, price, status, created_at, file_url
       FROM print_requests
       ORDER BY created_at DESC`
    );

    const requests = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      pages: row.pages,
      copies: row.copies,
      color: row.color,
      sides: row.sides,
      specific_pages: row.specific_pages,
      status: row.status,
      price: row.price,
      comments: row.comments,
      created_at: row.created_at,
      file_url: row.file_url
    }));

    res.json(requests);
  } catch (err) {
    console.error('Error fetching print requests:', err.message);
    res.status(500).json({ error: 'Unable to fetch print requests' });
  }
});

// Update status
app.put('/api/admin/print-requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE print_requests SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Status updated', updated: result.rows[0] });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ error: 'Unable to update status' });
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
