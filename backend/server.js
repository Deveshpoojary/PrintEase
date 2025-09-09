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
// Import Cashfree PG SDK
const { Cashfree, CFEnvironment } = require('cashfree-pg');



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

// PayU configuration
const PAYU_KEY = process.env.PAYU_KEY || '';
const PAYU_SALT = process.env.PAYU_SALT || '';
const PAYU_BASE_URL = process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:5000';

function sha512Hex(input) {
  return crypto.createHash('sha512').update(input).digest('hex');
}

// Cashfree configuration
const CF_APP_ID = process.env.CF_APP_ID;
const CF_SECRET_KEY = process.env.CF_SECRET_KEY;
const CF_BASE_URL = process.env.CF_BASE_URL || 'https://sandbox.cashfree.com';
const CF_CHECKOUT_BASE = process.env.CF_CHECKOUT_BASE || 'https://payments-test.cashfree.com';


const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,   // use PRODUCTION when going live
  process.env.CF_APP_ID,
  process.env.CF_SECRET_KEY
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

// Build timestamptz explicitly in IST (Asia/Kolkata) to avoid server/DB TZ drift
function buildStartAt(dateStr, timeStr) {
  // Interpret inputs as local IST and append +05:30 offset so Postgres parses correctly
  // Example: 2025-01-31 14:20:00+05:30
  return `${dateStr} ${timeStr}:00+05:30`;
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

    const startAt = buildStartAt(date, time);

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

    const startAt = buildStartAt(date, time);
    // Prevent booking past times
    if (Date.parse(startAt) < Date.now()) {
      return res.status(400).json({ error: 'Selected time is in the past. Please choose a future time.' });
    }

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
      ORDER BY s.start_at DESC, b.created_at DESC
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

function generateOrderId() {
  const uniqueId = crypto.randomBytes(8).toString("hex");
  return `ORD-${uniqueId}`;
}


// Create Stripe session (NO DB insert here)
// Initialize Cashfree payment (replaces PayU)
app.post("/api/cashfree/init", uploadd.array("files"), async (req, res) => {
  try {
    const { email, name } = req.body;
    const printOptions = JSON.parse(req.body.printOptions || "{}");
    const files = req.files;

    if (!email || !name || !files || files.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!CF_APP_ID || !CF_SECRET_KEY) {
      return res.status(500).json({ error: "Payment gateway not configured (missing CF_APP_ID/CF_SECRET_KEY)." });
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
    
    const amount = Number(totalPrice.toFixed(2));
    const customerId = String(email || name || orderId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const customer_details = {
      customer_id: customerId,
      customer_email: email,
      customer_phone: (req.body.phone && String(req.body.phone).trim()) || '9999999999',
      customer_name: name,
    };

    // Create a pending print_request now; mark completed on webhook
    const insertPrintReqSQL = `
      INSERT INTO print_requests
        (name, email, file_url, color, sides, copies, pages, specific_pages, comments, price, status, created_at)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'processing',NOW())
      RETURNING id;
    `;
    const prInsert = await pool.query(insertPrintReqSQL, [
        name,
        email,
      fileUrlsAsString,
        color,
        sides,
        copies,
      totalPages,
      specificPages,
      comments,
      amount
    ]);
    const printRequestId = prInsert.rows[0].id;

    // Create Cashfree order using PG SDK
     const orderParams = {
       order_amount: amount,
       order_currency: 'INR',
       order_id: orderId,
       customer_details,
       order_note: 'PrintEase Order',
       order_meta: {
         return_url: `${FRONTEND_BASE_URL}/success?orderId=${orderId}`,
         notify_url: `${BACKEND_BASE_URL}/api/cashfree/webhook`,
        //  payment_methods: {}
       }
     };
     
     try {
       // Create order using Cashfree PG SDK
       const response = await cashfree.PGCreateOrder(orderParams);
      
       console.log("Cashfree response:", response.data);
       const cfJson = response.data;
       
       // Process the order creation
       await processOrderCreation(cfJson, orderId, printRequestId, res);
     } catch (error) {
       console.error('Cashfree order creation error:', error);
       if (error.response && error.response.data) {
         return res.status(500).json({ error: error.response.data.message || 'Cashfree order creation failed' });
       }
       return res.status(500).json({ error: error.message || 'Cashfree order creation failed' });
     }
       
     // This function will be called after successful order creation
      async function processOrderCreation(cfJson, orderId, printRequestId, res) {
        try {
          console.log('Processing order creation with orderId:', orderId);
          
          // Save order pending and link to print_request
          await pool.query(
            `INSERT INTO orders (order_id, print_request_id, amount, status, user_name, user_email, payment_session_id, created_at)
             VALUES ($1,$2,$3,'pending',$4,$5,$6,NOW())
             ON CONFLICT (order_id) DO NOTHING`,
            [orderId, printRequestId, amount, name, email, cfJson.payment_session_id || null]
          );

          // Always return both payment_link and session_id
          return res.status(200).json({
            orderId: orderId,
            payment_session_id: cfJson.payment_session_id,
            payment_link: cfJson.payment_link || null
          });
        } catch (err) {
          console.error('Database error when saving order:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
  } catch (err) {
    console.error('Cashfree init error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Verify payment and INSERT into DB
// PayU success callback (frontend will redirect here and then call this endpoint)
// app.post('/api/payu/verify', express.urlencoded({ extended: true }), async (req, res) => {
//   try {
//     const {
//       status,
//       txnid,
//       amount,
//       productinfo,
//       firstname,
//       email,
//       mihpayid,
//       hash,
//       udf1,
//       udf2,
//     } = req.body;

//     // Verify hash: salt|status|||||||||udf2|udf1|email|firstname|productinfo|amount|txnid|key
//     const reverseSeq = `${PAYU_SALT}|${status}|||||||||${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
//     const serverHash = sha512Hex(reverseSeq).toLowerCase();
//     if (serverHash !== String(hash).toLowerCase()) {
//       return res.status(400).json({ error: 'Hash verification failed' });
//     }

//     if (status !== 'success') {
//       return res.status(400).json({ error: 'Payment not completed' });
//     }

//     const md = JSON.parse(udf2 || '{}');
//     const totalPrice = parseFloat(amount);

//     // Upsert order by order_id (= txnid)
//     const existingOrder = await pool.query(
//       'SELECT * FROM orders WHERE order_id = $1',
//       [txnid]
//     );

//     let printRequestId;
//     if (existingOrder.rows.length === 0) {
//     const insertPrintReqSQL = `
//       INSERT INTO print_requests
//         (name, email, file_url, color, sides, copies, pages, specific_pages, comments, price, created_at)
//       VALUES
//         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
//       RETURNING id;
//     `;
//     const { rows } = await pool.query(insertPrintReqSQL, [
//         firstname,
//         email,
//         udf1,
//       md.color,
//       md.sides,
//       md.copies,
//       md.pages,
//       md.specificPages,
//       md.comments,
//       totalPrice,
//     ]);
//       printRequestId = rows[0].id;

//     const insertOrderSQL = `
//       INSERT INTO orders 
//         (print_request_id, user_name, user_email, amount, status, payment_session_id, payment_intent_id, order_id, created_at)
//       VALUES 
//         ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
//     `;
//     await pool.query(insertOrderSQL, [
//       printRequestId,
//         firstname,
//         email,
//       totalPrice,
//         'completed',
//         txnid,
//         mihpayid,
//         txnid,
//       ]);
//     } else {
//       await pool.query(
//         'UPDATE orders SET status = $1, payment_session_id = $2, payment_intent_id = $3 WHERE order_id = $4',
//         ['completed', txnid, mihpayid, txnid]
//       );
//     }

//     res.json({ success: true, message: 'Payment verified & data inserted.' });
//   } catch (err) {
//     console.error('PayU verify error:', err);
//     res.status(500).json({ error: 'Payment verification failed' });
//   }
// });

// Cashfree webhook endpoint to handle payment notifications

app.post('/api/cashfree/webhook', express.json(), async (req, res) => {
  try {
    console.log('Cashfree webhook received:', JSON.stringify(req.body, null, 2));
    
    // Handle different webhook formats
    let orderId, paymentStatus, paymentId;
    
    if (req.body.data) {
      // New webhook format
      orderId = req.body.data.order?.order_id;
      paymentStatus = req.body.data.payment?.payment_status;
      paymentId = req.body.data.payment?.cf_payment_id;
    } else {
      // Direct format
      orderId = req.body.order_id;
      paymentStatus = req.body.payment_status;
      paymentId = req.body.cf_payment_id;
    }
    
    if (!orderId) {
      console.error('No order_id found in webhook');
      return res.status(400).json({ error: 'Invalid webhook data' });
    }
    
    console.log(`Processing webhook for order: ${orderId}, status: ${paymentStatus}`);
    
    // Determine final status
    let finalStatus = 'failed';
    if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID') {
      finalStatus = 'completed';
    }
    
    // Update order in database
    const existingOrder = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );
    
    if (existingOrder.rows.length === 0) {
      console.error('Order not found for webhook:', orderId);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order status with payment details
    await pool.query(
      'UPDATE orders SET status = $1, payment_intent_id = $2 WHERE order_id = $3',
      [finalStatus, paymentId || null, orderId]
    );
    
    console.log(`Order ${orderId} updated to ${finalStatus}`);
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});




// Get order details by order ID
app.get('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      `SELECT o.*, pr.status as print_status 
       FROM orders o 
       LEFT JOIN print_requests pr ON o.print_request_id = pr.id 
       WHERE o.order_id = $1`, 
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
app.put('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2',
      [status, orderId]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
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
   ORDER BY s.start_at DESC, b.created_at DESC `,
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

