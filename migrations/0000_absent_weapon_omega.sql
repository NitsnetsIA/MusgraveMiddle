CREATE TABLE "delivery_centers" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"item_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" text NOT NULL,
	"item_ean" text NOT NULL,
	"item_ref" text,
	"item_title" text,
	"item_description" text,
	"unit_of_measure" text,
	"quantity_measure" real,
	"image_url" text,
	"nutrition_label_url" text,
	"quantity" real NOT NULL,
	"base_price_at_order" real NOT NULL,
	"tax_rate_at_order" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items_simulated" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"item_ean" text NOT NULL,
	"item_ref" text,
	"item_title" text,
	"item_description" text,
	"unit_of_measure" text,
	"quantity_measure" real,
	"image_url" text,
	"nutrition_label_url" text,
	"quantity" real NOT NULL,
	"base_price_at_order" real NOT NULL,
	"tax_rate_at_order" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" text PRIMARY KEY NOT NULL,
	"source_purchase_order_id" text,
	"user_email" text NOT NULL,
	"store_id" text NOT NULL,
	"observations" text,
	"subtotal" real NOT NULL,
	"tax_total" real NOT NULL,
	"final_total" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders_simulated" (
	"order_id" text PRIMARY KEY NOT NULL,
	"source_purchase_order_id" text NOT NULL,
	"user_email" text NOT NULL,
	"store_id" text NOT NULL,
	"observations" text,
	"subtotal" real NOT NULL,
	"tax_total" real NOT NULL,
	"final_total" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"ean" text PRIMARY KEY NOT NULL,
	"ref" text,
	"title" text NOT NULL,
	"description" text,
	"base_price" real NOT NULL,
	"tax_code" text NOT NULL,
	"unit_of_measure" text NOT NULL,
	"quantity_measure" real NOT NULL,
	"image_url" text,
	"nutrition_label_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"item_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "purchase_order_items_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"purchase_order_id" text NOT NULL,
	"item_ean" text NOT NULL,
	"item_ref" text,
	"item_title" text,
	"item_description" text,
	"unit_of_measure" text,
	"quantity_measure" real,
	"image_url" text,
	"nutrition_label_url" text,
	"quantity" real NOT NULL,
	"base_price_at_order" real NOT NULL,
	"tax_rate_at_order" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"purchase_order_id" text PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"store_id" text NOT NULL,
	"status" text NOT NULL,
	"subtotal" real NOT NULL,
	"tax_total" real NOT NULL,
	"final_total" real NOT NULL,
	"server_sent_at" timestamp with time zone,
	"ftp_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"responsible_email" text,
	"delivery_center_code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tax_rate" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"email" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items_simulated" ADD CONSTRAINT "order_items_simulated_order_id_orders_simulated_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders_simulated"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_purchase_order_id_purchase_orders_purchase_order_id_fk" FOREIGN KEY ("source_purchase_order_id") REFERENCES "public"."purchase_orders"("purchase_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_code_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tax_code_taxes_code_fk" FOREIGN KEY ("tax_code") REFERENCES "public"."taxes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("purchase_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_store_id_stores_code_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_delivery_center_code_delivery_centers_code_fk" FOREIGN KEY ("delivery_center_code") REFERENCES "public"."delivery_centers"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_stores_code_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("code") ON DELETE no action ON UPDATE no action;