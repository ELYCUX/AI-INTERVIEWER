# 🎤 AI Interview Coach

An end-to-end **AI-powered interview practice platform** that records candidate interview responses via webcam, analyzes them using **Google Gemini multimodal AI**, and provides **detailed, actionable feedback** on communication skills, confidence, technical accuracy, and soft skills.

This project is designed for students, job seekers, and professionals to **practice interviews in a realistic environment** and receive instant, objective feedback.

---

## ✨ Key Features

* 🎥 **Webcam & Audio Recording** (Browser-based)
* 🧠 **AI-Powered Video Analysis** using Google Gemini
* 📝 **Automatic Speech Transcription**
* 🎯 **Question-Aware Accuracy Scoring**
* 👁️ **Eye Contact & Facial Expression Review**
* 🗣️ **Speaking Style & Pace Analysis**
* 📊 **Confidence Score Visualization**
* 💡 **Actionable Improvement Tips**
* 📚 **Built-in Interview Question Bank** (Technical / Soft Skills / HR)
* 🎨 **Modern, Responsive UI**
* 🔐 **Privacy-Friendly** (files auto-deleted after analysis)

---

## 🏗️ Tech Stack

### Frontend

* HTML5
* CSS3 (Custom design system)
* Vanilla JavaScript
* MediaRecorder API
* WebRTC (getUserMedia)

### Backend

* Python 3.9+
* Flask
* Google Generative AI SDK (Gemini)

### AI Model

* **Gemini 2.5 Flash** – Multimodal video + audio understanding

---

## 📁 Project Structure

```
AI-Interview-Coach/
│
├── app.py                 # Flask backend
├── uploads/               # Temporary video storage (auto-cleaned)
│
├── templates/
│   └── index.html         # Main UI
│
├── static/
│   ├── style.css          # Complete UI styling
│   └── script.js          # Camera, recording, UI logic, uploads
│
├── README.md              # Project documentation
└── requirements.txt       # Python dependencies
```

---

## 🚀 How It Works (Flow)

1. User selects or reads an interview question
2. Browser captures **video + audio** using webcam
3. Recording is saved as **WebM**
4. Video is uploaded to **Gemini Cloud**
5. Gemini analyzes:

   * Transcript
   * Technical accuracy (based on question)
   * Eye contact & expressions
   * Speaking style
   * Confidence
6. AI returns **strict JSON output**
7. Dashboard displays results visually
8. Local + cloud files are deleted for privacy

---

## 📚 Interview Question Bank

The sidebar includes **20–30 curated interview questions**, categorized into:

### 🔧 Technical

* REST vs SOAP
* OOPS principles
* Python threading
* Flask middleware
* Async / Await
* Database normalization

### 🤝 Soft Skills

* Handling conflict
* Managing stress
* Receiving feedback
* Team collaboration
* Leadership experience

### 🧑‍💼 HR

* Tell me about yourself
* Why should we hire you?
* Strengths & weaknesses
* 5-year career plan
* Motivation

> Clicking a question automatically sets it as the **active analysis context**.

---

## 📊 AI Response Format

Gemini is prompted to return **ONLY JSON** in the following structure:

```json
{
  "transcript": "...",
  "accuracy_score": 85,
  "confidence_score": 78,
```

