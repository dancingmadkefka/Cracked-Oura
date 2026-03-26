<div align="center">
  <img src="frontend/public/icon.png" alt="Cracked Oura Logo" width="128">
  <h1>Cracked Oura</h1>
  <p><b>Free application that gives you full access to your Oura ring data.</b></p>
  
  [![GitHub release](https://img.shields.io/github/v/release/EIrno/Cracked-Oura?label=Latest%20Release)](https://github.com/EIrno/Cracked-Oura/releases/latest)
  ![Status](https://img.shields.io/badge/Status-Alpha-red)
</div>

---

### Pay for the ring, not for the app that is not even that good
Oura ring paywalls the data behind a subscription, but luckily you can export your data from Oura and import it to Cracked Oura.

**Cracked Oura** is an open-source desktop application that provides full access to your health metrics, stored locally on your machine.

**Key Benefits**
- **No Subscription:** See all of your Oura ring data without subscription. 
- **Privacy First:** Your data is stored locally in an SQLite database. It never leaves your computer unless you export it.
- **Advanced Analytics:** Visualize trends, correlations, and deeper insights than the standard app provides. 

<img width="1470" height="916" alt="Cracked Oura front page" src="https://github.com/user-attachments/assets/cda629a9-5072-4a5f-9e5d-6ddb3873c0f0" />

---

## Features

### Oura ring data without subscription
See all of your Oura ring data without subscription. Thanks to EU's right to data portability, you can export your data from Oura and import it to Cracked Oura. 

**Automation that requests your data from Oura and imports it to Cracked Oura.** This populates the local database with your data. Population can also be done manually by importing a zip file from Oura that you can find in https://membership.ouraring.com/data-export. 

<img width="1470" height="916" alt="Cracked Oura automation" src="https://github.com/user-attachments/assets/8aa42539-f014-4254-8885-9d6dfabf13b2" />
<img width="1470" height="916" alt="Cracked Oura logn term charts" src="https://github.com/user-attachments/assets/6cbd5345-d81e-4000-ade0-a0ea4e21508c" />


### Desktop Dashboard that can be customized
View your Sleep, Readiness, and Activity scores, etc in a desktop dashboards that is at least as good as the official Oura dashboard. The dashboards can be customized to show the data that you want to see. 

<img width="1470" height="916" alt="Cracked Oura widget editor" src="https://github.com/user-attachments/assets/39103072-e176-4b13-86df-95eaacdd3ac1" />
<img width="1470" height="916" alt="Cracked Oura layout editor" src="https://github.com/user-attachments/assets/43925f97-9d94-48aa-8b26-36a096499c0c" />

### AI Health Analyst
Oura's own AI advisor is quite limited. It does not have access to your historical data and cannot answer questions about your health trends, because it has only a few days of data available. 

Cracked Oura can leverage local LLMs to analyze your health data and provide insights. 

> [!NOTE]
> This feature is still experimental, not documented, and under development and will be improved in the future. 

<img width="1470" height="916" alt="Cracked Oura advisor" src="https://github.com/user-attachments/assets/e9ce6ac2-60da-486f-a01f-8cd03dce6337" />

---

## Getting Started

### Installation
1.  **Download** the latest release for your operating system:
    -   [Download for macOS (.dmg)](https://github.com/EIrno/Cracked-Oura/releases)
    -   [Download for Windows (.exe)](https://github.com/EIrno/Cracked-Oura/releases) *(when available in release assets)*

2.  **Install & Run** the application.
3.  **Login** to your Oura account when prompted to sync your historical data.


> [!NOTE]
> Most of the features are still experimental and under development and will be improved in the future. 

### Troubleshooting

> **"App is damaged and can't be opened"** (macOS)
> This is a known Gatekeeper issue because the app is not notarized by Apple.
> To fix, move the app to your `Applications` folder and run this in Terminal:
> ```bash
> sudo xattr -cr "/Applications/Cracked Oura.app"
> ```

> [!NOTE]
> This project is not affiliated with, associated with, or endorsed by Oura Health Oy. Use at your own risk.

---

## For Developers

We welcome contributions.

### Tech Stack
-   **Frontend:** Electron, React, TypeScript, Tailwind
-   **Backend:** Python, FastAPI, SQLite
-   **Mobile:** Kotlin, Jetpack Compose, Room, DataStore, Retrofit

### Android Mobile Sync

This repo now includes:

- A token-protected mobile sync API on the desktop/backend side
- A native Android client under [`android-mobile/`](android-mobile)

Setup and usage are documented in [`docs/android-mobile-sync.md`](docs/android-mobile-sync.md).

### Build from Source

**macOS / Linux:**
```bash
# 1. Clone Repository
git clone https://github.com/EIrno/Cracked-Oura.git
cd Cracked-Oura

# 2. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pyinstaller

# 3. Setup Frontend
cd ../frontend
npm install
npm run dev
```

**Windows (PowerShell):**
```powershell
# 1. Clone Repository
git clone https://github.com/EIrno/Cracked-Oura.git
cd Cracked-Oura

# 2. Setup Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install pyinstaller

# 3. Setup Frontend
cd ..\frontend
npm install
npm run dev
```
If you're using Command Prompt, activate the environment with:
```bat
venv\Scripts\activate.bat
```

### Build for Production
To create a standalone application installer (works on macOS, Windows, and Linux):
```bash
cd frontend
npm run build
# macOS: outputs a .dmg in frontend/dist/
# Windows: outputs a Setup .exe in frontend/dist/
# Linux: outputs .AppImage and .deb in frontend/dist/
```
