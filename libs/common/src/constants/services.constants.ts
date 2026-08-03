export const SERVICES = {
    API_GATEWAY: 'api-gateway',
    AUTH_SERVICE: 'auth-service',
    ORDRER_SERVICE: 'order-service',
    NOTIFICATION_SERVICE: 'notification-service',
} as const;

export const SERVICE_PORTS = {
    API_GATEWAY: 3000,
    AUTH_SERVICE: 3001,
    ORDRER_SERVICE: 3002,
    NOTIFICATION_SERVICE: 3003,
}as const;