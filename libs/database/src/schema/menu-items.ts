import { pgTable, uuid, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';


export const menu_items = pgTable('menu_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  price: integer('price').notNull(),
  available: boolean('available').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type MenuItems = typeof menu_items.$inferSelect;
export type NewMenuItems = typeof menu_items.$inferInsert;
