# Small Production-Ready System Design Practice Plans

These projects follow the same style as `eventflow-app`: a NestJS monorepo with an API gateway, auth service, one focused domain service, shared libraries, Drizzle/Postgres, Kafka, and notifications.

Small means each project has only one core workflow. Production-ready means the workflow is designed with validation, ownership, constraints, transactions, observability, and tests.

## Common Architecture

```text
Client
  |
  v
api-gateway
  |---- HTTP ----> auth-service
  |---- HTTP ----> domain-service

auth-service/domain-service
  |---- Drizzle ----> Postgres
  |---- Kafka ------> Kafka topics

notifications-service
  |---- consumes Kafka topics
  |---- sends email through MailHog locally
```

## Common Repo Structure

```text
apps/
  api-gateway/
  auth-service/
  domain-service/
  notifications-service/
libs/
  common/
  database/
  kafka/
drizzle/
docker-compose.yaml
```

## Common Production Standards

- Use DTO validation with `class-validator`.
- Use JWT guards for private routes.
- Use roles only where they are meaningful.
- Never trust user ID, ownership, totals, status, or price from the client.
- Use Postgres foreign keys, unique constraints, indexes, and enums.
- Use transactions when one workflow changes multiple rows.
- Emit Kafka events only after the database write succeeds.
- Include `eventId`, `schemaVersion`, `occurredAt`, and entity IDs in event payloads.
- Make notification consumers idempotent.
- Add `GET /health` to every app.
- Log workflow actions and failures with Nest `Logger`.
- Add unit tests for business rules.
- Add one e2e test for the main workflow through the gateway.

---

## Project 2: MiniOrders

### 1. System Goal

MiniOrders is a small ordering system. Admins create menu items, users create orders from available items, and users pay for their own orders.

### 2. Actors

- `Admin`: creates menu items.
- `Customer`: creates and pays orders.
- `Notifications Service`: sends order and payment emails.

### 3. Functional Requirements

- Users can register and login.
- Admin can create menu items.
- Customers can list available menu items.
- Customers can create an order with item quantities.
- System calculates order total from database prices.
- Customers can pay their own pending orders.
- Customers can view their own orders.
- System sends email notifications for order created and order paid.

### 4. Non-Functional Requirements

- Order creation must be transactional.
- Order creation must be idempotent.
- Client cannot control prices or totals.
- Paid orders cannot be paid twice.

### 5. Services

```text
apps/
  api-gateway/
  auth-service/
  orders-service/
  notifications-service/
```

`api-gateway`

- Exposes menu and order routes.
- Requires JWT for order actions.
- Passes `Idempotency-Key` to orders service for order creation.

`auth-service`

- Owns registration, login, password hashing, and JWT creation.
- Emits `user.registered`.

`orders-service`

- Owns menu items, orders, and order items.
- Calculates totals from database prices.
- Uses transactions for order creation.
- Emits `order.created` and `order.paid`.

`notifications-service`

- Consumes user and order events.
- Sends local emails through MailHog.

### 6. Data Model

`users`

- `id`
- `email`, unique
- `password`
- `name`
- `role`: `ADMIN` or `CUSTOMER`
- `createdAt`
- `updatedAt`

`menu_items`

- `id`
- `name`
- `description`
- `price`
- `available`
- `createdAt`
- `updatedAt`

`orders`

- `id`
- `userId`
- `status`: `PENDING`, `PAID`, `CANCELLED`
- `totalPrice`
- `idempotencyKey`
- `createdAt`
- `updatedAt`

`order_items`

- `id`
- `orderId`
- `menuItemId`
- `quantity`
- `unitPrice`
- `subtotal`

Important constraints:

- `orders.userId` references `users.id`.
- `order_items.orderId` references `orders.id`.
- `order_items.menuItemId` references `menu_items.id`.
- Unique index on `orders.userId + orders.idempotencyKey`.

