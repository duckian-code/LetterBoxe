import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userName: varchar({ length: 255 }).notNull(),
    avatarUrl: varchar({ length: 255 }).notNull(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const userLikesTable = pgTable("user_likes", {
    userId: integer().notNull().unique(),
    filmId: integer().notNull().unique(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const userWatchlistTable = pgTable("user_watchlist", {
    userId: integer().notNull().unique(),
    filmId: integer().notNull().unique(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const userWatchedTable = pgTable("user_watched", {
    userId: integer().notNull().unique(),
    filmId: integer().notNull().unique(),
    watchedAt: varchar({ length: 255 }).notNull(),
});

export const userReviews = pgTable("user_reviews", {
    userId: integer().notNull().unique(),
    filmId: integer().notNull().unique(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const reviews = pgTable("reviews", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull().unique(),
    rating: integer().notNull(),
    content: varchar({ length: 255 }).notNull(),
    createdAt: varchar({ length: 255 }).notNull(),
});
