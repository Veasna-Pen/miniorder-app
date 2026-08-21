import { pgTable, uuid, varchar, integer, pgEnum, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const orderStatusEnum = pgEnum('order_status', [
    'PENDING',
    'PAID',
    'CANCELLED',
]);

export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    status: orderStatusEnum('status').default('PENDING').notNull(),
    totalPrice: integer('total_price').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    uniqueIndex('orders_user_id_idempotency_key_idx').on(table.userId, table.idempotencyKey),
]);

export type Orders = typeof orders.$inferSelect;
export type NewOrders = typeof orders.$inferInsert;

