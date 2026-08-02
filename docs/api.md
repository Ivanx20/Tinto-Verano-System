# API REST

Formato estándar de respuesta:

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Mensaje seguro para el usuario",
  "errors": []
}
```

## Endpoints principales

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### Users
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Roles
- `GET /api/roles`
- `POST /api/roles`
- `PUT /api/roles/:id`
- `DELETE /api/roles/:id`

### Products
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Customers
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

### Sales
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/sales/:id`
- `POST /api/sales/:id/cancel`

### Tables
- `GET /api/tables`
- `POST /api/tables`
- `PUT /api/tables/:id`
- `PATCH /api/tables/:id/status`

### Orders
- `GET /api/orders`
- `POST /api/orders`
- `PUT /api/orders/:id`
- `DELETE /api/orders/:id`
- `PATCH /api/orders/:id/status`

### Inventory
- `GET /api/inventory`
- `POST /api/inventory`
- `GET /api/inventory/:id`
- `PUT /api/inventory/:id`
- `DELETE /api/inventory/:id`
- `GET /api/inventory/kardex/:itemId`
- `GET /api/inventory/movements`
- `POST /api/inventory/movements`

### Purchases
- `GET /api/purchases`
- `POST /api/purchases`
- `GET /api/purchases/:id`

### Cash
- `POST /api/cash/open`
- `POST /api/cash/close`
- `GET /api/cash/current`
- `POST /api/cash/movements`

### Reports
- `GET /api/reports/dashboard`
- `GET /api/reports/sales`
- `GET /api/reports/products`
- `GET /api/reports/inventory`
- `GET /api/reports/cash`
- `GET /api/reports/accounts-receivable`
- `GET /api/reports/accounts-payable`

### Settings
- `GET /api/settings`
- `POST /api/settings`
- `PUT /api/settings/:id`

### Audit
- `GET /api/audit-logs`
