# 🧮 Calculo AI

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

> *"Your AI-powered Calculus assistant — upload a textbook, snap a problem, or just type it in."*

Calculo AI is a full-stack Flask web app powered entirely by **Groq** — the fastest free AI inference on the planet. Solve calculus problems step-by-step, plot interactive graphs, reference formulas, generate quizzes, and upload files or images of handwritten problems. Built by a second-year CE student. 🔥

---

## ✨ Features

- 🧠 **AI Solver** — step-by-step solutions, explanations, summaries and final answers
- 📈 **Graph Plotter** — interactive Plotly graphs with AI explanation
- 📖 **Formula Reference** — tabbed reference for Differentiation, Integration, Limits and Series
- ❓ **Quiz Mode** — AI-generated practice questions by topic and difficulty
- 📄 **File Upload** — supports PDF, DOCX, TXT and images
- 📸 **Camera Capture** — snap a photo of a handwritten problem on mobile
- 🔢 **LaTeX Rendering** — beautiful math via MathJax
- ⚡ **100% Groq** — text via `llama-3.3-70b-versatile`, vision via `llama-4-scout-17b`

---

## 🗂️ Project Structure

```
CALCULO/
├── app.py                    # Flask app, routes, Groq integration
├── templates/
│   ├── base.html             # Parent template (navbar + footer)
│   ├── index.html            # Landing page
│   ├── solver.html           # AI solver + file upload
│   ├── graphs.html           # Graph plotter
│   ├── formulas.html         # Formula reference tabs
│   └── quiz.html             # Quiz generator
├── static/
│   ├── css/style.css         # Full custom CSS (Calculo AI theme)
│   ├── js/script.js          # Fetch, Plotly, MathJax, tab logic
│   └── images/
│       └── img.png           # Logo
├── uploads/                  # Temp file storage
├── .env                      # API keys (not committed)
├── requirements.txt
├── Procfile
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/eugene234466/calculo-ai.git
cd calculo-ai

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GROQ_API_KEY=your_key_here" > .env

# Run the app
python app.py
```

Open your browser at `http://127.0.0.1:5000` 🎉

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| AI — Text | Groq `llama-3.3-70b-versatile` |
| AI — Vision | Groq `meta-llama/llama-4-scout-17b-16e-instruct` |
| Graphs | Plotly.js + math.js |
| Math Rendering | MathJax 3 |
| File Parsing | PyPDF2, python-docx, Pillow |
| Frontend | HTML5, CSS3, JavaScript |
| Fonts | Google Fonts — Orbitron + Merriweather |
| Deployment | Railway |

---

## 📄 Pages

| Page | Route | Description |
|---|---|---|
| Home | `/` | Landing page with features overview |
| Solver | `/solver` | AI solver with file + camera upload |
| Graphs | `/graphs` | Interactive graph plotter |
| Formulas | `/formulas` | Tabbed formula reference |
| Quiz | `/quiz` | AI-generated practice questions |

---

## 🧠 Topics Covered

- Differentiation
- Integration
- Limits
- Series & Sequences

---

## 📦 Deployment

Deployed on **Railway** with a single `Procfile`:

```
web: gunicorn app:app
```

Set `GROQ_API_KEY` as an environment variable on the Railway dashboard.

---

## 👨‍💻 About

Built by **Eugene Yarney** — second-year Computer Engineering student at Ghana Communication Technology University.

- 🌍 Nsawam, Ghana
- 📧 eugeneyarney23@gmail.com
- 💼 [LinkedIn](https://linkedin.com/in/eugene-yarney)
- 🐙 [GitHub](https://github.com/eugene234466)
- 🌐 [Portfolio](https://portfolio-0597.onrender.com)

---

## 📜 License

Proprietary — All rights reserved © 2026 Eugene Yarney.

---

<p align="center">Built with 💙 and Groq 🔥</p>
