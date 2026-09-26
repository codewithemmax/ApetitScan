<div align="center">

# 🥗 PetitScan 
**The tiny lens for your daily macros.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

Tracking macros shouldn't feel like manual data entry. MicroMacro is a lightweight, camera-first nutrition tracker that uses AI to analyze your plate in seconds. Snap a photo, get your macros, and get on with your day.

[Live Demo](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## ✨ Features

* **📷 AI-Powered Plate Scanning:** Point your camera at any meal, and the vision model instantly identifies the food items and estimates portion sizes.
* **📊 Instant Macro Breakdown:** Automatically extracts highly accurate protein, carbohydrate, and fat estimates from the image without manual searching.
* **🔍 Ingredient Decoding:** Scans food labels to break down complex additives and flag potential allergens.
* **⚡ Frictionless Logging:** A minimalist UI designed for speed. Log a full meal with a single tap.
* **📈 Daily Insights:** Clean, responsive dashboard to track your nutritional goals over time.

## 🛠️ Tech Stack

**Frontend**
* [Next.js](https://nextjs.org/) / [React](https://reactjs.org/) - UI framework
* [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling for a clean, minimalist interface

**Backend**
* [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) - Robust API routing
* [Google Gemini 1.5 Pro](https://deepmind.google/technologies/gemini/) - Vision API for high-accuracy image-to-macro extraction
* [MongoDB](https://www.mongodb.com/) - NoSQL database for flexible user and meal data storage

## 🚀 Getting Started

Follow these steps to set up the project locally for development and testing.

### Prerequisites
* Node.js (v18 or higher)
* MongoDB database (local or Atlas)
* Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/micromacro.git
   cd micromacro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add the following variables:
   ```env
   PORT=8000
   MONGO_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## 🧠 How It Works (Architecture)

1. **Capture:** The user takes a picture of their food via the Next.js frontend interface.
2. **Process:** The image is compressed and sent via the Express backend to the Gemini 1.5 Pro Vision endpoint.
3. **Extract:** A strict system prompt forces the AI to return a structured JSON object containing identified ingredients, estimated weights, and macro values (Protein, Carbs, Fats, Calories).
4. **Store & Render:** The backend saves the log to MongoDB and passes the clean data back to the frontend dashboard.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
