-- ============================================================
-- Dynova Sport final schema + old data
-- Logic cleanup:
-- - Removed products.sold and products.rating because they are derived from orders/reviews
-- - Removed products.brand because brands table + brand_id is source of truth
-- - Removed product_variants.size/color text because size_id/color_id reference sizes/colors
-- - Removed duplicate order columns: email/phone/address/coupon/total_price/discount/total
-- - Removed order_items.size/color duplicate; size_name/color_name are order snapshots
-- - Banners and notifications are not included
-- ============================================================

-- =====================================================
-- DYNOVA SPORT - CLEAN DATABASE + OLD DATA MIGRATED
-- Generated from your backup: dynova_sport (3)(1).sql
-- Removed tables: banners, notifications
-- Added normalized tables: sizes, colors
-- Old data preserved and normalized for real e-commerce logic
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

SET time_zone = "+00:00";

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `dynova_sport` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `dynova_sport`;

DROP TABLE IF EXISTS `personal_access_tokens`;

DROP TABLE IF EXISTS `password_reset_tokens`;

DROP TABLE IF EXISTS `reviews`;

DROP TABLE IF EXISTS `wishlists`;

DROP TABLE IF EXISTS `cart_items`;

DROP TABLE IF EXISTS `order_items`;

DROP TABLE IF EXISTS `orders`;

DROP TABLE IF EXISTS `vouchers`;

DROP TABLE IF EXISTS `product_variants`;

DROP TABLE IF EXISTS `products`;

DROP TABLE IF EXISTS `colors`;

DROP TABLE IF EXISTS `sizes`;

DROP TABLE IF EXISTS `brands`;

DROP TABLE IF EXISTS `categories`;

DROP TABLE IF EXISTS `users`;

DROP TABLE IF EXISTS `roles`;

