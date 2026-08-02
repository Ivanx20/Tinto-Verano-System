# Base de datos

El modelo usa PostgreSQL y Prisma ORM. Las tablas principales tienen campos de auditoría:

- `createdAt`
- `updatedAt`
- `deletedAt`
- `isActive`

Las operaciones de ventas, compras, pagos e inventario deben ejecutarse dentro de transacciones.

## Tablas principales

- users, roles, permissions, user_roles, role_permissions
- customers, suppliers
- product_categories, products, product_variants
- ingredients, recipes
- inventory_items, warehouses, inventory_movements
- purchases, purchase_details
- sales, sale_details, payments
- restaurant_tables, orders, order_items
- cash_registers, cash_movements
- accounts_receivable, accounts_receivable_payments
- accounts_payable, accounts_payable_payments
- reservations, promotions, invoices, company_settings, audit_logs, refresh_tokens
