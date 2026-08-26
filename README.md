# Gas Mlangoni — Mobile Application & Operational Engine

[![EPRA Compliant](https://img.shields.io/badge/Regulatory-EPRA%20Compliant-green.svg)](https://www.epra.go.ke/)
[![ODPC Protection](https://img.shields.io/badge/Data%20Privacy-ODPC%20Act%202019-blue.svg)](https://www.odpc.go.ke/)
[![Payment Engine](https://img.shields.io/badge/Payment-Safaricom%20Daraja%20M--Pesa-brightgreen.svg)](https://developer.safaricom.co.ke/)
[![Spatial Index](https://img.shields.io/badge/Spatial%20Analytics-Uber%20H3%20Hexagonal-orange.svg)](https://h3geo.org/)
[![Platforms](https://img.shields.io/badge/Platforms-iOS%20%7C%20Android%20%7C%20M--Pesa%20Mini--App-lightgrey.svg)]()

> **Asset-Light LPG Delivery Marketplace, Safety Escrow & Spatial Analytics Platform for Kenya.**

Gas Mlangoni connects end consumers (households and B2B commercial entities) with licensed independent LPG dealers and petrol station forecourts across Kenya (**Nairobi, Mombasa, Nakuru, Eldoret, Kisumu**). The platform ensures 100% compliance with EPRA mutual exchange regulations, guarantees accurate gas weight through doorstep digital scale audits, and monetizes anonymized spatial consumption analytics via Uber H3 hexagonal indexing.

---

## 📋 Table of Contents
1. [Key Pillars & Core Architecture](#-key-pillars--core-architecture)
2. [10-Step End-to-End Operational Workflow](#-10-step-end-to-end-operational-workflow)
3. [Data Flow Diagrams (DFD)](#-data-flow-diagrams-dfd)
   - [DFD Level 1: System Overview](#dfd-level-1-system-overview)
   - [DFD Level 2: Detailed Process Deconstruction](#dfd-level-2-detailed-process-deconstruction)
4. [Governance & Regulatory Compliance Stack](#-governance--regulatory-compliance-stack)
5. [Data Store Schema Specifications](#-data-store-schema-specifications)
6. [API & Integration Interfaces](#-api--integration-interfaces)
7. [Deployment & Operations](#-deployment--operations)

---

## 🏛️ Key Pillars & Core Architecture

Gas Mlangoni is built on four core operational pillars designed to standardize and secure liquid petroleum gas (LPG) distribution in urban and suburban East Africa:

| Pillar | Operational Mechanism | Technical Implementation |
| :--- | :--- | :--- |
| **EPRA Cylinder Exchange Engine** | Enforces Kenya Energy and Petroleum Regulatory Authority rules. Matches refills strictly to brand-matched empty cylinders or authorized cross-brand exchange fees. | Algorithmic brand inventory matching engine integrated into catalog query filters (`K-Gas`, `Rubis`, `TotalEnergies`, `Progas`, etc.). |
| **Escrow-Backed M-Pesa Payments** | Funds are authorized via Safaricom Daraja STK Push and held in escrow until doorstep physical verification. | Automated escrow hold ledger; instant B2C split remittance to vendor and rider M-Pesa Tills upon delivery OTP validation. |
| **Doorstep Weight Verification** | Delivery riders perform a mandatory 3-point audit using Class III digital scales before funds release. | Bluetooth/IoT and manual scale reading input verified against tare + net gas target weight ($\pm 50	ext{g}$ tolerance). |
| **H3 Spatial Data Monetization** | Aggregates demand telemetry into Uber H3 hexagonal grids for OMC (Oil Marketing Company) market analytics. | Pipeline converting delivery coordinates into H3 Resolution-8 spatial cells with $k$-anonymity ($k \ge 50$) exported as GeoParquet files. |

---

## 🔄 10-Step End-to-End Operational Workflow

```
[ Customer ] ──► (1. Registration) ──► (2. Browse Catalog) ──► (3. Place Order)
                                                                    │
[ Escrow Ledger ] ◄── (6. Escrow Hold) ◄── (5. Dispatch Rider) ◄── (4. Order Lock)
        │
        ▼
[ Doorstep ] ──► (7. 3-Point Weight Audit) ──► (8. Loyalty Credit) ──► (10. H3 GeoParquet)
                                  │
                          (9. Safety Center)
```

### Step 1: Customer Registration & Cylinder Profiling
* **Auth Layer:** Registration via phone number with Safaricom M-Pesa OTP verification.
* **Profile Setup:** User configures delivery address metadata (Estate Name, Apartment/House Number, precise GPS Geofence Pin).
* **Inventory Registration:** Primary cylinder brand(s) logged (e.g., *13kg K-Gas*, *6kg Progas*) to automate compliant brand-matching during checkout.

### Step 2: Dynamic Catalog Browsing & Real-Time SLA Counter
* Dynamic inventory loading based on user proximity:
  * **Household Cylinders:** 6kg and 13kg refills and complete sets.
  * **Commercial Cylinders:** 35kg and 50kg refills targeted at restaurants, hotels, and educational institutions.
  * **Safety Hardware:** Certified low/high-pressure regulators, anti-leak reinforced hosepipes, safety clamps, smart Bluetooth scales.
* **Dynamic SLA Badge:** Real-time ETA estimation based on localized rider density (e.g., *"18 Mins in Kilimani"*).

### Step 3: Order Placement & Exchange Rule Validation
* **EPRA Validation Engine:** Validates cylinder ownership state. Checks if the customer has an equivalent empty cylinder brand or calculates regulatory cross-brand exchange surcharge.
* **Delivery Modes:**
  * *On-Demand:* Target delivery in `< 25 minutes`.
  * *Scheduled / Predictive Refill:* Time-slotted delivery based on past usage patterns.
* **Payment Options:** M-Pesa Express (STK Push), M-Pesa Paybill, Cash on Delivery (COD), or B2B 30-Day Invoicing.

### Step 4: Order Summary & Receipt Lock
* **Price Calculation:** `Total = Retail Refill Price + Zone Delivery Fee - Loyalty Point Discounts`.
* Immutable receipt generated and locked prior to dispatch authorization.

### Step 5: Proximity Routing & Rider Dispatch
* **Routing Algorithm:** Selects the optimal EPRA-licensed depot holding verified active inventory of the specified brand.
* **Rider Matching:** Nearest rider equipped with an approved upright gas transport cage receives dispatch telemetry on the Rider App.
* Live real-time GPS tracking stream initialized for customer frontend.

### Step 6: Escrow Payment Authorization
* System triggers an automated Safaricom Daraja API STK Push prompt to the customer's mobile device.
* Upon PIN entry, funds enter the **Gas Mlangoni Escrow Account** (held state, pending fulfillment).

### Step 7: Delivery Completion & Mandatory 3-Point Audit
Upon doorstep arrival, the rider conducts mandatory physical quality assurance:
1. **Safety Seal Audit:** Verifies the manufacturer's tamper-evident heat-shrink seal.
2. **Class III Digital Weight Audit:** Suspends the filled cylinder on a calibrated digital scale in view of the customer (e.g., verifying `24.8 kg` total = `11.8 kg` tare weight + `13.0 kg` net LPG).
3. **Valve Leak Audit:** Conducts bubble testing using a certified non-corrosive solution.
* Customer enters a 4-digit OTP or digital sign-off.
* Escrow engine executes **automated instant split payouts** to vendor and rider M-Pesa Till numbers.

### Step 8: Gamified Loyalty Allocation (Mlangoni Points)
* System automatically awards **Mlangoni Points** (e.g., 50 points per 13kg refill).
* Points are redeemable against future gas purchases, accessory upgrades, or free regulator safety inspections.

### Step 9: 24/7 Safety Center & Emergency Isolation
* One-touch **"Report Gas Leak"** button embedded in all user interfaces.
* Triggers immediate dispatch of nearby emergency response technicians and presents immediate physical protocols (valve shutoff guidance, ventilation steps, power isolation).

### Step 10: Vendor Operations & Spatial Data Processing
* **Depot-in-a-Box ERP:** Vendor managers track real-time cylinder turnover, driver dispatch status, and automated M-Pesa settlement statements.
* **H3 Spatial Processing:** Anonymizes completed order telemetry into **Uber H3 Resolution-8** spatial grid cells and writes partitioned **GeoParquet** files for OMC supply chain forecasting.

---

## 📊 Data Flow Diagrams (DFD)

### DFD Level 1: System Overview

```
                          ┌──────────────────────────┐
                          │    Customer App / UI     │
                          └─────────────┬────────────┘
                                        │
           Phone, M-Pesa OTP, GPS       │ Order Details, Brand, STK Auth
          ─────────────────────────────►│◄─────────────────────────────
                                        │
┌─────────────────────────┐   ┌─────────┴──────────┐   ┌──────────────────────────┐
│ P1.0 Reg & Auth         │   │ P2.0 Order Placement│   │ P3.0 Delivery Management │
│ (M-Pesa OTP, Profiles)  │   │ (Inventory & EPRA) │   │ (GPS & Proximity Route)  │
└────────────┬────────────┘   └─────────┬──────────┘   └───────────┬──────────────┘
             │                          │                          │
             ▼                          ▼                          ▼
  ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
  │ D1: User & Estate │      │ D2: Order & Stock │      │ Rider App / Agent │
  └───────────────────┘      └───────────────────┘      └───────────┬───────┘
                                                                   │
                                                                   │ GPS Logs, Weight Audits
                                                                   ▼
┌─────────────────────────┐   ┌────────────────────┐   ┌──────────────────────────┐
│ P5.0 Safety & Support   │   │ P4.0 Payment Escrow│   │ D3: Payment & Escrow Data│
│ (Leak Emergency System) │   │ (Daraja STK / Split│   │ (M-Pesa Trans IDs, Esc)  │
└────────────┬────────────┘   └─────────┬──────────┘   └──────────────────────────┘
             │                          │
             ▼                          ▼
  ┌────────────────────────────────────────────────┐
  │ D4: Loyalty & H3 Spatial Analytics (GeoParquet)│
  └────────────────────────────────────────────────┘
```

---

### DFD Level 2: Detailed Process Deconstruction

```
1.0 Registration & Authentication Sub-Processes
   ├── 1.1 Collect & Validate: Ingests phone, M-Pesa OTP, and address geofence.
   └── 1.2 Store Profile: Writes customer profiles and KYB vendor permits to D1 (User & Estate Data).

2.0 Order Placement Sub-Processes
   ├── 2.1 Check Stock: Queries D2 (Order & Inventory) for depot stock levels and EPRA brand matching.
   └── 2.2 Process Order: Locks item price, applies delivery fees, and updates active order state in D2.

3.0 Delivery Management Sub-Processes
   ├── 3.1 Dispatch Rider: Assigns nearby rider with upright safety cage based on proximity matrix.
   ├── 3.2 Log Telemetry: Continuously streams rider GPS pings to D2 and customer interface.
   ├── 3.3 Process Arrival: Triggers doorstep customer arrival notification.
   └── 3.4 Collect Weight Audit: Captures Class III scale readings, tare weight, and customer OTP sign-off.

4.0 Payment & Analytics Sub-Processes
   ├── 4.1 Escrow Hold: Locks M-Pesa payment in escrow ledger upon Daraja STK Push confirmation.
   ├── 4.2 Finalize Payout: Triggers instant split remittance to vendor/rider Tills upon 3.4 sign-off.
   └── 4.3 Generate Analytics: Batch-processes completed orders into H3 Resolution-8 spatial grids (k >= 50) and writes GeoParquet.

5.0 Safety & Support Sub-Processes
   └── 5.1 Process Safety Alert: Handles "Report Gas Leak" triggers and escalates to emergency containment agents.
```

---

## 🛡️ Governance & Regulatory Compliance Stack

Gas Mlangoni operates under strict regulatory frameworks established by statutory bodies in Kenya:

```
                  ┌──────────────────────────────────────────────┐
                  │       GAS MLANGONI GOVERNANCE STACK          │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌───────────────────┬────────────┴───────┬───────────────────┐
        ▼                   ▼                    ▼                   ▼
┌───────────────┐   ┌───────────────┐    ┌───────────────┐   ┌───────────────┐
│ EPRA License  │   │  Weights &    │    │ ODPC Privacy  │   │ M-Pesa Escrow │
│    Engine     │   │ Measures Act  │    │ Anonymization │   │   System      │
└───────┬───────┘   └───────┬───────┘    └───────┬───────┘   └───────┬───────┘
        │                   │                    │                   │
  Validates vendor    Class III scale       H3 hexagonal       Instant split
  LPG retail permits  bi-annual audits     spatial grid        settlements upon
  automatically       & weight logs        k >= 50 threshold   3-point audit
```

1. **EPRA License Gatekeeping:**
   * Automated verification of vendor LPG Retail Permits via EPRA API integration.
   * Unverified vendors are restricted from listing inventory or receiving dispatches.
2. **Weights & Measures Act (Cap 513):**
   * Mandatory use of Class III certified digital weighing scales by all delivery riders.
   * Scales undergo mandatory bi-annual calibration audits.
   * Weight logs (Gross, Tare, Net) are permanently recorded on transaction receipts.
3. **ODPC Data Protection Act (2019):**
   * Consumer location data is converted into Uber H3 hexagonal cells.
   * Enforces $k$-anonymity constraints ($k \ge 50$ unique households per cell) before spatial data is exported as GeoParquet files.
4. **M-Pesa Escrow Governance:**
   * Eliminates prepayment risks. Funds remain locked until the doorstep 3-point inspection is verified.

---

## 💾 Data Store Schema Specifications

### `D1: User & Estate Data`
* `user_id` (UUID, Primary Key)
* `phone_number` (String, E.164 format)
* `user_type` (`CUSTOMER` | `RIDER` | `VENDOR` | `ADMIN`)
* `estate_name` (String)
* `geofence_polygon` (GeoJSON Polygon)
* `default_cylinder_brands` (Array of Strings: `["K-Gas", "Rubis"]`)
* `kyb_permit_number` (String, Optional for Vendors)
* `kyb_verification_status` (`PENDING` | `VERIFIED` | `REJECTED`)

### `D2: Order & Inventory Data`
* `order_id` (UUID, Primary Key)
* `customer_id` (UUID, Foreign Key -> D1)
* `depot_id` (UUID, Foreign Key -> D1)
* `rider_id` (UUID, Foreign Key -> D1)
* `cylinder_brand` (String)
* `cylinder_size_kg` (Decimal: `6.0`, `13.0`, `35.0`, `50.0`)
* `order_status` (`PLACED` | `DISPATCHED` | `ARRIVED` | `AUDITED` | `COMPLETED` | `CANCELLED`)
* `scale_tare_weight_kg` (Decimal)
* `scale_gross_weight_kg` (Decimal)
* `weight_audit_passed` (Boolean)
* `leak_test_passed` (Boolean)

### `D3: Payment & Escrow Data`
* `transaction_id` (UUID, Primary Key)
* `order_id` (UUID, Foreign Key -> D2)
* `mpesa_checkout_request_id` (String)
* `mpesa_receipt_number` (String)
* `amount_kes` (Decimal)
* `escrow_status` (`HELD` | `RELEASED` | `REFUNDED`)
* `vendor_split_kes` (Decimal)
* `rider_split_kes` (Decimal)
* `platform_fee_kes` (Decimal)

### `D4: Loyalty & H3 Spatial Analytics`
* `analytics_id` (UUID, Primary Key)
* `h3_index_res8` (String, e.g., `886a302821ffff`)
* `aggregated_orders_count` (Integer)
* `k_anonymity_metric` (Integer, Must be $\ge 50$)
* `gas_volume_kg` (Decimal)
* `export_parquet_path` (String)

---

## 🛠️ API & Integration Interfaces

### Core System Stack
* **Mobile Frontend:** React Native / Flutter (iOS, Android) & M-Pesa Mini-App (JS/HTML5 framework).
* **Backend API:** Go / Node.js Microservices running on Kubernetes.
* **Spatial Processing:** Python (PySpark, H3-Py, GeoPandas, PyArrow for GeoParquet).
* **Database Engine:** PostgreSQL + PostGIS (Transactional), ClickHouse (Analytics), Redis (Rider Telemetry & Caching).
* **Payments Integrations:** Safaricom Daraja 2.0 API (STK Push, B2C Remittance, C2B Paybill).

---

## ⚡ Deployment & Operations

### Prerequisites
* Go 1.21+ / Python 3.10+
* PostgreSQL 15+ with PostGIS extension enabled
* Redis 7.0+
* Safaricom Daraja API Credentials (Consumer Key, Consumer Secret, Passkey, Shortcode)

### Quick Start
```bash
# Clone repository
git clone https://github.com/NullKy-Bytes/gas-mlangoni.git
cd gas-mlangoni

# Configure environment secrets
cp .env.example .env

# Run database migrations
make migrate-up

# Start local API services
make run-dev
```

---

## 📄 License & Contact

* **Developer & Operator:** NullKy Bytes / Gas Mlangoni Team
* **Compliance Lead:** `compliance@gasmlangoni.co.ke`
* **Emergency Hotline:** `0800-GAS-SAFE` (24/7 Safety & Leak Escalation)
* **License:** Proprietary & Confidential — All rights reserved under Kenya ODPC & EPRA framework guidelines.