require('dotenv').config();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerDoc");
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});