# Expense Tracker App
Aplikacion mobil për ndjekjen dhe menaxhimin e shpenzimeve personale

## Anëtarët

| Emri | Roli | Branch |
|------|------|--------|
| Anita Osmani | Product Owner | feature/auth |
| Rinor Tahiri | Scrum Master | feature/expenses |
| Leart Aliu | Developer | feature/report |

## Stack
- *Frontend*: React Native (Expo)
- *Backend*: Node.js + Express
- *Database*: MySQL
- *Auth*: JWT + bcrypt

---

## Instalimi — Hap pas Hapi

### 1. Klono Projektin
git clone https://github.com/Anita592/Expense-Tracker.git

Hyr brenda folderit të projektit.

### 2. Instalo Backend
cd backend

npm install

### 3.Krijo .env
copy .env.example .env

#### Hap .env dhe ploteso:
DB_PASS=fjalëkalimi_yt_mysql

JWT_SECRET=expensetracker2026secret

### 4. Krijo Databazën
Hap MySQL Workbench

Hap fajllin backend/src/migrations/init.sql

Ekzekuto të gjitha komandat SQL (Ctrl+A pastaj butonin Run)

### 5. Starto Backend
npm run dev

 #### Duhet të shohësh: 
 Server running on port 5000

### 6. Instalo Frontend
cd frontend

npm install

### 7. Starto Frontend
npm run web

#### Hapet automatikisht në browser: 
http://localhost:8081

# Shënime të Rëndësishme
#### .env nuk shkon në GitHub — secili e krijon lokalisht

#### Backend duhet të jetë duke punuar para se të nisësh frontend

Porta e backend: 5000

Porta e frontend: 8081

Nëse porta 8081 është e zënë, do hapet në 8082
