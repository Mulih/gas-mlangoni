# Gas Mlangoni — Actor & Use Case Catalog

**Purpose:** Ground truth reference for every actor in the system and every interaction they can have with it — including what happens when things go wrong. This is the foundation everything else (data model, sequence diagrams, state machines) gets built on.

---

## 1. Actor Register

| Actor | Type | Interacts Via | Notes |
|---|---|---|---|
| **Customer (Household)** | Human, primary | Mobile app / M-Pesa Mini-App | Buys 6kg/13kg refills, sets/accessories |
| **Customer (B2B/Commercial)** | Human, primary | Mobile app (possibly + web) | Buys 35kg/50kg, may use 30-day invoicing |
| **Delivery Agent (Rider)** | Human, primary | Rider App | Executes dispatch, weight audit, payout trigger |
| **Vendor / Depot Manager** | Human, primary | Vendor Portal ("Depot-in-a-Box" ERP) | Manages stock, pricing, receives payouts |
| **Platform Admin / Ops** | Human, internal | Admin console | Verifies EPRA permits, handles disputes/escalations, manages emergency response |
| **Safety Agent** | Human, internal | Admin console / dispatch tooling | Responds to "Report Gas Leak" alerts |
| **Safaricom Daraja API** | External system | Server-to-server (API + webhooks) | STK Push, escrow hold, split payouts, Paybill, B2B till. You do not control its uptime, latency, or callback ordering. |
| **EPRA (regulator)** | External / non-interactive | Document upload + (likely) manual review | Not an API integration at your scale — model as a constraint-source, not a live actor, unless you've confirmed an EPRA verification API exists |
| **OMC / Bulk Distributor** | External, secondary | Data product / dashboard (not core app) | Consumes anonymized H3 demand data from D4. Not part of the transactional flow at all — keep this firmly separated in your architecture |
| **ODPC (Data Protection)** | Non-interactive | N/A | Not an actor — a compliance constraint on how D1/D4 are designed and exported |

**Design implication:** Only 6 of these are actors the core transactional system talks to in real time (Customer, Rider, Vendor, Admin, Safety Agent, Daraja). EPRA, ODPC, and OMC are constraints/consumers, not participants in the live workflow — can't let them creep into our core service logic.

---

## 2. Use Case Catalog

Each use case includes the failure paths the original spec didn't cover — these are what actually determine the state machine design later.

### A. Registration & Onboarding

**UC-01: Customer Registration**
- **Actor:** Customer
- **Main flow:** Download app / open Mini-App → M-Pesa OTP verification → set delivery profile (estate, GPS pin) → register cylinder brand(s)
- **Failure paths:**
  - OTP times out or fails → retry with rate limiting (prevent SMS bombing abuse)
  - User abandons after OTP but before profile setup → partial account state must be resumable, not orphaned
  - GPS pin fails to resolve (no signal, denied permission) → allow manual estate/address entry as fallback
- **Postcondition:** Customer record created in D1 with at least one verified phone number

**UC-02: Vendor Onboarding & EPRA Verification**
- **Actor:** Vendor, Platform Admin
- **Main flow:** Vendor registers business → uploads EPRA LPG Retail Permit + KYB docs → Admin reviews and approves → vendor can list inventory
- **Failure paths:**
  - Permit upload is illegible/expired → rejected, vendor notified, resubmission flow needed
  - Permit approved but later expires → **you need a scheduled re-verification job**, not just a one-time check at onboarding. This is a gap in the original spec — EPRA compliance isn't "verify once," it's "verify continuously."
  - Vendor tries to list inventory before approval → hard block at the API/business-logic layer, not just UI hiding
- **Postcondition:** Vendor status = `verified` with permit expiry date tracked

**UC-03: Rider Onboarding**
- **Actor:** Delivery Agent, Platform Admin
- **Main flow:** Rider registers, uploads ID/license, assigned to a depot or zone, provisioned with calibrated Class III scale (asset tracking)
- **Failure paths:**
  - Scale not yet calibrated / calibration expired (bi-annual requirement per spec) → rider should be blocked from accepting weight-audit-requiring jobs until re-certified
- **Postcondition:** Rider status = `active`, scale calibration due-date tracked

---

### B. Catalog & Order Placement

**UC-04: Browse Catalog**
- **Actor:** Customer
- **Main flow:** Home screen loads nearby inventory by location + ETA badge
- **Failure paths:**
  - No vendors within service radius → show clear "not yet available in your area" state, not an empty/broken screen
  - Location permission denied → fallback to manually selected estate

**UC-05: Place Order with Brand/Exchange Validation**
- **Actor:** Customer
- **Main flow:** Select size + accessories → system validates cylinder brand match or cross-brand exchange fee → select delivery mode + payment method
- **Failure paths:**
  - Customer's registered brand has zero matching vendor stock nearby → **not covered in original spec at all.** Do they get offered cross-brand exchange automatically, at what fee, or is the order simply blocked? This needs a business decision before you can build it.
  - Vendor stock changes between "browse" and "confirm" (race condition — two customers order the last cylinder) → needs an inventory reservation/lock mechanism, not just a read-then-write

