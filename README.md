# Local Roots Farm

A mobile-first farm shop application for ordering fresh produce, managing subscriptions, and checking out via WhatsApp. Includes an AI shopping assistant "Rooty".

## Setup Instructions

1.  **Clone and Install**:
    ```bash
    npm install
    ```
2.  **Environment Variables**:
    - Create a `.env` file based on `.env.example`.
    - `API_KEY`: Your Google Gemini API key.
    - `VITE_ADMIN_PASSWORD`: Password for the `/admin` dashboard.
    - `VITE_WHATSAPP_NUMBER`: The farm's WhatsApp number (e.g., `96176965766`).
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Admin Access
Access the admin dashboard at `/#/admin`. You will be prompted for the `VITE_ADMIN_PASSWORD` defined in your environment variables.

## Important Operational Notes
- **Manual Confirmation**: Orders are **not automatically confirmed** by the website. All orders are pending until manually confirmed on WhatsApp by the farm team.
- **Source of Truth**: The WhatsApp conversation history is the official source of truth. The admin dashboard and website data are planning and logistics aids.
- **Deterministic Scheduling**: Delivery on Thursdays, Pickup on Fridays for the next 21 days.
- **Capacity Management**: Automatic tracking of slot capacity via localStorage based on "New" and "Confirmed" orders.
