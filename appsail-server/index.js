const express = require('express');
const path = require('path');
const app = express();

// Serve React build files
app.use(express.static(path.join(__dirname, 'build')));

// Fallback to index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// AppSails requires this env variable for the port
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));