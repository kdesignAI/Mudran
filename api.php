<?php
/**
 * Mudran Sahayogi Backend API v2.9
 * Optimized for Persistence, Reliability and Detailed Error Reporting
 */
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Database Configuration - Ensure these match your actual CPanel DB info
$host = "localhost";
$db_name = "khairulahsan_mudran"; 
$username = "khairulahsan_mudran";     
$password = "nEMem_kew4"; 

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    ob_end_clean();
    // Return 200 OK with error body so JS can catch it gracefully
    http_response_code(200); 
    echo json_encode(["error" => "Database Connection failed: " . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$workspace_id = $_GET['workspace_id'] ?? '';

if ($method == 'OPTIONS') {
    ob_end_clean();
    exit;
}

// Get JSON input
$raw_input = file_get_contents("php://input");
$input = json_decode($raw_input, true);

function sendJSON($data) {
    ob_end_clean();
    echo json_encode($data);
    exit;
}

function formatMySQLDate($isoDate) {
    if (!$isoDate) return null;
    return date('Y-m-d H:i:s', strtotime($isoDate));
}

switch ($action) {
    case 'ping':
        sendJSON(["status" => "online", "message" => "API is reachable", "timestamp" => time()]);
        break;

    case 'get_workspaces':
        try {
            $stmt = $conn->query("SELECT id, name, owner_name AS ownerName, owner_phone AS ownerPhone, status, subscription_type AS subscriptionType, expiry_date AS expiryDate, has_press_printing AS hasPressPrinting FROM workspaces ORDER BY created_at DESC");
            $res = $stmt->fetchAll();
            foreach ($res as &$w) {
                $w['hasPressPrinting'] = (bool)($w['hasPressPrinting'] ?? true);
            }
            sendJSON($res ?: []);
        } catch (Exception $e) {
            sendJSON(["error" => "Fetch workspaces failed: " . $e->getMessage()]);
        }
        break;

    case 'create_workspace':
        if (!$input) sendJSON(["error" => "Invalid JSON input"]);
        $conn->beginTransaction();
        try {
            $expiry = formatMySQLDate($input['expiryDate']);
            $stmt = $conn->prepare("INSERT INTO workspaces (id, name, owner_name, owner_phone, expiry_date, subscription_type, status) VALUES (:id, :name, :oname, :ophone, :expiry, :sub, :status)");
            $stmt->execute([
                ':id' => $input['id'],
                ':name' => $input['name'],
                ':oname' => $input['ownerName'],
                ':ophone' => $input['ownerPhone'],
                ':expiry' => $expiry,
                ':sub' => $input['subscriptionType'] ?? 'TRIAL',
                ':status' => 'ACTIVE'
            ]);
            
            $stmt_settings = $conn->prepare("INSERT INTO settings (workspace_id, software_name, logo_text, theme_color, whatsapp_templates) VALUES (:wid, :sname, 'M', '#0891b2', '[]')");
            $stmt_settings->execute([
                ':wid' => $input['id'],
                ':sname' => $input['name']
            ]);
            
            $conn->commit();
            sendJSON(["status" => "success"]);
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            sendJSON(["error" => "Workspace creation failed: " . $e->getMessage()]);
        }
        break;

    case 'get_all_data':
        if (!$workspace_id) sendJSON(["error" => "Workspace ID required"]);
        try {
            $data = [];
            
            // Settings
            $stmt = $conn->prepare("SELECT software_name AS softwareName, logo_text AS logoText, theme_color AS themeColor, logo_url AS logoUrl, invoice_header AS invoiceHeader, contact_phone AS contactPhone, contact_website AS contactWebsite, whatsapp_templates AS whatsappTemplates, whatsappGroupLink, facebookPageLink, telegramChannelLink FROM settings WHERE workspace_id = :wid");
            $stmt->execute([':wid' => $workspace_id]);
            $data['settings'] = $stmt->fetch();
            if ($data['settings']) {
                $data['settings']['whatsappTemplates'] = json_decode($data['settings']['whatsappTemplates'] ?: '[]', true);
            }

            // Inventory
            $stmt = $conn->prepare("SELECT id, name, category, quantity, unit, unit_price AS unitPrice, alert_level AS alertLevel FROM inventory WHERE workspace_id = :wid");
            $stmt->execute([':wid' => $workspace_id]);
            $data['inventory'] = $stmt->fetchAll() ?: [];

            // Customers
            $stmt = $conn->prepare("SELECT id, name, phone, address, discount_type AS defaultDiscountType, discount_value AS defaultDiscountValue FROM customers WHERE workspace_id = :wid");
            $stmt->execute([':wid' => $workspace_id]);
            $data['customers'] = $stmt->fetchAll() ?: [];

            // Employees
            $stmt = $conn->prepare("SELECT id, name, designation, phone, base_salary AS baseSalary, joined_date AS joinedDate, role FROM employees WHERE workspace_id = :wid");
            $stmt->execute([':wid' => $workspace_id]);
            $data['employees'] = $stmt->fetchAll() ?: [];
            
            // Orders
            $stmt = $conn->prepare("SELECT o.*, c.name as customer_name, c.phone as customer_phone FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.workspace_id = :wid ORDER BY o.order_date DESC");
            $stmt->execute([':wid' => $workspace_id]);
            $orders = $stmt->fetchAll() ?: [];
            foreach ($orders as &$order) {
                $order['orderNumber'] = $order['order_number'];
                $order['subTotal'] = (float)$order['sub_total'];
                $order['grandTotal'] = (float)$order['grand_total'];
                $order['paidAmount'] = (float)$order['paid_amount'];
                $order['dueAmount'] = (float)$order['due_amount'];
                $order['orderDate'] = $order['order_date'];
                $order['deliveryDate'] = $order['delivery_date'];
                $order['pressStage'] = $order['press_stage'];
                
                $items_stmt = $conn->prepare("SELECT id, name, category, quantity, width, height, sqft AS sqFt, rate, total, paper_type AS paperType, print_side AS printSide, color_mode AS colorMode, design_link AS designLink FROM order_items WHERE order_id = :oid");
                $items_stmt->execute([':oid' => $order['id']]);
                $order['items'] = $items_stmt->fetchAll() ?: [];
                $order['customer'] = ['id' => $order['customer_id'], 'name' => $order['customer_name'] ?: 'Unknown', 'phone' => $order['customer_phone'] ?: ''];
            }
            $data['orders'] = $orders;

            // Purchases
            $stmt = $conn->prepare("SELECT * FROM purchases WHERE workspace_id = :wid ORDER BY date DESC");
            $stmt->execute([':wid' => $workspace_id]);
            $purchases = $stmt->fetchAll() ?: [];
            foreach ($purchases as &$p) {
                $p['purchaseNumber'] = $p['purchase_number'];
                $p['totalAmount'] = (float)$p['total_amount'];
                $p['paidAmount'] = (float)$p['paid_amount'];
                $p['dueAmount'] = (float)$p['due_amount'];
                $p['supplierName'] = $p['supplier_name'];
                $p['dueDate'] = $p['due_date'];
                
                $p_items_stmt = $conn->prepare("SELECT * FROM purchase_items WHERE purchase_id = :pid");
                $p_items_stmt->execute([':pid' => $p['id']]);
                $p['items'] = $p_items_stmt->fetchAll() ?: [];
            }
            $data['purchases'] = $purchases;

            // Transactions
            $stmt = $conn->prepare("SELECT id, date, type, category, amount, description, related_order_id AS relatedOrderId, employee_id AS employeeId FROM transactions WHERE workspace_id = :wid ORDER BY date DESC");
            $stmt->execute([':wid' => $workspace_id]);
            $data['transactions'] = $stmt->fetchAll() ?: [];
            
            sendJSON($data);
        } catch (Exception $e) {
            sendJSON(["error" => "Get all data failed: " . $e->getMessage()]);
        }
        break;

    case 'save_customer':
        if (!$input) sendJSON(["error" => "No Input"]);
        try {
            $stmt = $conn->prepare("REPLACE INTO customers (id, workspace_id, name, phone, address, discount_type, discount_value) VALUES (:id, :wid, :name, :phone, :addr, :dt, :dv)");
            $stmt->execute([
                ':id' => $input['id'], 
                ':wid' => $workspace_id, 
                ':name' => $input['name'], 
                ':phone' => $input['phone'], 
                ':addr' => $input['address'] ?? '', 
                ':dt' => $input['defaultDiscountType'] ?? 'PERCENTAGE', 
                ':dv' => $input['defaultDiscountValue'] ?? 0
            ]);
            sendJSON(["status" => "success"]);
        } catch (Exception $e) { sendJSON(["error" => "Save customer failed: " . $e->getMessage()]); }
        break;

    case 'save_inventory':
        if (!$input) sendJSON(["error" => "No Input"]);
        try {
            $stmt = $conn->prepare("REPLACE INTO inventory (id, workspace_id, name, category, quantity, unit, unit_price, alert_level) VALUES (:id, :wid, :name, :cat, :qty, :unit, :price, :alert)");
            $stmt->execute([
                ':id' => $input['id'], 
                ':wid' => $workspace_id, 
                ':name' => $input['name'], 
                ':cat' => $input['category'], 
                ':qty' => $input['quantity'], 
                ':unit' => $input['unit'], 
                ':price' => $input['unitPrice'], 
                ':alert' => $input['alertLevel']
            ]);
            sendJSON(["status" => "success"]);
        } catch (Exception $e) { sendJSON(["error" => "Save inventory failed: " . $e->getMessage()]); }
        break;

    case 'save_employee':
        if (!$input) sendJSON(["error" => "No Input"]);
        try {
            $joinedDate = formatMySQLDate($input['joinedDate']);
            $stmt = $conn->prepare("REPLACE INTO employees (id, workspace_id, name, designation, phone, base_salary, joined_date, role) VALUES (:id, :wid, :name, :des, :phone, :sal, :join, :role)");
            $stmt->execute([
                ':id' => $input['id'], 
                ':wid' => $workspace_id, 
                ':name' => $input['name'], 
                ':des' => $input['designation'], 
                ':phone' => $input['phone'], 
                ':sal' => $input['baseSalary'], 
                ':join' => $joinedDate, 
                ':role' => $input['role']
            ]);
            sendJSON(["status" => "success"]);
        } catch (Exception $e) { sendJSON(["error" => "Save employee failed: " . $e->getMessage()]); }
        break;

    case 'save_purchase':
        if (!$input) sendJSON(["error" => "No Input"]);
        $conn->beginTransaction();
        try {
            $purchaseDate = formatMySQLDate($input['date']);
            $dueDate = formatMySQLDate($input['dueDate'] ?? null);
            
            $stmt = $conn->prepare("REPLACE INTO purchases (id, workspace_id, purchase_number, supplier_name, total_amount, paid_amount, due_amount, date, due_date) VALUES (:id, :wid, :num, :sup, :total, :paid, :due, :date, :ddate)");
            $stmt->execute([
                ':id' => $input['id'], 
                ':wid' => $workspace_id, 
                ':num' => $input['purchaseNumber'], 
                ':sup' => $input['supplierName'], 
                ':total' => $input['totalAmount'], 
                ':paid' => $input['paidAmount'], 
                ':due' => $input['dueAmount'], 
                ':date' => $purchaseDate, 
                ':ddate' => $dueDate
            ]);
            
            $conn->prepare("DELETE FROM purchase_items WHERE purchase_id = :id")->execute([':id' => $input['id']]);
            $item_stmt = $conn->prepare("INSERT INTO purchase_items (purchase_id, inventory_item_id, name, quantity, unit_price, total) VALUES (:pid, :iid, :name, :qty, :price, :total)");
            
            foreach ($input['items'] as $item) {
                $item_stmt->execute([
                    ':pid' => $input['id'], 
                    ':iid' => $item['inventoryItemId'], 
                    ':name' => $item['name'], 
                    ':qty' => $item['quantity'], 
                    ':price' => $item['unitPrice'], 
                    ':total' => $item['total']
                ]);
                
                $inv_upsert = $conn->prepare("INSERT INTO inventory (id, workspace_id, name, category, quantity, unit, unit_price, alert_level) 
                    VALUES (:id, :wid, :name, :cat, :qty, :unit, :price, 5) 
                    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), unit_price = VALUES(unit_price)");
                
                $inv_upsert->execute([
                    ':id' => $item['inventoryItemId'], 
                    ':wid' => $workspace_id, 
                    ':name' => $item['name'], 
                    ':cat' => $item['category'] ?? 'Raw Material', 
                    ':qty' => $item['quantity'], 
                    ':unit' => $item['unit'] ?? 'Pcs', 
                    ':price' => $item['unitPrice']
                ]);
            }
            
            if ($input['paidAmount'] > 0) {
                $tx_stmt = $conn->prepare("REPLACE INTO transactions (id, workspace_id, date, type, category, amount, description) VALUES (:id, :wid, :date, 'EXPENSE', 'Raw Materials', :amt, :des)");
                $tx_stmt->execute([
                    ':id' => 'TX-PUR-'.$input['id'],
                    ':wid' => $workspace_id,
                    ':date' => $purchaseDate,
                    ':amt' => $input['paidAmount'],
                    ':des' => 'Purchase from ' . $input['supplierName'] . ' (Inv: ' . $input['purchaseNumber'] . ')'
                ]);
            }
            
            $conn->commit();
            sendJSON(["status" => "success"]);
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            sendJSON(["error" => "Purchase save failed: " . $e->getMessage()]);
        }
        break;

    case 'save_order':
        if (!$input) sendJSON(["error" => "No Input"]);
        $conn->beginTransaction();
        try {
            if (isset($input['customer'])) {
                $c = $input['customer'];
                $stmt_c = $conn->prepare("REPLACE INTO customers (id, workspace_id, name, phone, address) VALUES (:id, :wid, :name, :phone, :addr)");
                $stmt_c->execute([':id' => $c['id'], ':wid' => $workspace_id, ':name' => $c['name'], ':phone' => $c['phone'], ':addr' => $c['address'] ?? '']);
            }
            $orderDate = formatMySQLDate($input['orderDate']);
            $deliveryDate = formatMySQLDate($input['deliveryDate']);
            
            $stmt = $conn->prepare("REPLACE INTO orders (id, workspace_id, order_number, customer_id, sub_total, discount, grand_total, paid_amount, due_amount, status, priority, press_stage, order_date, delivery_date, order_note) VALUES (:id, :wid, :num, :cid, :st, :disc, :gt, :paid, :due, :status, :pri, :stage, :odate, :ddate, :note)");
            $stmt->execute([
                ':id' => $input['id'], 
                ':wid' => $workspace_id, 
                ':num' => $input['orderNumber'], 
                ':cid' => $input['customer']['id'], 
                ':st' => $input['subTotal'], 
                ':disc' => $input['discount'], 
                ':gt' => $input['grandTotal'], 
                ':paid' => $input['paidAmount'], 
                ':due' => $input['dueAmount'], 
                ':status' => $input['status'], 
                ':pri' => $input['priority'] ?? 'NORMAL', 
                ':stage' => $input['pressStage'] ?? 'PLATE', 
                ':odate' => $orderDate, 
                ':ddate' => $deliveryDate, 
                ':note' => $input['orderNote'] ?? null
            ]);
            
            $conn->prepare("DELETE FROM order_items WHERE order_id = :id")->execute([':id' => $input['id']]);
            $item_stmt = $conn->prepare("INSERT INTO order_items (id, order_id, name, category, quantity, width, height, sqft, rate, total, paper_type, print_side, color_mode, design_link) VALUES (:id, :oid, :name, :cat, :qty, :w, :h, :sq, :rate, :total, :pt, :ps, :cm, :dl)");
            foreach ($input['items'] as $item) {
                $item_stmt->execute([
                    ':id' => $item['id'], 
                    ':oid' => $input['id'], 
                    ':name' => $item['name'], 
                    ':cat' => $item['category'], 
                    ':qty' => $item['quantity'], 
                    ':w' => $item['width'] ?? 0, 
                    ':h' => $item['height'] ?? 0, 
                    ':sq' => $item['sqFt'] ?? 0, 
                    ':rate' => $item['rate'], 
                    ':total' => $item['total'], 
                    ':pt' => $item['paperType'] ?? null, 
                    ':ps' => $item['printSide'] ?? null, 
                    ':cm' => $item['colorMode'] ?? null, 
                    ':dl' => $item['designLink'] ?? null
                ]);
            }
            $conn->commit();
            sendJSON(["status" => "success"]);
        } catch (Exception $e) {
            if ($conn->inTransaction()) $conn->rollBack();
            sendJSON(["error" => "Order save failed: " . $e->getMessage()]);
        }
        break;

    case 'save_transaction':
        if (!$input) sendJSON(["error" => "No Input"]);
        try {
            $txDate = formatMySQLDate($input['date']);
            $stmt = $conn->prepare("REPLACE INTO transactions (id, workspace_id, date, type, category, amount, description, related_order_id, employee_id) VALUES (:id, :wid, :date, :type, :cat, :amt, :des, :roid, :eid)");
            $stmt->execute([
                ':id' => $input['id'], 
                ':wid' => $workspace_id, 
                ':date' => $txDate, 
                ':type' => $input['type'], 
                ':cat' => $input['category'], 
                ':amt' => $input['amount'], 
                ':des' => $input['description'], 
                ':roid' => $input['relatedOrderId'] ?? null,
                ':eid' => $input['employeeId'] ?? null
            ]);
            sendJSON(["status" => "success"]);
        } catch (Exception $e) { sendJSON(["error" => "Save transaction failed: " . $e->getMessage()]); }
        break;

    case 'save_settings':
        if (!$input) sendJSON(["error" => "No Input"]);
        try {
            $stmt = $conn->prepare("REPLACE INTO settings (workspace_id, software_name, logo_text, theme_color, logo_url, invoice_header, contact_phone, contact_website, whatsapp_templates, whatsappGroupLink, facebookPageLink, telegramChannelLink) VALUES (:wid, :name, :logo, :color, :lurl, :hdr, :phone, :web, :wts, :wgl, :fb, :tg)");
            $stmt->execute([
                ':wid' => $workspace_id,
                ':name' => $input['softwareName'],
                ':logo' => $input['logoText'],
                ':color' => $input['themeColor'],
                ':lurl' => $input['logoUrl'] ?? '',
                ':hdr' => $input['invoiceHeader'] ?? '',
                ':phone' => $input['contactPhone'] ?? '',
                ':web' => $input['contactWebsite'] ?? '',
                ':wts' => json_encode($input['whatsappTemplates'] ?? []),
                ':wgl' => $input['whatsappGroupLink'] ?? '',
                ':fb' => $input['facebookPageLink'] ?? '',
                ':tg' => $input['telegramChannelLink'] ?? ''
            ]);
            sendJSON(["status" => "success"]);
        } catch (Exception $e) { sendJSON(["error" => "Save settings failed: " . $e->getMessage()]); }
        break;

    default:
        sendJSON(["error" => "Unknown Action: " . $action]);
}
