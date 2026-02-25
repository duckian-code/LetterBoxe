import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const moviesTable = pgTable("movies", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    releaseYear: integer().notNull(),
    tmdbId: integer().notNull().unique(),
});
