-- ==========================================
-- GRANITOS Database Schema
-- Author : Shreyas Sapparad
-- Consolidated schema through the Returns +
-- Commission/Loading/Refund checkpoint.
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
    purchase_date DATE NOT NULL,
    purchase_price_per_sqft DECIMAL(10,2) NOT NULL,
    total_slabs INT NOT NULL,
    available_slabs INT NOT NULL,
    total_sqft DECIMAL(10,2) NOT NULL,
    available_sqft DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (granite_id, lot_number),
    FOREIGN KEY (granite_id) REFERENCES Granite(granite_id)
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
    commission DECIMAL(10,2) NULL,
    loading_charge DECIMAL(10,2) NULL,
    loading_paid BOOLEAN NOT NULL DEFAULT FALSE,
    loading_paid_date DATE NULL,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
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
    FOREIGN KEY (sale_id) REFERENCES Sale(sale_id),
    FOREIGN KEY (lot_id) REFERENCES Lot(lot_id)
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
    FOREIGN KEY (sale_id) REFERENCES Sale(sale_id)
);

-- ==========================================
-- Settings Table (single row, setting_id = 1)
-- ==========================================

CREATE TABLE IF NOT EXISTS Settings (
    setting_id INT PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL DEFAULT 'GRANITOS',
    business_address VARCHAR(255),
    business_phone VARCHAR(20),
    business_email VARCHAR(100),
    gst_number VARCHAR(20),
    invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'INV-',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₹'
);

INSERT IGNORE INTO Settings (setting_id) VALUES (1);

-- ==========================================
-- Sale Return Table
-- ==========================================

CREATE TABLE IF NOT EXISTS Sale_Return (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_item_id INT NOT NULL,
    return_date DATE NOT NULL,
    sqft_returned DECIMAL(10,2) NOT NULL,
    slabs_returned INT NOT NULL,
    deduction_percent DECIMAL(5,2) NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    remarks VARCHAR(255),
    FOREIGN KEY (sale_item_id) REFERENCES Sale_Item(sale_item_id)
);

-- ==========================================
-- Refund Table
-- (only exists for returns that were paid
-- out immediately, in cash/UPI/transfer)
-- ==========================================

CREATE TABLE IF NOT EXISTS Refund (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT NOT NULL,
    refund_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    refund_method ENUM('CASH', 'UPI', 'BANK_TRANSFER') NOT NULL,
    remarks VARCHAR(255),
    FOREIGN KEY (return_id) REFERENCES Sale_Return(return_id)
);