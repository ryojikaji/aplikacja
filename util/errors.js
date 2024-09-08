export class ArgumentError extends Error {
    constructor(message, status) {
        super(message)
        this.status = status
    }
}