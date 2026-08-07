-- ==========================================
-- GRANITOS Database Schema
-- Author : Shreyas Sapparad
-- ==========================================

CREATE DATABASE IF NOT EXISTS granitos;

USE granitos;

-- ==========================================
-- Customer Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(255),
    gst_no VARCHAR(15)
);

-- ==========================================
-- Granite Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Granite (
    granite_id INT AUTO_INCREMENT PRIMARY KEY,
    granite_name VARCHAR(100) NOT NULL UNIQUE
);

-- ==========================================
-- Lots Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Lots (
    lot_id INT AUTO_INCREMENT PRIMARY KEY,

    granite_id INT NOT NULL,

    lot_name VARCHAR(50) NOT NULL,

    purchase_price_per_sqft DECIMAL(10,2) NOT NULL,

    total_slabs INT NOT NULL,

    available_slabs INT NOT NULL,

    total_sqft DECIMAL(10,2) NOT NULL,

    available_sqft DECIMAL(10,2) NOT NULL,

    UNIQUE (granite_id, lot_name),

    FOREIGN KEY (granite_id)
        REFERENCES Granite(granite_id)
);

-- ==========================================
-- Sales Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,

    customer_id INT NOT NULL,

    sale_date DATE NOT NULL,

    FOREIGN KEY (customer_id)
        REFERENCES Customer(customer_id)
);

-- ==========================================
-- Sale Items Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Sale_Items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,

    sale_id INT NOT NULL,

    lot_id INT NOT NULL,

    slabs_sold INT NOT NULL,

    sqft_sold DECIMAL(10,2) NOT NULL,

    selling_price_per_sqft DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (sale_id)
        REFERENCES Sales(sale_id),

    FOREIGN KEY (lot_id)
        REFERENCES Lots(lot_id)
);