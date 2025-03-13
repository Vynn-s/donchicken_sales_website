# Don Eking's Chicken Store Management System 🍗

A user-friendly system to manage Don Eking's Chicken Store's daily operations, including sales tracking and employee management.

## 🚀 Getting Started

### What You Need First:
1. Download and install these programs:
   * [Node.js](https://nodejs.org/) (Pick the "LTS" version)
   * [MySQL](https://dev.mysql.com/downloads/mysql/) (Pick the latest version)
   * [Visual Studio Code](https://code.visualstudio.com/) (or any text editor you like)

### How to Install:

1. Download this project:
   * Go to this project's GitHub page
   * Click the green "Code" button
   * Click "Download ZIP"
   * Extract the ZIP file to a folder on your computer

2. Set up the project:
   * Open the folder in Visual Studio Code
   * Open the Terminal (View > Terminal)
   * Type `npm install` and press Enter
   * Wait for it to finish installing

3. Set up your settings:
   * Create a new file called `.env` in the main folder
   * Copy and paste this, replacing the values in brackets:
   ```
   DB_HOST=localhost
   DB_USER=[your MySQL username]
   DB_PASSWORD=[your MySQL password]
   DB_NAME=don_ekings_db
   PORT=3000
   JWT_SECRET=[make up a long random string]
   ```

4. Set up the database:
   * Open MySQL Workbench
   * Connect to your MySQL server
   * Create a new database called `don_ekings_db`
   * Open the `database/schema.sql` file from the project
   * Run the SQL commands in MySQL Workbench

## 💻 Running the System

1. Start the system:
   * Open Terminal in VS Code
   * Type `npm start` and press Enter
   * You should see "Server running on port 3000"

2. Use the system:
   * Open your web browser
   * Go to `http://localhost:3000`
   * Create an Account
   * Log in with:
     * Email: youraccount@email.com
     * Password: myaccount123

## 🤔 Common Problems and Solutions

### "Cannot connect to database":
* Make sure MySQL is running
* Check if your username and password in `.env` are correct
* Make sure you created the database

### "npm not found":
* Make sure you installed Node.js
* Try restarting your computer
* Open a new terminal window

### "Page not loading":
* Check if you typed the URL correctly
* Make sure the server is running
* Try clearing your browser cache

### Login not working:
* Make sure Caps Lock is off
* Try clearing your browser cookies
* Double-check the email and password

## 📱 Features

1. Sales Management:
   * Record new sales
   * View sales history
   * Calculate daily totals

2. Employee Management:
   * Add/remove employees
   * Track work hours
   * Manage schedules

3. Reports:
   * Daily sales reports
   * Employee performance
   * Popular items

## 💡 Tips for Use

* Always log out when leaving the system
* Regularly check your sales reports
* Back up your database weekly
* Keep your password secure
* Update your system regularly

## 🆘 Need Help?

If you're having problems:
1. Check the Common Problems section above
2. Ask a team member for help
3. Contact technical support with:
   * What's not working
   * What you were trying to do
   * Any error messages you see

## 🔒 Important Safety Notes

* Never share your password
* Log out after using the system
* Don't leave the system open unattended
* Regularly update your password
* Keep your `.env` file private

## ⚡ Quick Start Guide

1. Open your web browser
2. Go to `http://localhost:3000`
3. Log in with your credentials
4. Start using the system!

## 📝 Daily Tasks Checklist

- [ ] Start the server
- [ ] Log in to your account
- [ ] Check yesterday's sales
- [ ] Record new sales
- [ ] Back up data (if it's backup day)
- [ ] Log out when finished

Remember:
* Keep your passwords safe
* Save your work regularly
* Report any problems you find
* Ask for help if needed

## 🎯 Using the System

### For Sales:
1. Click "Sales" in the menu
2. Enter customer orders
3. Confirm the totals
4. Complete the sale

### For Reports:
1. Click "Reports" in the menu
2. Select the date range
3. Choose report type
4. View or print results

### For Employee Management:
1. Click "Employees" in the menu
2. Update schedules as needed
3. Track attendance
4. Manage permissions
