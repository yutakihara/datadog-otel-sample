import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Author テーブル
export const authors = pgTable("Author", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Post テーブル
export const posts = pgTable("Post", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  published: boolean("published").default(false).notNull(),
  authorId: integer("authorId").notNull().references(() => authors.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Comment テーブル
export const comments = pgTable("Comment", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("postId").notNull().references(() => posts.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// リレーション定義
export const authorsRelations = relations(authors, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(authors, {
    fields: [posts.authorId],
    references: [authors.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

