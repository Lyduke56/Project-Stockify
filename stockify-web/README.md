# Stockify — Small Business Supply-Chain Manager

Stockify is a multi-tenant SaaS inventory management engine tailored for small enterprises. It empowers business owners — from solo operators to small teams — to make data-driven restocking decisions through automated stock monitoring and alert generation.

## The Problem

Small businesses lose sales every day due to stock-outs. Without real-time visibility into inventory levels and demand trends, owners are left reacting instead of planning. Spreadsheets don't scale, and enterprise ERPs are overkill. Stockify fills that gap.

## Features

**Super Admin**
- Manage tenant accounts (register, approve, suspend, terminate)
- Monitor platform health and resource utilization across all tenants

**Business Admin**
- Customize the customer-facing storefront (colors, logos, banners, layouts)
- Manage employee accounts with Role-Based Access Control (RBAC)
- View real-time sales analytics and annual projections *(requires 6+ months of data)*

**Employees**
- Manage inventory with full CRUD, category assignment, and restock threshold configuration
- Update order fulfillment status in real time (Processing → Out for Delivery → Received)

**Customers**
- Browse and filter products without an account
- Checkout via QR code payment or Cash-on-Delivery (COD)
- Track orders and submit feedback and ratings

## Tech Stack

- **Language & Framework:** TypeScript with Next.js
- **Backend & Database:** Supabase
- **Authentication:** Supabase Authentication