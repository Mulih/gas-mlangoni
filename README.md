# Gas Mlangoni — Backend

Lightweight backend service for Gas Mlangoni — an LPG (cylinder) ordering platform. Built with TypeScript, Express and Prisma (Postgres). This README focuses on the backend/service layer found in `backend/`.

## Highlights
- TypeScript + Express API
Install dependencies
bash
npm install
# or
pnpm install
Create a .env file in backend/ with your database URL:
env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
Generate Prisma client & run migrations (dev)
bash
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate dev --schema=./prisma/schema.prisma
Start the dev server
bash
npm run dev

Database models (summary)

See prisma/schema.prisma. Key models:

Customer
id (uuid), phone (unique), name?, createdAt
relations: addresses[], orders[]
Address
id, customerId (FK), estateName, gpsLat, gpsLng
index: customerId
Vendor
id, businessName, epraPermitNumber?, permitStatus (enum), permitExpiry?, createdAt
relations: inventory[], orders[]
CylinderPrice
id, brand, size, price (Decimal)
unique(brand, size)
InventoryStock
id, vendorId, brand, size, quantity
Rider
id, name, phone (unique), status (enum)
Order
id, customerId, vendorId, riderId?, status (enum), deliveryMode, totalAmount (Decimal), timestamps
Enums: PermitStatus, RiderStatus, OrderStatus

Notes:

Many fields map to snake_case in the DB via @map() in the Prisma schema.
Enums are persisted in DB; changing enum value names requires migrations and caution.
Validation

Validation middleware (src/middleware/validate.ts) uses Zod:

Use validate(schema) as middleware in routes.
On validation failure the middleware returns 400 with flattened error details.
Schemas live alongside their modules, e.g. src/modules/cylinderPrices/cylinderPricesSchema.ts.
Important routes (examples)

(Use the actual server host/port your app runs on, e.g. http://localhost:3000)

Create customer

POST /customers
Body:
JSON
{
  "phone": "+254712345678",
  "name": "Alice"
}
Success: 201, returns created customer object
Get customer with addresses

GET /customers/:customerId
Example: GET /customers/11111111-2222-3333-4444-555555555555
Success: 200, returns customer including addresses
Add address for customer

POST /customers/:customerId/addresses
Body:
JSON
{
  "estateName": "Kentan Estates",
  "gpsLat": -1.2921,
  "gpsLng": 36.8219
}
Success: 201, returns created address
Set platform cylinder price

POST /cylinder-prices
Body validated by Zod:
JSON
{
  "brand": "BrandA",
  "size": "6kg",
  "price": 15.50
}
Success: 200/201 depending on implementation, sets or updates price record
Curl examples:

bash
# create a customer
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{"phone":"+254712345678","name":"Alice"}'

# add an address
curl -X POST http://localhost:3000/customers/<CUSTOMER_ID>/addresses \
  -H "Content-Type: application/json" \
  -d '{"estateName":"Kentan Estates","gpsLat":-1.2921,"gpsLng":36.8219}'

# set cylinder price
curl -X POST http://localhost:3000/cylinder-prices \
  -H "Content-Type: application/json" \
  -d '{"brand":"BrandA","size":"6kg","price":15.50}'
Development notes & best practices

Do not edit generated Prisma client files under src/generated/prisma.
Keep Prisma schema changes in prisma/schema.prisma and run prisma migrate when changing schema.
Use the Zod schemas in each module and validate() middleware for consistent validation and error responses.
DB columns are often mapped to snake_case to produce predictable SQL column names; check the Prisma schema when writing raw queries or migrations.
Be careful when changing enum values — these affect DB enum types.
Testing

Add tests (unit/integration) as needed. If you add test scripts, document them here.
Consider using a test database or an in-memory DB during CI.
Scripts

Check package.json inside backend/ for scripts such as:

dev — run the server in development (watch mode)
build — compile TypeScript
start — run compiled build
prisma commands: npx prisma generate / npx prisma migrate
Contributing

Fork and create a branch
Implement changes and add tests
Run migrations (if any) and update Prisma schema
Open a PR with a clear description
License

