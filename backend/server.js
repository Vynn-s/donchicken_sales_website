const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const saltRounds = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));

// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3308,
  user: 'newuser',
  password: '',
  database: 'db_chicken_store'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to the database!');
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Get user from database
    connection.query(
      'SELECT * FROM admins WHERE email = ?', 
      [email], 
      async (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const admin = results[0];

        // Compare password
        try {
          const match = await bcrypt.compare(password, admin.password);

          if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
          }

          // Send success response with user data (excluding password)
          res.json({
            message: "Login successful",
            adminId: admin.AdminID,
            firstName: admin.firstname,
            lastName: admin.lastname,
            email: admin.email
          });

        } catch (bcryptError) {
          console.error("Password comparison error:", bcryptError);
          return res.status(500).json({ message: "Error processing login" });
        }
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create Account Route
app.post('/create-account', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Validate input
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    // Check if email already exists
    connection.query('SELECT email FROM admins WHERE email = ?', [email], async (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Email already exists" });
      }

      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create timestamp in YYYY-MM-DD HH:MM:SS format
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Insert new admin
        const sql = "INSERT INTO admins (firstname, lastname, email, password, created_at) VALUES (?, ?, ?, ?, ?)";
        connection.query(sql, [firstName, lastName, email, hashedPassword, now], (error, results) => {
          if (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: "Error creating account" });
          }

          res.status(201).json({ 
            message: "Account created successfully",
            adminId: results.insertId
          });
        });
      } catch (hashError) {
        console.error("Password hashing error:", hashError);
        return res.status(500).json({ message: "Error processing password" });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Sales Data Route
app.get('/data', (req, res) => {
  connection.query('SELECT * FROM sales ORDER BY timestamp DESC', (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Database error');
      return;
    }
    res.json(results);
  });
});

// Submit Sale Route
app.post('/submit-sale', (req, res) => {
  const { sales } = req.body;

  if (!sales || sales.length === 0) {
    return res.status(400).json({ message: "No sales data received." });
  }

  const sql = "INSERT INTO sales (name, category, unit_price, quantity, total_price) VALUES ?";
  const values = sales.map(sale => [
    sale.name,
    sale.category,
    sale.unitPrice,
    sale.quantity,
    sale.totalPrice
  ]);

  connection.query(sql, [values], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ message: "Database error.", error: error.message });
    }
    res.json({ message: "Sales recorded successfully." });
  });
});

// Update Sale Route
app.put('/update-sale/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, unit_price, quantity, total_price } = req.body;

  const sql = "UPDATE sales SET name = ?, category = ?, unit_price = ?, quantity = ?, total_price = ? WHERE id = ?";
  connection.query(sql, [name, category, unit_price, quantity, total_price, id], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ message: "Database error.", error: error.message });
    }
    res.json({ message: "Sale updated successfully." });
  });
});

// Delete Sale Route
app.delete('/delete-sale/:id', (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM sales WHERE id = ?";
  connection.query(sql, [id], (error, results) => {
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({ message: "Database error.", error: error.message });
    }
    res.json({ message: "Sale deleted successfully." });
  });
});

