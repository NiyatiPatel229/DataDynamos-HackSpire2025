# DataDynamos-HackSpire2025
## MindMosaic: Mental Health & Wellness App 🌿

MindMosaic is a comprehensive mental wellness mobile application built with **React Native** and **Expo**, designed to help users track their mental health, engage in mindfulness activities, and build emotional resilience through personalized recommendations and community support.

---

## 🚀 Features

- **Intelligent Mood Tracking**  
  Track moods in real-time, analyze sentiments, and visualize trends with beautiful interactive charts.

- **AI-Powered Mental Health Chatbot**  
  Talk naturally with an AI-driven chatbot for mental health support, powered by the **Google Gemini API**.

- **NLP based Sentimental Analysis**  
  Text summarization of user's chat and then using it for sentimental analysis.

- **Personalized Activity Recommendations**  
  Get mood-specific suggestions like yoga exercises, mindfulness activities, music, and videos.

- **Community Support**  
  Connect with others, share experiences, and build your support network.

- **Voice Interaction**  
  Speak and listen to the app with **Speech Recognition** and **Text-to-Speech** features.

- **Achievements & Streaks**  
  Stay motivated by tracking your progress and achieving milestones.

- **Wellness Tracker**  
  View a complete emotional wellness report with charts generated from sentiment analysis over time. Track your mental health trends daily, weekly, and monthly.

- **SOS (Emergency Support System)**  
  Instantly call or message your emergency contacts in case of urgent situations. Designed for quick access to help when it's needed most, ensuring user safety and peace of mind.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|:-----:|:-------------|
| Frontend | React Native, Expo |
| Backend | Firebase Authentication, Firebase Realtime Database |
| AI Integration | Google Gemini API (for Sentiment Analysis and Chatbot) |
| UI Libraries | React Native Vector Icons, React Native Animatable, Expo Linear Gradient |
| Charts | React Native Chart Kit |
| Voice | Expo Speech |

---

## 🧠 Core Modules Architecture

```mermaid
flowchart TD
    Start --> Login/Signup
    Login/Signup --> Dashboard
    Dashboard --> MoodTracking
    Dashboard --> Chatbot
    Dashboard --> Activities
    Dashboard --> Community
    MoodTracking --> SentimentAnalysis
    Chatbot --> AIResponse
    Activities --> ActivitySuggestions
    Community --> ForumPosts
