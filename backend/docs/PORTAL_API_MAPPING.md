# Portal → API → Model Mapping

This document is the "Step 1: Data Entry (Completing the Portals)"
deliverable: it lists every B2B portal screen, the endpoint that backs
it, which models it reads/writes, and which roles may call it. The
same data lives in code at `backend/config/portalPermissions.js` —
treat that file as the source of truth and this document as its
human-readable mirror.

## Authentication

All four endpoints below sit behind the RBAC system
(`backend/middleware/rbacAuth.js`), not the main customer-facing auth
system. Callers must send:

```
Authorization: Bearer <rbac-jwt>
```

obtained from `POST /api/auth/admin/login`, `/api/auth/manager/login`,
or `/api/auth/staff/login` (see `backend/controllers/rbacAuthController.js`).

## Roles

| Role | Issued by | Notes |
|---|---|---|
| `admin` | Admin login (hardcoded credentials, see `rbacAuthController.adminLogin`) | Full access to every portal. |
| `manager` | Manager login, backed by the `managers` Mongo collection | Full access to every portal. |
| `staff` | Staff login, backed by the `staff` Mongo collection | Department-aware (see Step 5). No contract pricing. |
| `dealer` | *Not wired to a login screen yet* | Can place bulk orders. **Cannot** view contract pricing. |
| `dealer_contract` | *Not wired to a login screen yet* | Can place bulk orders **and** view contract pricing. |

`dealer` / `dealer_contract` are recognized by the permission matrix and
fully covered by tests, but there's no dealer signup/login flow built
yet — see "Follow-ups" at the bottom.

## Portal Mapping Table

| Portal | Endpoint | Models Used | Allowed Roles | Controller |
|---|---|---|---|---|
| Bulk Order Portal | `POST /api/bulk-order` | `Order`, `OrderItem`, `Product` | admin, manager, staff, dealer, dealer_contract | `orderController.createBulkOrder` |
| Contract Pricing screen | `GET /api/contract-pricing/:customerId` | `Customer`, `Product`, `Order` | admin, manager, dealer_contract | `contractPricingController.getContractPricing` |
| Cleaning Kit bundle preview | `GET /api/facility-bundle/preview` | `Product` | admin, manager, staff, dealer, dealer_contract | `productController.previewFacilityBundle` |
| Role-aware dashboard queue | `GET /api/rbac-dashboard/my-queue` | `Order` | admin, manager, staff | `dashboardController.getRoleBasedQueue` |
| Order action history | `GET /api/rbac-dashboard/orders/:orderId/history` | `Order`, `AuditLog` | admin, manager, staff | `dashboardController.getOrderActionHistory` |

## Validation rule worked example: Dealer vs. Contract Pricing

`config/portalPermissions.js` deliberately excludes the plain `dealer`
role from `PORTALS.CONTRACT_PRICING.allowedRoles`. `rbacAuth.authorizePortal('CONTRACT_PRICING')`
enforces this:

- `dealer` token → `403 Forbidden`, with a message telling them they
  need their account upgraded to `dealer_contract`.
- `dealer_contract` / `manager` / `admin` token → `200 OK`.

This is enforced centrally in the middleware, not duplicated per-route,
so the rule can't drift between portals that both gate on
"is this a contract customer."

## Request/response examples

### `POST /api/bulk-order`
```json
// Request
{
  "customer_name": "Acme Corp",
  "customer_id": 7,
  "package_name": "Bulk Order",
  "items": [
    { "product_id": 1, "quantity": 50 },
    { "product_id": 4, "quantity": 20 }
  ]
}

// Response (201)
{
  "message": "Bulk order created successfully",
  "order": { "order_id": 55, "customer_name": "Acme Corp", "amount": 17500, ... },
  "items": [ ... ]
}
```

### `GET /api/contract-pricing/7`
```json
{
  "customer": { "customer_id": 7, "name": "Acme Corp", "company": "Acme" },
  "pricingTier": "Gold",
  "discountPercent": 15,
  "lifetimeSpend": 62000,
  "orderCount": 14,
  "catalog": [
    { "product_id": 1, "name": "Floor Cleaner", "listPrice": 250, "contractPrice": 212.5, "discountPercent": 15 }
  ]
}
```

### `GET /api/facility-bundle/preview?facility_type=Hospital&facility_size=Medium`
```json
{
  "message": "Facility bundle preview generated successfully",
  "bundle": {
    "facilityType": "Healthcare",
    "facilitySize": "Medium",
    "items": [
      { "product_id": 5, "name": "Sanitizer", "category": "Hand Care", "price": 150, "quantity": 5, "subtotal": 750 },
      { "product_id": 1, "name": "Floor Cleaner", "category": "Cleaning Liquid", "price": 250, "quantity": 5, "subtotal": 1250 }
    ],
    "totalAmount": 2150,
    "totalQuantity": 10
  }
}
```

## Follow-ups (out of scope for this change)

- Build an actual Dealer signup/login flow (model + controller + UI)
  so `dealer` / `dealer_contract` tokens are issued by something other
  than a manual JWT.
- Run `npm run setup-db` against a live MySQL instance to add the
  `actor_label` / `entity_type` / `entity_id` columns to `audit_logs`
  (see `backend/scripts/updateSchema.js`). Until that's run,
  `AuditLog.create()` automatically falls back to the legacy 4-column
  insert, so nothing breaks — but per-order action history
  (`GET /api/rbac-dashboard/orders/:id/history`) will be empty.
