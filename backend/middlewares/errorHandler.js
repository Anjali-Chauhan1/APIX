
export const errorHandler = (err, req, res, next) => {
    // Log to console for dev
    console.error('SERVER ERROR:', err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        message = 'Resource not found';
        statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        message = 'Duplicate field value entered';
        statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map(val => val.message);
        statusCode = 400;
    }

    res.status(statusCode).json({
        success: false,
        message: Array.isArray(message) ? message.join(', ') : String(message),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack, details: err.errors })
    });
};


export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
