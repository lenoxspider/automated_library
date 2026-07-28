# Deployment Instructions

Because of the major architectural changes we've made (adding the cron job scheduler and migrating to item-level barcode tracking), you will need to run the following commands on your production server after pulling the latest code to ensure everything functions correctly.

1. **Pull the latest code:**
   ```bash
   git pull origin main
   ```

2. **Install the new dependencies:**
   We added `node-cron` for the background jobs, so you need to update your `node_modules`.
   ```bash
   npm install
   ```

3. **Run the Database Barcode Migration:**
   This script will update your production database schema and automatically generate physical barcodes for all the books currently in your system.
   *WARNING: This will clear any active checkouts in the system as they cannot be mapped to the new physical copies.*
   ```bash
   node migrate_barcodes.js
   ```

4. **Restart your server:**
   Restart your Node.js process so it picks up the new `cronJobs.js` background worker and the updated API endpoints.
   *(Depending on how you run your server, this might be `pm2 restart server`, `systemctl restart library-app`, or just stopping and starting `node server.js`)*
   ```bash
   pm2 restart all
   ```