DROP TABLE IF EXISTS `migrations`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` BIGINT UNSIGNED NOT NULL DEFAULT 2,
  `name` VARCHAR(150) NOT NULL,
  `full_name` VARCHAR(150) NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `address` VARCHAR(255) NULL,
  `province` VARCHAR(120) NULL,
  `district` VARCHAR(120) NULL,
  `ward` VARCHAR(120) NULL,
  `avatar` VARCHAR(600) NULL,
  `avatar_url` VARCHAR(600) NULL,
  `status` ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `remember_token` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_id_index` (`role_id`),
  KEY `users_status_index` (`status`),
  CONSTRAINT `users_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `image` VARCHAR(600) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `brands` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `logo` VARCHAR(600) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_slug_unique` (`slug`),
  KEY `brands_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sizes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `type` ENUM('clothing','shoes','other') NOT NULL DEFAULT 'other',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sizes_name_unique` (`name`),
  KEY `sizes_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `colors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `code` VARCHAR(80) NOT NULL,
  `hex` VARCHAR(20) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `colors_code_unique` (`code`),
  KEY `colors_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `brand_id` BIGINT UNSIGNED NULL,
  `name` VARCHAR(220) NOT NULL,
  `slug` VARCHAR(240) NOT NULL,
  `short_description` VARCHAR(1000) NULL,
  `description` LONGTEXT NULL,
  `image` VARCHAR(600) NULL,
  `price` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `compare_price` DECIMAL(14,2) NULL,
  `status` ENUM('active','inactive','draft') NOT NULL DEFAULT 'active',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_id_index` (`category_id`),
  KEY `products_brand_id_index` (`brand_id`),
  KEY `products_status_index` (`status`),
  KEY `products_featured_index` (`is_featured`),
  CONSTRAINT `products_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `products_brand_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_variants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `size_id` BIGINT UNSIGNED NULL,
  `color_id` BIGINT UNSIGNED NULL,
  `sku` VARCHAR(180) NULL,
  `price` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `discount_price` DECIMAL(14,2) NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `image` VARCHAR(600) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `variants_product_id_index` (`product_id`),
  KEY `variants_size_id_index` (`size_id`),
  KEY `variants_color_id_index` (`color_id`),
  KEY `variants_sku_index` (`sku`),
  CONSTRAINT `variants_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `variants_size_id_fk` FOREIGN KEY (`size_id`) REFERENCES `sizes` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `variants_color_id_fk` FOREIGN KEY (`color_id`) REFERENCES `colors` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cart_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `product_variant_id` BIGINT UNSIGNED NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_user_product_variant_unique` (`user_id`,`product_id`,`product_variant_id`),
  KEY `cart_product_id_index` (`product_id`),
  KEY `cart_variant_id_index` (`product_variant_id`),
  CONSTRAINT `cart_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `cart_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `cart_variant_id_fk` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wishlists` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wishlists_user_product_unique` (`user_id`,`product_id`),
  KEY `wishlists_product_id_index` (`product_id`),
  CONSTRAINT `wishlists_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `wishlists_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vouchers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `discount_type` ENUM('percent','fixed') NOT NULL DEFAULT 'fixed',
  `discount_value` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `min_order_value` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `max_discount` DECIMAL(14,2) NULL,
  `usage_limit` INT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `start_date` DATETIME NULL,
  `end_date` DATETIME NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vouchers_code_unique` (`code`),
  KEY `vouchers_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL,
  `voucher_id` BIGINT UNSIGNED NULL,
  `order_code` VARCHAR(80) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) NULL,
  `customer_phone` VARCHAR(30) NULL,
  `shipping_address` VARCHAR(500) NOT NULL,
  `province` VARCHAR(120) NULL,
  `district` VARCHAR(120) NULL,
  `ward` VARCHAR(120) NULL,
  `note` TEXT NULL,
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `shipping_fee` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `grand_total` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `payment_method` ENUM('cod','bank','vnpay','momo') NOT NULL DEFAULT 'cod',
  `payment_status` ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  `status` ENUM('pending','confirmed','shipping','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_code_unique` (`order_code`),
  KEY `orders_user_id_index` (`user_id`),
  KEY `orders_voucher_id_index` (`voucher_id`),
  KEY `orders_status_index` (`status`),
  CONSTRAINT `orders_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `orders_voucher_id_fk` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `product_variant_id` BIGINT UNSIGNED NULL,
  `product_name` VARCHAR(220) NOT NULL,
  `variant_name` VARCHAR(220) NULL,
  `size_name` VARCHAR(100) NULL,
  `color_name` VARCHAR(100) NULL,
  `sku` VARCHAR(180) NULL,
  `product_image` VARCHAR(600) NULL,
  `variant_image` VARCHAR(600) NULL,
  `price` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `quantity` INT NOT NULL DEFAULT 1,
  `total` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index` (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  KEY `order_items_variant_id_index` (`product_variant_id`),
  CONSTRAINT `order_items_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `order_items_variant_id_fk` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED NULL,
  `order_item_id` BIGINT UNSIGNED NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `content` TEXT NULL,
  `status` ENUM('pending','approved','hidden') NOT NULL DEFAULT 'approved',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviews_user_id_index` (`user_id`),
  KEY `reviews_product_id_index` (`product_id`),
  KEY `reviews_order_id_index` (`order_id`),
  KEY `reviews_order_item_id_index` (`order_item_id`),
  CONSTRAINT `reviews_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `reviews_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `reviews_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `reviews_order_item_id_fk` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(150) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `abilities` TEXT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- OLD DATA MIGRATED INTO CLEAN SCHEMA
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `roles` (`id`, `name`, `display_name`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Quản trị viên', '2026-06-30 06:29:48', '2026-06-30 06:29:48'),
(2, 'customer', 'Khách hàng', '2026-06-30 06:29:48', '2026-06-30 06:29:48');

INSERT INTO `users` (`id`, `role_id`, `name`, `full_name`, `email`, `password`, `phone`, `address`, `province`, `district`, `ward`, `avatar`, `avatar_url`, `status`, `email_verified_at`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 1, 'Nguyễn Trọng Hoài', 'Nguyễn Trọng Hoài', 'admin@dynova.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9k.HwDltV8XyUf8FScQki', '0866347730', 'TP. Hồ Chí Minh', NULL, NULL, NULL, 'https://i.pravatar.cc/300?img=12', 'https://i.pravatar.cc/300?img=12', 'active', '2026-06-30 06:29:48', NULL, '2026-06-30 06:29:48', '2026-06-30 06:29:48'),
(2, 2, 'Khách hàng Demo', 'Khách hàng Demo', 'customer@dynova.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9k.HwDltV8XyUf8FScQki', '0909000001', 'Quận 1, TP. Hồ Chí Minh', NULL, NULL, NULL, 'https://i.pravatar.cc/300?img=32', 'https://i.pravatar.cc/300?img=32', 'active', '2026-06-30 06:29:48', NULL, '2026-06-30 06:29:48', '2026-06-30 06:29:48'),
(3, 2, 'Minh Anh', 'Minh Anh', 'minhanh@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9k.HwDltV8XyUf8FScQki', '0909000002', 'Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, 'https://i.pravatar.cc/300?img=45', 'https://i.pravatar.cc/300?img=45', 'active', '2026-06-30 06:29:48', NULL, '2026-06-30 06:29:48', '2026-06-30 06:29:48'),
(4, 1, 'hoài', 'hoài', 'tronghoainguyen5@gmail.com', '$2y$12$dZ9EGlu4XFqJnA8gFZVIdu2zQvAf0rniAt.nQSYvKRDWHQ7u7N4Nu', '0937781823', NULL, 'Thành phố Hồ Chí Minh', NULL, NULL, NULL, NULL, 'active', NULL, NULL, '2026-07-01 00:41:30', '2026-07-02 11:07:41'),
(5, 2, 'giang', 'giang', 'ngo779998@gmail.com', '$2y$12$y0k4qEUvD9SQp8w9WCAyau87u/1.N6nYDNNRQX.WowJiFJUetswcy', '0937356605', NULL, NULL, NULL, NULL, 'http://127.0.0.1:8000/storage/avatars/PqmutnFR6AEbqYgwP22795RCzHhSlCg7lxaQioMm.jpg', 'http://127.0.0.1:8000/storage/avatars/PqmutnFR6AEbqYgwP22795RCzHhSlCg7lxaQioMm.jpg', 'active', NULL, NULL, '2026-07-01 23:21:58', '2026-07-01 23:23:15');

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(2, 'Áo', 'ao', NULL, 'áo chính.webp', 1, 1, '2026-06-18 00:29:53', '2026-06-18 00:29:53'),
(3, 'Giày', 'giay', NULL, 'giày chính.webp', 1, 2, '2026-06-18 00:29:53', '2026-06-18 00:29:53'),
(4, 'Phụ kiện', 'phu-kien', NULL, 'phụ kiện chính.webp', 1, 3, '2026-06-18 00:29:53', '2026-06-18 00:29:53'),
(5, 'Quần', 'quan', NULL, 'quần chính.webp', 1, 4, '2026-06-18 00:29:53', '2026-06-18 00:29:53'),
(6, 'Thương hiệu', 'thuong-hieu', NULL, 'thương hiệu chính.webp', 1, 5, '2026-06-18 00:29:53', '2026-06-18 00:29:53');

INSERT INTO `brands` (`id`, `name`, `slug`, `description`, `logo`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Nike', 'nike', NULL, 'ALLBRANDS_NIKE.webp', 1, 1, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(2, 'Adidas', 'adidas', NULL, 'ALLBRANDS_DAS.webp', 1, 2, '2026-06-18 00:32:02', '2026-06-18 00:32:02'),
(3, 'Puma', 'puma', NULL, 'ALLBRANDS_PUMA.webp', 1, 3, '2026-06-18 00:32:02', '2026-06-18 00:32:02'),
(4, 'UNDER ARMOUR', 'under-armour', NULL, 'ALLBRANDS_UA.webp', 1, 4, '2026-06-18 00:32:02', '2026-06-18 00:32:02'),
(5, 'SPEEDO', 'speedo', NULL, 'ALLBRANDS_SPEEDO.webp', 1, 5, '2026-06-18 00:32:02', '2026-06-18 00:32:02'),
(6, 'ZOGGS', 'zoggs', NULL, 'ALLBRANDS_ZOGGS.webp', 1, 6, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(7, '2XU', '2xu', NULL, 'ALLBRANDS_2XU.webp', 1, 7, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(8, 'ONEILL', 'oneill', NULL, 'ALLBRANDS_ONEILL.webp', 1, 8, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(9, 'AIRWALK', 'airwalk', NULL, 'ALLBRANDS_AIR.webp', 1, 9, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(10, 'CROCS', 'crocs', NULL, 'ALLBRANDS_CROCS.webp', 1, 10, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(11, 'HOKA', 'hoka', NULL, 'HOKA.webp', 1, 11, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(12, 'JOOLA', 'joola', NULL, 'ALLBRANDS_JOOLA.webp', 1, 12, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(13, 'TRIGGERPOINT', 'triggerpoint', NULL, 'ALLBRANDS_TRIGGER (1).webp', 1, 13, '2026-07-02 08:02:51', '2026-07-02 08:02:51'),
(14, 'ASICS', 'asics', NULL, 'ALLBRANDS_ASICS.webp', 1, 14, '2026-07-02 08:02:51', '2026-07-02 08:02:51');

INSERT INTO `sizes` (`id`, `name`, `type`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Freesize', 'other', 0, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(2, 'S', 'clothing', 1, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(3, 'M', 'clothing', 2, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(4, 'L', 'clothing', 3, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(5, 'XL', 'clothing', 4, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00');

INSERT INTO `colors` (`id`, `name`, `code`, `hex`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Mặc định', 'default', NULL, 0, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(2, 'Be', 'be', '#D6BFA5', 1, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(3, 'Vàng Chanh', 'vang-chanh', NULL, 2, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(4, 'Xanh', 'xanh', '#2563EB', 3, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(5, 'Đen', 'den', '#000000', 4, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(6, 'Xanh Dương', 'xanh-duong', '#2563EB', 5, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(7, 'Hồng', 'hong', '#EC4899', 6, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(8, 'Tím', 'tim', '#8B5CF6', 7, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00'),
(9, 'Trắng', 'trang', '#FFFFFF', 8, 1, '2026-07-09 00:00:00', '2026-07-09 00:00:00');

INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `short_description`, `description`, `image`, `price`, `compare_price`, `status`, `is_featured`, `created_at`, `updated_at`) VALUES
(5, 2, 2, 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers', 'ao-polo-nam-adidas-mercedes-amg-petronas-formula-1-team-engineers-5', 'Form áo vừa vặn, dễ dàng vận động, thích hợp nhiều hoạt động.
Thiết kế nút cài và cổ áo tạo điểm nhấn cổ điển.
Chất liệu cao cấp: 57% cotton, 39% modal, 4% elastane
Cấu trúc vải waffle giúp thấm hút mồ hôi và giữ cho bạn luôn thoải mái.
Mã sản phẩm: KE5524', 'Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers mang đến phong cách lịch lãm, chuyên nghiệp cho những ai đam mê tốc độ. Thiết kế tinh tế với chất liệu mềm mại, co giãn đem lại sự thoải mái tối đa dù bạn mặc đi làm hay dạo chơi ở trường đua. Form áo vừa vặn, cùng cổ áo và hàng nút cài tạo điểm nhấn cổ điển. Áo sử dụng cấu trúc vải waffle giúp thấm hút mồ hôi, thông thoáng tuyệt đối, giữ bạn luôn mát mẻ cả ngày dài. Logo BOS nổi bật trên tay áo khẳng định niềm yêu thích của bạn dành cho đội đua F1 huyền thoại.', 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Trắng-2.300.000₫.webp', '2300000.00', '2500000.00', 'active', 0, '2026-07-02 08:02:52', '2026-07-02 08:02:52'),
(29, 2, 1, 'NIKE-Áo Thun Nam Nike Court Heritage', 'nike-ao-thun-nam-nike-court-heritage-29', 'Phom dáng tiêu chuẩn thoải mái, vừa vặn, không bị rộng thùng thình.
Chất liệu cotton mềm, nhẹ, tạo cảm giác dễ chịu suốt ngày dài.
Cổ áo bo gân giúp giữ form đẹp và bền hơn sau nhiều lần giặt.
100% cotton, thân thiện với da và thoáng mát khi vận động.
Kiểu dáng chuẩn truyền thống, dễ phối đồ cho nhiều phong cách khác nhau.
Mã sản phẩm: IH2086-394', 'Một thiết kế kinh điển có lý do, Áo Thun Nam Nike Court Heritage được làm từ chất liệu cotton mềm mại, phom dáng tiêu chuẩn thoải mái, dễ mặc mỗi ngày và dễ phối với mọi trang phục yêu thích của bạn.', 'NIKE-Áo Thun Nam Nike Court Heritage - Xanh Mint-909.000₫.webp', '909000.00', '1500000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(30, 2, 1, 'NIKE-Áo Thun Nam Nike Dri-Fit Uv Hyverse', 'nike-ao-thun-nam-nike-dri-fit-uv-hyverse-30', 'Công nghệ Nike Dri-FIT giúp thấm hút mồ hôi, đẩy nhanh quá trình bay hơi, giữ cơ thể luôn khô thoáng và thoải mái.
Sản phẩm có khả năng chống tia UVA và UVB tại các vùng da được che phủ bởi áo.
Chất liệu vải dệt kim mềm mịn, mang lại cảm giác êm ái khi mặc.
Đường may phẳng giúp hạn chế cọ xát, tạo sự dễ chịu trên da.
Thiết kế phù hợp cho các hoạt động chạy bộ, tập luyện và yoga.
Cổ áo bo đứng gọn gàng, giữ form đẹp khi vận động.
Logo Swoosh đặc trưng được đặt bên ngực trái.
Chất liệu 100%', 'Áo Thun Nam Nike Dri-FIT UV Hyverse được thiết kế với chất liệu thấm hút mồ hôi giúp cơ thể luôn khô thoáng và thoải mái trong suốt buổi tập. Form áo rộng rãi, mềm mại, mang lại cảm giác dễ chịu khi vận động, phù hợp cho nhiều hoạt động khác nhau như chạy bộ, tập gym hay yoga. Đây là lựa chọn lý tưởng cho những buổi tập đa dạng, giúp bạn luôn sẵn sàng cho mọi thử thách luyện tập.', 'NIKE-Áo Thun Nam Nike Dri-Fit Uv Hyverse - Xanh Mint-989.000₫.webp', '989000.00', '1500000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(31, 2, 1, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve', 'nike-ao-thun-nam-nike-miler-run-energy-dri-fit-uv-protection-short-sleeve-31', 'Công nghệ Nike Dri-FIT giúp hút mồ hôi khỏi da và làm khô nhanh, giữ cơ thể luôn khô thoáng, thoải mái.
Phom dáng kinh điển, dễ mặc, cho cảm giác tự nhiên và thoải mái trong mọi chuyển động.
Chất liệu 100% polyester bền, nhẹ, nhanh khô, phù hợp cho tập luyện hằng ngày.
Bảo vệ da khỏi tia UVA và UVB tại các vùng được áo che phủ; nên kết hợp kem chống nắng chất lượng cho vùng da hở.
Mã sản phẩm: IF9476-845', 'Chạy bộ thoải mái trên mọi quãng đường với Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve siêu nhẹ, thoáng mát, tích hợp bảo vệ tia UV và công nghệ thấm hút mồ hôi, giúp bạn luôn khô ráo và dễ chịu từ km đầu tiên đến vạch đích.', 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve - Cam-1.029.000₫.webp', '1029000.00', '2500000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(32, 2, 1, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit', 'nike-ao-thun-nam-nike-pro-dri-fit-32', 'Công nghệ Nike Dri-FIT hút mồ hôi khỏi da, giúp bay hơi nhanh hơn để bạn luôn khô thoáng và thoải mái.
Chất vải thoáng khí, bề mặt mềm mịn như đào mang lại cảm giác êm ái trên da.
Thành phần vải 59% cotton và 41% polyester, vừa mềm mại vừa bền, ít nhăn và nhanh khô.
Phom dáng tiêu chuẩn, dễ mặc, phù hợp nhiều dáng người và phong cách luyện tập hằng ngày.
Mã sản phẩm: IH1948-100', 'Chiếc Áo Thun Nam Nike Pro Dri-Fit thoáng khí tích hợp công nghệ Dri-FIT giúp kiểm soát mồ hôi, giữ bạn khô ráo và tự tin bứt phá mọi mục tiêu luyện tập.', 'NIKE-Áo Thun Nam Nike Pro Dri-Fit - Trắng-909.000₫.webp', '909000.00', '1200000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(33, 2, 1, 'NIKE-Áo Thun Nam Nike Sportswear Club', 'nike-ao-thun-nam-nike-sportswear-club-33', 'Chất liệu cotton dày vừa phải, mềm mại, đứng form, thoải mái khi mặc hằng ngày
Thiết kế phom rộng, thoáng, dễ vận động và phối layer
Cổ tròn gân (ribbed collar) ôm vừa vặn, giữ form tốt
Chất liệu: 100% cotton
Mã sản phẩm: FV0376-502', 'Nâng tầm phong cách mỗi ngày với Áo Thun Nam Nike Sportswear Club. Chất vải cotton dày vừa phải, mềm mại nhưng đứng form, cho cảm giác thoải mái và bền bỉ. Phom rộng thoáng, dễ cử động và phối nhiều lớp. Logo Nike Futura thêu ở ngực tạo điểm nhấn thể thao đầy năng động.', 'NIKE-Áo Thun Nam Nike Sportswear Club - Tím-989.000₫.webp', '989000.00', '1990000.00', 'active', 0, '2026-06-26 19:42:23', '2026-07-02 19:37:08'),
(34, 2, 1, 'NIKE-Áo Thun Nam Nike Sportswear Loose', 'nike-ao-thun-nam-nike-sportswear-loose-34', 'Cổ bo gân giữ form tốt, giúp áo ôm vừa vặn và gọn gàng.
100% cotton thoáng mát, thấm hút mồ hôi tốt, dễ chịu cả ngày dài.
Mã sản phẩm: IH1372-045', 'Chiếc Áo Thun Nam Nike Sportswear Loose cổ điển nhưng vẫn đầy tính thoải mái này sở hữu phom dáng rộng rãi, dễ mặc. Chất liệu cotton dày vừa phải mang lại cảm giác mềm mại nhưng vẫn giữ form, bền đẹp và êm ái cho những ngày mặc thường xuyên.', 'NIKE-Áo Thun Nam Nike Sportswear Loose - Đen-1.139.000₫.webp', '1139000.00', '1599000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(35, 2, 2, 'ADIDAS-Áo Bra Thể Thao Nữ Adidas Hyperglam Padded', 'adidas-ao-bra-the-thao-nu-adidas-hyperglam-padded-35', 'Mút ngực tháo rời, dây quai có thể điều chỉnh cho vừa vặn theo ý thích.
Sử dụng một phần chất liệu tái chế, thân thiện hơn với môi trường.
Chất vải thấm hút nhanh và khô ráo, giúp cơ thể luôn thoáng mát khi đổ mồ hôi.
Phom dáng ôm gọn hơn cơ thể, co giãn linh hoạt theo từng chuyển động.
Miếng mút tháo rời cho độ che phủ tùy chọn và cảm giác mặc cá nhân hóa.
Thun jacquard cao cấp với logo hiệu suất nổi bật ở giữa ngực, 3 Sọc in trên ống chân tạo điểm nhấn thể thao.
Chất liệu interlock: 85% ', 'Bộ sưu tập tập luyện đa năng lấy cảm hứng từ Gen Z, vừa cá tính, thời trang để diện mỗi ngày, vừa ứng dụng chất liệu hiệu suất cao cho những buổi tập đầy năng lượng. Hoàn hảo cho người trẻ yêu phong cách hiện đại nhưng vẫn coi trọng sự thoải mái và hiệu quả khi vận động.', 'ADIDAS-Áo Bra Thể Thao Nữ Adidas Hyperglam Padded - Đen-950.000₫.webp', '950000.00', '1800000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(36, 2, 2, 'ADIDAS-Áo Thun Nữ Adidas Adi365', 'adidas-ao-thun-nu-adidas-adi365-36', 'Phom dáng: Regular fit, thoải mái, dễ vận động
Chất liệu chính: 100% polyester tái chế
Vải single jersey mềm, thoáng
Chiều dài áo: Dáng chuẩn, che phủ vừa phải
Ứng dụng công nghệ Climacool giúp mát và khô ráo
Cổ tròn thể thao, dễ phối đồ
Chi tiết phản quang hỗ trợ chạy trong điều kiện thiếu sáng
Dải sau cổ in logo, tăng độ bền và tạo điểm nhấn thương hiệu
Mã sản phẩm: KR2959', 'Áo thun nữ adidas adi365 Climacool thiết kế dáng regular hiện đại, thoải mái cho mọi buổi chạy. Chất liệu nhẹ, thoáng, hỗ trợ vận động tự do. Công nghệ Climacool thấm hút và tản mồ hôi nhanh, giữ cơ thể luôn mát, khô ráo để bạn tập trung vào từng bước chạy. Chi tiết phản quang và dải sau cổ tạo điểm nhấn, tôn tinh thần gắn kết cộng đồng chạy bộ.', 'ADIDAS-Áo Thun Nữ Adidas Adi365 - Hồng-900.000₫.webp', '900000.00', '1800000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(37, 2, 2, 'ADIDAS-Áo Thun Nữ Adidas Stadium Season', 'adidas-ao-thun-nu-adidas-stadium-season-37', 'Phom rộng (Loose fit)
Cổ chữ V, bo gân
Chất liệu chính: 100% polyester tái chế
Thiết kế vải mesh thoáng khí
Dáng áo hơi lửng
Viền satin tinh tế
Panel tricot ở phần vai
In adidas Sportswear ở ngực trước
Mã sản phẩm: KR5329', 'Áo Thun Nữ Adidas Stadium Season mang đậm tinh thần thể thao Mỹ với phong cách năng động, trẻ trung lấy cảm hứng từ văn hóa cổ vũ bóng đá, bóng rổ và bóng chày. Thiết kế loose fit cùng phom hơi croptop tạo cảm giác thoải mái, phù hợp cho các hoạt động thường ngày hay xuống phố cá tính. Cổ chữ V kết hợp viền rib cổ điển và chi tiết panel tricot ở vai giúp tăng nét thể thao hiện đại, trong khi chất liệu sport mesh thoáng khí mang lại sự dễ chịu suốt cả ngày. Điểm nhấn 3-Stripes biểu tượng cùng logo adidas Sportswear phía trước giúp hoàn thiện diện mạo nổi bật, cho bạn tự tin thể hiện phong cách năng động ở bất cứ đâu.', 'ADIDAS-Áo Thun Nữ Adidas Stadium Season - Xanh Dương-1.250.000₫.webp', '1250000.00', '1800000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(38, 2, 1, 'NIKE-Áo Ba Lỗ Nữ Nike Swift Dri-Fit', 'nike-ao-ba-lo-nu-nike-swift-dri-fit-38', 'Giữ khô thoáng: Công nghệ Nike Dri-FIT hút mồ hôi khỏi da, giúp bay hơi nhanh để bạn luôn khô ráo và dễ chịu trong suốt buổi chạy.
Thoát ẩm tối đa: Mảng lưới mesh lớn phía sau hỗ trợ luồng khí lưu thông, giải phóng hơi ẩm nhanh hơn khi vận động cường độ cao.
Form dáng tiện lợi: Thiết kế bo gọn ở eo giúp phối lớp với áo khoác hoặc áo thun khác dễ dàng mà không bị cộm.
Che phủ tự nhiên: Vạt áo cong tinh tế giúp phần thân luôn kín đáo, kể cả khi sải bước dài hay tăng tốc.
Dễ nhận diện khi thiếu', 'Lấy cảm hứng từ chính những runner như bạn, chiếc Áo Ba Lỗ Nữ Nike Swift Dri-Fit được làm mới với tiêu chí tối ưu hiệu năng. Chất vải siêu nhẹ, mềm mại, thấm mồ hôi nhanh cùng thiết kế thoáng khí giúp bạn tập trung trọn vẹn vào từng kilomet, không bị phân tâm bởi cảm giác bứt rứt, nặng nề trên cơ thể.', 'NIKE-Áo Ba Lỗ Nữ Nike Swift Dri-Fit - Cam-1.209.000₫.webp', '1209000.00', '1500000.00', 'active', 0, '2026-06-26 19:42:23', '2026-06-26 19:42:23'),
(39, 2, 1, 'NIKE-Áo Bra Thể Thao Nữ Nike Indy High-Support Zip', 'nike-ao-bra-the-thao-nu-nike-indy-high-support-zip-39', 'Tự do chọn mức độ nâng đỡ: Indy Light Support cho cảm giác nhẹ nhàng, thoải mái; Indy Medium Support ôm sát, vững vàng khi bạn di chuyển nhiều.
Luôn khô thoáng: Công nghệ Nike Dri-FIT giúp hút mồ hôi khỏi da và đẩy nhanh bay hơi để bạn luôn khô ráo, dễ chịu.
Mặc vào cởi ra siêu nhanh: Thiết kế khóa kéo phía trước với móc cài bên trong giúp thay áo dễ dàng, kèm nắp che khóa tạo bề mặt êm ái với da.
Che phủ ổn định: Mút lót may liền chống xô lệch, gấp nếp, cho bề mặt phẳng và che phủ chắc chắn.', 'Khóa chắc và tự tin bứt phá – Áo Bra Thể Thao Nữ Nike Indy High-Support Zip giúp giảm tối đa dao động khi vận động mạnh, lý tưởng cho các bài tập cường độ cao. Dây đai êm, nâng đỡ tốt và có thể điều chỉnh cho vừa vặn, trong khi chất vải mịn, khô nhanh mang lại bề mặt phẳng gọn, thoải mái và tôn dáng.', 'NIKE-Áo Bra Thể Thao Nữ Nike Indy High-Support Zip - Đen-1.539.000₫.webp', '1539000.00', '2500000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(40, 2, 1, 'NIKE-Áo Bra Thể Thao Nữ Nike Indy Light-Support', 'nike-ao-bra-the-thao-nu-nike-indy-light-support-40', 'Công nghệ Nike Dri-FIT giúp hút mồ hôi khỏi da, đẩy nhanh bay hơi để bạn luôn khô ráo và thoải mái.
Mút đệm thiết kế kỹ thuật, luồn từ phía dưới và cố định chắc, giữ phom ngực mượt mà và ổn định khi giặt và vận động.
Độ nâng đỡ nhẹ ôm êm cơ thể, tạo cảm giác tự do, không gò bó khi tập luyện hay sinh hoạt thường ngày.
Đai ngực jacquard mềm áp sát cơ thể, ôm chắc mà không siết, không gây hằn hay khó chịu.
Dây đeo có thể điều chỉnh, dễ dàng tùy chỉnh vừa vặn theo dáng người và sở thích.
Chất l', 'Thoải mái là chính mình trong chiếc Áo Bra Thể Thao Nữ Nike Indy Light-Support dáng thấp, thiết kế tối giản và thanh lịch này. Chất vải mịn, khô nhanh mang lại bề mặt phẳng phiu, gọn gàng, trong khi độ nâng đỡ nhẹ ôm êm cơ thể nhưng vẫn cho bạn sự tự do tối đa – lý tưởng cho các bài tập nhẹ nhàng hoặc mặc cả ngày dài mà vẫn dễ chịu.', 'NIKE-Áo Bra Thể Thao Nữ Nike Indy Light-Support - Trắng-1.149.000₫.webp', '1149000.00', '2500000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(41, 2, 1, 'NIKE-Áo Bra Thể Thao Nữ Nike Swoosh Medium-Support Padded', 'nike-ao-bra-the-thao-nu-nike-swoosh-medium-support-padded-41', 'Công nghệ Nike Dri-FIT giúp hút mồ hôi khỏi da và bay hơi nhanh, giữ cơ thể khô thoáng và dễ chịu, kết hợp lớp lưới thoáng khí giúp bạn luôn mát mẻ.
Vải nhẹ, thích ứng theo chuyển động, đàn hồi tốt và hồi dáng nhanh, tạo độ ôm vừa khít và tôn dáng nhẹ nhàng.
Sợi siêu co giãn giúp mặc và cởi áo dễ dàng, không gây khó chịu.
Độ nâng đỡ trung bình cho cảm giác ôm chắc, giữ mọi thứ cố định khi vận động.
Mút ngực may liền, không xô lệch, giữ form đẹp tự nhiên.
Chất liệu cao cấp: Thân áo 72% polye', 'Tập luyện hết mình mà không phải lo lắng về áo ngực. Chiếc Áo Bra Thể Thao Nữ Nike Swoosh Medium-Support Padded thấm hút mồ hôi này ôm gọn cơ thể, cố định chắc chắn và che phủ an toàn, cho bạn tự tin di chuyển tự do. Chất liệu co giãn hút ẩm nhanh, giữ phom tốt sau mỗi lần mặc, luôn sẵn sàng đồng hành cùng bạn trong mọi buổi tập.', 'NIKE-Áo Bra Thể Thao Nữ Nike Swoosh Medium-Support Padded - Đen-1.259.000₫.webp', '1259000.00', '2500000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(42, 2, 1, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey', 'nike-ao-thun-nu-nike-sportswear-oversized-jersey-42', 'Logo Swoosh thêu nổi bật, khẳng định phong cách thể thao cao cấp.
Cổ áo bo gân chắc chắn, giữ form đẹp và ôm vừa vặn.
Chất liệu 100% polyester nhẹ, bền và thoáng mát suốt ngày dài.
Phom oversize rộng rãi, thoải mái và cực kỳ sành điệu.
Mã sản phẩm: IO0914-435', 'Mang chất “đấu trường rực lửa” ra phố với chiếc áo jersey đầy cá tính. Phom rộng thời thượng, đường nét chỉn chu và cảm hứng thể thao mạnh mẽ giúp bạn nổi bật ở mọi nơi, từ sân bóng đến đường phố.', 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey - Xanh Dương-1.769.000₫.webp', '1769000.00', NULL, 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(43, 2, 1, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running', 'nike-ao-thun-nu-nike-swift-breathe-dri-fit-short-sleeve-running-43', 'Công nghệ Nike Dri-FIT hỗ trợ thoát mồ hôi nhanh, giữ da khô ráo, thoải mái
Chất vải siêu nhẹ, bề mặt mịn, thông thoáng với độ che phủ nhẹ
Chi tiết phản quang hỗ trợ nổi bật hơn trong điều kiện thiếu sáng
Chất liệu: 100% polyester
Phom dáng ôm gọn, tôn dáng, hiện đại
Mã sản phẩm: IF1681-852', 'Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running siêu nhẹ, thoáng mát, luôn sẵn sàng đồng hành cùng bạn trên mọi cung đường chạy. Chất liệu thông thoáng, thấm hút mồ hôi nhanh, mang lại cảm giác mát mẻ, khô ráo và dễ chịu để bạn tự tin tăng tốc ở mọi cự ly.', 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running - Cam San Hô-1.429.000₫.webp', '1429000.00', '1500000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(44, 2, 4, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh', 'under-armour-ao-thun-nu-under-armour-tech-mesh-44', 'Chất liệu UA Tech™ khô nhanh, siêu mềm, bề mặt vải cho cảm giác tự nhiên, dễ chịu.
Vải có khả năng hút mồ hôi và thoát ẩm cực nhanh, giúp cơ thể luôn khô ráo.
Công nghệ kiểm soát mùi hạn chế mùi khó chịu khi vận động cường độ cao.
Thân áo chứa ít nhất 90% polyester tái chế (không tính phụ liệu, trang trí), thân thiện hơn với môi trường.
100% Polyester bền, nhẹ, phù hợp tập luyện hằng ngày.
Dáng Loose rộng rãi, cho cảm giác thoải mái và tự do cử động tối đa.
Mã sản phẩm: 6009990-001', 'UA Tech™ là dòng đồ tập “chủ lực” của Under Armour: phom rộng thoải mái, siêu nhẹ, luôn giữ cơ thể mát mẻ để bạn tập luyện hết mình. Một chiếc áo đáp ứng trọn vẹn mọi nhu cầu luyện tập hằng ngày.', 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-999.000₫.webp', '999000.00', '1100000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(45, 2, 2, 'ADIDAS-Áo Đá Bóng Trẻ Em Adidas Sân Nhà Arsenal Fc 26 Replica', 'adidas-ao-da-bong-tre-em-adidas-san-nha-arsenal-fc-26-replica-45', 'Phom dáng regular fit vừa vặn
Công nghệ Climacool: Thấm hút mồ hôi, thoáng khí
Vải dệt kim đôi
Huy hiệu câu lạc bộ được may trực tiếp
Họa tiết graphic độc quyền trên cổ áo và viền tay áo
100% polyester (100% tái chế)
Mã sản phẩm: KB9947', 'Khám phá Áo Đá Bóng Trẻ Em Adidas Sân Nhà Arsenal Fc 26/27 – mẫu áo sân nhà đậm chất biểu tượng, tôn vinh trọn vẹn DNA kinh điển của Arsenal và cột mốc 20 năm ngôi nhà hiện đại Emirates. Thiết kế lấy cảm hứng từ kiến trúc, đường nét và các tác phẩm nghệ thuật nổi tiếng của sân, giữ vững nền đỏ kinh điển với điểm nhấn trắng tinh giản, nhưng được nâng tầm bằng những chi tiết tinh xảo. Cổ áo và tay áo được trang trí họa tiết độc quyền mô phỏng những đường lượn mềm như làn sóng khán đài, trong khi ba sọc biểu tượng sử dụng các sắc đỏ tương phản, gợi lại những giai đoạn vinh quang khác nhau trong lịch sử đầy tự hào của câu lạc bộ.', 'ADIDAS-Áo Đá Bóng Trẻ Em Adidas Sân Nhà Arsenal Fc 26 Replica - Đỏ-1.500.000₫.webp', '1500000.00', '1800000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(46, 2, 2, 'ADIDAS-Áo Đá Bóng Trẻ Em Adidas Sân Nhà Liverpool Fc 27 Replica', 'adidas-ao-da-bong-tre-em-adidas-san-nha-liverpool-fc-27-replica-46', 'Chất liệu 100% polyester tái chế, thân thiện môi trường và bền đẹp theo thời gian.
Khô nhanh, thấm hút mồ hôi hiệu quả, luôn giữ cơ thể khô thoáng khi vận động.
Công nghệ HEAT.RDY giúp thoát nhiệt tối ưu, thoải mái ngay cả trong những trận cầu căng thẳng.
Công nghệ CLIMACOOL tăng cường khả năng thông thoáng, cho cảm giác mát mẻ và dễ chịu suốt 90 phút.
Mã sản phẩm: KB8255', 'Với Áo Đá Bóng Trẻ Em Adidas Sân Nhà Liverpool Fc 26/27, các fan nhí có thể ăn mừng bóng đá và thể hiện sự ủng hộ của mình với CLB. Chiếc áo là sự kết hợp giữa nguồn cảm hứng từ phiên bản thập niên 80 và tinh thần cách tân táo bạo.

Kết cấu vải dệt kim đôi mang lại cảm giác mềm mại, bền bỉ, đồng hành cùng những cuộc phiêu lưu kỳ thú của bé. Công nghệ adidas Climacool thấm hút và xử lý mồ hôi nhanh chóng khi bé vui chơi và hoạt động hàng ngày. Logo Performance thêu, huy hiệu câu lạc bộ dệt và biểu tượng 3-stripes cho bé tự tin khoác màu áo của đội bóng yêu thích với niềm tự hào.', 'ADIDAS-Áo Đá Bóng Trẻ Em Adidas Sân Nhà Liverpool Fc 27 Replica - Đỏ-1.500.000₫.webp', '1500000.00', '1800000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(47, 2, 1, 'NIKE SWIM-Áo Bơi Chống Nắng Bé Trai Nike Swim Hydroguard', 'nike-swim-ao-boi-chong-nang-be-trai-nike-swim-hydroguard-47', 'Công nghệ Nike Dri-FIT giúp thấm hút và thoát mồ hôi nhanh, giữ cho cơ thể luôn khô ráo và thoải mái khi mặc.
Sản phẩm có khả năng chống tia nắng UVA và UVB (UPF 40+) ở những vùng vải che phủ. Với các vùng da hở, bạn nên dùng thêm kem chống nắng để bảo vệ tốt hơn.
Form tiêu chuẩn (Standard Fit)
Logo Swoosh ép nhiệt
Chất liệu: 100% polyester
Mã sản phẩm: NESSG831-434', 'Áo Bơi Chống Nắng Bé Trai Nike Swim Hydroguard giúp bé thoải mái vận động dưới nắng với lớp vải chống tia UV và công nghệ thấm hút mồ hôi, giữ da luôn khô thoáng, dễ chịu. Phom dáng tiêu chuẩn ôm gọn vừa vặn, logo Swoosh hiện đại tạo điểm nhấn thể thao, phù hợp cho các hoạt động bơi lội và vui chơi ngoài trời.', 'NIKE SWIM-Áo Bơi Chống Nắng Bé Trai Nike Swim Hydroguard - Xanh Dương-999.000₫.webp', '999000.00', '1300000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(48, 2, 1, 'NIKE SWIM-Áo Bơi Thể Thao Bé Gái Nike Swim Long Sleeve Hydroguard', 'nike-swim-ao-boi-the-thao-be-gai-nike-swim-long-sleeve-hydroguard-48', 'Công nghệ Nike Dri-FIT giúp hút mồ hôi ra khỏi da để nhanh chóng bay hơi, giữ cho khô ráo và thoải mái.
Dây đai cổ bên trong mềm mại trên da
Mã sản phẩm: NESSF744-678', 'Công nghệ Dri-FIT sẽ giữ cho cơ thể khô ráo và thoải mái, trong khi áo thun dài tay vừa vặn này với chỉ số bảo vệ UV 40 UPF giúp được che chắn ánh nắng gay gắt', 'NIKE SWIM-Áo Bơi Thể Thao Bé Gái Nike Swim Long Sleeve Hydroguard - Hồng-999.000₫.webp', '999000.00', '1500000.00', 'active', 0, '2026-06-26 19:43:52', '2026-06-26 19:43:52'),
(49, 2, 5, 'SPEEDO-Áo Phao Trẻ Em Speedo Printed', 'speedo-ao-phao-tre-em-speedo-printed-49', 'Chất liệu: Polyester
Áo bơi có đệm xốp để nổi
Thiết kế đầy màu sắc, ngộ nghĩnh
Trẻ em phải được giám sát khi sử dụng sản phẩm này
Sản xuất theo tiêu chuẩn an toàn của Úc và Châu Âu
Mã sản phẩm: 8-1225214686', 'Tận hưởng buổi học bơi với chiếc áo phao có họa tiết Chim cánh cụt châu Phi Chima. Được thiết kế để mang lại cho người học cảm giác thoải mái để cử động tay chân khi bơi với các miếng đệm xốp để nổi. Phía trước có khóa kéo giúp giữ an toàn cho các bé bơi lội .Được sản xuất theo tiêu chuẩn an toàn của Úc và Châu Âu. Trẻ em phải được giám sát khi sử dụng sản phẩm này.', 'SPEEDO-Áo Phao Trẻ Em Speedo Printed - Xanh Lá-1.099.000₫.webp', '1099000.00', '1500000.00', 'active', 0, '2026-06-26 19:44:41', '2026-06-26 19:44:41'),
(50, 2, 5, 'SPEEDO-Đồ Bơi Một Mảnh Bé Gái Speedo Digital Printed', 'speedo-do-boi-mot-manh-be-gai-speedo-digital-printed-50', 'Chất liệu thân áo 82% polyester tái chế, 18% elastane CREORA® HighClo™ giúp chống clo, co giãn 4 chiều, bền đẹp lâu dài.
Sợi polyester từ chai nhựa tái chế, thân thiện với môi trường, an tâm cho làn da bé.
Kiểu dáng racerback chắc chắn, ôm sát nhưng không gây khó chịu, giúp bé tự do vận động.
Thiết kế hở chân thấp, che chắn thoải mái khi vui chơi.
Lót trước và sau bằng 100% polyester tái chế, nâng cao sự mềm mại, an toàn cho da bé.
Mã sản phẩm: 8-00373918289', 'Cùng bé yêu chinh phục những con sóng và tận hưởng mùa hè rực rỡ với Đồ Bơi Một Mảnh Bé Gái Speedo Digital Printed! Thiết kế nổi bật hình dưa hấu dễ thương sẽ làm bé thích mê. Đồng thời quai lưng thể thao ôm sát chắc chắn giúp bé thoải mái vận động dù là bơi lội hay vui chơi trên bờ cát. Chất liệu EnduraBrite tiên tiến với khả năng co giãn 4 chiều và công nghệ CREORA® HighClo™ giúp chống chịu clo vượt trội, giữ dáng áo luôn như mới.', 'SPEEDO-Đồ Bơi Một Mảnh Bé Gái Speedo Digital Printed - Hồng-419.000₫.webp', '419000.00', '500000.00', 'active', 0, '2026-06-26 19:44:41', '2026-06-26 19:44:41'),
(51, 2, 5, 'SPEEDO-Đồ Bơi Một Mảnh Bé Gái Speedo Learn To Swim Digital Frill Thinstrap', 'speedo-do-boi-mot-manh-be-gai-speedo-learn-to-swim-digital-frill-thinstrap-51', 'Thinstrap suit - with frill detail on shoulder and leg
-Higher chlorine resistance than standard swimwear fabrics - fits like new for longer with CREORA® HighClo™
-Shape Retention - fabric stretches so you can enjoy your swim without feeling restricted
-Nylon yarns in the EnduraFlex fabric are made from 100% pre-consumer waste, such as waste fabric from factories 8-00314614807', 'Join the all-new Learn to Swim Squad on a magical Bondi adventure! Pretty in pinks and purples, this fun Thinstrap Swimsuit is perfect for little swimmers and features our fun-loving new Aria the Otter and Ellie the Elephant characters enjoying a swim down under. Young children will enjoy the frill detailing, while the thin strap design allows them to splash and play without feeling restricted. Ideal for regular pool sessions, our ECO EnduraFlex fabric offers higher chlorine resistance than standard swimwear fabrics and fits like new for longer with CREORA® HighClo™. In addition, nylon yarns in the EnduraFlex fabric are made from 100% pre-consumer waste, such as waste fabric from factories.', 'SPEEDO-Đồ Bơi Một Mảnh Bé Gái Speedo Learn To Swim Digital Frill Thinstrap - Hồng-275.000₫.webp', '275000.00', '300000.00', 'active', 0, '2026-06-26 19:44:41', '2026-06-26 19:44:41'),
(52, 2, 6, 'ZOGGS-Đồ Bơi Một Mảnh Bé Gái Zoggs Zip', 'zoggs-do-boi-mot-manh-be-gai-zoggs-zip-52', 'Bộ đồ bơi một mảnh có khóa kéo phía trước, chống cọ xát
Làm từ chai nhựa tái chế sau tiêu dùng (18 x 500ml chai nhựa tái chế trong mỗi mét vải)
Kháng clo rất tốt, bền đến 250 giờ trong hồ bơi
Lót phía trước để tăng cường sự kín đáo và hỗ trợ
Chất liệu khô nhanh
Bảo vệ chống nắng UPF 50+
Co giãn 4 chiều, giữ form dáng tốt
Người mẫu mặc kích cỡ 10
Chất liệu Ecolast™: 82% Polyester tái chế, 18% Polyester PBT
Trọng lượng: 195 gram
Mã sản phẩm: 463137-DESC', 'Phong cách mới - Giới thiệu bộ Đồ Bơi Một Mảnh Bé Gái Zoggs Zip! Thiết kế cổ cao tăng cường che phủ và khóa kéo chống cọ xát phía trước. Kiểu dáng lưng mở giúp bé di chuyển tự do khi bơi. Họa tiết toàn bộ phía trước với các chú chim hồng và xanh rất phù hợp cho mùa hè.

Chất liệu Ecolast™ từ chai nhựa tái chế, kháng clo rất tốt, cảm giác mềm mại khi chạm vào.', 'ZOGGS-Đồ Bơi Một Mảnh Bé Gái Zoggs Zip - 474.000₫.webp', '4740000.00', '5000000.00', 'active', 0, '2026-06-26 19:44:41', '2026-06-26 19:44:41'),
(59, 5, 7, '2XU-Quần Dài Bó Cơ Nam 2XU Base Layer Compression', '2xu-quan-dai-bo-co-nam-2xu-base-layer-compression-59', 'Thành phần: 77% polyester tái chế, 23% spandex
Cạp chun jacquard phẳng, ôm vừa vặn, an toàn
Lớp đũng lưới bên trong tăng cường khả năng thoáng khí
Chất liệu co giãn, đàn hồi tốt
Thấm hút và khô thoáng nhanh chóng
Mã sản phẩm: MA7199b-BLK/NRO', 'Đưa buổi tập của bạn lên một tầm cao mới với Quần Bó Cơ Nén Nam 2XU Base Layer. Được thiết kế để ôm vừa vặn, thoải mái, chiếc quần này cung cấp lực nén nhẹ nhàng hỗ trợ lưu thông máu đến các cơ, giảm nguy cơ chấn thương và cải thiện hiệu suất tập luyện.', '2XU-Quần Dài Bó Cơ Nam 2XU Base Layer Compression - Đen-1.592.000₫.webp', '1592000.00', '2000000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(60, 5, 1, 'NIKE-Quần Bó Thể Thao Nam Nike Pro Dri-Fit', 'nike-quan-bo-the-thao-nam-nike-pro-dri-fit-60', 'Công nghệ Nike Dri-FIT thấm hút mồ hôi, hỗ trợ khô thoáng, thoải mái
Vải dệt co giãn ôm sát cơ thể, cho cảm giác linh hoạt, tự nhiên
Cạp quần mềm, co giãn tốt, ôm gọn phía trên hông
Túi bên tiện lợi để cất chìa khóa, thẻ và các vật nhỏ
Chất liệu: Thân quần 90% polyester, 10% elastane; Lưới 92% polyester, 8% elastane
Mã sản phẩm: FB7953-010', 'Quần Bó Thể Thao Nam Nike Pro Dri-FIT đồng hành cùng mọi hành trình tập luyện, giúp bạn tự tin bứt phá giới hạn. Chất vải ôm sát, co giãn linh hoạt, hỗ trợ tối đa ngay cả khi bạn ở phòng gym, trên sân cỏ hay trong mọi hoạt động dã ngoại khác.', 'NIKE-Quần Bó Thể Thao Nam Nike Pro Dri-Fit - Đen-879.000₫.webp', '879000.00', '1000000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(61, 5, 1, 'NIKE-Quần Ngắn Thể Thao Nam Nike Dri-Fit Form 7 Inch Unlined', 'nike-quan-ngan-the-thao-nam-nike-dri-fit-form-7-inch-unlined-61', 'Công nghệ Nike Dri-FIT giúp thấm hút mồ hôi nhanh, hỗ trợ bay hơi hiệu quả để cơ thể luôn khô thoáng và thoải mái khi vận động.
Chất liệu vải woven nhẹ và mịn mang lại cảm giác linh hoạt, kết hợp cùng thiết kế đáy quần mở rộng giúp chuyển động chân tự nhiên hơn trong mọi bài tập.
Cạp quần low-profile ôm gọn, nằm phẳng trên da và đi kèm dây rút điều chỉnh vừa vặn.
Túi hai bên tiện lợi giúp cất giữ an toàn các vật dụng nhỏ như chìa khóa hoặc thẻ.
Thiết kế phù hợp cho chạy bộ, tập gym và yoga.
', 'Quần Ngắn Thể Thao Nam Nike Dri-FIT Form 7 Inch Unlined được thiết kế dành cho chạy bộ, tập luyện và yoga với kiểu dáng linh hoạt, phù hợp cho những buổi tập đa dạng cường độ. Chất liệu tích hợp công nghệ thấm hút mồ hôi giúp cơ thể luôn khô thoáng, trong khi bề mặt vải mềm mịn và form quần gọn nhẹ mang lại cảm giác thoải mái trong từng chuyển động. Từ các bài tập sức mạnh đến những buổi yoga cường độ cao, Nike Dri-FIT Form luôn sẵn sàng đồng hành cùng bạn.', 'NIKE-Quần Ngắn Thể Thao Nam Nike Dri-Fit Form 7 Inch Unlined - Xanh Mint-1.099.000₫.webp', '1099000.00', '2000000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(62, 5, 1, 'NIKE-Quần Ngắn Thể Thao Nam Nike Dri-Fit Tech Woven', 'nike-quan-ngan-the-thao-nam-nike-dri-fit-tech-woven-62', 'Dáng rộng thoải mái ở mông và đùi, giúp cử động dễ dàng và tạo phong cách năng động, phóng khoáng.
Lưng thun co giãn kết hợp chốt chỉnh dây cho cảm giác ôm gọn vừa vặn quanh eo suốt cả ngày.
Túi bên có khóa kéo giúp cất giữ điện thoại, ví và vật dụng nhỏ an toàn khi di chuyển.
Túi sau cài nút bấm tiện lợi, tăng thêm không gian chứa đồ mà vẫn gọn gàng.
Chất liệu thân quần: 94% nylon/6% elastane, túi lót: 100% polyester, bền nhẹ, mau khô và dễ chăm sóc.
Phom chuẩn truyền thống, dễ mặc, dễ phố', 'Mang trọn vẻ đẹp hiện đại, chiếc Quần Ngắn Thể Thao Nam Nike Dri-Fit Tech Woven nổi bật với chi tiết chỉn chu như túi Tech siêu dài tiện dụng và dây rút lấy cảm hứng từ dây bolo độc đáo. Chất liệu trơn mịn, co giãn linh hoạt cùng độ dài ống quần khoảng 15cm, rơi ngay trên đầu gối, giúp bạn thoải mái vận động mà vẫn giữ được diện mạo gọn gàng, cá tính.', 'NIKE-Quần Ngắn Thể Thao Nam Nike Dri-Fit Tech Woven - Đen-2.569.000₫.webp', '2569000.00', '2999000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(63, 5, 1, 'Quần Bơi Nam Nike Swim Breaker Full Mesh 7 Inch Volley', 'quan-boi-nam-nike-swim-breaker-full-mesh-7-inch-volley-63', 'Túi lưới bên trong túi phải tăng không gian cất giữ an toàn
Cạp chun co giãn với dây rút bên ngoài
Lót full mesh thoáng khí, khô nhanh
Túi hai bên lót lưới tiện lợi
Logo Nike Swoosh thêu tinh tế
Độ dài ống trong: 7 inch (~17,8 cm)
Chất liệu thân: 100% nylon taslan tái chế
Lót trong: 100% polyester tái chế
Mã sản phẩm: NESSG514-001', 'Thiết kế tối giản nhưng nổi bật, quần bơi nam Nike Swim Breaker Full Mesh 7 Inch Volley mang lại phong cách thể thao đa năng. Lưng chun co giãn với dây rút, túi lưới thoáng khí và lót full mesh giúp khô nhanh, di chuyển linh hoạt, sẵn sàng cho mọi cuộc phiêu lưu dưới nước.', 'Quần Bơi Nam Nike Swim Breaker Full Mesh 7 Inch Volley - Đen NIKE SWIM 1.899.000₫.webp', '1899000.00', '2000000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(64, 5, 4, 'UNDER ARMOUR-Quần Lót Nam Under Armour Performance Cotton 3Inch', 'under-armour-quan-lot-nam-under-armour-performance-cotton-3inch-64', 'Chất liệu cotton pha mềm mại, thấm hút mồ hôi và khô rất nhanh
Không có đường may bên hông hoặc phía sau để hạn chế ma sát
Co giãn 4 chiều linh hoạt
Thắt lưng đàn hồi
Gấu quần được thiết kế phẳng, tránh bị cuộn hoặc xê dịch theo chuyển động cơ thể
Kiểu dáng ôm: Vừa vặn
3 chiếc mỗi gói
Độ dài (từ đáy quần đến gấu quần): ~7.62cm
Có khe mở
57% Cotton/38% Polyester/5% Elastane
Mã sản phẩm: 1383891-410', 'Đồ Lót Nam Under Armour Performance Cotton 3Inch sở hữu chất liệu Charged Cotton® - vừa mềm mại, thoải mái lại vừa thấm hút và co giãn linh hoạt. Sản phẩm cũng được áp dụng công nghệ ngăn mùi và hạn chế ma sát.', 'UNDER ARMOUR-Quần Lót Nam Under Armour Performance Cotton 3Inch-650.000₫.webp', '650000.00', '700000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(65, 5, 4, 'UNDER ARMOUR-Quần Ngắn Thể Thao Nam Under Armour Tech™ Woven Wordmark', 'under-armour-quan-ngan-the-thao-nam-under-armour-techtm-woven-wordmark-65', 'Chất liệu vải dệt siêu nhẹ, bền bỉ, tạo cảm giác thoải mái vượt trội
Công nghệ thấm hút mồ hôi, giúp quần luôn khô thoáng
Lưng thun co giãn có dây rút trong, dễ dàng điều chỉnh
Thiết kế túi hai bên tiện lợi
Đường xẻ gối hai bên giúp di chuyển linh hoạt
Chất liệu chính: ít nhất 90% polyester tái chế (không kể trang trí và phụ kiện)
Không có lớp lót trong
Có túi
Độ dài ống quần: 8.25" (~21 cm)
Chất liệu: 100% Polyester
Dáng rộng (Loose fit): Tối ưu sự thoải mái
Mã sản phẩm: 1383356-390', 'Quần Ngắn Thể Thao Nam Under Armour Tech™ Woven Wordmark là lựa chọn hoàn hảo cho mọi hoạt động thể thao. Thiết kế năng động, tối ưu sự thoải mái với chất liệu siêu nhẹ, co giãn giúp bạn luôn sẵn sàng vận động. Quần dễ gấp gọn, tiện mang theo, phù hợp luyện tập mọi lúc, mọi nơi.', 'UNDER ARMOUR-Quần Ngắn Thể Thao Nam Under Armour Tech™ Woven Wordmark-639.000₫.webp', '639000.00', '800000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(66, 5, 2, 'ADIDAS-Quần Bó Thể Thao Nữ Adidas Hyperglam 3-Stripes', 'adidas-quan-bo-the-thao-nu-adidas-hyperglam-3-stripes-66', 'Dáng ôm sát tôn đường cong cơ thể, tạo vẻ thon gọn và năng động.
Cạp chun toàn phần co giãn tốt, giúp quần ôm vừa vặn và dễ chịu.
Chất liệu chính: 85% polyester tái chế / 15% elastane, vừa thân thiện môi trường vừa co giãn linh hoạt.
Đai lưng jacquard cao cấp với logo thể thao, nhấn mạnh phong cách cá tính.
Thiết kế không đường may phía trước giúp bề mặt phẳng phiu, hạn chế hằn và khó chịu.
Công nghệ CLIMACOOL giúp thấm hút, thoát mồ hôi nhanh, giữ cơ thể luôn khô thoáng khi tập luyện.
Cạp', 'Quần Bó Thể Thao Nữ Adidas Hyperglam 3-Stripes là lựa chọn hoàn hảo cho những cô nàng yêu phong cách năng động mà vẫn thời thượng.

Từ phòng tập boutique đến quán cà phê sau giờ luyện tập, bạn có thể tự tin diện nguyên một set mà không cần thay đổi.

Chất vải bóng mịn ôm theo từng chuyển động, mang lại cảm giác thoải mái và tăng thêm sự tự tin suốt cả ngày. Cạp cao tôn dáng, giúp vòng eo trông gọn gàng hơn, trong khi đai lưng jacquard kèm logo thể thao tạo điểm nhấn cá tính, nổi bật.

Công nghệ Climacool thấm hút và thoát mồ hôi nhanh, giữ cho cơ thể luôn khô ráo, mát mẻ khi vận động. Hoạ tiết 3 Sọc in trên ống chân khẳng định chất adidas đậm nét.

Biến chiếc legging này thành điểm nhấn trong tủ đồ tập của bạn – dù là đi tập gym hay hẹn hò bạn bè, Hyperglam luôn là trợ thủ đắc lực về cả phong cách lẫn hiệu suất.', 'ADIDAS-Quần Bó Thể Thao Nữ Adidas Hyperglam 3-Stripes - Đen-1.100.000₫.webp', '1100000.00', '1800000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(67, 5, 2, 'ADIDAS-Quần Bó Thể Thao Nữ Adidas Optime Workout', 'adidas-quan-bo-the-thao-nu-adidas-optime-workout-67', 'Dáng ôm sát cơ thể, tôn dáng và hỗ trợ tối ưu khi tập luyện.
Chất liệu chính: 73% polyester tái chế / 27% elastane, vừa bền vững vừa đàn hồi tốt.
Vải dệt interlock giúp quần dày dặn, khó see-through, tạo sự yên tâm khi vận động.
Cạp lưng cao ôm gọn bụng, che phủ tốt và cố định quần khi tập.
Công nghệ CLIMACOOL giúp thoát mồ hôi nhanh, giữ cơ thể luôn mát và khô ráo.
Thiết kế không đường may giữa phía trước cho bề mặt phẳng, thoải mái và đẹp mắt hơn.
Công nghệ ADIMOVE cho cảm giác ôm sát nh', 'Quần Bó Thể Thao Nữ Adidas Optime Workout với công nghệ Climacool mang đến cảm giác mát mẻ, khô ráo và tự tin trong mọi buổi tập.

Chất vải ADIMOVE ôm sát như làn da thứ hai, giữ form lâu dài nhờ công nghệ Lycra® Sport, tôn dáng mà vẫn thoải mái. Cạp cao ôm gọn vòng eo, che phủ tốt và hỗ trợ cơ thể khi vận động mạnh.

Chất vải squat-proof co giãn 4 chiều cho phép bạn thoải mái gập, ngồi, kéo giãn mà không lo lộ, trong khi túi đùi tiện lợi giúp bạn mang theo điện thoại hoặc vật dụng cần thiết. Thiết kế không đường may giữa phía trước tạo bề mặt trơn mượt, phẳng phiu, giúp dáng quần đẹp hơn.

Hãy tận hưởng cảm giác khô thoáng, êm ái và đầy phong cách với chiếc quần tập sở hữu công nghệ Climacool này.', 'ADIDAS-Quần Bó Thể Thao Nữ Adidas Optime Workout - Đen-1.500.000₫.webp', '1500000.00', '1700000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(68, 5, 2, 'ADIDAS-Quần Ngắn Thể Thao Nữ Adidas Hyperglam 3-Stripes Woven', 'adidas-quan-ngan-the-thao-nu-adidas-hyperglam-3-stripes-woven-68', 'Dáng regular fit vừa vặn, dễ phối đồ và phù hợp nhiều vóc dáng.
Cạp cao với thun ôm toàn bộ vòng eo, cố định chắc chắn khi vận động.
Chất liệu chính 100% polyester tái chế, nhẹ, bền và thân thiện hơn với môi trường.
Kết cấu dệt trơn cho bề mặt mịn, thoải mái khi tiếp xúc với da.
Công nghệ CLIMACOOL giúp thoát ẩm nhanh, giữ cơ thể luôn khô thoáng và mát mẻ.
Sọc 3-Stripes in dọc ống quần tạo điểm nhấn thể thao, đậm chất adidas.
Logo và chi tiết nhận diện adidas hoàn thiện vẻ ngoài năng động,', 'Quần Ngắn Thể Thao Nữ Adidas Hyperglam 3-Stripes Woven là lựa chọn lý tưởng cho những cô nàng luôn di chuyển, cần một item vừa tập luyện tốt vừa mặc đi chơi vẫn đẹp.

Thiết kế trẻ trung, tôn dáng với cạp thun jacquard ôm gọn, phần lưng cao che phủ khéo léo, giúp bạn tự tin trong mọi động tác. Công nghệ Climacool chủ động hút và tản mồ hôi, giữ cơ thể luôn khô ráo, mát mẻ để bạn tập trung 100% vào buổi tập mà không bị phân tâm.

Đường xẻ sườn tăng biên độ vận động đồng thời tạo điểm nhấn cá tính, kết hợp sọc 3-Stripes in dọc ống đầy biểu tượng giúp bạn nổi bật từ phòng gym đến những buổi gặp gỡ cafe.

Sở hữu ngay chiếc quần short “must-have” mang tinh thần adidas để nâng tầm phong cách luyện tập và thời trang hằng ngày của bạn.', 'ADIDAS-Quần Ngắn Thể Thao Nữ Adidas Hyperglam 3-Stripes Woven - Đen-750.000₫.webp', '750000.00', '950000.00', 'active', 0, '2026-06-29 23:37:56', '2026-06-29 23:37:56'),
(69, 5, 1, 'NIKE-Chân Váy Nữ Nike Sportswear Mid-Rise Mini', 'nike-chan-vay-nu-nike-sportswear-mid-rise-mini-69', 'Logo Nike Swoosh thêu nổi bật, tôn điểm nhấn thời trang và đẳng cấp.
Lưng thun kèm dây rút, dễ dàng điều chỉnh vừa vặn ôm gọn cơ thể.
Chất liệu thân váy 62% cotton, 38% nylon mang lại cảm giác mềm mại, thoáng mát và bền đẹp.
Túi 100% polyester nhẹ, nhanh khô, tiện lợi cho sinh hoạt hàng ngày.
Mã sản phẩm: IF0557-435', 'Hãy đưa vẻ đẹp táo bạo, rực rỡ từ sân đấu xuống phố với chiếc Chân Váy Nữ Nike Sportswear Mid-Rise Mini đầy phong cách này. Thiết kế lấy cảm hứng thể thao kết hợp chi tiết hoàn thiện tinh tế giúp bạn nâng tầm diện mạo trong mọi khoảnh khắc. Lớp quần lót tích hợp bên trong cho bạn thoải mái vận động, tự tin cả ngày dài. Và vâng, váy có túi tiện dụng để bạn mang theo những món đồ nhỏ quan trọng.', 'NIKE-Chân Váy Nữ Nike Sportswear Mid-Rise Mini - Xanh Dương-1.659.000₫.webp', '1659000.00', '2000000.00', 'active', 0, '2026-06-30 01:47:22', '2026-06-30 01:47:22'),
(70, 5, 1, 'NIKE-Quần Ngắn Thể Thao Nữ Nike Swift Dri-Fit Mid-Rise 2-In-1', 'nike-quan-ngan-the-thao-nu-nike-swift-dri-fit-mid-rise-2-in-1-70', 'Chuyển động linh hoạt: Chất liệu vải nhẹ có độ co giãn tốt; đường xẻ gấu quần giúp tăng thêm sự tự do khi sải bước.
Lưu trữ nâng cấp: Túi khóa kéo phía sau cạp quần đủ lớn để chứa cả điện thoại kích thước lớn; túi thả hai bên ở lớp quần trong giúp tăng thêm không gian chứa đồ.
Công nghệ Dri-FIT: Nike Dri-FIT giúp thấm hút mồ hôi khỏi da, hỗ trợ bay hơi nhanh hơn, giữ cơ thể luôn khô thoáng và thoải mái.
Chi tiết phản quang: Logo Swoosh phản quang ở đùi trái và họa tiết phản quang ở hai bên đù', 'Quần Ngắn Thể Thao Nữ Nike Swift Dri-FIT Mid-Rise 2-In-1 được thiết kế dựa trên trải nghiệm thực tế của người chạy bộ, tập trung tối ưu sự thoải mái và hiệu suất. Chất liệu nhẹ, thấm hút mồ hôi giúp cơ thể luôn khô thoáng khi vận động. Thiết kế 2 lớp gồm lớp trong ôm sát và lớp ngoài rộng rãi mang lại sự che chắn và tự tin khi di chuyển. Hệ thống túi tiện lợi giúp bạn mang theo các vật dụng nhỏ cần thiết, để luôn tập trung vào từng bước chạy.', 'NIKE-Quần Ngắn Thể Thao Nữ Nike Swift Dri-Fit Mid-Rise 2-In-1 - Hồng-1.599.000₫.webp', '1599000.00', '2000000.00', 'active', 0, '2026-06-30 01:47:22', '2026-06-30 01:47:22'),
(71, 5, 8, 'ONEILL-Quần Ngắn Đi Biển Bé Trai ONeill Hyperfreak Mysto 16', 'oneill-quan-ngan-di-bien-be-trai-oneill-hyperfreak-mysto-16-71', 'Outseam 16"
Sử dụng vải kháng khuẩn, giúp loại bỏ vi khuẩn gây mùi
Độ co dãn tối ưu với công nghệ Hyperfreak
Trang bị dây rút giúp điều chỉnh kích thước linh hoạt
Đường may chắc chắn, độ bền cao
Tiện lợi với túi zip bên hông
Chất liệu thông thoáng, chống hăm
Được làm bằng vật liệu tái chế Repreve®
Mã sản phẩm: SP3206005-CRM', 'Quần đi biển Oneill Hyperfreak Mysto 16 sử dụng chất liệu Hyperfreak giúp bạn luôn thoải mái khi ở dưới nước nhờ độ co dãn cao cùng công nghệ O''Neill Hyperdry đẩy nhanh thời gian làm khô, mang lại cảm giác dễ chịu và mang lại sự linh hoạt trong các chuyển động.', 'O''NEILL-Quần Ngắn Đi Biển Bé Trai O''Neill Hyperfreak Mysto 16 - Nhiều Màu-224.000₫.webp', '224000.00', '300000.00', 'active', 0, '2026-06-30 01:47:22', '2026-06-30 01:47:22'),
(72, 5, 5, 'SPEEDO-Quần Bơi Chống Nắng Bé Gái Speedo Essential Colorblock', 'speedo-quan-boi-chong-nang-be-gai-speedo-essential-colorblock-72', 'Chất liệu: EnduraBrite™ chống chịu chlorine tuyệt vời, chống nắng UPF40+
Kiểu dáng: Ôm vừa vặn, che phủ toàn bộ đôi chân
Họa tiết Colorblock bắt mắt
Công nghệ CREORA® HighClo™ giữ form dáng lâu dài
Mã sản phẩm: 8-00319116634', 'Để bé thỏa sức vui đùa dưới nắng hè rực rỡ, Quần Bơi Chống Nắng Bé Gái Speedo Essential Colorblock chính là người bạn đồng hành lý tưởng. Sản phẩm này được thiết kế với kiểu dáng thể thao, chất liệu bền vững và khả năng chống nắng tuyệt vời, bảo vệ làn da mỏng manh của bé an toàn trong những giờ vui chơi thỏa thích. Với những ưu điểm nổi bật trên, Quần Bơi Chống Nắng Bé Gái Speedo Essential Colorblock chắc chắn sẽ là món quà tuyệt vời dành cho bé', 'SPEEDO-Quần Bơi Chống Nắng Bé Gái Speedo Essential Colorblock - Đen-400.000₫.webp', '400000.00', '600000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(73, 5, 6, 'ZOGGS-Quần Bơi Bé Trai Zoggs Hip Racer', 'zoggs-quan-boi-be-trai-zoggs-hip-racer-73', 'Được làm từ chai nhựa tái chế (18 chai nhựa 500ml được tái chế trong mỗi mét vải)
Chống clo cao, duy trì lên đến 250 giờ bơi trong hồ
Chiều dài: ~32cm
Lót phía trước hình tam giác để tăng thêm sự kín đáo
Dây rút giúp điều chỉnh độ vừa vặn
Vải nhanh khô
Khả năng chống nắng UPF50+
Co giãn 4 chiều, mềm mại
Giữ dáng vượt trội và có thể giặt bằng máy
Người mẫu đang mặc kích thước 10
Chất liệu Ecolast™: 82% Polyester tái chế, 18% Polyester PBT
Trọng lượng vải: 195 gram
Mã sản phẩm: 463412-', 'Đắm chìm vào thế giới dưới nước cùng Quần Bơi Bé Trai Zoggs Hip Racer! Các họa tiết ấn tượng cho bé thêm phần hứng khởi. Lớp lót hình tam giác phía trước giúp tăng cường độ phủ và dây rút cho độ vừa vặn hoàn hảo. Khả năng kháng clo cực tốt. Chất liệu Ecolast™ từ chai nhựa tái chế.', 'ZOGGS-Quần Bơi Bé Trai Zoggs Hip Racer - Xanh Navy-237.000₫.webp', '237000.00', '500000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(74, 4, 9, 'AIRWALK-Xe Scooter Airwalk Veer Suspension', 'airwalk-xe-scooter-airwalk-veer-suspension-74', 'Hệ thống gấp với một nút bấm.
Vòng bi ABEC-7.
2 bánh xe
Có thể gấp gọn
Tấm lót chân chống trơn trượt
Tay cầm dễ dàng cầm nắm
Chiều cao tay lái có thể điều chỉnh
Phanh chân sau
Trọng lượng 12 kg
Tải trọng tối đa: 100 kg
Dành cho lứa tuổi từ 8 tuổi trở lên
Mã sản phẩm: 784-5859', 'Chiếc xe scooter này bao gồm tay nắm TPR. Chiều rộng tay lái: 375 mm. Các thanh và ống được làm bằng nhôm. Chiều cao sản phẩm: 880 – 1030 mm. Ống đầu, đầu nối và boong làm bằng chất liệu nhôm. Kích thước sàn: 130 x 505 mm. Kẹp đôi bằng nhôm. Phuộc trước bằng thép và phanh sau bằng nhôm, bánh xe đúc pu 200mm có in và lõi pp abec-7 cao su chịu lực. Tải trọng tối đa: 100kg.', 'AIRWALK-Xe Scooter Airwalk Veer Suspension - Đen-1.201.000₫.webp', '1201000.00', '1500000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(75, 4, 10, 'CROCS-Phụ Kiện Jibbitz™ Food Peach', 'crocs-phu-kien-jibbitztm-food-peach-75', 'Sản phẩm này không phải là đồ chơi.
Không dùng cho trẻ em dưới 3 tuổi
Mã sản phẩm: 10007508', 'Phụ kiện Jibbitz ™ đa dạng với những hình ảnh vui nhộn, chữ cái, ký tự, nhân vật, hay các thông điệp về văn hoá, dùng để gắn trang trí cho các đôi Crocs Classics.Với 13 lỗ trên mỗi chiếc Crocs Classic, bạn có thể thoả sức sáng tạo với 26 chiếc Jibbitz ™ cùng một lúc.', 'CROCS-Phụ Kiện Jibbitz™ Food Peach - Cam San Hô-185.000₫.webp', '185000.00', '200000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(76, 4, 11, 'HOKA-Áo Vest Nước HOKA Trail Run 10L', 'hoka-ao-vest-nuoc-hoka-trail-run-10l-76', 'Thích hợp cho chạy địa hình, đi bộ đường dài, mang lại độ ổn định cao và trọng lượng nhẹ
Giá gắn gậy tích hợp với miệng gia cố, dễ dàng lấy và cất gậy khi di chuyển.
Khóa nam châm phía trước cùng dây co giãn, các điểm gài linh hoạt giúp điều chỉnh chiều cao phù hợp với cơ thể.
Ngăn nhỏ phía trên bên phải có còi an toàn tích hợp, tăng độ an tâm cho vận động viên.
Hai ngăn chứa bình nước đi kèm với hai bình mềm HydraPak 500mL, tiện lợi khi bổ sung nước.
Hai ngăn khóa kéo phía trước mở rộng dạ', 'Được lấy cảm hứng từ giải siêu marathon HOKA UTMB® Mont-Blanc và thử nghiệm qua nhiều cuộc đua đỉnh cao trên thế giới, Áo Vest Nước HOKA Trail Run 10L mang đến sự cân bằng tuyệt vời giữa thoải mái, trọng lượng nhẹ và không gian chứa đồ rộng rãi cho các vận động viên chuyên nghiệp. Với thiết kế 12 ngăn thông minh cùng giá gắn gậy tiện lợi và hai bình nước mềm 500mL HydraPak đi kèm, sản phẩm này chắc chắn sẽ trở thành trợ thủ đắc lực trên mọi cung đường chinh phục địa hình thử thách.', 'HOKA-Áo Vest Nước HOKA Trail Run 10L - Trắng-5.399.000₫.webp', '5399000.00', '6000000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(77, 4, 11, 'HOKA-Mũ Lưỡi Trai HOKA Run', 'hoka-mu-luoi-trai-hoka-run-77', 'Chất liệu 100% polyester: Nhẹ nhàng, thoáng khí và nhanh khô, mang lại sự thoải mái tối đa.
Lưới bên thoáng khí: Tăng cường sự thông thoáng khi vận động.
Vành mũ mềm: Dễ dàng điều chỉnh hình dáng theo ý thích.
Dây cài tùy chỉnh: Webbing rộng kết hợp khóa cài chắc chắn, mang lại sự vừa vặn thoải mái.
Chi tiết phản quang: Tăng khả năng nhìn thấy khi chạy vào buổi tối hoặc trong điều kiện ánh sáng yếu.
Mã sản phẩm: 1164330-HKB', 'Mũ Lưỡi Trai HOKA Run là sự kết hợp hoàn hảo giữa phong cách, sự thoải mái và hiệu suất. Được cải tiến dựa trên phản hồi của vận động viên và người hâm mộ, mũ có thiết kế lưới bên tăng cường độ thoáng khí và vành mũ mềm có thể định hình dễ dàng. Dây cài webbing tùy chỉnh kết hợp với chất liệu nhẹ, nhanh khô mang lại cảm giác vừa vặn và thoải mái cho mọi hoạt động. Sản phẩm còn được bổ sung chi tiết phản quang giúp tăng cường an toàn khi chạy trong điều kiện ánh sáng yếu.', 'HOKA-Mũ Lưỡi Trai HOKA Run - Xanh Dương-719.000₫.webp', '719000.00', '800000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(78, 4, 12, 'JOOLA-Vợt Pickleball JOOLA Scorpeus Pro V Anna 16Mm', 'joola-vot-pickleball-joola-scorpeus-pro-v-anna-16mm-78', 'Bề mặt carbon fiber nhám tăng khả năng tạo xoáy và kiểm soát bóng tối đa.
Lõi vợt dày 16mm/14mm giúp giảm chấn tốt và tăng độ ổn định cho từng cú đánh.
Đạt chứng nhận UPA-A và USAP, phù hợp thi đấu chuyên nghiệp.
Thiết kế chuẩn, phù hợp với nhiều phong cách thi đấu.
Chiều dài vợt 40,6cm đảm bảo kiểm soát linh hoạt mọi vị trí trên sân.
Bản rộng 20,3cm mở rộng điểm ngọt, hỗ trợ đa dạng kỹ thuật phòng ngự.
Tay cầm Feel-Tec êm ái, chống trơn trượt khi thi đấu liên tục.
Tay cầm dài 13,3cm phù ', 'Scorpeus Pro V – cây vợt hoàn hảo cho những ai yêu thích lối chơi phòng ngự chắc chắn. Với thiết kế bản rộng nhất cùng hình dáng dễ kiểm soát, Scorpeus Pro V giúp mỗi cú đánh đều ổn định ngay cả khi bạn chưa chuẩn xác về thời gian hay điểm tiếp xúc.

Chiều dài ngắn hơn các dòng Pro V khác mang lại sự vững vàng vượt trội trong các pha bóng tốc độ gần lưới. Đây là lựa chọn lý tưởng cho các trận đấu đôi khi cần che chắn ít sân nhưng phải chiến thắng nhiều pha điểm tại khu vực lưới.

Công nghệ KineticFrame độc quyền ở phần cổ vợt giúp giảm rung, kiểm soát bóng tốt hơn và đảm bảo những tay vợt mềm vẫn luôn làm chủ cuộc chơi dưới áp lực.', 'JOOLA-Vợt Pickleball JOOLA Scorpeus Pro V Anna 16Mm - Vàng-7.890.000₫.webp', '7890000.00', '8000000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(79, 4, 1, 'NIKE-Vớ Thể Thao Nike Everyday Cushioned (3 Đôi)', 'nike-vo-the-thao-nike-everyday-cushioned-3-doi-79', 'Công nghệ Dri-FIT giúp giữ cho đôi chân của bạn khô ráo và thoải mái.

Đệm chân sử dụng chất liệu vải terry dày mang lại sự thoải mái và hấp thụ tác động.

Dải vòm có gân ôm nhẹ nhàng mang lại cảm giác hỗ trợ.

Thiết kế bao phủ mắt cá chân và bắp chân dưới. Chất liệu: 69% cotton / 28% polyester / 2% elastane / 1% nylon
Sản phẩm có thể giặt máy 
Mã sản phẩm: SX7664-100', 'Cung cấp năng lượng cho quá trình tập luyện của bạn với vớ Everyday Cushioned của Nike. Đế vải bông dày mang đến cho bạn sự thoải mái hơn khi tập chân và nâng tạ, trong khi dải vòm có gân bao bọc phần giữa bàn chân tạo cảm giác hỗ trợ tối đa.', 'NIKE-Vớ Thể Thao Nike Everyday Cushioned (3 Đôi) - Trắng-489.000₫.webp', '489000.00', '500000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(80, 4, 5, 'SPEEDO-Bình Xịt Chống Sương Speedo Anti Fog', 'speedo-binh-xit-chong-suong-speedo-anti-fog-80', 'Công thức đặc biệt của Bình Xịt Chống Sương Speedo Anti Fog giúp tạo thành một lớp màng bảo vệ trên bề mặt kính bơi, ngăn chặn sự hình thành của hơi nước, cho bạn tầm nhìn rõ nét và an toàn khi bơi lội
Không màu, không mùi, không gây kích ứng mắt, đảm bảo an toàn cho người sử dụng
Với dung tích 30ml, có thể sử dụng lên đến 200 lần
Mã sản phẩm: 8-00381317217', 'Bình Xịt Chống Sương Speedo Anti Fog - Người bạn đồng hành không thể thiếu trong túi đồ của bạn. Sự kết hợp hoàn hảo giữa công nghệ chống sương và khả năng phục hồi hiệu suất ban đầu, sản phẩm này không chỉ giữ cho kính bơi của bạn luôn sáng bóng mà còn mang lại trải nghiệm tốt nhất trong quá trình bơi lội.', 'SPEEDO-Bình Xịt Chống Sương Speedo Anti Fog - Đỏ-299.000₫.webp', '299000.00', '300000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(81, 4, 5, 'SPEEDO-Kính Bơi Cận Thị Người Lớn Speedo Aquapure Optical (Asia Fit)', 'speedo-kinh-boi-can-thi-nguoi-lon-speedo-aquapure-optical-asia-fit-81', 'Gọng kính IQfit ™ 3D không bị rò rỉ, vừa vặn an toàn và giảm các vết xung quanh mắt
Dây đeo IQfit ™ với thang đo lực căng, phù hợp với từng cá nhân
Ống kính rõ ràng cho điều kiện ánh sáng yếu và khả năng hiển thị tối đa. Lý tưởng để bơi trong nhà.
Thấu kính phủ lớp chống sương mù với khả năng chống tia cực tím 100%
Mã sản phẩm: 8-095409722
', 'Kính Bơi Cận Thị Người Lớn Speedo Aquapure Optical sở hữu công nghệ IQfit ™ - công nghệ kính bảo hộ tiên tiến nhất từ trước đến nay của Speedo. Thiết kế vừa vặn, an toàn không rò rỉ và giảm các vết hằn quanh mắt, cho bạn tự tin tuyệt đối khi tập luyện.', 'SPEEDO-Kính Bơi Cận Thị Người Lớn Speedo Aquapure Optical (Asia Fit) - Đen-1.099.000₫.webp', '1099000.00', '1500000.00', 'active', 0, '2026-06-30 02:23:02', '2026-06-30 02:23:02'),
(82, 4, 5, 'SPEEDO-Kính Bơi Cận Thị Speedo Biofuse 2.0 Optical', 'speedo-kinh-boi-can-thi-speedo-biofuse-2-0-optical-82', 'Flexible Frame 2.0: Khung kính linh hoạt, ôm sát khuôn mặt thoải mái
Chống mờ, nhìn rõ lâu dài: Tráng phủ anti-fog giúp tầm nhìn luôn trong suốt
Ổn định khi đeo: Rãnh định hình sống mũi tăng độ chắc và êm
Đệm siêu mềm: Viền đệm êm, ôm theo vùng mắt, phù hợp nhiều khuôn mặt
Chống UV400: Bảo vệ mắt khỏi tia UVA & UVB
Tầm nhìn rộng: Thiết kế tròng mở rộng góc nhìn hai bên khi bơi
Khung trong chắc chắn: Tăng độ ổn định nhưng vẫn mềm dẻo khi đeo
Dây đeo tách đôi: Ôm gọn, dễ cố định và chỉnh tó', 'Kính Bơi Speedo Biofuse 2.0 Optical là lựa chọn số 1 cho tập luyện, nay tích hợp tròng kính cận với độ chuẩn - giúp bạn nhìn rõ từ bể bơi đến biển. Khung liền mềm ôm sát, đệm mắt êm ái, dây đeo chỉnh nhanh bằng nút bấm cho cảm giác chắc mặt mà vẫn thoải mái. Tròng rộng hỗ trợ tầm nhìn ngoại biên, nhiều mức độ từ -1.5 đến -6.0.', 'SPEEDO-Kính Bơi Cận Thị Speedo Biofuse 2.0 Optical - Xanh Navy-899.000₫.webp', '899000.00', '1000000.00', 'active', 0, '2026-06-30 02:43:38', '2026-06-30 02:43:38'),
(83, 4, 5, 'SPEEDO-Kính Bơi Người Lớn Speedo Biofuse 2.0', 'speedo-kinh-boi-nguoi-lon-speedo-biofuse-2-0-83', 'Vẫn sử dụng công nghệ Speedo Biofuse® bán chạy nhất của Speedo để mang lại sự thoải mái linh hoạt mỗi khi bạn bơi.

Con dấu điều chỉnh siêu mềm với thiết kế rãnh mới, mang đến kiểu dáng vừa vặn.

Thiết kế khung bên trong linh hoạt và mạnh mẽ, kéo dài và điều chỉnh để vừa vặn và mang lại sự ổn định vượt trội.

Hình dạng tròng kính được cải tiến mới, mang lại tầm nhìn ngoại vi tuyệt vời.

Dây đeo cấu hình thấp thời trang với các bánh răng kéo để vừa vặn an toàn và thoải mái.

Lớp phủ chố', 'Kính Bơi Speedo Biofuse 2.0 – Tầm Nhìn Rõ Nét, Êm Ái Tối Ưu

Khám phá hiệu suất vượt trội của Kính Bơi Speedo Biofuse 2.0! Công nghệ Biofuse độc quyền mang đến tầm nhìn rõ nét, sự linh hoạt và cảm giác thoải mái tuyệt vời dưới nước. Thiết kế hiện đại và đa dạng màu sắc, sẵn sàng đồng hành cùng bạn trong mọi buổi tập luyện.

Biofuse 2.0. Vẫn sử dụng công nghệ Speedo Biofuse® bán chạy nhất của chúng tôi, kính bảo hộ mới của Speedo mang đến sự thoải mái và phù hợp ở cấp độ tiếp theo với cơ chế nút ấn hoàn toàn mới và các vòng đệm siêu mềm với thiết kế rãnh mới. Đó là những gì bạn yêu thích về Biofuse - thậm chí còn nhiều hơn nữa.', 'SPEEDO-Kính Bơi Người Lớn Speedo Biofuse 2.0 - Xanh Navy-792.000₫.webp', '792000.00', '850000.00', 'active', 0, '2026-06-30 02:43:38', '2026-06-30 02:43:38'),
(84, 4, 5, 'SPEEDO-Kính Bơi Người Lớn Speedo Fastskin Purefocus (Asia Fit)', 'speedo-kinh-boi-nguoi-lon-speedo-fastskin-purefocus-asia-fit-84', 'Ngăn sương mù nhờ chức năng chống tia cực tím và chức năng chống sương mù mạnh gấp đôi
Thấu kính gương polycarbonate với phản xạ ánh sáng và tầm nhìn rõ ràng
Giảm khả năng chống dòng nước và góc nhìn rộng với ống kính cong giúp loại bỏ các góc ở góc
Bao bì 3D được áp dụng cấu hình thấp ngăn ngừa rò rỉ nước và giảm thiểu các vết mắt
Dây đeo vừa vặn IQ được cấp bằng sáng chế của Speedo với kích thước được ghi trên đó, vì vậy bạn có thể điều chỉnh dây đeo một cách chính xác để vừa với mình mọi ', 'Chiếc kính có gương lấy nét tinh khiết với thiết kế đẹp mắt theo đuổi độ cản trở thấp và vừa vặn tối ưu cho hình dạng khuôn mặt của người châu Á.', 'SPEEDO-Kính Bơi Người Lớn Speedo Fastskin Purefocus (Asia Fit) - Cam-2.099.000₫.webp', '2099000.00', '2500000.00', 'active', 0, '2026-06-30 02:43:38', '2026-06-30 02:43:38'),
(85, 4, 5, 'SPEEDO-Nón Bơi Speedo Silicone', 'speedo-non-boi-speedo-silicone-85', 'Lý tưởng cho những buổi bơi luyện tập thường xuyên, giúp bạn luôn sẵn sàng xuống nước.
Thiết kế 3D công thái học ôm vừa vặn, tạo cảm giác thoải mái và chắc đầu.
Chất liệu silicone bền, sử dụng lâu dài mà không dễ rách hay biến dạng.
Bề mặt mịn không vướng, không kéo giật tóc khi đội hoặc tháo mũ.
Thiết kế thủy động lực giúp giảm lực cản nước, hỗ trợ bạn bơi nhanh và mượt mà hơn.
Mã sản phẩm: 8-7098417614', 'Được thiết kế tối ưu cho hiệu suất bơi tốt hơn,Nón Bơi Speedo Silicone trơn với thiết kế 3D công thái học ôm sát đầu, mang lại cảm giác dễ chịu và chắc chắn ngay cả khi bạn bơi lâu. Bề mặt mượt, mang lại dáng bơi thủy động lực học giúp bạn lướt nước nhẹ nhàng và chuyên nghiệp hơn. Chất liệu silicone bền bỉ cho phép bạn sử dụng thường xuyên mà vẫn giữ form đẹp, đồng thời hỗ trợ bảo vệ mái tóc khỏi tác hại của clo – một phụ kiện màu xanh nổi bật không thể thiếu trong túi đồ bơi của bạn.', 'SPEEDO-Nón Bơi Speedo Silicone - Trắng-199.000₫.webp', '199000.00', '200000.00', 'active', 0, '2026-06-30 02:43:38', '2026-06-30 02:43:38'),
(86, 4, 13, 'TRIGGERPOINT-Con Lăn Tập Gym Triggerpoint The Grid Foam', 'triggerpoint-con-lan-tap-gym-triggerpoint-the-grid-foam-86', 'Bề mặt ba chiều cho phép cơ được mát xa trong khi bạn lăn, tăng lưu thông của máu và oxy — các chất dinh dưỡng cần thiết để hồi phục cơ bắp
Thiết kế Proprietary Distrodensity độc quyền tái tạo cảm giác như bàn tay của một nhà trị liệu mát xa
Lõi rỗng, cứng được bọc bằng tay đệp xốp EVA cứng hơn so với các con lăn xốp truyền thống
Kết cấu cao cấp sẽ không bị hỏng khi sử dụng nhiều lần
Dành cho người mới bắt đầu hoặc người đã có kinh nghiệm sử dụng con lăn
Kích thước: 33 cm x 14 cm
Khối lượn', 'Con lăn tập gym TriggerPoint GRID®, con lăn lõi rỗng nguyên bản, có bề mặt xốp đa mật độ đã được cấp bằng sáng chế giúp nén chắc chắn như massage thể thao đồng thời tăng lưu thông máu và oxy cần thiết để phục hồi cơ. Con lăn có thiết kế GRID®phù hợp để giảm đau và căng cơ, cải thiện khả năng vận động, tăng cường tuần hoàn. Được các bác sĩ thể thao, chuyên gia chỉnh hình và vật lý trị liệu khuyên dùng.', 'TRIGGERPOINT-Con Lăn Tập Gym Triggerpoint The Grid Foam - Rằn Ri-1.149.000₫.webp', '1149000.00', '1900000.00', 'active', 0, '2026-06-30 02:43:38', '2026-06-30 02:43:38'),
(87, 4, 4, 'UNDER ARMOUR-Mũ Xô Nam Under Armour Iso-Chill Armourvent', 'under-armour-mu-xo-nam-under-armour-iso-chill-armourvent-87', 'Công nghệ ArmourVent® mang đến độ thoáng khí tối ưu với chất liệu nhẹ, co giãn, bền bỉ và nhanh khô.
Dải thấm mồ hôi Iso-Chill giúp phân tán nhiệt cơ thể, tạo cảm giác mát lạnh khi chạm vào.
Dây rút điều chỉnh đảm bảo độ vừa vặn chắc chắn.
Dây đai dệt có họa tiết nổi bật tạo điểm nhấn màu sắc.
Không có kiểu dáng cố định.
Chất liệu: 100% Polyester.
Mã sản phẩm: 1383434-025', 'Mũ Xô Nam Under Armour Iso-Chill Armourvent giữ cho bạn luôn mát mẻ bằng cách thoát nhiệt qua các lỗ thông hơi - giúp đẩy không khí nóng ra ngoài nhưng vẫn đủ nhỏ để ngăn chặn tia nắng mặt trời.', 'UNDER ARMOUR-Mũ Xô Nam Under Armour Iso-Chill Armourvent-495.000₫.jpg', '4950000.00', '6000000.00', 'active', 0, '2026-06-30 02:43:38', '2026-06-30 02:43:38'),
(88, 4, 6, 'ZOGGS-Kẹp Mũi Bơi Người Lớn Zoggs', 'zoggs-kep-mui-boi-nguoi-lon-zoggs-88', 'Chất liệu: 80% nylon, 20% silicone
Khung nhựa dễ dàng phù hợp
Miếng đệm silicon siêu thoải mái
Kích thước thông thường phù hợp với hầu hết các mũi - phù hợp nhất với người lớn
Hộp đựng tiện dụng
Mã sản phẩm: 465279-AST', 'KẸP MŨI BƠI NGƯỜI LỚN ZOGGS NOSE CLIP', 'ZOGGS-Kẹp Mũi Bơi Người Lớn Zoggs - Xanh Dương-50.000₫.webp', '50000.00', '80000.00', 'active', 0, '2026-06-30 02:43:38', '2026-06-30 02:43:38'),
(89, 3, 2, 'ADIDAS-Giày Chạy Bộ Nam Adidas Adizero Adios Pro 4', 'adidas-giay-chay-bo-nam-adidas-adizero-adios-pro-4-89', 'Form ôm vừa chân, phù hợp hầu hết dáng chân runner.
Hệ thống dây buộc chắc chắn, dễ tùy chỉnh độ ôm.
Thân giày bằng vải dệt và chất liệu tổng hợp, thoáng khí và nhẹ.
Đệm Lightstrike Pro siêu nhẹ, đàn hồi tốt cho cảm giác bật nhịp và tốc độ cao.
Lót trong bằng vải mang lại cảm giác thoải mái, hạn chế cọ xát.
Trọng lượng khoảng 200g (size UK 8.5), lý tưởng cho chạy tốc độ và thi đấu.
Độ chênh đế 6 mm (gót 39 mm / mũi 33 mm) giúp chuyển bước tự nhiên, hỗ trợ tăng tốc.
Đế ngoài cao su Contine', 'Giày Chạy Bộ Nam Adidas Adizero Adios Pro 4 được sinh ra để chinh phục kỷ lục, kế thừa danh tiếng “đôi giày thắng giải nhiều nhất thế giới” của dòng Adizero Adios Pro. Dành cho các runner tốc độ muốn phá bỏ giới hạn, phiên bản mới sở hữu loạt nâng cấp tối ưu hiệu quả chạy: thanh ENERGYRODS 2.0 pha carbon cho chuyển động gót–mũi chân liền mạch và bứt tốc, điểm rocker mới ở đế giữa hỗ trợ tiết kiệm sức, cùng hai lớp đệm LIGHTSTRIKE PRO siêu nhẹ giúp êm chân mà vẫn giữ năng lượng trên cả quãng đường dài. Đế ngoài Continental™ bám đường vượt trội kết hợp LIGHTTRAXION giúp giảm trọng lượng nhưng vẫn giữ lực bám tự tin trong từng bước bật mũi.', 'ADIDAS-Giày Chạy Bộ Nam Adidas Adizero Adios Pro 4 - Trắng-6.500.000₫.webp', '6500000.00', '7000000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(90, 3, 2, 'ADIDAS-Giày Sneaker Trẻ Em Adidas Droids Grand Court 2.0 El C', 'adidas-giay-sneaker-tre-em-adidas-droids-grand-court-2-0-el-c-90', 'Kiểu dáng vừa vặn
Dây giày kết hợp quai dán
Thân trên bằng da tổng hợp
Gót TPU chắc chắn
Đế ngoài bằng cao su
©Disney
Mã sản phẩm: IH1137', 'Để bé thỏa sức hóa thân thành nhân vật hoạt hình yêu thích với Giày Sneaker Trẻ Em Adidas Droids Grand Court 2.0 El C. Dù đang tung tăng ở công viên hay vui chơi ở sân trường, chất liệu mềm mại của đôi giày sẽ giữ cho chân bé luôn thoải mái suốt cả ngày. Quai dán kết hợp dây giày co giãn giúp bé dễ dàng mang vào và tháo ra. Họa tiết Star Wars tăng thêm phần bắt mắt.', 'ADIDAS-Giày Sneaker Trẻ Em Adidas Droids Grand Court 2.0 El C - Trắng-600.000₫.webp', '600000.00', '900000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(91, 3, 14, 'ASICS-Giày Chạy Bộ Nam Asics Gel-Kayano 33', 'asics-giay-chay-bo-nam-asics-gel-kayano-33-91', 'Upper lưới kỹ thuật: Chất liệu lưới siêu nhẹ, thoáng khí, giảm tối đa lớp phủ dư thừa, giúp ôm chân tự nhiên và linh hoạt khi di chuyển
Công nghệ PureGEL™ gót sau: Phiên bản GEL™ cải tiến mềm hơn, hấp thụ chấn động tốt hơn, mềm hơn khoảng 65% so với GEL™ tiêu chuẩn
Đệm FF BLAST™ PLUS: Lớp đệm đế giữa nhẹ, êm như mây, mang lại độ phản hồi tốt và trọng lượng nhẹ hơn FF BLAST™ thông thường
Đế ngoài HYBRID ASICSGRIP™: Kết hợp ASICSGRIP™ và AHARPLUS™ giúp tăng độ bám đa địa hình và nâng cao độ bền', 'Giày Chạy Bộ Nam Asics Gel-Kayano 33 được tạo ra để đồng hành cùng bạn trên mọi cung đường với cảm giác êm ái, ổn định và đầy tự tin. Công nghệ FLUIDSUPPORT™ hỗ trợ từng chuyển động một cách tự nhiên, giúp mỗi bước chạy trở nên mượt mà hơn, trong khi lớp đệm kết hợp FF BLAST™ PLUS và FF BLAST™ MAX mang đến độ êm mềm vượt trội cùng khả năng hoàn trả năng lượng hiệu quả. Dù là những buổi chạy hàng ngày hay những chặng đường dài thử thách, Gel-Kayano 33 luôn sẵn sàng giúp bạn duy trì phong độ và tận hưởng trọn vẹn từng kilomet.', 'ASICS-Giày Chạy Bộ Nam Asics Gel-Kayano 33 - Xanh Lá-4.599.000₫.webp', '4599000.00', '5000000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(92, 3, 14, 'ASICS-Giày Chạy Bộ Nam Asics Gel-Nimbus 28', 'asics-giay-chay-bo-nam-asics-gel-nimbus-28-92', 'Độ chênh gót - mũi: 8 mm
Trọng lượng nhẹ: 281g
Dành cho bàn chân trung tính (neutral)
Thân giày dệt kim cao cấp: ôm chân, thông thoáng, giảm chi tiết thừa cồng kềnh.
Lót giày OrthoLite X-55 cao cấp: tăng cường độ êm, kiểm soát độ ẩm, giữ chân luôn khô thoáng.
Công nghệ nhuộm tiên tiến: giảm 33% lượng nước và 45% khí thải carbon so với phương pháp truyền thống.
PureGEL thế hệ mới: êm hơn tới 65% so với công nghệ GEL thông thường, nâng tầm trải nghiệm chạy bộ.
Chi tiết phản quang: tăng độ a', 'Giày Chạy Bộ Nam Asics Gel-Nimbus 28 - Đỉnh cao êm ái dành cho người yêu chạy bộ! Thiết kế nhẹ hơn khoảng 20g so với phiên bản trước, GEL-NIMBUS 28 mang đến cảm giác êm ái chưa từng có, giúp mỗi bước chạy đường dài trở nên nhẹ nhàng và thoải mái hơn bao giờ hết. Kết hợp công nghệ đệm FF BLAST PLUS và PureGEL hiện đại, đôi giày này mang lại sự êm mềm như "đi trên mây", nâng niu đôi chân bạn. Phần thân giày sử dụng chất liệu dệt kim kỹ thuật cao, ôm trọn bàn chân và giữ cho chân luôn dễ chịu, mát mẻ suốt quá trình vận động.', 'ASICS-Giày Chạy Bộ Nam Asics Gel-Nimbus 28 - Xanh Dương-4.599.000₫.webp', '4599000.00', '5000000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(93, 3, 14, 'ASICS-Giày Chạy Trail Nam Asics Trabuco Max 5', 'asics-giay-chay-trail-nam-asics-trabuco-max-5-93', 'Upper lưới kỹ thuật được xử lý chống thấm nước, giúp hạn chế hấp thụ nước khi chạy trong điều kiện ẩm ướt.
Công nghệ GUIDESOLE™ với thiết kế đế cong giúp giảm độ gập cổ chân, hỗ trợ chạy dễ dàng và hiệu quả hơn trên quãng đường dài.
Lót giày EVA mang lại cảm giác êm ái, đồng thời hỗ trợ quản lý độ ẩm để bàn chân luôn khô thoáng.
Đệm FF BLAST™ PLUS cho cảm giác êm nhẹ, phản hồi năng lượng tốt và nhẹ hơn FF BLAST™ tiêu chuẩn.
Đế ngoài ASICSGRIP™ độc quyền của ASICS tăng độ bám trên nhiều loại ', 'Giày Chạy Bộ Nam Asics Trabuco Max 5 mang đến độ bám vượt trội và êm ái tối đa, giúp bạn tự tin chinh phục mọi cung đường trail. Đế ngoài với công nghệ ASICSGRIP™ tăng độ bám trên địa hình off-road, kết hợp đệm FF BLAST™ PLUS đàn hồi, nhẹ hơn khoảng 13g so với phiên bản trước. Thân giày lưới chống thấm nước giúp hạn chế hấp thụ nước, giữ chân khô thoáng và thoải mái ngay cả khi trời mưa.', 'ASICS-Giày Chạy Trail Nam Asics Trabuco Max 5 - Nhiều Màu-4.399.000₫.webp', '4399000.00', '5000000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(94, 3, 10, 'CROCS-Giày Clog Trẻ Em Crocs Bayaband', 'crocs-giay-clog-tre-em-crocs-bayaband-94', 'Cực kỳ nhẹ và thoải mái khi mang
Dễ dàng vệ sinh
Nhanh khô
Dây quai gót xoay vừa vặn, an toàn
Có thể sáng tạo phong cách cá nhân với phụ kiện Jibbitz ™
Lớp lót sử dụng công nghệ độc quyền Iconic Crocs Comfort ™: Nhẹ. Linh hoạt. Tiện nghi 360 độ
Mã sản phẩm: 207019-410', 'Bayaband là sự kết hợp hình dáng tuyệt đẹp của Baya và tinh thần thể thao - thời trang của Crocband ™. Kết quả là một đôi giày đầy vui nhộn, cá tính cho phép những đứa trẻ của bạn tung tăng tiến về phía trước với tinh thần Crocs - luôn tự tin, thoải mái nhất!', 'CROCS-Giày Clog Trẻ Em Crocs Bayaband - Xanh Navy-876.000₫.webp', '876000.00', '1000000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(95, 3, 10, 'CROCS-Giày Clog Trẻ Em Crocs LEGO® System Classic', 'crocs-giay-clog-tre-em-crocs-lego-system-classic-95', 'Họa tiết gạch LEGO quanh đế có thể thay đổi tùy lô sản xuất, mang lại vẻ ngoài luôn mới lạ.
Phần gạch trang trí trên đế chỉ mang tính thiết kế, không thể lắp ghép được với các khối LEGO thật.
Chất liệu dễ vệ sinh, nhanh khô, lý tưởng cho bé hoạt động cả ngày.
Quai gót xoay linh hoạt giúp cố định chân chắc chắn hơn khi chạy nhảy, vận động.
Dễ dàng cá nhân hóa với các hạt trang trí Jibbitz™ để bé tự do thể hiện phong cách riêng.
Công nghệ Iconic Crocs Comfort™: siêu nhẹ, linh hoạt, êm ái 360°', 'Để bé tự do xây dựng thế giới mơ ước của mình với Giày Clog Trẻ Em Crocs LEGO® System Classic! Thiết kế Classic Clog quen thuộc được “nâng cấp” với các khối gạch LEGO chạy quanh đế, vừa ôm chân êm ái vừa khơi gợi trí tưởng tượng. Đây chính là “tác phẩm xây dựng” độc đáo cho bé những cuộc phiêu lưu bất tận, vui chơi thỏa thích và thể hiện cá tính riêng.', 'CROCS-Giày Clog Trẻ Em Crocs LEGO® System Classic - Đen-1.695.000₫.webp', '1695000.00', '1800000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(96, 3, 10, 'CROCS-Giày Clog Trẻ Em Crocs Mickey Mouse Classic', 'crocs-giay-clog-tre-em-crocs-mickey-mouse-classic-96', 'Chất liệu: Croslite™ – siêu nhẹ, êm ái
Thiết kế Classic Clog, dễ mang – dễ tháo
Họa tiết Mickey Mouse nổi bật, tạo cảm giác vui tươi
Lỗ thoáng khí giúp chân bé luôn khô ráo
Quai gót xoay linh hoạt, giúp giày ôm chân hơn
Đế chống trơn trượt, an toàn cho bé khi di chuyển
Dễ vệ sinh, nhanh khô
Mã sản phẩm: 212373-90H', 'Giày Clog Trẻ Em Crocs Mickey Mouse Classic mang chú chuột Mickey tinh nghịch đến từng bước chân của bé. Phối màu đen – đỏ nổi bật cùng quai gót vàng vui mắt, giúp bé luôn nổi bật và tràn đầy năng lượng mỗi khi ra ngoài.', 'CROCS-Giày Clog Trẻ Em Crocs Mickey Mouse Classic - Đen-1.495.000₫.webp', '1495000.00', '1800000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(97, 3, 11, 'HOKA-Giày Chạy Bộ Nữ HOKA Bondi 9 Wide', 'hoka-giay-chay-bo-nu-hoka-bondi-9-wide-97', 'Phù hợp: Chạy bộ hàng ngày, đi bộ
Cổ giày đúc 3D
Đế giữa bằng EVA siêu nhẹ và đàn hồi cao
Thân trên lưới kỹ thuật với 55% sợi polyester tái chế
Chi tiết phản quang trên thân giày
Dây kéo gót giày dài, dễ xỏ giày
Đế MetaRocker™ mượt mà
Khung ôm chân Active Foot Frame™ tập trung ở gót
Lót giày EVA đúc khuôn
Đế ngoài cao su bền Durabrasion chống mài mòn
Trọng lượng: 264 g
Độ chênh gót - mũi: 5 mm
Độ ổn định: Trung tính, đệm cân bằng đều không thêm công nghệ hỗ trợ chuyên biệt, chỉ hỗ tr', 'Giày Chạy Bộ Nữ HOKA Bondi 9 Wide là bước đột phá với đệm siêu êm ái. Một trong những đôi giày hoạt động bền bỉ nhất trong dòng HOKA, Bondi 9 mang đến trải nghiệm êm nhẹ tối đa cho mọi bước chạy hàng ngày. Được thiết kế lại toàn diện từ đế đến thân giày, tăng chiều cao đệm và sử dụng lớp đệm giữa bằng chất foam cao cấp mới, giúp tạo cảm giác mềm mại, đàn hồi đặc trưng của Bondi. Phần cổ giày đúc 3D và thân trên dệt cấu trúc với các vùng thoáng khí tăng cường, cùng lớp cao su Durabrasion bền bỉ giúp chống mài mòn ở những khu vực chịu lực nhiều.', 'HOKA-Giày Chạy Bộ Nữ HOKA Bondi 9 Wide - Hồng-2.799.300₫.webp', '2799300.00', '3000000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(98, 3, 11, 'HOKA-Giày Chạy Bộ Nữ HOKA Bondi 9 Wide', 'hoka-giay-chay-bo-nu-hoka-bondi-9-wide-98', 'Thân giày dệt kim với các vùng thoáng khí, mang lại sự thoải mái và thông thoáng.
Cổ giày đúc 3D ôm sát mắt cá chân, tăng cảm giác êm ái.
Đế giữa EVA siêu tới hạn (Super Critically Foamed EVA) cho độ mềm và độ nảy vượt trội.
Lưới kỹ thuật sử dụng 55% polyester tái chế.
Chi tiết phản quang trên thân giày tăng khả năng nhận diện.
Quai kéo gót dài giúp mang và tháo giày dễ dàng.
Công nghệ Smooth MetaRocker™ hỗ trợ chuyển động mượt mà.
Active Foot Frame™ tập trung ở phần gót, tăng độ ổn định ', 'Giày Chạy Bộ Nữ HOKA Bondi 9 là phiên bản nâng cấp toàn diện của dòng giày đệm siêu êm nổi tiếng từ HOKA, mang đến trải nghiệm mềm mại và thoải mái tối đa cho những buổi chạy hằng ngày. Được cải tiến từ trên xuống dưới với chiều cao đế tăng thêm, lớp bọt EVA siêu tới hạn mới cùng thiết kế cổ giày đúc 3D ôm sát mắt cá chân, Bondi 9 tạo nên cảm giác êm ái, đàn hồi và ổn định trong từng bước chạy. Thân giày dệt kim có các vùng thoáng khí chuyên biệt giúp tăng độ thông thoáng và độ ôm chân, trong khi đế ngoài Durabrasion Rubber gia tăng độ bền tại các khu vực chịu mài mòn cao.', 'HOKA-Giày Chạy Bộ Nữ HOKA Bondi 9 Wide - Xám-3.999.000₫.webp', '3999000.00', '4500000.00', 'active', 0, '2026-06-30 06:10:52', '2026-06-30 06:10:52'),
(99, 3, 11, 'HOKA-Giày Chạy Trail Nam HOKA Speedgoat 7 Wide', 'hoka-giay-chay-trail-nam-hoka-speedgoat-7-wide-99', 'Phù hợp hoàn hảo cho chạy địa hình và trail chuyên sâu.
Đệm giữa supercritical foam tăng hoàn trả năng lượng và độ êm vượt trội.
Thiết kế tích hợp chỗ gắn găng bọc (gaiter) giúp bảo vệ bàn chân khỏi bụi bẩn, sỏi đá.
Đế ngoài Vibram® Megagrip với lugs sâu bám dính xuất sắc trên mọi địa hình ẩm ướt, trơn trượt.
Mũi giày bằng vải co giãn, sáng tạo, ôm chân và linh hoạt tối ưu.
Chất liệu dệt RPET siêu nhẹ, thân thiện môi trường.
Lưỡi gà phẳng, khóa đôi chống trượt, tăng độ ổn định khi di chuyể', 'Bám đường siêu việt và nhạy bén trên mọi địa hình phức tạp, Speedgoat phiên bản mới tiếp tục khẳng định vị thế là người bạn đồng hành lý tưởng cho dân chạy trail. Đệm giữa SCF cải tiến giúp hoàn trả năng lượng vượt trội, tăng độ nhạy cho mỗi bước chân. Thiết kế cổ giày được tinh chỉnh ôm sát hơn, tăng khả năng bảo vệ cổ chân khỏi đất đá cũng như tối đa hóa sự thoải mái. Sở hữu công nghệ hiện đại cùng kiểu dáng đặc trưng, Speedgoat chính là lựa chọn hoàn hảo cho những ai khao khát chinh phục mọi cung đường off-road cả ngày dài.', 'HOKA-Giày Chạy Trail Nam HOKA Speedgoat 7 Wide - Nhiều Màu-4.199.000₫.webp', '4199000.00', '4500000.00', 'active', 0, '2026-06-30 06:29:28', '2026-06-30 06:29:28'),
(100, 3, 11, 'HOKA-Giày Chạy Trail Nam HOKA Transport 2 Wide', 'hoka-giay-chay-trail-nam-hoka-transport-2-wide-100', 'Thân giày làm từ 100% polyester tái chế và lưỡi gà Cordura® bền chắc, thoáng khí
Dây rút co giãn tiện lợi, mang vào nhanh chóng
Đế giữa EVA chứa 30% mía, êm nhẹ và thân thiện môi trường
Đế ngoài Vibram® EcoStep Recycle với 30% vật liệu tái chế, bám đường tốt
Lớp chống thấm không chứa PFC/PFAS, an toàn sức khỏe và môi trường
Lót và viền giày bằng 100% polyester tái chế, êm ái & nâng đỡ
Dây giày ghillie dệt từ polyester tái chế 100%
Lót giày mềm, đàn hồi, nâng niu từng bước chân
Tặng kèm t', 'Khám phá Giày Chạy Trail Nam Hoka Transport 2 Wide – đôi giày hoàn hảo cho các tín đồ dịch chuyển! Với sự nâng cấp vượt trội về độ êm ái, Transport 2 mang đến cảm giác mới mẻ nhờ lớp đệm cao, lót giày mềm mại và cổ giày êm ái hơn. Thiết kế hướng đến môi trường với đế giữa từ mía 30%, đế ngoài Vibram® EcoStep Recycle và các chi tiết tái chế, Transport 2 còn sở hữu dây rút nhanh tiện lợi, lớp chống thấm nước thân thiện và khả năng phản quang toàn diện 360 độ. Cho dù đi bộ trong thành phố hay khám phá những cung đường mòn, bạn sẽ luôn tự tin cùng Transport 2!', 'HOKA-Giày Chạy Trail Nam HOKA Transport 2 Wide - Đen-3.999.000₫.webp', '3999000.00', '4500000.00', 'active', 0, '2026-06-30 06:29:28', '2026-06-30 06:29:28'),
(101, 3, 11, 'HOKA-Giày Chạy Trail Nam HOKA Transport 2 Wide', 'hoka-giay-chay-trail-nam-hoka-transport-2-wide-101', 'Thân giày làm từ 100% polyester tái chế và lưỡi gà Cordura® bền chắc, thoáng khí
Dây rút co giãn tiện lợi, mang vào nhanh chóng
Đế giữa EVA chứa 30% mía, êm nhẹ và thân thiện môi trường
Đế ngoài Vibram® EcoStep Recycle với 30% vật liệu tái chế, bám đường tốt
Lớp chống thấm không chứa PFC/PFAS, an toàn sức khỏe và môi trường
Lót và viền giày bằng 100% polyester tái chế, êm ái & nâng đỡ
Dây giày ghillie dệt từ polyester tái chế 100%
Lót giày mềm, đàn hồi, nâng niu từng bước chân
Tặng kèm t', 'Khám phá Giày Chạy Trail Nam Hoka Transport 2 Wide – đôi giày hoàn hảo cho các tín đồ dịch chuyển! Với sự nâng cấp vượt trội về độ êm ái, Transport 2 mang đến cảm giác mới mẻ nhờ lớp đệm cao, lót giày mềm mại và cổ giày êm ái hơn. Thiết kế hướng đến môi trường với đế giữa từ mía 30%, đế ngoài Vibram® EcoStep Recycle và các chi tiết tái chế, Transport 2 còn sở hữu dây rút nhanh tiện lợi, lớp chống thấm nước thân thiện và khả năng phản quang toàn diện 360 độ. Cho dù đi bộ trong thành phố hay khám phá những cung đường mòn, bạn sẽ luôn tự tin cùng Transport 2!', 'HOKA-Giày Chạy Trail Nam HOKA Transport 2 Wide - Trắng-3.999.000₫.webp', '3999000.00', '4500000.00', 'active', 0, '2026-06-30 06:29:28', '2026-06-30 06:29:28'),
(102, 3, 1, 'NIKE-Giày Thời Trang Bé Trai Nike Court Borough Lorecraft (Ps)', 'nike-giay-thoi-trang-be-trai-nike-court-borough-lorecraft-ps-102', 'Phần mũi giày và giữa bàn chân được thiết kế rộng rãi hơn, mang đến sự thoải mái cho đôi bàn chân đang phát triển của trẻ
Dây giày co giãn tiện lợi giúp trẻ em dễ dàng tự mang và tháo giày
Rãnh Flex để tăng cường tính linh hoạt và chuyển động tự nhiên
Mã sản phẩm: DV5457-002', 'Nike Court Borough Lorecraft (PS) là đôi giày lý tưởng để đồng hành cùng những bước chân đầu tiên của trẻ. Lấy cảm hứng từ những đôi giày huyền thoại, Court Borough Lorecraft (PS) kết hợp giữa phong cách cổ điển và các chi tiết hiện đại, mang đến vẻ ngoài vừa quen thuộc vừa mới mẻ.', 'NIKE-Giày Thời Trang Bé Trai Nike Court Borough Lorecraft (Ps) - Đen-839.400₫.webp', '839400.00', '900000.00', 'active', 0, '2026-06-30 06:29:28', '2026-06-30 06:29:28'),
(103, 3, 3, 'PUMA-Giày Chạy Bộ Nam Puma Deviate Nitro Elite 4', 'puma-giay-chay-bo-nam-puma-deviate-nitro-elite-4-103', 'Tấm PWRPLATE bằng sợi carbon ổn định thân giày, tối đa chuyển hóa năng lượng cho bước chạy bùng nổ.
Đế cao su PUMAGRIP bền bỉ, bám chắc trên nhiều bề mặt cho cảm giác an toàn khi tăng tốc.
Đệm NITROFOAM™ Elite siêu nhẹ, độ nảy cao mang lại phản hồi tối ưu cho hiệu suất đỉnh cao.
Thiết kế chuyên cho chạy bộ đường nhựa, phù hợp luyện tập tốc độ và ngày thi đấu.
Form tiêu chuẩn, ôm chân thoải mái, dễ chọn size.
Dây buộc chắc chắn, dễ điều chỉnh độ ôm cho từng kiểu bàn chân.
Thân giày ULTRAWEA', 'Giày Chạy Bộ Nam Puma Deviate Nitro Elite 4 được sinh ra cho ngày đua, giúp bạn bứt tốc tự tin với đệm NITROFOAM™ ELITE siêu nhẹ, đàn hồi mạnh mẽ và tấm PWRPLATE cải tiến hỗ trợ vững chắc, đẩy bạn lao về phía trước ở mỗi sải chân.', 'PUMA-Giày Chạy Bộ Nam Puma Deviate Nitro Elite 4 - Tím-5.950.000₫.webp', '5950000.00', '6000000.00', 'active', 0, '2026-06-30 06:29:28', '2026-06-30 06:29:28');

INSERT INTO `product_variants` (`id`, `product_id`, `size_id`, `color_id`, `sku`, `price`, `discount_price`, `stock`, `image`, `is_active`, `created_at`, `updated_at`) VALUES
(6, 32, 3, 2, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit-Be', '909000.00', NULL, 18, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit - Be -909.000₫.webp', 1, '2026-07-02 10:31:56', '2026-07-02 10:31:56'),
(7, 32, 4, 3, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit-Vàng chanh', '909000.00', NULL, 15, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit - Vàng Chanh -909.000₫.webp', 1, '2026-07-02 10:31:56', '2026-07-02 10:31:56'),
(10, 38, 4, 4, 'Áo Ba Lỗ Nữ Nike Swift Dri-Fit-Xanh', '737400.00', NULL, 10, 'NIKE-Áo Ba Lỗ Chạy Bộ Nữ Nike Swift Dri-Fit - Xanh Mint-737.400₫.webp', 1, '2026-07-02 10:31:56', '2026-07-02 10:31:56'),
(53, 5, 2, 5, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers-S', '2300000.00', NULL, 10, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Đen-2.300.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(54, 5, 3, 5, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers-M', '2300000.00', NULL, 10, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Đen-2.300.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(55, 5, 4, 5, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers-L', '2300000.00', NULL, 10, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Đen-2.300.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(56, 5, 5, 5, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers-XL', '2300000.00', NULL, 10, 'ADIDAS-Áo Polo Nam Adidas Mercedes - Amg Petronas Formula 1 Team Engineers - Đen-2.300.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(57, 29, 2, 6, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis-S', '1277400.00', NULL, 20, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis - Xanh Dương-1.277.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(58, 29, 3, 6, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis-M', '1277400.00', NULL, 20, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis - Xanh Dương-1.277.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(59, 29, 4, 6, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis-L', '1277400.00', NULL, 20, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis - Xanh Dương-1.277.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(60, 29, 5, 6, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis-XL', '1277400.00', NULL, 20, 'NIKE-Áo Polo Nam Nike Court Heritage Tennis - Xanh Dương-1.277.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(61, 30, 2, 7, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile-S', '605400.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile - Hồng-605.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(62, 30, 3, 7, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile-M', '605400.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile - Hồng-605.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(63, 30, 4, 7, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile-L', '605400.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile - Hồng-605.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(64, 30, 5, 7, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile-XL', '605400.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Hyverse Dri-Fit Uv Short-Sleeve Versatile - Hồng-605.400₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(65, 31, 2, 8, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve-S', '1029000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve - Tím-1.029.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(66, 31, 3, 8, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve-M', '1029000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve - Tím-1.029.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(67, 31, 4, 8, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve-L', '1029000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve - Tím-1.029.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(68, 31, 5, 8, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve-XL', '1029000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Miler Run Energy Dri-Fit Uv-Protection Short-Sleeve - Tím-1.029.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(69, 32, 2, 5, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit-Đen-S', '909000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit - Đen-909.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(70, 32, 3, 5, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit-Đen-M', '909000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit - Đen-909.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(71, 32, 4, 5, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit-Đen-L', '909000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit - Đen-909.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(72, 32, 5, 5, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit-Đen-XL', '909000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Pro Dri-Fit - Đen-909.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(73, 33, 2, 9, 'NIKE-Áo Thun Nam Nike Sportswear Club-S', '1009000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Sportswear Club - Trắng-1.009.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(74, 33, 3, 9, 'NIKE-Áo Thun Nam Nike Sportswear Club-M', '1009000.00', NULL, 19, 'NIKE-Áo Thun Nam Nike Sportswear Club - Trắng-1.009.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 19:37:08'),
(75, 33, 4, 9, 'NIKE-Áo Thun Nam Nike Sportswear Club-L', '1009000.00', NULL, 20, 'NIKE-Áo Thun Nam Nike Sportswear Club - Trắng-1.009.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(76, 33, 5, 9, 'NIKE-Áo Thun Nam Nike Sportswear Club-XL', '1009000.00', NULL, 19, 'NIKE-Áo Thun Nam Nike Sportswear Club - Trắng-1.009.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 19:37:08'),
(77, 38, 2, 5, 'Áo Ba Lỗ Nữ Nike Swift Dri-Fit-Đen-S', '1209000.00', NULL, 20, 'NIKE-Áo Ba Lỗ Nữ Nike Swift Dri-Fit - Đen-1.209.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(78, 38, 3, 5, 'Áo Ba Lỗ Nữ Nike Swift Dri-Fit-Đen-M', '1209000.00', NULL, 20, 'NIKE-Áo Ba Lỗ Nữ Nike Swift Dri-Fit - Đen-1.209.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(79, 38, 4, 5, 'Áo Ba Lỗ Nữ Nike Swift Dri-Fit-Đen-L', '1209000.00', NULL, 20, 'NIKE-Áo Ba Lỗ Nữ Nike Swift Dri-Fit - Đen-1.209.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(80, 38, 5, 5, 'Áo Ba Lỗ Nữ Nike Swift Dri-Fit-Đen-XL', '1209000.00', NULL, 20, 'NIKE-Áo Ba Lỗ Nữ Nike Swift Dri-Fit - Đen-1.209.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(81, 39, 2, 9, 'Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip-S', '1539000.00', NULL, 12, 'NIKE-Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip - Trắng-1.539.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(82, 39, 3, 9, 'Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip-M', '1539000.00', NULL, 12, 'NIKE-Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip - Trắng-1.539.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(83, 39, 4, 9, 'Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip-L', '1539000.00', NULL, 12, 'NIKE-Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip - Trắng-1.539.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(84, 39, 5, 9, 'Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip-XL', '1539000.00', NULL, 12, 'NIKE-Áo Bra Thể Thao Nữ Nike Indy High-Support Padded Front-Zip - Trắng-1.539.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(85, 42, 2, 5, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey-S', '1769000.00', NULL, 22, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey - Đen-1.769.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(86, 42, 3, 5, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey-M', '1769000.00', NULL, 22, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey - Đen-1.769.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(87, 42, 4, 5, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey-L', '1769000.00', NULL, 22, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey - Đen-1.769.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(88, 42, 5, 5, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey-XL', '1769000.00', NULL, 22, 'NIKE-Áo Thun Nữ Nike Sportswear Oversized Jersey - Đen-1.769.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(89, 43, 2, 5, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running-S', '1429000.00', NULL, 30, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running - Đen-1.429.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(90, 43, 3, 5, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running-M', '1429000.00', NULL, 30, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running - Đen-1.429.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(91, 43, 4, 5, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running-L', '1429000.00', NULL, 30, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running - Đen-1.429.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(92, 43, 5, 5, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running-XL', '1429000.00', NULL, 30, 'NIKE-Áo Thun Nữ Nike Swift Breathe Dri-Fit Short-Sleeve Running - Đen-1.429.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(93, 44, 2, 8, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-S', '999000.00', NULL, 40, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-999.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(94, 44, 3, 8, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-M', '999000.00', NULL, 40, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-999.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(95, 44, 4, 8, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-L', '999000.00', NULL, 40, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-999.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23'),
(96, 44, 5, 8, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-XL', '999000.00', NULL, 40, 'UNDER ARMOUR-Áo Thun Nữ Under Armour Tech Mesh-999.000₫.webp', 1, '2026-07-02 03:09:23', '2026-07-02 03:09:23');

INSERT INTO `vouchers` (`id`, `code`, `title`, `description`, `discount_type`, `discount_value`, `min_order_value`, `max_discount`, `usage_limit`, `used_count`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'DYNOVANEW', 'Ưu đãi khách hàng mới', 'Giảm 100.000đ cho đơn hàng đầu tiên từ 500.000đ.', 'fixed', '100000.00', '500000.00', NULL, 200, 12, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-06-30 06:29:49', '2026-06-30 06:29:49'),
(2, 'SPORT10', 'Giảm 10% đơn thể thao', 'Giảm 10% tối đa 150.000đ cho đơn từ 700.000đ.', 'percent', '10.00', '700000.00', '150000.00', 300, 35, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-06-30 06:29:49', '2026-06-30 06:29:49'),
(3, 'FREESHIP', 'Hỗ trợ phí vận chuyển', 'Giảm 30.000đ phí vận chuyển cho đơn từ 300.000đ.', 'fixed', '30000.00', '300000.00', NULL, 500, 80, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1, '2026-06-30 06:29:49', '2026-06-30 06:29:49');

INSERT INTO `orders` (`id`, `user_id`, `voucher_id`, `order_code`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `province`, `district`, `ward`, `note`, `subtotal`, `discount_amount`, `shipping_fee`, `grand_total`, `payment_method`, `payment_status`, `status`, `created_at`, `updated_at`) VALUES
(4, 5, NULL, 'DNV260702155916PF5', 'giang', 'ngo779998@gmail.com', '0937356605', '123 abc, Phường Thủ Dầu Một, Phường Thủ Dầu Một, Thành phố Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'Phường Thủ Dầu Một', 'Phường Thủ Dầu Một', NULL, 4199000, '0.00', '0.00', '4199000.00', 'cod', 'unpaid', 'completed', '2026-07-02 08:59:16', '2026-07-02 14:23:02'),
(6, 5, NULL, 'DNV2607030205527PT', 'giang', 'ngo779998@gmail.com', '0937356605', '123 abc, Phường Thủ Dầu Một, Phường Thủ Dầu Một, Thành phố Hồ Chí Minh', 'Thành phố Hồ Chí Minh', 'Phường Thủ Dầu Một', 'Phường Thủ Dầu Một', NULL, 2018000, '0.00', '0.00', '2018000.00', 'cod', 'unpaid', 'completed', '2026-07-02 19:05:52', '2026-07-02 19:37:08');

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_variant_id`, `product_name`, `variant_name`, `size_name`, `color_name`, `sku`, `product_image`, `variant_image`, `price`, `quantity`, `total`, `created_at`, `updated_at`) VALUES
(5, 4, 99, NULL, 'HOKA-Giày Chạy Trail Nam HOKA Speedgoat 7 Wide', NULL, NULL, NULL, NULL, 'HOKA-Giày Chạy Trail Nam HOKA Speedgoat 7 Wide - Nhiều Màu-4.199.000₫.webp', NULL, '4199000.00', 1, '4199000.00', '2026-07-02 08:59:16', '2026-07-03 02:32:02'),
(8, 6, 33, 74, 'NIKE-Áo Thun Nam Nike Sportswear Club', 'Trắng / M', 'M', 'Trắng', 'NIKE-Áo Thun Nam Nike Sportswear Club-M', 'NIKE-Áo Thun Nam Nike Sportswear Club - Tím-989.000₫.webp', 'NIKE-Áo Thun Nam Nike Sportswear Club - Trắng-1.009.000₫.webp', '1009000.00', 1, '1009000.00', '2026-07-02 19:05:52', '2026-07-03 02:32:02'),
(9, 6, 33, 76, 'NIKE-Áo Thun Nam Nike Sportswear Club', 'Trắng / XL', 'XL', 'Trắng', 'NIKE-Áo Thun Nam Nike Sportswear Club-XL', 'NIKE-Áo Thun Nam Nike Sportswear Club - Tím-989.000₫.webp', 'NIKE-Áo Thun Nam Nike Sportswear Club - Trắng-1.009.000₫.webp', '1009000.00', 1, '1009000.00', '2026-07-02 19:05:52', '2026-07-03 02:32:02');

INSERT INTO `password_reset_tokens` (`email`, `token`, `created_at`) VALUES
('tronghoainguyen5@gmail.com', '$2y$12$iygLuwNXXU4cVslhWvgoVuPkiTSZiHfJ5pyJBMuPqV.Ephsmd7vo2', '2026-07-02 19:48:38');

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(21, 'App\\Models\\User', 4, 'dynova-web-token', '48d8d1e5a49beae6792f90d25e500211133b50b0e76f05c4b1a02983f2a5fef1', '["*"]', '2026-07-02 23:12:46', NULL, '2026-07-02 19:52:30', '2026-07-02 23:12:46'),
(22, 'App\\Models\\User', 5, 'dynova-web-token', '4085c951c012386a447ce1126726211d33390aa6d419408078a4b0d0819960e2', '["*"]', '2026-07-08 23:48:50', NULL, '2026-07-02 23:12:51', '2026-07-08 23:48:50');

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2026_06_30_133419_add_phone_role_to_users_table', 1),
(2, '2026_06_30_133504_create_password_reset_tokens_table', 1),
(3, '2026_06_30_134113_create_personal_access_tokens_table', 2),
(4, '2026_06_30_140420_add_name_phone_role_to_users_table', 3),
(5, '2026_07_01_081425_add_missing_columns_to_orders_table', 4),
(6, '2026_07_01_081933_add_profile_fields_to_users_table', 4),
(7, '2026_07_01_111149_create_wishlists_table', 5);

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE `roles` AUTO_INCREMENT = 3;

ALTER TABLE `users` AUTO_INCREMENT = 6;

ALTER TABLE `categories` AUTO_INCREMENT = 7;

ALTER TABLE `brands` AUTO_INCREMENT = 15;

ALTER TABLE `sizes` AUTO_INCREMENT = 6;

ALTER TABLE `colors` AUTO_INCREMENT = 10;

ALTER TABLE `products` AUTO_INCREMENT = 104;

ALTER TABLE `product_variants` AUTO_INCREMENT = 97;

ALTER TABLE `vouchers` AUTO_INCREMENT = 4;

ALTER TABLE `orders` AUTO_INCREMENT = 7;

ALTER TABLE `order_items` AUTO_INCREMENT = 10;

ALTER TABLE `personal_access_tokens` AUTO_INCREMENT = 23;

ALTER TABLE `migrations` AUTO_INCREMENT = 8;

COMMIT;
