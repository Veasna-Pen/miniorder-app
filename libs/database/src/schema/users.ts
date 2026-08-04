import { pgEnum, pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    role: roleEnum('role').default('USER').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;