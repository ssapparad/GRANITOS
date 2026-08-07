-- ==========================================
-- GRANITOS Database Schema
-- Author : Shreyas Sapparad
-- Rewritten to match actual table/column names
-- used by the working application code.
-- ==========================================

CREATE DATABASE IF NOT EXISTS granitos;

USE granitos;

-- ==========================================
-- Customer Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,

    customer_name VARCHAR(100) NOT NULL,

    phone VARCHAR(15),

    address VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==========================================
-- Granite Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Granite (
    granite_id INT AUTO_INCREMENT PRIMARY KEY,

    granite_name VARCHAR(100) NOT NULL UNIQUE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ==========================================
-- Lot Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Lot (
    lot_id INT AUTO_INCREMENT PRIMARY KEY,

    granite_id INT NOT NULL,

    lot_number VARCHAR(50) NOT NULL,

    purchase_price_per_sqft DECIMAL(10,2) NOT NULL,

    total_slabs INT NOT NULL,
    available_slabs INT NOT NULL,

    total_sqft DECIMAL(10,2) NOT NULL,
    available_sqft DECIMAL(10,2) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (granite_id, lot_number),

    FOREIGN KEY (granite_id)
        REFERENCES Granite(granite_id)
);

-- ==========================================
-- Sale Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Sale (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,

    invoice_no VARCHAR(50) NOT NULL UNIQUE,

    customer_id INT NOT NULL,

    sale_date DATE NOT NULL,

    remarks VARCHAR(255),

    FOREIGN KEY (customer_id)
        REFERENCES Customer(customer_id)
);

-- ==========================================
-- Sale Item Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Sale_Item (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,

    sale_id INT NOT NULL,

    lot_id INT NOT NULL,

    slabs_sold INT NOT NULL,

    sqft_sold DECIMAL(10,2) NOT NULL,

    negotiated_rate_per_sqft DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (sale_id)
        REFERENCES Sale(sale_id),

    FOREIGN KEY (lot_id)
        REFERENCES Lot(lot_id)
);

-- ==========================================
-- Payment Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,

    sale_id INT NOT NULL,

    payment_date DATE NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    payment_method ENUM('CASH', 'UPI', 'BANK_TRANSFER') NOT NULL,

    remarks VARCHAR(255),

    FOREIGN KEY (sale_id)
        REFERENCES Sale(sale_id)
);