import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userName: varchar({ length: 255 }).notNull(),
    avatarUrl: varchar({ length: 255 }).notNull(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const filmsTable = pgTable("films", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    year: integer().notNull(),
    posterUrl: varchar({ length: 255 }).notNull(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const userLikes = pgTable("user_likes", {
    userId: integer().notNull().unique(),
    filmId: integer().notNull().unique(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const userWatchlist = pgTable("user_watchlist", {
    userId: integer().notNull().unique(),
    filmId: integer().notNull().unique(),
    createdAt: varchar({ length: 255 }).notNull(),
});

export const userWatched = pgTable("user_watched", {
    userId: integer().notNull().unique(),
    watchDate: varchar({ length: 255 }).notNull(),
})