### 7. API Design

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`

Menu:

- `POST /menu-items`
- `GET /menu-items`

Orders:

- `POST /orders`
- `GET /orders/my-orders`
- `GET /orders/:id`
- `POST /orders/:id/pay`

`POST /orders` should require:

- JWT token
- `Idempotency-Key` header
- item list with `menuItemId` and `quantity`

### 8. Event Design

`user.registered`

- `eventId`
- `schemaVersion`
- `occurredAt`
- `userId`
- `email`
- `name`

`order.created`

- `eventId`
- `schemaVersion`
- `occurredAt`
- `orderId`
- `userId`
- `totalPrice`
- `itemCount`

`order.paid`

- `eventId`
- `schemaVersion`
- `occurredAt`
- `orderId`
- `userId`
- `totalPrice`

### 9. Main Workflow

Create order:

1. Customer calls `POST /orders` with `Idempotency-Key`.
2. Gateway validates JWT and forwards user context.
3. Orders service checks whether the same key was already used by this user.
4. If already used, return the existing order.
5. Orders service fetches menu item prices from database.
6. Orders service rejects unavailable items.
7. In one transaction, create `orders` and `order_items`.
8. Orders service emits `order.created`.
9. Notifications service sends order confirmation email.

Pay order:

1. Customer calls `POST /orders/:id/pay`.
2. Orders service checks the order belongs to the user.
3. Orders service rejects orders not in `PENDING`.
4. Orders service updates order status to `PAID`.
5. Orders service emits `order.paid`.

### 10. Failure Cases

- Missing `Idempotency-Key` returns `400 Bad Request`.
- Unavailable menu item returns `400 Bad Request`.
- Paying someone else's order returns `403 Forbidden`.
- Paying an already paid order returns `409 Conflict`.
- Duplicate order request with same idempotency key returns existing order.

### 11. Tests

- Order total is calculated from stored prices.
- Order creation creates order and items in one transaction.
- Duplicate idempotency key does not create duplicate order.
- User cannot read another user's order.
- Paid order cannot be paid again.
- Order paid emits event.

---

### 9. Main Workflow

Book appointment:

1. Patient calls `POST /appointments/book`.
2. Gateway validates JWT and forwards `x-user-id`.
3. Appointments service checks slot exists and status is `OPEN`.
4. In one transaction, update slot to `BOOKED` and create appointment.
5. Unique constraint prevents two active appointments for one slot.
6. Appointments service emits `appointment.booked`.
7. Notifications service sends booking email.

Cancel appointment:

1. Patient calls `POST /appointments/:id/cancel`.
2. Appointments service checks appointment belongs to the user.
3. Appointments service rejects already cancelled appointment.
4. In one transaction, update appointment to `CANCELLED` and slot to `OPEN`.
5. Appointments service emits `appointment.cancelled`.

### 10. Failure Cases

- Booking a booked slot returns `409 Conflict`.
- Booking a cancelled slot returns `400 Bad Request`.
- Cancelling another user's appointment returns `403 Forbidden`.
- Cancelling an already cancelled appointment returns `409 Conflict`.
- Invalid page or limit returns `400 Bad Request`.

### 11. Tests

- Patient can book open slot.
- Two users cannot book the same slot.
- Booking updates slot status.
- Cancellation reopens slot.
- Patient cannot cancel another patient's appointment.
- Booking emits event.

---

## Suggested Build Order

1. `MiniOrders`: transactions, calculated totals, and idempotency.

## Final Done Criteria For Each Project

- `pnpm run build` passes.
- `pnpm run lint` passes.
- `pnpm run test` passes.
- Auth uses hashed passwords and JWT.
- API gateway validates DTOs and protects private routes.
- Domain service enforces ownership and business rules.
- Database schema includes enums, foreign keys, indexes, and unique constraints.
- Main workflow has tests for success, forbidden, conflict, and invalid input.
- Kafka events are emitted for the main workflow.
- Notifications service consumes events safely.
- Every app has `GET /health`.
- README includes setup commands, `.env.example`, routes, and event examples.
