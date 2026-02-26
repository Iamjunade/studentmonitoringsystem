import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

const app = express();

// CORS configuration
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Authentication middleware
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (token) {
        jwt.verify(token, 'your-secret-key', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Input validation example
app.post('/api/data', 
    body('name').isString().notEmpty(),
    body('email').isEmail(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // Process valid data
        res.sendStatus(200);
    }
);

app.use(authenticateJWT);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});