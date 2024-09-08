const localhost = '::ffff:127.0.0.1'

export function debounce(milliseconds) {
    const requestTimestamps = {}

    if (!process.env.DEBOUNCE)
        return (req, res, next) => next()

    return (req, res, next) => {
        const now = Date.now()
        const timestamp = requestTimestamps[req.ip]

        if (timestamp) {
            const remaining = milliseconds - (now - timestamp)
            
            if (0 < remaining)
                return res.status(429).send(remaining)
        }
    
        requestTimestamps[ip] = now
        next()
    }
}

export const debounceSeconds = seconds => debounce(seconds * 1000)
export const debounceMinutes = minutes => debounceSeconds(minutes * 60)