import { pgTable, uuid, text, timestamp, numeric, varchar, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'client', 'contractor']);
export const requestStatusEnum = pgEnum('request_status', ['pending', 'quoted', 'approved', 'contract_sent', 'completed']);
export const quoteStatusEnum = pgEnum('quote_status', ['draft', 'sent', 'approved', 'revised']);
export const pricingTypeEnum = pgEnum('pricing_type', ['hourly', 'flat']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['pending', 'approved', 'paid', 'rejected']);
export const roundOptionEnum = pgEnum('round_option', ['none', 'up', 'down']); // New Enum

// Tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  companyName: varchar('company_name', { length: 256 }),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const requests = pgTable('requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => users.id),
  projectName: varchar('project_name', { length: 256 }).notNull(),
  description: text('description'),
  status: requestStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').notNull().references(() => requests.id),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  price: numeric('price'),
  pricingType: pricingTypeEnum('pricing_type'),
  internalCost: numeric('internal_cost'),
  margin: numeric('margin'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => requests.id),
  clientId: uuid('client_id').references(() => users.id),
  projectName: varchar('project_name', { length: 256 }),
  notes: text('notes'), // Added notes field
  netPrice: numeric('net_price').notNull(),
  taxRate: numeric('tax_rate').default('0'),
  taxAmount: numeric('tax_amount').default('0'),
  deliveryFee: numeric('delivery_fee').default('0'),
  totalPrice: numeric('total_price').notNull(),
  status: quoteStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const quoteItems = pgTable('quote_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteId: uuid('quote_id').notNull().references(() => quotes.id),
  serviceName: varchar('service_name', { length: 256 }).notNull(),
  description: text('description'),
  price: numeric('price').notNull(),
  quantity: numeric('quantity').default('1').notNull(), 
  unitPrice: numeric('unit_price'), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  contractorId: uuid('contractor_id').notNull().references(() => users.id),
  requestId: uuid('request_id').references(() => requests.id),
  projectName: varchar('project_name', { length: 256 }),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  status: invoiceStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteId: uuid('quote_id').references(() => quotes.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// New Pricing Entries Table
export const pricingEntries = pgTable('pricing_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  internalCostInput: numeric('internal_cost_input'),
  marginInput: numeric('margin_input'),
  calculatedPrice: numeric('calculated_price'),
  pricingType: pricingTypeEnum('pricing_type').default('flat').notNull(),
  roundOption: roundOptionEnum('round_option').default('none').notNull(),
  description: text('description'),
  link: text('link'),
  projectNotes: text('project_notes'),
  clientNotes: text('client_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  parent: one(users, {
    fields: [users.parentId],
    references: [users.id],
    relationName: 'parent_child',
  }),
  children: many(users, { relationName: 'parent_child' }),
  requests: many(requests),
  invoices: many(invoices),
  comments: many(comments),
  notifications: many(notifications),
  quotes: many(quotes),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  client: one(users, { fields: [requests.clientId], references: [users.id] }),
  documents: many(documents),
  quotes: many(quotes),
  invoices: many(invoices),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  request: one(requests, { fields: [documents.requestId], references: [requests.id] }),
}));

export const servicesRelations = relations(services, ({ }) => ({
  // No specific relations defined in PROJECT_SPEC.md for services
  // Can add pricingEntryId here if services link directly to a pricingEntry
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  request: one(requests, { fields: [quotes.requestId], references: [requests.id] }),
  client: one(users, { fields: [quotes.clientId], references: [users.id] }),
  quoteItems: many(quoteItems),
  comments: many(comments),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  contractor: one(users, { fields: [invoices.contractorId], references: [users.id] }),
  request: one(requests, { fields: [invoices.requestId], references: [requests.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  quote: one(quotes, { fields: [comments.quoteId], references: [quotes.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const pricingEntriesRelations = relations(pricingEntries, ({ }) => ({
  // No direct relations to other tables from here, as it's a standalone template
}));