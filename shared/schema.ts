import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  birthDate: text("birth_date"),
  memberSince: text("member_since").notNull(),
  currentWeight: integer("current_weight"),
  targetWeight: integer("target_weight"),
  primaryGoal: text("primary_goal"),
  planId: text("plan_id").notNull().default("basic"),
  isCheckedIn: boolean("is_checked_in").default(false),
  lastCheckin: timestamp("last_checkin"),
  profilePhoto: text("profile_photo"),
  isAdmin: boolean("is_admin").default(false),
});

export const plans = pgTable("plans", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  monthlyPrice: integer("monthly_price").notNull(),
  features: jsonb("features").notNull(),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  instructor: text("instructor").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").default(0),
  date: text("date").notNull(),
});

export const classBookings = pgTable("class_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  classId: text("class_id").notNull(),
  bookingDate: timestamp("booking_date").default(sql`now()`),
  status: text("status").notNull().default("booked"),
});

export const workouts = pgTable("workouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  calories: integer("calories"),
  exercises: jsonb("exercises").notNull(),
});

export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("available"), // available, occupied, maintenance
  reservedBy: text("reserved_by"),
  reservedUntil: timestamp("reserved_until"),
});

export const checkins = pgTable("checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  checkinTime: timestamp("checkin_time").default(sql`now()`),
  checkoutTime: timestamp("checkout_time"),
  duration: integer("duration"), // in minutes
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  memberSince: true,
  isCheckedIn: true,
  lastCheckin: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  currentParticipants: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  reservedBy: true,
  reservedUntil: true,
});

export const insertCheckinSchema = createInsertSchema(checkins).omit({
  id: true,
  checkinTime: true,
  checkoutTime: true,
  duration: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Plan = typeof plans.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ClassBooking = typeof classBookings.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