**UC-06: Confirm Order / Receipt Lock**
- **Actor:** Customer
- **Main flow:** Itemized receipt renders → "Confirm & Pay"
- **Failure paths:**
  - Pricing changed between catalog view and confirm (vendor updated price) → re-confirm with customer, don't silently charge a different amount

---

### C. Escrow Payment

**UC-07: Escrow Payment Authorization**
- **Actor:** Customer, Safaricom Daraja (external)
- **Main flow:** STK Push sent → customer enters PIN → funds locked in escrow
- **Failure paths:**
  - STK Push times out (customer doesn't respond within Safaricom's window) → order must revert to a `payment_pending_expired` state, not hang indefinitely
  - Customer enters wrong PIN / cancels → allow retry, cap retries to prevent abuse
  - Daraja callback arrives late or out of order (this happens in production) → your system must be idempotent on the M-Pesa transaction ID, and must not assume callback order matches request order
  - Payment succeeds but no rider is available to accept dispatch → **this is the critical gap.** You need a defined rule: auto-refund after N minutes? Hold and retry? This determines your saga design.
- **Postcondition:** D3 records escrow lock with M-Pesa transaction ID

---

### D. Dispatch & Delivery

**UC-08: Rider Dispatch**
- **Actor:** Rider, Platform Admin
- **Main flow:** Routing engine finds nearest depot with matching stock → nearest available rider notified
- **Failure paths:**
  - No rider accepts within SLA window → escalate to next-nearest, then to admin for manual intervention if still unaccepted
  - Rider accepts but then goes offline (phone dies, app crashes) mid-delivery → need a heartbeat/timeout mechanism to detect "stuck" deliveries and reassign

**UC-09: Live Tracking**
- **Actor:** Customer, Rider
- **Main flow:** Continuous GPS pings, ETA updates
- **Failure paths:**
  - Rider's GPS signal drops (tunnels, dead zones common in parts of Kenya) → app should show "last known location" with a staleness indicator, not a silently frozen pin

**UC-10: Doorstep 3-Point Audit**
- **Actor:** Rider, Customer
- **Main flow:** Seal check → weigh on certified scale → leak test → customer confirms weight + OTP/signature
- **Failure paths:**
  - Weight reading fails accuracy tolerance (potential under-fill or fraud) → **this needs its own escalation path.** Does the rider get a replacement cylinder on the spot? Does the order get flagged for investigation? Undefined in the original spec.
  - Customer disputes the weight reading in person → need an in-app dispute/hold mechanism before escrow auto-releases
  - Customer refuses to sign/OTP after a valid weight check → escrow must NOT auto-release; needs a manual admin resolution path

---

### E. Payout

**UC-11: Escrow Split Payout**
- **Actor:** System (triggered by UC-10 completion), Safaricom Daraja
- **Main flow:** Automated split payout to vendor + rider M-Pesa tills
- **Failure paths:**
  - Payout API call to Daraja fails after audit is confirmed complete → funds are stuck in an ambiguous state. This needs a retry queue with alerting, not a fire-and-forget call — money must never silently disappear from the system's view.

---

### F. Loyalty

**UC-12: Points Allocation & Redemption**
- **Actor:** Customer
- **Failure paths:**
  - Points credited but order later disputed/refunded → needs a clawback mechanism

---

### G. Safety & Emergency

**UC-13: Report Gas Leak**
- **Actor:** Customer, Safety Agent
- **Main flow:** One-touch report → nearest safety agent alerted → containment protocol displayed
- **Failure paths:**
  - No safety agent acknowledges within SLA → this is a life-safety path, it needs a hard escalation (e.g., auto-forward to a fallback contact or emergency services guidance) — the highest-priority exception path in the whole system

---

### H. Vendor Ops & Analytics

**UC-14: Depot Inventory & Settlement Management**
- **Actor:** Vendor
- **Failure paths:**
  - Vendor manually overrides stock count in a way that conflicts with an in-flight reserved order → needs conflict resolution rules

**UC-15: H3 Spatial Analytics Export**
- **Actor:** System (batch process), OMC (consumer)
- **Failure paths:**
  - A spatial cell has fewer than 50 households (k-anonymity threshold not met) → that cell must be suppressed or merged with a neighbor, never exported under-threshold. This is a hard compliance gate, not a "nice to have" filter.

---

## 3. Open Questions This Catalog Surfaces

These are business decisions, not engineering ones — worth resolving before we design the data model and state machines:

1. When a customer's brand has no local match, is cross-brand exchange automatic, opt-in, or blocked?
2. What's the timeout/refund policy if escrow is captured but no rider accepts?
3. What's the exact dispute-resolution flow for a failed/contested weight audit?
4. Is EPRA permit verification manual (admin reviews upload) or is there an actual EPRA API? This changes UC-02 significantly.
5. What's the fallback chain for an unacknowledged gas leak report (this is the one use case with real safety stakes)?

---

*Next: once these are resolved (or you're ready to make reasonable assumptions), we move to the corrected Context Diagram (Level 0), which will formally place Daraja and EPRA as external entities.*
