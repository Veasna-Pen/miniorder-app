export const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'miniorderapp';
export const KAFKA_CONSUMER_GROUP =
  process.env.KAFKA_CONSUMER_GROUP || 'miniorder-consumer';

// Kafka topics
export const KAFKA_TOPICS = {
  // Auth events
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.loggedin',

  // Orders events
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',

  // Notifications events
  SEND_EMAIL: 'notification.send.email',
};

export type KafkaTopics = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
