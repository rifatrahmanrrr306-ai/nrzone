# NRZONE PRO - Intelligence Division: Full System Overview

## 1. Core Architecture

The system is built on a **Premium Light Theme** design system, utilizing:

- **Framework**: React + Vite
- **Styling**: Tailwind CSS with a custom "High-Contrast White" aesthetic.
- **State Management**: Centralized `masterData` (JSON) synchronized with Supabase and LocalStorage.
- **Typography**: 'Outfit' font family with bold, italic, and uppercase variations.

## 2. Key Modules (Panels)

### 📊 Live Monitor (Dashboard)

The central nerve center providing a real-time overview of:

- Production efficiency.
- Daily output tracking.
- Active machinery/worker status.
- Critical system alerts.

### ✂️ Cutting Unit (Raw Material)

Manages the initial stage of production:

- Lot tracking and raw material issuance.
- Cutting efficiency analysis.
- Integration with the Inventory Hub.

### 🏭 Factory Units (Sewing & Stone)

Split into specialized departments:

- **Sewing**: High-volume production lines.
- **Stone**: Specialized embellishment unit.
- Tracks worker-wise production and daily targets.

### 📦 Pata Hub (Logistics)

Manages the "Pata" lifecycle (Stone packets, paper rolls):

- Material issuance with stock validation.
- Final product reception.
- Printed dispatch slips for premium documentation.
- Worker ledger management for payments.

### 👥 Staff & Attendance

Intelligence on human resources:

- Daily attendance logging.
- Advanced summary of worker performance.
- Automated payroll calculations based on production data.

### 🏺 Inventory Vault (Stock)

Centrally managed stock system for:

- Fabric and Raw materials.
- Consumables (Thread, Stones, etc.).
- Automated low-stock alerts.

### 💸 Accounts Division

Tracks all operational expenses:

- Factory expenses (Utility, Rent, etc.).
- External processing (Outside Work) costs.
- Profit & Loss tracking via the Reports Panel.

## 3. Security & Roles

The system implements role-based access control (RBAC):

- **Super Admin**: Full access to all modules and system settings.
- **Manager**: Operational access (except for settings and reports).

---

### Developed by: NRZONE Intelligence Division
