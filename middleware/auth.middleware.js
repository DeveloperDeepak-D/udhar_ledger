const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
    
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access Denied! No token provided.' 
            });
        }

        // Token verify karein
        jwt.verify(token, process.env.JWT_SECRET || 'default_access_secret', (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Invalid or expired token!' 
                });
            }

            // User info ko request object mein save kar dein taaki aage route mein use ho sake
            req.user = decoded; 
            next();
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = verifyToken;