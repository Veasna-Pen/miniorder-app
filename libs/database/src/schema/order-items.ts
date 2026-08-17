import { pgTable, uuid, integer } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { menu_items } from './menu-items';


export const order_items = pgTable('order_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    menuItemId: uuid('menu_item_id').references(() => menu_items.id).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    unitPrice: integer('unit_price').notNull(),
    subTotal: integer('subtotal').notNull(),
});

export type OrderItems = typeof order_items.$inferSelect;
export type NewOrderItems = typeof order_items.$inferInsert;
