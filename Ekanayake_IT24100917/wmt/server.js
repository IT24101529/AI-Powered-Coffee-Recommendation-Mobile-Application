const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

connectDB();

// Routes
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

app.get('/', (req, res) => res.json({ status: 'Server is running!' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));