// Recent Sales Route
app.get('/recent-sales', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  try {
    // Get total sales and orders
    connection.query(
      'SELECT COUNT(*) as totalOrders, SUM(total_price) as totalSales FROM sales',
      (error, summaryResults) => {
        if (error) {
          console.error('Error fetching summary:', error);
          return res.status(500).json({ message: 'Database error' });
        }

        // Get sales data
        connection.query(
          'SELECT * FROM sales ORDER BY timestamp DESC LIMIT ?',
          [limit],
          (error, sales) => {
            if (error) {
              console.error('Error fetching sales:', error);
              return res.status(500).json({ message: 'Database error' });
            }

            res.json({
              sales,
              totalOrders: summaryResults[0].totalOrders,
              totalSales: summaryResults[0].totalSales || 0
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Sales Reports Data
app.get('/sales-reports', async (req, res) => {
  const { timeRange, category, startDate, endDate } = req.query;
  let query = 'SELECT * FROM sales';
  const queryParams = [];

  // Add WHERE clause based on filters
  const whereConditions = [];
  
  if (category && category !== 'all') {
    whereConditions.push('category = ?');
    queryParams.push(category);
  }

  if (timeRange) {
    const now = new Date();
    let startDateTime;

    switch (timeRange) {
      case 'daily':
        startDateTime = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDateTime = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDateTime = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'yearly':
        startDateTime = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    if (startDateTime) {
      whereConditions.push('timestamp >= ?');
      queryParams.push(startDateTime);
    }
  }

  // Custom date range
  if (startDate && endDate) {
    whereConditions.push('timestamp BETWEEN ? AND ?');
    queryParams.push(startDate, endDate);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC';

  try {
    connection.query(query, queryParams, (error, sales) => {
      if (error) {
        console.error('Error fetching reports data:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      // Calculate summary statistics
      const summary = sales.reduce((acc, sale) => {
        acc.totalSales += sale.total_price;
        acc.totalOrders++;
        
        // Group by category
        if (!acc.categoryTotals[sale.category]) {
          acc.categoryTotals[sale.category] = {
            count: 0,
            revenue: 0
          };
        }
        acc.categoryTotals[sale.category].count++;
        acc.categoryTotals[sale.category].revenue += sale.total_price;

        // Group by date for trend analysis
        const date = new Date(sale.timestamp).toISOString().split('T')[0];
        if (!acc.dailyTotals[date]) {
          acc.dailyTotals[date] = 0;
        }
        acc.dailyTotals[date] += sale.total_price;

        return acc;
      }, {
        totalSales: 0,
        totalOrders: 0,
        categoryTotals: {},
        dailyTotals: {}
      });

      res.json({
        sales,
        summary
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Sales Summary
app.get('/sales-summary', (req, res) => {
  const query = `
    SELECT 
      DATE(timestamp) as date,
      category,
      COUNT(*) as order_count,
      SUM(quantity) as total_quantity,
      SUM(total_price) as total_revenue
    FROM sales 
    GROUP BY DATE(timestamp), category
    ORDER BY date DESC, total_revenue DESC
  `;

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching sales summary:', error);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// Export Sales Report
app.get('/export-sales', (req, res) => {
  const { startDate, endDate, category } = req.query;
  let query = 'SELECT * FROM sales';
  const queryParams = [];
  const whereConditions = [];

  if (startDate && endDate) {
    whereConditions.push('timestamp BETWEEN ? AND ?');
    queryParams.push(startDate, endDate);
  }

  if (category && category !== 'all') {
    whereConditions.push('category = ?');
    queryParams.push(category);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC';

  connection.query(query, queryParams, (error, results) => {
    if (error) {
      console.error('Error exporting sales:', error);
      return res.status(500).json({ message: 'Database error' });
    }

    // Convert results to CSV format
    const fields = ['id', 'timestamp', 'name', 'category', 'quantity', 'unit_price', 'total_price'];
    const csv = results.map(row => {
      return fields.map(field => {
        let value = row[field];
        if (field === 'timestamp') {
          value = new Date(value).toLocaleString();
        }
        return JSON.stringify(value);
      }).join(',');
    }).join('\n');

    const headers = fields.join(',');
    const csvContent = headers + '\n' + csv;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
    res.send(csvContent);
  });
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => res.status(204));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Start the Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    connection.end();
    console.log('Server shutdown complete');
    process.exit(0);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => {
    connection.end();
    process.exit(1);
  });
}); 

// Employee Routes - Add these to your existing server.js

// Get all employees
app.get('/employees', (req, res) => {
  const query = 'SELECT * FROM employees ORDER BY firstName ASC';
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// Get single employee
app.get('/employees/:id', (req, res) => {
  const { id } = req.params;
  
  connection.query('SELECT * FROM employees WHERE id = ?', [id], (error, results) => {
    if (error) {
      console.error('Error fetching employee:', error);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(results[0]);
  });
});

// Add new employee
app.post('/employees', (req, res) => {
  const { firstName, lastName, position, shift, phone } = req.body;

  // Validate input
  if (!firstName || !lastName || !position || !shift || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `
    INSERT INTO employees 
    (firstName, lastName, position, shift, phone) 
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [firstName, lastName, position, shift, phone],
    (error, results) => {
      if (error) {
        console.error('Error adding employee:', error);
        return res.status(500).json({ message: 'Database error' });
      }
      res.status(201).json({
        message: 'Employee added successfully',
        employeeId: results.insertId
      });
    }
  );
});

// Update employee
app.put('/employees/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, position, shift, phone } = req.body;

  // Validate input
  if (!firstName || !lastName || !position || !shift || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = `
    UPDATE employees 
    SET firstName = ?, lastName = ?, position = ?, shift = ?, phone = ?
    WHERE id = ?
  `;

  connection.query(
    query,
    [firstName, lastName, position, shift, phone, id],
    (error, results) => {
      if (error) {
        console.error('Error updating employee:', error);
        return res.status(500).json({ message: 'Database error' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      res.json({ message: 'Employee updated successfully' });
    }
  );
});

// Delete employee
app.delete('/employees/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM employees WHERE id = ?';

  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error deleting employee:', error);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  });
});

// Add or update this route in your server.js
app.get('/current-user', (req, res) => {
  // You would typically get this from a session or JWT token
  const userId = req.session?.userId; // Assuming you're using sessions

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  connection.query(
    'SELECT firstname, lastname FROM admins WHERE AdminID = ?',
    [userId],
    (error, results) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];
      res.json({
        username: `${user.firstname} ${user.lastname}`,
        timestamp: new Date().toISOString()
      });
    }
  );
});

/// Add this to your server.js if not already present
app.post('/verify-admin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Get admin from database
    connection.query(
      'SELECT * FROM admins WHERE email = ?', 
      [email], 
      async (error, results) => {
        if (error) {
          console.error("Database error:", error);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const admin = results[0];

        // Compare password
        try {
          const match = await bcrypt.compare(password, admin.password);

          if (!match) {
            return res.status(401).json({ message: "Invalid password" });
          }

          res.json({ message: "Verification successful" });

        } catch (bcryptError) {
          console.error("Password comparison error:", bcryptError);
          return res.status(500).json({ message: "Error processing verification" });
        }
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add this route to update password
app.post('/update-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  try {
      // First verify current password
      connection.query(
          'SELECT * FROM admins WHERE email = ?',
          [email],
          async (error, results) => {
              if (error) {
                  console.error("Database error:", error);
                  return res.status(500).json({ message: "Database error" });
              }

              if (results.length === 0) {
                  return res.status(404).json({ message: "User not found" });
              }

              const admin = results[0];

              // Verify current password
              const isValid = await bcrypt.compare(currentPassword, admin.password);
              if (!isValid) {
                  return res.status(401).json({ message: "Current password is incorrect" });
              }

              // Hash new password
              const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

              // Update password in database
              connection.query(
                  'UPDATE admins SET password = ? WHERE email = ?',
                  [hashedPassword, email],
                  (updateError, updateResults) => {
                      if (updateError) {
                          console.error("Update error:", updateError);
                          return res.status(500).json({ message: "Failed to update password" });
                      }

                      res.json({ message: "Password updated successfully" });
                  }
              );
          }
      );
  } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error" });
  }
});