
# Aura Parfumerie 🌿✨

**Aura Parfumerie** is a conceptual luxury retail platform designed to demonstrate the future of "Clienteling 2.0". It combines high-end aesthetic web design with powerful AI-driven customer lifecycle management.

Built with **React**, **Tailwind CSS**, **Framer Motion**, and powered by **Google Gemini API**.

---

## 🌟 Key Features

### For the Customer (The Collector)
*   **Immersive Boutique**: A visually stunning product catalog with category filtering (Fine Fragrance, Home Collection, Accessories) and detailed product modals.
*   **AI Scent Concierge**: An intelligent chatbot persona ("Aura") that helps users discover fragrances based on mood, memory, and notes.
    *   *Powered by Gemini 3 Flash Preview.*
*   **Omnichannel Simulation**: Users can simulate logging in or chatting via Web, WhatsApp, or Telegram.
*   **Scent Profile**: A dedicated section in the User Profile where customers can manage their favorite olfactory notes (e.g., Oud, Bergamot), which informs the AI recommendations.
*   **Editorial Journal**: A content feed featuring stories about ingredients and travel.
*   **Seamless Checkout**: A slide-out cart drawer with a simulated secure checkout process.

### For the Business (The Admin/CRM)
*   **Intelligent CRM Dashboard**: A comprehensive view of customer data.
    *   **AI Analysis**: One-click analysis of customer chat history to derive Sentiment, VIP Status suggestions, Summary, and Recommended Next Actions.
    *   **Live Reply**: Send messages directly from the dashboard to the customer's preferred channel.
*   **Campaign Manager**: Create email marketing campaigns with AI assistance.
    *   *AI Content Generation*: Generate subject lines and email body copy based on a topic and target segment (e.g., "Write a teaser for VIPs about the new Jasmine scent").
*   **Inventory Management**: Add and edit products.
    *   *AI Descriptions*: Auto-generate poetic, luxury product descriptions based on a list of scent notes.
    *   *Bulk Import*: Admins can import products via a JSON file using `POST /api/products/bulk` (protected). A `frontend/data/sample-products.json` is available as an example.
*   **Order Management**: Track and update order statuses (Pending -> Delivered).

---

## 🧠 AI Integration & Service Functions

The application relies on `services/geminiService.ts` to interface with the Google GenAI SDK.

### 1. Scent Concierge (`getConciergeResponse`)
*   **Function**: Acts as a knowledgeable perfume expert.
*   **Model**: `gemini-3-flash-preview` with `thinkingBudget: 0` (Speed priority).
*   **Context**: Takes the full chat history to maintain conversation flow.

### 2. CRM Intelligence (`analyzeCustomerInteraction`)
*   **Function**: Reads customer support transcripts to extract structured data.
*   **Output**: JSON Schema.
    *   `sentiment`: Positive/Neutral/Negative.
    *   `statusSuggestion`: Lead/Active/VIP/At Risk.
    *   `extractedPreferences`: Array of preferred scents found in text.
    *   `summary`: Concise overview.
    *   `nextAction`: Actionable advice for the sales associate.

### 3. Campaign Generation (`generateCampaignContent`)
*   **Function**: Writes marketing copy.
*   **Input**: Topic & Target Segment.
*   **Output**: JSON Schema (`subject`, `body`).

### 4. Product Copywriting (`generateProductDescription`)
*   **Function**: Generates creative writing for product listings.
*   **Input**: Product Name & Scent Notes.
*   **Output**: Text.

---

## 🔐 Authentication & Roles

The app uses a simulated authentication service (`services/authService.ts`).

### **How to Login**
1.  Click **Sign In** (top right).
2.  **Customer Access**: Enter any email (e.g., `user@example.com`) or phone number.
3.  **Admin Access**: Enter **`admin@aura.com`** or **`concierge@aura.com`**.

*Note: For the Magic Link flow, click "Simulate Clicking Link". For the OTP flow, a demo code will be provided on screen.*

---

## 📂 Project Structure

*   **`components/`**: React UI components.
    *   `CrmDashboard.tsx`: The core admin interface.
    *   `ChatWidget.tsx`: The floating AI chat bubble.
    *   `Shop.tsx` / `InventoryManager.tsx`: Product management.
    *   `Concierge.tsx`, `About.tsx`, `Journal.tsx`: Brand pages.
*   **`services/`**: Business logic and API calls.
    *   `geminiService.ts`: AI implementation.
    *   `authService.ts`: Mock auth provider.
    *   `storageService.ts`: Mock cloud storage (avatars/JSON).
*   **`types.ts`**: TypeScript definitions for User, Customer, Product, Order, etc.
*   **`constants.ts`**: Mock data initialization.

---

## 🚀 Getting Started

1.  **Install Dependencies**:
    The project uses ES Modules via CDN in `index.html`, so no heavy `npm install` is strictly required for the runtime, but a standard React build environment is assumed.

2.  **Environment Variables**:
    Ensure `process.env.API_KEY` is set with a valid Google Gemini API Key.

3.  **Run**:
    Start the development server.

```bash
npm start
```
