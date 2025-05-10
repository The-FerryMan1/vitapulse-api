import { int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';


export const users = sqliteTable('users_table', {
    id: int().primaryKey({autoIncrement: true}),  
    deviceId: text().unique().notNull(),  
    name: text().notNull(), 
    birthday: text().notNull(),  
    sex: text().notNull(),
    email: text().notNull().unique(),  
    contact: text().notNull().unique(),
    password: text().notNull(),
    role: text().default('general').notNull(),
    isVerified: int({mode: 'boolean'}).default(false).notNull(),
    status: int({mode: 'boolean'}).default(false),
    created_At:  int({mode: 'timestamp'}).notNull(),
});

export const verificationToken = sqliteTable("verificationToken", {
    id: int().primaryKey({ autoIncrement: true }),
    token: text().notNull().unique(),
    userId: int().references(() => users.id, { onDelete: 'cascade' }),
    tokenExpires: int({ mode: "timestamp" }).notNull(),
});
export const passwordResetToken = sqliteTable("resetToken", {
    id: int().primaryKey({ autoIncrement: true }),
    token: text().notNull().unique(),
    userId: int().references(() => users.id, { onDelete: 'cascade' }),
    tokenExpires: int({ mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;

export const usersRelation = relations(users, ({many})=>({
    bpPulseRecords: many(bpPulseRecords),
    alertHistory: many(alertHistory),
    logs: many(logs),

}))

export const bpPulseRecords = sqliteTable('bp_records_table', {
    id: int().primaryKey({autoIncrement:true}),  // Auto-incrementing ID
    user_id: int().references(()=> users.id, {onDelete: 'cascade'}).notNull(),  // Foreign key to users table
    systolic: int().notNull(),  // Systolic blood pressure
    diastolic: int().notNull(),  // Diastolic blood pressure
    bpStatus: text().notNull(),  // Whether the reading is abnormal (true/false)
    pulse: int().notNull(), //pulse rate 
    pulseStatus: text().notNull(),  // Whether the reading is abnormal (true/false)
    clinicalBpLabel: text().notNull(),
    timestamp: text().notNull(),  // Timestamp of the measurement
});

export type records = typeof bpPulseRecords.$inferSelect;



// Alert History table to store past alerts
export const alertHistory = sqliteTable('alert_history', {
    id: int().primaryKey({ autoIncrement: true }),  // Auto-incrementing ID
    user_id: int().references(() => users.id, { onDelete: 'cascade' }).notNull(),  // Foreign key to users table
    message: text().notNull(),  // The alert message
    timestamp: text().notNull(),  // Timestamp when the alert was sent
});


//actiivity logs
export const logs = sqliteTable('logs', {
    id: int().primaryKey({autoIncrement: true}),
    user_id: int().references(()=>users.id, {onDelete: 'cascade'}).notNull(),
    activity: text().notNull(),
    timestamp: text().notNull(),  // Timestamp when the alert was sent
})


//logins
export const loginStat = sqliteTable('login_stat', {
    id: int('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(), // Format: YYYY-MM-DD
    logins: int('logins').notNull().default(0),
}, (t) => [
    unique('unique_date').on(t.date) // New syntax: array, not object
]);