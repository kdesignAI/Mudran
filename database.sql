
-- Comprehensive Database Schema for Mudran Sahayogi SaaS
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    status ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED') DEFAULT 'ACTIVE',
    subscription_type VARCHAR(50) DEFAULT 'TRIAL',
    expiry_date DATETIME,
    has_press_printing BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    workspace_id VARCHAR(50) PRIMARY KEY,
    software_name VARCHAR(255),
    logo_text VARCHAR(10),
    theme_color VARCHAR(20),
    logo_url TEXT,
    invoice_header TEXT,
    contact_phone VARCHAR(50),
    contact_website VARCHAR(255),
    whatsapp_templates JSON,
    whatsappGroupLink TEXT,
    facebookPageLink TEXT,
    telegramChannelLink TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(12,2) DEFAULT 0,
    unit VARCHAR(20),
    unit_price DECIMAL(12,2),
    alert_level DECIMAL(12,2),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    discount_type ENUM('PERCENTAGE', 'FIXED') DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(12,2) DEFAULT 0,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    phone VARCHAR(20),
    base_salary DECIMAL(12,2),
    joined_date DATETIME,
    role VARCHAR(50),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50),
    purchase_number VARCHAR(100),
    supplier_name VARCHAR(255),
    total_amount DECIMAL(14,2),
    paid_amount DECIMAL(14,2),
    due_amount DECIMAL(14,2),
    date DATETIME,
    due_date DATETIME,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id VARCHAR(50),
    inventory_item_id VARCHAR(50),
    name VARCHAR(255),
    quantity DECIMAL(12,2),
    unit_price DECIMAL(12,2),
    total DECIMAL(12,2),
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50),
    order_number VARCHAR(100) NOT NULL,
    customer_id VARCHAR(50),
    sub_total DECIMAL(14,2),
    discount DECIMAL(14,2),
    grand_total DECIMAL(14,2),
    paid_amount DECIMAL(14,2),
    due_amount DECIMAL(14,2),
    status VARCHAR(50),
    priority VARCHAR(20),
    press_stage VARCHAR(50),
    order_date DATETIME,
    delivery_date DATETIME,
    order_note TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    name VARCHAR(255),
    category VARCHAR(100),
    quantity DECIMAL(12,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    sqft DECIMAL(12,2),
    rate DECIMAL(12,2),
    total DECIMAL(14,2),
    paper_type VARCHAR(100),
    print_side VARCHAR(50),
    color_mode VARCHAR(50),
    design_link TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    workspace_id VARCHAR(50),
    date DATETIME,
    type ENUM('INCOME', 'EXPENSE'),
    category VARCHAR(100),
    amount DECIMAL(14,2),
    description TEXT,
    related_order_id VARCHAR(50),
    employee_id VARCHAR(50),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
